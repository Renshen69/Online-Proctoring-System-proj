# Focus & Device Detection for Online Exams

This project is a Python-based online proctoring system that uses computer vision to monitor a user's focus and detect unauthorized devices during an online exam. It provides a real-time dashboard with attention score, alerts, and logs.

## Quick Start

1.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Run the application:**
    ```bash
    streamlit run app/dashboard.py
    ```

## How to Run

### With Webcam

To use your default webcam as the video source:

```bash
streamlit run app/dashboard.py
```

### With a Video File

To process a pre-recorded video file:

```bash
streamlit run app/dashboard.py -- --video path/to/your/video.mp4
```
*Note the double dash `--` which is required to pass arguments to the streamlit script.*

You can place your video files in the `demo_videos` directory for easy access.

## Configuration

You can configure the application by creating a `.env` file in the root of the project. Copy the `.env.example` file to get started:

```bash
cp .env.example .env
```

### Configuration Options

-   `CAMERA_INDEX`: The index of the camera to use (e.g., `0` for the default webcam).
-   `VIDEO_PATH`: Path to a video file to use instead of a webcam.
-   `SCORE_THRESHOLD_FOCUSED`: The score above which the user is considered "focused".
-   `SCORE_THRESHOLD_DISTRACTED`: The score below which the user is considered "distracted".
-   `HEAD_POSE_YAW_THRESHOLD`: The yaw angle (in degrees) beyond which the user is considered to be looking away.
-   `HEAD_POSE_PITCH_THRESHOLD`: The pitch angle (in degrees) beyond which the user is considered to be looking away.
-   `GAZE_OFF_CENTER_DURATION`: The duration (in seconds) the user's gaze can be off-center before a penalty is applied.
-   `SCORE_SMOOTHING_ALPHA`: The alpha value for the exponential moving average used to smooth the attention score. A lower value results in smoother but less responsive scores.

## Implementation Notes

### Head Pose Estimation

Head pose is estimated using MediaPipe Face Mesh to detect facial landmarks. These 2D landmarks are then used with `cv2.solvePnP` to estimate the 3D pose of the head, providing yaw, pitch, and roll angles.

### Gaze Estimation

Gaze is approximated by tracking the position of the iris relative to the corners of the eye. This provides a simple "left", "right", or "center" gaze direction.

### Device Detection

Device detection is performed using a pre-trained YOLOv8 model to detect cell phones. If YOLOv8 is not available, the application falls back to a MobileNet-SSD model.

**Note on MobileNet-SSD:** For the fallback device detection to work, you need to download the model files:
- `MobileNetSSD_deploy.prototxt.txt`
- `MobileNetSSD_deploy.caffemodel`

You can find these online, for example, in the original [MobileNet-SSD repository](https://github.com/chuanqi305/MobileNet-SSD). Place these files in the root of the project.

### Attention Score

The attention score is calculated based on a set of rules and penalties:
-   A base score is penalized based on head pose (looking away), gaze (off-center for too long), and device detection.
-   The score is smoothed over time using an exponential moving average to reduce noise.

### GPU Support (Optional)

If you have a compatible GPU and have installed the GPU version of PyTorch, YOLOv8 will automatically use it for faster device detection.

## Running Tests

To run the unit tests for the attention scoring function:

```bash
python -m unittest tests/test_attention.py
```