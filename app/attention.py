import time

class AttentionScorer:
    def __init__(self, yaw_threshold, pitch_threshold, gaze_duration_threshold, smoothing_alpha):
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold
        self.gaze_duration_threshold = gaze_duration_threshold
        self.smoothing_alpha = smoothing_alpha

        self.last_gaze_off_center_time = None
        self.smoothed_score = 70.0  # Start with a base score

    def calculate_attention_score(self, head_pose, gaze, device, num_faces):
        """
        Calculates the attention score based on head pose, gaze, device detection, and number of faces.
        """
        base_score = 100
        state = "focused" # Default state

        # Apply penalties and determine state based on priority
        # Highest priority: Device detected
        if device and device["phone_detected"]:
            base_score -= 50
            state = "device_detected"
        # Next priority: Multiple faces detected
        elif num_faces > 1: # Use elif to ensure device_detected takes precedence
            base_score -= 60 # Significant penalty
            state = "multiple_faces_detected"
        # Next priority: Head away
        elif head_pose: # Only check head pose if not device_detected or multiple_faces_detected
            if abs(head_pose["yaw"]) > self.yaw_threshold or abs(head_pose["pitch"]) > self.pitch_threshold:
                base_score -= 30
                state = "away"

        # Gaze penalty (only affects score, not state directly anymore)
        if gaze:
            if gaze["direction"] != "center":
                if self.last_gaze_off_center_time is None:
                    self.last_gaze_off_center_time = time.time()
                elif time.time() - self.last_gaze_off_center_time > self.gaze_duration_threshold:
                    base_score -= 25 # Gaze penalty still applies to score
            else:
                self.last_gaze_off_center_time = None

        # Clamp score to [0, 100]
        score = max(0, min(100, base_score))

        # Apply exponential moving average for smoothing
        self.smoothed_score = (self.smoothing_alpha * score) + ((1 - self.smoothing_alpha) * self.smoothed_score)
        
        final_score = max(0, min(100, self.smoothed_score))

        return final_score, state