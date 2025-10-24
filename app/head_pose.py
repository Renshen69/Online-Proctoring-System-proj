import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh

def get_head_pose(frame):
    """
    Estimates head pose (yaw, pitch, roll) from a single frame.
    Returns a dictionary with yaw, pitch, and roll in degrees.
    """
    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as face_mesh:

        # Flip the image horizontally for a later selfie-view display
        # and convert the BGR image to RGB.
        image = cv2.cvtColor(cv2.flip(frame, 1), cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = face_mesh.process(image)
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # 3D model points.
                face_3d = np.array([
                    (0.0, 0.0, 0.0),            # Nose tip
                    (0.0, -330.0, -65.0),       # Chin
                    (-225.0, 170.0, -135.0),    # Left eye left corner
                    (225.0, 170.0, -135.0),     # Right eye right corner
                    (-150.0, -150.0, -125.0),   # Left Mouth corner
                    (150.0, -150.0, -125.0)     # Right mouth corner
                ], dtype=np.float64)

                # 2D image points from mediapipe
                face_2d = np.array([
                    (face_landmarks.landmark[1].x * image.shape[1], face_landmarks.landmark[1].y * image.shape[0]),      # Nose tip
                    (face_landmarks.landmark[152].x * image.shape[1], face_landmarks.landmark[152].y * image.shape[0]),   # Chin
                    (face_landmarks.landmark[263].x * image.shape[1], face_landmarks.landmark[263].y * image.shape[0]),   # Left eye left corner
                    (face_landmarks.landmark[33].x * image.shape[1], face_landmarks.landmark[33].y * image.shape[0]),      # Right eye right corner
                    (face_landmarks.landmark[287].x * image.shape[1], face_landmarks.landmark[287].y * image.shape[0]),   # Left Mouth corner
                    (face_landmarks.landmark[57].x * image.shape[1], face_landmarks.landmark[57].y * image.shape[0])       # Right mouth corner
                ], dtype=np.float64)

                focal_length = image.shape[1]
                center = (image.shape[1]/2, image.shape[0]/2)
                camera_matrix = np.array(
                    [[focal_length, 0, center[0]],
                     [0, focal_length, center[1]],
                     [0, 0, 1]], dtype = "double"
                )

                dist_coeffs = np.zeros((4,1)) # Assuming no lens distortion
                (success, rotation_vector, translation_vector) = cv2.solvePnP(face_3d, face_2d, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE)

                # Convert rotation vector to rotation matrix
                rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
                pose_mat = cv2.hconcat((rotation_matrix, translation_vector))
                _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)
                
                yaw = euler_angles[1, 0]
                pitch = euler_angles[0, 0]
                roll = euler_angles[2, 0]

                return {"yaw": yaw, "pitch": pitch, "roll": roll}

    return None