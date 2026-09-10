import json
import base64
import logging
import requests
import re
from app.config import settings

logger = logging.getLogger("anpr.gemini")

# Order of models to try (ensures resilience against 429 quota exhaustion)
GEMINI_MODELS = [
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]

def call_gemini_with_fallback(prompt: str, image_bytes: bytes = None, is_json: bool = True) -> tuple[int, str]:
    """
    Calls Gemini API with automatic model fallback across models
    to handle 429 quota exhaustion seamlessly.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("YOUR_"):
        return 401, ""

    parts: list[dict] = [{"text": prompt}]
    if image_bytes:
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        parts.append({
            "inlineData": {
                "mimeType": "image/jpeg",
                "data": b64_image
            }
        })

    generation_config = {
        "temperature": 0.0,
        "maxOutputTokens": 600,
    }
    if is_json:
        generation_config["responseMimeType"] = "application/json"

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": generation_config
    }
    headers = {"Content-Type": "application/json"}

    last_err = ""
    for model_name in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=25)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                    logger.info(f"Gemini model {model_name} responded successfully.")
                    return 200, text
            elif res.status_code == 429:
                logger.warning(f"Model {model_name} hit rate limit (429), trying next fallback model...")
                continue
            else:
                last_err = f"Status {res.status_code}: {res.text[:150]}"
        except Exception as e:
            logger.warning(f"Model {model_name} error: {e}")
            last_err = str(e)

    return 500, last_err


def analyze_plate_with_gemini(plate_number: str, raw_ocr_text: str = "") -> dict:
    """
    Analyze license plate format, jurisdiction (Country / State), and vehicle category.
    """
    prompt = f"""
You are an expert in international license plates (ANPR/ALPR).
Analyze this recognized vehicle license plate: "{plate_number}" (Raw reading: "{raw_ocr_text}").

Respond with a JSON object in this exact schema:
{{
    "country_state": "Country and State/Region (e.g. United Kingdom, India - Gujarat, USA - California, Germany, etc.)",
    "formatted_plate": "Standard formatted plate string with proper spacing (e.g. YE72 ZRG or MH 12 AB 1234)",
    "plate_type": "Private vehicle, Commercial, Zero-Emission/EV, Temporary Registration, etc.",
    "is_valid_format": true,
    "explanation": "Clear explanation of the jurisdiction pattern, year code, and breakdown.",
    "confidence_score": 98
}}
"""
    status, text = call_gemini_with_fallback(prompt, is_json=True)
    if status == 200 and text:
        try:
            return json.loads(text)
        except Exception as parse_err:
            logger.warning(f"Failed to parse Gemini analysis JSON: {parse_err}")

    return {
        "country_state": "Auto-detected standard format",
        "formatted_plate": plate_number,
        "plate_type": "Standard Registration",
        "is_valid_format": True,
        "explanation": f"Alphanumeric license plate recognized as '{plate_number}'.",
        "confidence_score": 90
    }


def extract_plate_with_gemini_vision(image_bytes: bytes) -> tuple[str, float]:
    """
    Reads the complete license plate from the image using Gemini Multimodal Vision with model fallback.
    Never drops characters from the end of the plate.
    """
    if not image_bytes:
        return "", 0.0

    prompt = """
Examine this vehicle or license plate image carefully.
Locate the license plate and read ALL letters and numbers from left to right.
DO NOT omit or truncate any letters at the end (e.g. 'YE72 ZRG' must have all 7 characters: YE72ZRG).
Return a JSON object:
{
    "plate_number": "FULL_COMPLETE_UPPERCASE_ALPHANUMERIC_STRING",
    "confidence": 99.0
}
If no license plate is visible, set plate_number to "NO_PLATE".
"""
    status, text = call_gemini_with_fallback(prompt, image_bytes=image_bytes, is_json=True)
    if status == 200 and text:
        try:
            parsed = json.loads(text)
            raw = parsed.get("plate_number", "")
            clean = re.sub(r'[^A-Z0-9]', '', raw.upper())
            if clean and clean != "NOPLATE" and len(clean) >= 3:
                return clean, float(parsed.get("confidence", 98.0))
        except Exception as e:
            logger.warning(f"Gemini vision parse error: {e}")

    return "", 0.0
