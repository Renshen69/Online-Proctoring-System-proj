import cv2
import numpy as np
from ultralytics import YOLO

# Initialize YOLOv8 model
# This will download the model if not present
try:
    yolo_model = YOLO('yolov8n.pt')
    YOLO_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not initialize YOLOv8. Falling back to MobileNet-SSD. Error: {e}")
    YOLO_AVAILABLE = False

# Fallback MobileNet-SSD
if not YOLO_AVAILABLE:
    # Download from:
    # https://github.com/chuanqi305/MobileNet-SSD/blob/master/MobileNetSSD_deploy.caffemodel
    # https://github.com/chuanqi305/MobileNet-SSD/blob/master/MobileNetSSD_deploy.prototxt
    try:
        net = cv2.dnn.readNetFromCaffe("MobileNetSSD_deploy.prototxt.txt", "MobileNetSSD_deploy.caffemodel")
        CLASSES = ["background", "aeroplane", "bicycle", "bird", "boat",
                   "bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
                   "dog", "horse", "motorbike", "person", "pottedplant", "sheep",
                   "sofa", "train", "tvmonitor", "cell phone"]
        MNET_AVAILABLE = True
    except cv2.error as e:
        print(f"Error: Could not load MobileNet-SSD model. Device detection will be disabled. {e}")
        MNET_AVAILABLE = False
else:
    MNET_AVAILABLE = False


def detect_device(frame):
    """
    Detects phones or other unauthorized devices in the frame.
    Prioritizes YOLOv8 if available, otherwise falls back to MobileNet-SSD.
    """
    if YOLO_AVAILABLE:
        return detect_device_yolo(frame)
    elif MNET_AVAILABLE:
        return detect_device_mobilenet(frame)
    else:
        return {"phone_detected": False, "bbox": None, "confidence": 0.0}

def detect_device_yolo(frame):
    """Detects devices using YOLOv8."""
    results = yolo_model(frame, verbose=False)
    
    for result in results:
        for box in result.boxes:
            # 67 is the class ID for 'cell phone' in COCO dataset
            if box.cls == 67:
                x1, y1, x2, y2 = box.xyxy[0]
                bbox = [int(x1), int(y1), int(x2 - x1), int(y2 - y1)]
                confidence = float(box.conf)
                if confidence > 0.5:
                    return {"phone_detected": True, "bbox": bbox, "confidence": confidence}

    return {"phone_detected": False, "bbox": None, "confidence": 0.0}

def detect_device_mobilenet(frame):
    """Detects devices using MobileNet-SSD."""
    (h, w) = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 0.007843, (300, 300), 127.5)
    net.setInput(blob)
    detections = net.forward()

    for i in np.arange(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.5:
            idx = int(detections[0, 0, i, 1])
            if CLASSES[idx] == "cell phone":
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                (startX, startY, endX, endY) = box.astype("int")
                bbox = [startX, startY, endX - startX, endY - startY]
                return {"phone_detected": True, "bbox": bbox, "confidence": float(confidence)}

    return {"phone_detected": False, "bbox": None, "confidence": 0.0}