import cv2
import time
from app.utils import NonBlockingQueue

def capture_frames(video_path, frame_queue: NonBlockingQueue, stop_event):
    """
    Captures frames from a webcam or video file and puts them in a queue.
    """
    if video_path:
        cap = cv2.VideoCapture(video_path)
    else:
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open video source.")
        return

    frame_id = 0
    while not stop_event.is_set():
        ret, frame = cap.read()
        if not ret:
            print("Info: End of video file or stream.")
            break
        
        frame_queue.put((frame_id, frame))
        frame_id += 1
        # Adjust sleep time to control capture frame rate
        time.sleep(1/15) # Capture at ~15 FPS

    cap.release()
    print("Capture thread stopped.")
