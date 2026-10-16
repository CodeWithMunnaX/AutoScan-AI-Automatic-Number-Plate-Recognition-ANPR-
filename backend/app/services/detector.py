import logging
from pathlib import Path
import numpy as np
import cv2

logger = logging.getLogger("anpr.detector")

# Global singleton ONNX session to avoid reloading on each request
_onnx_session = None
_session_failed = False

MODEL_DIR = Path(__file__).resolve().parent.parent / "weights"
ONNX_WEIGHTS_PATH = MODEL_DIR / "yolov8n.onnx"
YOLO_INPUT_SIZE = 640
VEHICLE_CLASSES = [2, 3, 5, 7]  # COCO: car, motorcycle, bus, truck


def get_detector():
    """
    Load or retrieve the YOLOv8n ONNX model (runs on onnxruntime, no PyTorch needed).
    """
    global _onnx_session, _session_failed
    if _onnx_session is not None or _session_failed:
        return _onnx_session

    try:
        import onnxruntime as ort
        logger.info(f"Loading YOLOv8n ONNX model from {ONNX_WEIGHTS_PATH}")
        _onnx_session = ort.InferenceSession(str(ONNX_WEIGHTS_PATH), providers=["CPUExecutionProvider"])
    except Exception as e:
        _session_failed = True
        logger.warning(f"YOLO ONNX initialization bypassed ({e}). Using OpenCV computer vision detector.")
    return _onnx_session


def run_yolo(session, image_bgr: np.ndarray, conf_thres: float = 0.25, iou_thres: float = 0.45) -> list[tuple[list[int], float, int]]:
    """
    Runs YOLOv8 ONNX inference and returns [(xyxy_box, confidence, class_id), ...] in image coordinates.
    """
    h, w = image_bgr.shape[:2]

    # Letterbox resize to 640x640 keeping aspect ratio
    scale = min(YOLO_INPUT_SIZE / w, YOLO_INPUT_SIZE / h)
    new_w, new_h = int(round(w * scale)), int(round(h * scale))
    pad_x, pad_y = (YOLO_INPUT_SIZE - new_w) // 2, (YOLO_INPUT_SIZE - new_h) // 2
    canvas = np.full((YOLO_INPUT_SIZE, YOLO_INPUT_SIZE, 3), 114, dtype=np.uint8)
    canvas[pad_y:pad_y + new_h, pad_x:pad_x + new_w] = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    blob = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB).transpose(2, 0, 1)[None].astype(np.float32) / 255.0
    preds = session.run(None, {session.get_inputs()[0].name: blob})[0][0].T  # (8400, 84)

    class_scores = preds[:, 4:]
    class_ids = class_scores.argmax(axis=1)
    confs = class_scores[np.arange(len(class_ids)), class_ids]
    keep = confs >= conf_thres
    if not keep.any():
        return []

    preds, class_ids, confs = preds[keep], class_ids[keep], confs[keep]
    cx, cy, bw, bh = preds[:, 0], preds[:, 1], preds[:, 2], preds[:, 3]
    x1 = (cx - bw / 2 - pad_x) / scale
    y1 = (cy - bh / 2 - pad_y) / scale
    x2 = (cx + bw / 2 - pad_x) / scale
    y2 = (cy + bh / 2 - pad_y) / scale

    nms_boxes = [[float(a), float(b), float(c - a), float(d - b)] for a, b, c, d in zip(x1, y1, x2, y2)]
    indices = cv2.dnn.NMSBoxes(nms_boxes, confs.tolist(), conf_thres, iou_thres)

    detections = []
    for i in np.array(indices).flatten():
        box = [
            int(max(0, x1[i])), int(max(0, y1[i])),
            int(min(w, x2[i])), int(min(h, y2[i])),
        ]
        detections.append((box, float(confs[i]), int(class_ids[i])))
    return detections


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
    session = get_detector()
    if session is not None:
        try:
            detections = run_yolo(session, image_np)

            if detections:
                best_box = None
                best_conf = 0.0

                for box, conf, cls_id in detections:
                    if cls_id in VEHICLE_CLASSES and conf > best_conf:
                        best_conf = conf
                        best_box = box

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

                coords, conf, _ = max(detections, key=lambda d: d[1])
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
