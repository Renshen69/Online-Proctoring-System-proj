# proctor_ai/analyze_frame.py
import cv2
from app.head_pose import get_head_pose
from app.gaze import get_gaze
from app.device_detector import detect_device
from app.attention import AttentionScorer

# Thresholds (can also load from .env)
HEAD_POSE_YAW_THRESHOLD = 25
HEAD_POSE_PITCH_THRESHOLD = 20
GAZE_OFF_CENTER_DURATION = 1.5
SCORE_SMOOTHING_ALPHA = 0.1

attention_scorer = AttentionScorer(
    HEAD_POSE_YAW_THRESHOLD, HEAD_POSE_PITCH_THRESHOLD, GAZE_OFF_CENTER_DURATION, SCORE_SMOOTHING_ALPHA
)

def analyze_frame(frame):
    """Analyzes a single frame and returns number of faces, status, attention score, and device info."""
    num_faces, head_pose = get_head_pose(frame)
    _, gaze = get_gaze(frame)
    device = detect_device(frame)

    attention_score, state = attention_scorer.calculate_attention_score(head_pose, gaze, device, num_faces)

    return {
        "num_faces": num_faces,
        "head_pose": head_pose,
        "gaze": gaze,
        "device": device,
        "attention_score": round(attention_score, 2),
        "state": state
    }
