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
from auth import auth_manager
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
    if "admin" not in active_websockets or not active_websockets["admin"]:
        return
        
    # Create a copy of the list to avoid modification during iteration
    admin_websockets = active_websockets["admin"].copy()
    disconnected_websockets = []
    
    # Get current sessions from database
    try:
        sessions_data = db.get_all_sessions()
    except Exception as e:
        print(f"Error getting sessions data: {e}")
        return
    
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
    
    try:
        await websocket.accept()
        print(f"WebSocket connection established for {client_id}")
        if client_id == "admin":
            await send_status_update()

        while True:
            try:
                await websocket.receive_text() # Keep connection alive
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"WebSocket error for {client_id}: {e}")
                break
    except Exception as e:
        print(f"WebSocket connection error for {client_id}: {e}")
    finally:
        if websocket in active_websockets.get(client_id, []):
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
    """Admin starts a new custom exam session."""
    students = data.get("students") # List of roll numbers
    exam_title = data.get("exam_title")
    exam_description = data.get("exam_description")

    if not exam_title or not students:
        return {"status": "error", "message": "Exam title and students (roll numbers) are required"}

    session_id = str(uuid.uuid4())
    
    # Save to database
    if db.create_session(session_id, None, students, "custom", exam_title, exam_description):
        # Also keep in memory for backward compatibility
        sessions[session_id] = {
            "exam_type": "custom",
            "exam_title": exam_title,
            "exam_description": exam_description,
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

    # Check if session exists in database
    session_data = db.get_session_data(session_id)
    if not session_data:
        return {"status": "error", "message": "Session not found"}
    
    # Check if student exists in this session
    if roll_no not in session_data["students"]:
        return {"status": "error", "message": "Student not found in this session"}
    
    return {"status": "success", "message": "Login successful"}

@app.get("/api/student-dashboard/{session_id}/{roll_no}")
async def student_dashboard(session_id: str, roll_no: str):
    """Provides student dashboard details."""
    # Get session data from database
    session_data = db.get_session_data(session_id)
    if not session_data:
        return {"status": "error", "message": "Session not found"}
    
    # Check if student exists in this session
    if roll_no not in session_data["students"]:
        return {"status": "error", "message": "Student not found in this session"}
    
    student_data = session_data["students"][roll_no]
    
    response_data = {
        "roll_no": roll_no,
        "proctoring_status": student_data.get("status", "Not Started"),
        "exam_type": "custom",
        "exam_title": session_data.get("exam_title"),
        "exam_description": session_data.get("exam_description"),
    }
    
    return {
        "status": "success",
        "data": response_data
    }


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

@app.post("/api/submit-violation")
async def submit_violation(data: dict):
    """Receive and store violations (mouse out, tab switch) from frontend."""
    try:
        session_id = data.get("session_id")
        roll_no = data.get("roll_no")
        violation_type = data.get("violation_type")
        
        if not session_id or not roll_no or not violation_type:
            return {"status": "error", "message": "Session ID, roll number, and violation type are required"}
        
        # Save violation to database
        db.save_violation(session_id, roll_no, violation_type)
        
        # Get current counts from database (source of truth)
        violation_counts = db.get_violation_counts(session_id, roll_no)
        
        # Notify admin via websocket
        await send_status_update()
        
        return {
            "status": "success", 
            "message": "Violation recorded",
            "counts": violation_counts
        }
    
    except Exception as e:
        print(f"Error in /submit-violation: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/violation-counts/{session_id}/{roll_no}")
async def get_violation_counts(session_id: str, roll_no: str):
    """Get current violation counts for a student."""
    try:
        counts = db.get_violation_counts(session_id, roll_no)
        return {
            "status": "success",
            "counts": counts
        }
    except Exception as e:
        print(f"Error getting violation counts: {e}")
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
                "mouse_out_count": 0,
                "tab_switch_count": 0,
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
        
        # Get violation counts from database
        violation_counts = db.get_violation_counts(session_id, roll_no)
        results.update(violation_counts)

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

@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and all its data."""
    try:
        # Delete from database
        if db.delete_session(session_id):
            # Remove from in-memory sessions
            if session_id in sessions:
                del sessions[session_id]
            
            await send_status_update()
            return {"status": "success", "message": "Session deleted successfully"}
        else:
            return {"status": "error", "message": "Failed to delete session from database"}
    except Exception as e:
        return {"status": "error", "message": f"Error deleting session: {str(e)}"}

# Authentication endpoints
@app.post("/api/auth/signup")
async def admin_signup(data: dict):
    """Admin signup with email verification"""
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        return {"status": "error", "message": "Email, password, and name are required"}
    
    result = auth_manager.create_admin(email, password, name)
    return result

@app.post("/api/auth/verify-otp")
async def verify_otp(data: dict):
    """Verify OTP for admin account activation"""
    email = data.get("email")
    otp = data.get("otp")
    
    if not email or not otp:
        return {"status": "error", "message": "Email and OTP are required"}
    
    result = auth_manager.verify_otp(email, otp)
    return result

@app.post("/api/auth/login")
async def admin_login(data: dict):
    """Admin login"""
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return {"status": "error", "message": "Email and password are required"}
    
    result = auth_manager.login_admin(email, password)
    return result

@app.post("/api/auth/resend-otp")
async def resend_otp(data: dict):
    """Resend OTP for email verification"""
    email = data.get("email")
    
    if not email:
        return {"status": "error", "message": "Email is required"}
    
    result = auth_manager.resend_otp(email)
    return result

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

# --- Custom Exam Question Management ---
@app.post("/api/session/{session_id}/questions")
async def add_question(session_id: str, data: dict):
    """Add a question to a custom exam session."""
    question_text = data.get("question_text")
    question_type = data.get("question_type")  # 'mcq' or 'essay'
    points = data.get("points", 1)
    order_index = data.get("order_index", 0)
    
    if not question_text or not question_type:
        return {"status": "error", "message": "Question text and type are required"}
    
    if question_type not in ["mcq", "essay"]:
        return {"status": "error", "message": "Question type must be 'mcq' or 'essay'"}
    
    question_id = db.add_question(session_id, question_text, question_type, points, order_index)
    
    if question_id:
        return {"status": "success", "question_id": question_id}
    else:
        return {"status": "error", "message": "Failed to add question"}

@app.post("/api/question/{question_id}/options")
async def add_mcq_option(question_id: int, data: dict):
    """Add an option to an MCQ question."""
    option_text = data.get("option_text")
    is_correct = data.get("is_correct", False)
    order_index = data.get("order_index", 0)
    
    if not option_text:
        return {"status": "error", "message": "Option text is required"}
    
    success = db.add_mcq_option(question_id, option_text, is_correct, order_index)
    
    if success:
        return {"status": "success", "message": "Option added successfully"}
    else:
        return {"status": "error", "message": "Failed to add option"}

@app.get("/api/session/{session_id}/questions")
async def get_session_questions(session_id: str):
    """Get all questions for a session."""
    questions = db.get_session_questions(session_id)
    return {"status": "success", "questions": questions}

@app.post("/api/session/{session_id}/student/{roll_no}/answer")
async def submit_answer(session_id: str, roll_no: str, data: dict):
    """Submit a student's answer to a question."""
    question_id = data.get("question_id")
    answer_text = data.get("answer_text")
    selected_option_id = data.get("selected_option_id")
    
    if not question_id:
        return {"status": "error", "message": "Question ID is required"}
    
    if not answer_text and not selected_option_id:
        return {"status": "error", "message": "Either answer text or selected option is required"}
    
    success = db.save_student_answer(session_id, roll_no, question_id, answer_text, selected_option_id)
    
    if success:
        return {"status": "success", "message": "Answer submitted successfully"}
    else:
        return {"status": "error", "message": "Failed to submit answer"}

@app.get("/api/session/{session_id}/student/{roll_no}/answers")
async def get_student_answers(session_id: str, roll_no: str):
    """Get all answers for a student in a session."""
    answers = db.get_student_answers(session_id, roll_no)
    return {"status": "success", "answers": answers}

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
