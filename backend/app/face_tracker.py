# proctor_ai/face_tracker.py
import cv2
import numpy as np
from .head_pose import get_head_pose

def analyze_frame(frame_bytes):
    # Convert bytes to numpy array
    nparr = np.frombuffer(frame_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Your AI logic here
    # Example using OpenCV's face detector
    faces=get_head_pose(img)
    num_faces=faces[0]
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    return num_faces
