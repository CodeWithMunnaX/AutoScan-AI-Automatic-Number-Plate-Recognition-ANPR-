import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import logging
from pathlib import Path
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("anpr.detector")

# Global singleton model to avoid reloading on each request
_yolo_model = None
_model_type = "none"

MODEL_DIR = Path(__file__).resolve().parent.parent / "weights"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
CUSTOM_WEIGHTS_PATH = MODEL_DIR / "license_plate_yolov8n.pt"

def get_detector():
    """
    Load or retrieve the YOLO detection model if torch is allowed by OS policy.
    """
    global _yolo_model, _model_type
    if _yolo_model is not None:
        return _yolo_model, _model_type

    try:
        from ultralytics import YOLO

        if CUSTOM_WEIGHTS_PATH.exists() and CUSTOM_WEIGHTS_PATH.stat().st_size > 100000:
            logger.info(f"Loading custom license plate YOLO model from {CUSTOM_WEIGHTS_PATH}")
            _yolo_model = YOLO(str(CUSTOM_WEIGHTS_PATH))
            _model_type = "license_plate_custom"
            return _yolo_model, _model_type

        # Try downloading specialized license plate detector
        try:
            import urllib.request
            weights_url = "https://github.com/Muhammad-Raza-Ahmad/Automatic-Number-Plate-Recognition-Using-YOLOv8/raw/main/license_plate_detector.pt"
            logger.info(f"Attempting to download specialized license plate detector from {weights_url}...")
            urllib.request.urlretrieve(weights_url, str(CUSTOM_WEIGHTS_PATH))
            if CUSTOM_WEIGHTS_PATH.exists() and CUSTOM_WEIGHTS_PATH.stat().st_size > 1000000:
                _yolo_model = YOLO(str(CUSTOM_WEIGHTS_PATH))
                _model_type = "license_plate_custom"
                return _yolo_model, _model_type
        except Exception as dl_err:
            logger.warning(f"Could not download custom weights ({dl_err}), falling back to yolov8n.pt")

        _yolo_model = YOLO("yolov8n.pt")
        _model_type = "yolov8n_general"
        return _yolo_model, _model_type

    except Exception as e:
        logger.warning(f"PyTorch/YOLO initialization bypassed ({e}). Using OpenCV computer vision detector.")
        return None, "none"


def detect_plate_with_opencv(image_bgr: np.ndarray) -> tuple[list[int], float] | None:
    """
    High-precision Computer Vision License Plate Detector using OpenCV:
    1. Color segmentation: Detects Red (temporary), Yellow (commercial),
       White (standard), and Green (EV) license plates.
    2. Morphological gradient & Sobel vertical edge analysis to identify
       dense alphanumeric character clusters with aspect ratio between 1.8 and 5.5.
    """
    h, w = image_bgr.shape[:2]
    total_area = h * w

    # 1. Color Masking (HSV)
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    mask_red1 = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([12, 255, 255]))
    mask_red2 = cv2.inRange(hsv, np.array([165, 50, 50]), np.array([180, 255, 255]))
    mask_yellow = cv2.inRange(hsv, np.array([15, 60, 60]), np.array([38, 255, 255]))
    mask_green = cv2.inRange(hsv, np.array([35, 50, 40]), np.array([85, 255, 255]))
    mask_white = cv2.inRange(hsv, np.array([0, 0, 160]), np.array([180, 60, 255]))

    color_mask = mask_red1 | mask_red2 | mask_yellow | mask_green | mask_white
    kernel_color = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 7))
    closed_color = cv2.morphologyEx(color_mask, cv2.MORPH_CLOSE, kernel_color)

    contours, _ = cv2.findContours(closed_color, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []

    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        aspect = cw / max(ch, 1)
        area = cw * ch
        area_ratio = area / total_area

        if 1.8 <= aspect <= 5.8 and 0.005 <= area_ratio <= 0.35:
            # Prefer middle or lower half of vehicle where bumpers are mounted
            y_center = (y + ch / 2) / h
            vert_weight = 1.2 if 0.25 <= y_center <= 0.85 else 0.7
            candidates.append(([x, y, x + cw, y + ch], area * vert_weight))

    if candidates:
        candidates.sort(key=lambda c: c[1], reverse=True)
        best_box = candidates[0][0]
        # Generous margin around the plate to ensure no trailing characters are cut off
        box_w = best_box[2] - best_box[0]
        box_h = best_box[3] - best_box[1]
        pad_x = int(box_w * 0.18)
        pad_y = int(box_h * 0.15)
        x1 = max(0, best_box[0] - pad_x)
        y1 = max(0, best_box[1] - pad_y)
        x2 = min(w, best_box[2] + pad_x)
        y2 = min(h, best_box[3] + pad_y)
        return [x1, y1, x2, y2], 0.90

    # 2. Edge & Gradient Analysis (Sobel Vertical Gradient)
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    sobelx = cv2.Sobel(gray, cv2.CV_16S, 1, 0, ksize=3)
    abs_sobelx = cv2.convertScaleAbs(sobelx)
    blurred = cv2.GaussianBlur(abs_sobelx, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    kernel_edge = cv2.getStructuringElement(cv2.MORPH_RECT, (19, 5))
    closed_edge = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_edge)

    contours_edge, _ = cv2.findContours(closed_edge, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours_edge:
        x, y, cw, ch = cv2.boundingRect(cnt)
        aspect = cw / max(ch, 1)
        area = cw * ch
        area_ratio = area / total_area

        if 2.0 <= aspect <= 5.5 and 0.006 <= area_ratio <= 0.28:
            candidates.append(([x, y, x + cw, y + ch], area))

    if candidates:
        candidates.sort(key=lambda c: c[1], reverse=True)
        best_box = candidates[0][0]
        box_w = best_box[2] - best_box[0]
        box_h = best_box[3] - best_box[1]
        pad_x = int(box_w * 0.18)
        pad_y = int(box_h * 0.15)
        return [
            max(0, best_box[0] - pad_x),
            max(0, best_box[1] - pad_y),
            min(w, best_box[2] + pad_x),
            min(h, best_box[3] + pad_y)
        ], 0.85

    return None


def detect_license_plate(image_np: np.ndarray) -> tuple[list[int], float]:
    """
    Detects the license plate in an RGB numpy image array:
    1. Tries YOLOv8 (if available in current OS environment)
    2. Runs high-precision OpenCV contour & color segmentation detector
    3. Center-bumper heuristic fallback
    """
    h, w = image_np.shape[:2]

    # Try YOLO model first if initialized
    model, model_type = get_detector()
    if model is not None:
        try:
            results = model.predict(image_np, conf=0.25, verbose=False)
            boxes = results[0].boxes

            if len(boxes) > 0:
                if model_type == "license_plate_custom":
                    best_idx = int(boxes.conf.argmax())
                    box = boxes[best_idx]
                    coords = box.xyxy[0].cpu().numpy().astype(int).tolist()
                    conf = float(box.conf[0].cpu().numpy())
                    return coords, conf
                else:
                    vehicle_classes = [2, 3, 5, 7]
                    best_box = None
                    best_conf = 0.0

                    for box in boxes:
                        cls_id = int(box.cls[0].cpu().numpy())
                        conf = float(box.conf[0].cpu().numpy())
                        if cls_id in vehicle_classes and conf > best_conf:
                            best_conf = conf
                            best_box = box.xyxy[0].cpu().numpy().astype(int).tolist()

                    if best_box:
                        vx1, vy1, vx2, vy2 = best_box
                        vh = vy2 - vy1
                        vw = vx2 - vx1
                        # Crop vehicle and run OpenCV plate locator on the vehicle region
                        v_crop = image_np[vy1:vy2, vx1:vx2]
                        cv_sub = detect_plate_with_opencv(v_crop)
                        if cv_sub:
                            sub_box, sub_conf = cv_sub
                            return [
                                vx1 + sub_box[0],
                                vy1 + sub_box[1],
                                vx1 + sub_box[2],
                                vy1 + sub_box[3]
                            ], round(best_conf * 0.95, 2)

                        px1 = max(0, int(vx1 + vw * 0.15))
                        py1 = min(h - 1, int(vy1 + vh * 0.50))
                        px2 = min(w - 1, int(vx2 - vw * 0.15))
                        py2 = min(h, int(vy2 - vh * 0.05))
                        return [px1, py1, px2, py2], round(best_conf * 0.85, 2)

                    best_idx = int(boxes.conf.argmax())
                    box = boxes[best_idx]
                    coords = box.xyxy[0].cpu().numpy().astype(int).tolist()
                    conf = float(box.conf[0].cpu().numpy())
                    return coords, conf
        except Exception as e:
            logger.warning(f"YOLO inference error: {e}")

    # 2. Run OpenCV contour and color segmenter
    cv_box = detect_plate_with_opencv(image_np)
    if cv_box:
        logger.info(f"OpenCV successfully localized plate at {cv_box[0]}")
        return cv_box

    # 3. Default center bumper fallback
    logger.warning("Using center bumper fallback region.")
    return [int(w * 0.2), int(h * 0.35), int(w * 0.8), int(h * 0.75)], 0.5
