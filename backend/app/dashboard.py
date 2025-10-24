import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import streamlit as st
import cv2
import threading
import os
import time
import json
from dotenv import load_dotenv
from app.capture import capture_frames
from app.head_pose import get_head_pose
from app.gaze import get_gaze
from app.device_detector import detect_device
from app.attention import AttentionScorer
from app.utils import NonBlockingQueue, get_current_timestamp, format_as_json

# Load environment variables
load_dotenv()

# --- Configuration ---
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", 0))
SCORE_THRESHOLD_FOCUSED = int(os.getenv("SCORE_THRESHOLD_FOCUSED", 70))
SCORE_THRESHOLD_DISTRACTED = int(os.getenv("SCORE_THRESHOLD_DISTRACTED", 50))
HEAD_POSE_YAW_THRESHOLD = int(os.getenv("HEAD_POSE_YAW_THRESHOLD", 25))
HEAD_POSE_PITCH_THRESHOLD = int(os.getenv("HEAD_POSE_PITCH_THRESHOLD", 20))
GAZE_OFF_CENTER_DURATION = float(os.getenv("GAZE_OFF_CENTER_DURATION", 1.5))
SCORE_SMOOTHING_ALPHA = float(os.getenv("SCORE_SMOOTHING_ALPHA", 0.1))
LOG_FILE = "logs/events.jsonl"

# --- Main Application ---
def main():
    st.set_page_config(page_title="Focus & Device Detection", layout="wide")
    st.title("Online Proctoring System")

    # Command-line argument for video file
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", help="Path to video file")
    args, _ = parser.parse_known_args()
    video_path = args.video

    # --- State Management ---
    if "stop_event" not in st.session_state:
        st.session_state.stop_event = threading.Event()
    if "frame_queue" not in st.session_state:
        st.session_state.frame_queue = NonBlockingQueue(maxsize=1)
    if "capture_thread" not in st.session_state:
        st.session_state.capture_thread = None
    if "attention_scorer" not in st.session_state:
        st.session_state.attention_scorer = AttentionScorer(
            HEAD_POSE_YAW_THRESHOLD, HEAD_POSE_PITCH_THRESHOLD, GAZE_OFF_CENTER_DURATION, SCORE_SMOOTHING_ALPHA
        )
    if "log_data" not in st.session_state:
        st.session_state.log_data = []
    if "chart_data" not in st.session_state:
        st.session_state.chart_data = []
    if "last_log_entry" not in st.session_state:
        st.session_state.last_log_entry = None


    # --- UI Layout ---
    col1, col2 = st.columns(2)

    with col1:
        st.header("Live Feed")
        video_placeholder = st.empty()

    with col2:
        st.header("Analysis")
        score_placeholder = st.empty()
        status_placeholder = st.empty()
        chart_placeholder = st.empty()
        st.header("Event Log")
        log_placeholder = st.empty()


    # --- Control Buttons ---
    if st.button("Start Proctoring"):
        if st.session_state.capture_thread is None or not st.session_state.capture_thread.is_alive():
            st.session_state.stop_event.clear()
            st.session_state.capture_thread = threading.Thread(
                target=capture_frames,
                args=(video_path, st.session_state.frame_queue, st.session_state.stop_event)
            )
            st.session_state.capture_thread.start()

    if st.button("Stop Proctoring"):
        st.session_state.stop_event.set()
        if st.session_state.capture_thread:
            st.session_state.capture_thread.join()
        st.session_state.capture_thread = None


    # --- Processing Loop ---
    while not st.session_state.stop_event.is_set():
        frame_data = st.session_state.frame_queue.get()
        if frame_data is None:
            time.sleep(0.01)
            continue

        frame_id, frame = frame_data

        if frame_id % 2 == 0:
            # --- Analysis ---
            num_faces, head_pose = get_head_pose(frame)
            _, gaze = get_gaze(frame) # Gaze also returns num_faces, but we use head_pose's for consistency
            device = detect_device(frame)
            attention_score, state = st.session_state.attention_scorer.calculate_attention_score(head_pose, gaze, device, num_faces)

            # --- Logging ---
            log_entry = {
                "timestamp": get_current_timestamp(),
                "frame_id": frame_id,
                "head_pose": head_pose,
                "gaze": gaze,
                "device": device,
                "num_faces": num_faces, # Add num_faces to log
                "attention_score": round(attention_score, 2),
                "state": state
            }
            st.session_state.last_log_entry = log_entry
        
        log_entry = st.session_state.last_log_entry
        if log_entry:
            st.session_state.log_data.insert(0, log_entry)
            if len(st.session_state.log_data) > 10:
                st.session_state.log_data.pop()
            
            with open(LOG_FILE, "a") as f:
                f.write(format_as_json(log_entry) + "\n")

            # --- Update UI ---
            attention_score = log_entry["attention_score"]
            state = log_entry["state"]
            device = log_entry["device"]
            num_faces_logged = log_entry["num_faces"]

            # Draw bounding box for device
            if device["phone_detected"] and device["bbox"]:
                x, y, w, h = device["bbox"]
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                cv2.putText(frame, "Device Detected", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            
            # Draw text for multiple faces
            if num_faces_logged > 1:
                cv2.putText(frame, f"Multiple Faces: {num_faces_logged}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            score_placeholder.metric("Attention Score", f"{attention_score:.1f}")

            if state == "focused":
                status_placeholder.success(f"Status: {state.upper()}")
            elif state == "distracted" or state == "away":
                status_placeholder.warning(f"Status: {state.upper()}")
            elif state == "multiple_faces_detected":
                status_placeholder.error(f"Status: MULTIPLE FACES DETECTED!")
            else: # device_detected
                status_placeholder.error(f"Status: {state.upper()}")

            st.session_state.chart_data.append(attention_score)
            if len(st.session_state.chart_data) > 60:
                st.session_state.chart_data.pop(0)
            chart_placeholder.line_chart(st.session_state.chart_data)

            log_placeholder.json(st.session_state.log_data)

        video_placeholder.image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), channels="RGB")
        
        # Control refresh rate
        time.sleep(1/15)


if __name__ == "__main__":
    main()
