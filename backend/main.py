from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import uuid

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
        status_data = {
            session_id: {
                "student_id": data["student_id"],
                "status": data["status"],
                "google_form_link": data["google_form_link"],
            }
            for session_id, data in sessions.items()
        }
        for websocket in active_websockets["admin"]:
            await websocket.send_text(json.dumps({"type": "status_update", "data": status_data}))

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
    if not google_form_link:
        return {"status": "error", "message": "Google Form link is required"}

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "google_form_link": google_form_link,
        "student_id": None,
        "status": "Not Started",
    }
    await send_status_update()
    return {"status": "success", "session_id": session_id}

@app.post("/api/submit-frame")
async def submit_frame(data: dict):
    """Student submits a frame for analysis."""
    session_id = data.get("session_id")
    if session_id not in sessions:
        return {"status": "error", "message": "Invalid session ID"}

    # --- AI Proctoring Logic ---
    # This is where you would integrate your Gemini face/gaze detection logic
    # For this prototype, we'll simulate the analysis
    import random
    face_count = random.choice([1, 1, 1, 1, 0, 2]) # Simulate face count
    status = "Focused"
    if face_count == 0:
        status = "No face detected"
    elif face_count > 1:
        status = "Multiple faces detected"
    
    sessions[session_id]["status"] = status
    await send_status_update()
    return {"status": "success", "proctoring_status": status}

@app.get("/api/admin-status")
async def admin_status():
    """Provides the current status of all sessions to the admin."""
    return sessions

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Student gets session details (e.g., Google Form link)."""
    if session_id in sessions:
        return {"status": "success", "data": sessions[session_id]}
    return {"status": "error", "message": "Session not found"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
