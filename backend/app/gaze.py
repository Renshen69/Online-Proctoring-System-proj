import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh

def get_gaze(frame):
    """
    Estimates gaze direction (left, right, center) from a single frame.
    Returns a tuple: (num_faces, gaze_data_for_first_face)
    This is an approximation based on iris position relative to eye corners.
    """
    with mp_face_mesh.FaceMesh(
        max_num_faces=2, # Changed to 2 for up to two faces
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as face_mesh:

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = face_mesh.process(image)
        image.flags.writeable = True

        num_faces = 0
        gaze_data = {"direction": "center", "confidence": 0.0}

        if results.multi_face_landmarks:
            num_faces = len(results.multi_face_landmarks)
            # Process only the first detected face for gaze estimation
            face_landmarks = results.multi_face_landmarks[0]

            # Using left eye for gaze estimation
            left_eye_landmarks = [33, 160, 158, 133, 153, 144]
            
            # Eye corners
            left_corner = (face_landmarks.landmark[33].x, face_landmarks.landmark[33].y)
            right_corner = (face_landmarks.landmark[133].x, face_landmarks.landmark[133].y)

            # Iris - approximation using a point in the middle of the eye
            # A more robust solution would use iris tracking landmarks if available
            iris_center_x = np.mean([face_landmarks.landmark[i].x for i in [473, 474, 475, 476, 477]])
            
            eye_width = right_corner[0] - left_corner[0]
            
            # Normalize iris position within the eye
            relative_iris_pos = (iris_center_x - left_corner[0]) / eye_width if eye_width != 0 else 0.5

            direction = "center"
            confidence = 0.8
            if relative_iris_pos < 0.35:
                direction = "right" # Looking right from user's perspective
                confidence = 1.0 - (relative_iris_pos / 0.35)
            elif relative_iris_pos > 0.65:
                direction = "left" # Looking left from user's perspective
                confidence = (relative_iris_pos - 0.65) / 0.35
            
            confidence = min(1.0, confidence)

            gaze_data = {"direction": direction, "confidence": confidence}

    return num_faces, gaze_data