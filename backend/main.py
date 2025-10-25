from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import uuid
import base64
from app.head_pose import get_head_pose
from app.analyze_frame import analyze_frame
import numpy as np
import cv2
from database import db
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory data stores (for prototype) ---
sessions = {}
active_websockets = {}

# --- WebSocket Manager ---
async def send_status_update():
    """Sends the current status of all sessions to all connected admins."""
    if "admin" in active_websockets:
        # Create a copy of the list to avoid modification during iteration
        admin_websockets = active_websockets["admin"].copy()
        disconnected_websockets = []
        
        # Get current sessions from database
        sessions_data = db.get_all_sessions()
        
        for websocket in admin_websockets:
            try:
                # Check if the websocket is still open
                if websocket.client_state.name == "CONNECTED":
                    await websocket.send_text(json.dumps({"type": "status_update", "data": sessions_data}))
                else:
                    disconnected_websockets.append(websocket)
            except Exception as e:
                print(f"Error sending status update: {e}")
                disconnected_websockets.append(websocket)
        
        # Remove disconnected websockets from the active list
        for ws in disconnected_websockets:
            if ws in active_websockets["admin"]:
                active_websockets["admin"].remove(ws)

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    if client_id not in active_websockets:
        active_websockets[client_id] = []
    active_websockets[client_id].append(websocket)
    await websocket.accept()
    print(f"WebSocket connection established for {client_id}")
    if client_id == "admin":
        await send_status_update()

    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        active_websockets[client_id].remove(websocket)
        print(f"WebSocket connection closed for {client_id}")

# --- API Endpoints ---
@app.post("/api/login")
async def login(data: dict):
    """Simple login for admin and student roles."""
    # In a real app, you would have proper authentication
    if data.get("role") in ["admin", "student"]:
        return {"status": "success", "role": data.get("role")}
    return {"status": "error", "message": "Invalid role"}

@app.post("/api/start-session")
async def start_session(data: dict):
    """Admin starts a new proctoring session."""
    google_form_link = data.get("google_form_link")
    students = data.get("students") # List of roll numbers

    if not google_form_link or not students:
        return {"status": "error", "message": "Google Form link and students (roll numbers) are required"}

    session_id = str(uuid.uuid4())
    
    # Save to database
    if db.create_session(session_id, google_form_link, students):
        # Also keep in memory for backward compatibility
        sessions[session_id] = {
            "google_form_link": google_form_link,
            "students": {
                student: {"status": "Not Started", "events": []} for student in students
            },
        }
        await send_status_update()
        return {"status": "success", "session_id": session_id, "students": students}
    else:
        return {"status": "error", "message": "Failed to create session in database"}

@app.post("/api/student-login")
async def student_login(data: dict):
    """Student login with roll number."""
    roll_no = data.get("roll_no")
    session_id = data.get("session_id")

    if not roll_no or not session_id:
        return {"status": "error", "message": "Roll number and session ID are required"}

    if session_id in sessions and roll_no in sessions[session_id]["students"]:
        return {"status": "success", "message": "Login successful"}
    
    return {"status": "error", "message": "Invalid roll number or session ID"}

@app.get("/api/student-dashboard/{session_id}/{roll_no}")
async def student_dashboard(session_id: str, roll_no: str):
    """Provides student dashboard details."""
    if session_id in sessions and roll_no in sessions[session_id]["students"]:
        session_data = sessions[session_id]
        student_data = session_data["students"][roll_no]
        return {
            "status": "success",
            "data": {
                "roll_no": roll_no,
                "google_form_link": session_data["google_form_link"],
                "proctoring_status": student_data.get("status", "Not Started"),
            }
        }
    return {"status": "error", "message": "Invalid session ID or roll number"}


@app.post("/api/submit-frame")
async def submit_frame(data: dict):
    try:
        session_id = data.get("session_id")
        roll_no = data.get("roll_no")
        frame_base64 = data.get("frame")

        if session_id not in sessions or roll_no not in sessions[session_id]["students"]:
            return {"status": "error", "message": "Invalid session ID or roll number"}

        # Convert base64 to numpy array
        frame_bytes = base64.b64decode(frame_base64.split(",")[-1])  # remove prefix if exists
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return {"status": "error", "message": "Failed to decode frame"}
        
        # --- AI Analysis ---
        result = analyze_frame(frame)
        
        # Determine status
        if result["num_faces"] == 0:
            status = "No face detected"
        elif result["num_faces"] > 1:
            status = "Multiple faces detected"
        elif result["state"] in ["distracted", "away"]:
            status = "Distracted"
        elif result["state"] == "focused":
            status = "Focused"
        else:  # device detected
            status = "Device Detected"

        # Update status in database
        db.update_student_status(session_id, roll_no, status)
        
        # Save event to database
        db.save_event(session_id, roll_no, result)
        
        # Also update in-memory for backward compatibility
        sessions[session_id]["students"][roll_no]["status"] = status
        sessions[session_id]["students"][roll_no]["events"].append(result)

        await send_status_update()

        return {"status": "success", "proctoring_status": status, "analysis": result}

    except Exception as e:
        print("Error in /submit-frame:", e)
        return {"status": "error", "message": str(e)}

@app.post("/api/stop-session")
async def stop_session(data: dict):
    try:
        session_id = data.get("session_id")
        roll_no = data.get("roll_no")

        if not session_id or not roll_no:
            return {"status": "error", "message": "Session ID and roll number are required"}

        if session_id not in sessions or roll_no not in sessions[session_id]["students"]:
            return {"status": "error", "message": "Invalid session ID or roll number"}

        student_data = sessions[session_id]["students"][roll_no]
        events = student_data.get("events", [])

        # Calculate results (handle case where no events exist)
        if not events:
            results = {
                "average_attention_score": 0,
                "distracted_count": 0,
                "multiple_faces_count": 0,
                "no_face_count": 0,
                "device_detected_count": 0,
            }
        else:
            attention_scores = [event.get("attention_score", 0) for event in events]
            distracted_count = sum(1 for event in events if event.get("state", "") in ["distracted", "away"])
            multiple_faces_count = sum(1 for event in events if event.get("num_faces", 0) > 1)
            no_face_count = sum(1 for event in events if event.get("num_faces", 0) == 0)
            device_detected_count = sum(1 for event in events if event.get("device", {}).get("phone_detected", False))

            results = {
                "average_attention_score": sum(attention_scores) / len(attention_scores) if attention_scores else 0,
                "distracted_count": distracted_count,
                "multiple_faces_count": multiple_faces_count,
                "no_face_count": no_face_count,
                "device_detected_count": device_detected_count,
            }

        # Update student status to Finished in database
        db.update_student_status(session_id, roll_no, "Finished")
        
        # Save final results to database
        db.save_session_results(session_id, roll_no, results)
        
        # Also update in-memory for backward compatibility
        sessions[session_id]["students"][roll_no]["status"] = "Finished"
        sessions[session_id]["students"][roll_no]["results"] = results

        await send_status_update()

        return {"status": "success", "results": results}
    
    except Exception as e:
        print(f"Error in /stop-session: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/admin-status")
async def admin_status():
    """Provides the current status of all sessions to the admin."""
    return db.get_all_sessions()

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Gets session details."""
    session_data = db.get_session_data(session_id)
    if session_data:
        return {"status": "success", "data": session_data}
    return {"status": "error", "message": "Session not found"}


@app.get("/api/session/{session_id}/events/{roll_no}")
async def get_session_events(session_id: str, roll_no: str):
    """Get all events for a specific student session."""
    events = db.get_session_events(session_id, roll_no)
    return {"status": "success", "events": events}

# --- Load existing sessions from database on startup ---
def load_existing_sessions():
    """Load existing sessions from database into memory for backward compatibility."""
    global sessions
    sessions = db.get_all_sessions()
    print(f"Loaded {len(sessions)} existing sessions from database")

# Load sessions on startup
load_existing_sessions()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
