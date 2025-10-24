import unittest
import time
from app.attention import AttentionScorer

class TestAttentionScorer(unittest.TestCase):

    def setUp(self):
        self.scorer = AttentionScorer(
            yaw_threshold=25,
            pitch_threshold=20,
            gaze_duration_threshold=1.5,
            smoothing_alpha=1.0  # No smoothing for predictable tests
        )

    def test_focused_state(self):
        score, state = self.scorer.calculate_attention_score(
            head_pose={"yaw": 0, "pitch": 0, "roll": 0},
            gaze={"direction": "center", "confidence": 0.9},
            device={"phone_detected": False}
        )
        self.assertEqual(state, "focused")
        self.assertEqual(score, 100)

    def test_away_state_yaw(self):
        score, state = self.scorer.calculate_attention_score(
            head_pose={"yaw": 30, "pitch": 0, "roll": 0},
            gaze={"direction": "center", "confidence": 0.9},
            device={"phone_detected": False}
        )
        self.assertEqual(state, "away")
        self.assertEqual(score, 70)

    def test_distracted_state_gaze(self):
        self.scorer.calculate_attention_score(
            head_pose={"yaw": 0, "pitch": 0, "roll": 0},
            gaze={"direction": "left", "confidence": 0.9},
            device={"phone_detected": False}
        )
        time.sleep(1.6)
        score, state = self.scorer.calculate_attention_score(
            head_pose={"yaw": 0, "pitch": 0, "roll": 0},
            gaze={"direction": "left", "confidence": 0.9},
            device={"phone_detected": False}
        )
        self.assertEqual(state, "distracted")
        self.assertEqual(score, 75)

    def test_device_detected_state(self):
        score, state = self.scorer.calculate_attention_score(
            head_pose={"yaw": 0, "pitch": 0, "roll": 0},
            gaze={"direction": "center", "confidence": 0.9},
            device={"phone_detected": True}
        )
        self.assertEqual(state, "device_detected")
        self.assertEqual(score, 50)

if __name__ == '__main__':
    unittest.main()