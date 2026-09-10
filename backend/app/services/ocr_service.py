import re
import cv2
import io
import base64
import logging
import numpy as np

logger = logging.getLogger("anpr.ocr")

_easyocr_reader = None

def get_ocr_reader():
    """Lazy-load the EasyOCR reader instance."""
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            logger.info("Initializing EasyOCR Reader (English)...")
            _easyocr_reader = easyocr.Reader(['en'], gpu=False)
            logger.info("EasyOCR Reader initialized.")
        except Exception as e:
            logger.warning(f"EasyOCR initialization bypassed: {e}")
            _easyocr_reader = None
    return _easyocr_reader


def clean_plate_text(raw_text: str) -> str:
    """
    Clean OCR text using regex:
    - Converts to uppercase
    - Strips whitespace and non-alphanumeric noise
    - Resolves typical character confusions
    """
    if not raw_text:
        return ""

    text = raw_text.upper().strip()
    text = re.sub(r'[^A-Z0-9]', '', text)

    cleaned = list(text)
    for i, char in enumerate(cleaned):
        prev_is_digit = (i > 0 and cleaned[i - 1].isdigit())
        next_is_digit = (i < len(cleaned) - 1 and cleaned[i + 1].isdigit())

        # If a letter sits between two digits, it is likely a digit
        if prev_is_digit and next_is_digit:
            if char in ['O', 'Q', 'D']:
                cleaned[i] = '0'
            elif char in ['I', 'L', 'T']:
                cleaned[i] = '1'
            elif char == 'Z':
                cleaned[i] = '2'
            elif char == 'S':
                cleaned[i] = '5'
            elif char == 'B':
                cleaned[i] = '8'
            elif char == 'G':
                cleaned[i] = '6'

    return "".join(cleaned)


def preprocess_plate_crop(crop_bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Preprocess the cropped license plate region using OpenCV:
    1. Resize for OCR legibility
    2. Convert to Grayscale
    3. Bilateral filter denoising
    4. CLAHE contrast enhancement
    5. Adaptive Otsu Binarization
    """
    h, w = crop_bgr.shape[:2]
    if h == 0 or w == 0:
        return crop_bgr, crop_bgr

    target_height = 140
    aspect_ratio = w / max(h, 1)
    target_width = int(target_height * aspect_ratio)
    resized = cv2.resize(crop_bgr, (target_width, target_height), interpolation=cv2.INTER_CUBIC)

    # 1. Grayscale
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

    # 2. Denoise with bilateral filter
    denoised = cv2.bilateralFilter(gray, d=11, sigmaColor=17, sigmaSpace=17)

    # 3. Contrast adjustment (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    contrast = clahe.apply(denoised)

    # 4. Otsu binarization
    _, thresh_otsu = cv2.threshold(contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Invert if the background is dark and text is light (e.g. red plate with white letters)
    white_pixels = cv2.countNonZero(thresh_otsu)
    total_pixels = thresh_otsu.size
    if white_pixels < (total_pixels / 2):
        thresh_otsu = cv2.bitwise_not(thresh_otsu)

    return thresh_otsu, contrast


def extract_plate_text_and_crop(
    image_bgr: np.ndarray,
    bbox: list[int],
    full_image_bytes: bytes = None
) -> tuple[str, str, float, str, bytes]:
    """
    Crops the bbox from image_bgr, preprocesses with OpenCV, and runs EasyOCR with Gemini Vision fallback.
    Returns:
        (cleaned_text, raw_text, confidence_percentage, base64_cropped_image, cropped_bytes)
    """
    h, w = image_bgr.shape[:2]
    x1, y1, x2, y2 = bbox

    x1 = max(0, min(x1, w - 1))
    y1 = max(0, min(y1, h - 1))
    x2 = max(x1 + 1, min(x2, w))
    y2 = max(y1 + 1, min(y2, h))

    crop = image_bgr[y1:y2, x1:x2]

    # Encode crop to JPEG bytes and base64
    is_success, buffer = cv2.imencode(".jpg", crop)
    crop_bytes = buffer.tobytes() if is_success else b""
    b64_str = f"data:image/jpeg;base64,{base64.b64encode(crop_bytes).decode('utf-8')}" if crop_bytes else ""

    processed_binary, processed_gray = preprocess_plate_crop(crop)

    # 1. EasyOCR
    reader = get_ocr_reader()
    raw_candidates = []
    confidences = []

    if reader is not None:
        try:
            results_bin = reader.readtext(processed_binary, detail=1, allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ -')
            for _, text, conf in results_bin:
                cleaned = clean_plate_text(text)
                if len(cleaned) >= 2:
                    raw_candidates.append(text)
                    confidences.append(float(conf))

            if not raw_candidates or max(confidences, default=0) < 0.4:
                results_gray = reader.readtext(processed_gray, detail=1, allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ -')
                for _, text, conf in results_gray:
                    cleaned = clean_plate_text(text)
                    if len(cleaned) >= 2:
                        raw_candidates.append(text)
                        confidences.append(float(conf))
        except Exception as ocr_err:
            logger.warning(f"EasyOCR error: {ocr_err}")

    raw_text = " ".join(raw_candidates).strip()
    cleaned_plate = clean_plate_text(raw_text)

    # 2. Vision OCR Verification & Enhancement
    # Ensure no characters or suffixes are dropped (e.g. 'YE72ZRG' instead of 'YE72Z')
    try:
        from app.services.gemini_service import extract_plate_with_gemini_vision

        v_text, v_conf = "", 0.0
        if crop_bytes:
            v_text, v_conf = extract_plate_with_gemini_vision(crop_bytes)

        if (not v_text or len(v_text) < 6) and full_image_bytes:
            f_text, f_conf = extract_plate_with_gemini_vision(full_image_bytes)
            if f_text and len(f_text) > len(v_text):
                v_text, v_conf = f_text, f_conf

        if v_text:
            # If Gemini vision found a longer or complete string, adopt it!
            if not cleaned_plate or len(v_text) > len(cleaned_plate) or (v_text.startswith(cleaned_plate) and len(v_text) > len(cleaned_plate)):
                logger.info(f"Adopted complete plate number: '{v_text}' (replaces partial '{cleaned_plate}')")
                cleaned_plate = v_text
                raw_text = v_text
                confidences.append(v_conf / 100.0)
    except Exception as vision_err:
        logger.warning(f"Vision enhancement error: {vision_err}")

    if not cleaned_plate:
        cleaned_plate = "NO_PLATE_DETECTED"
        confidence_pct = 0.0
    else:
        avg_conf = (sum(confidences) / len(confidences)) if confidences else 0.90
        confidence_pct = round(min(1.0, max(0.3, avg_conf)) * 100, 1)

    return cleaned_plate, raw_text, confidence_pct, b64_str, crop_bytes
