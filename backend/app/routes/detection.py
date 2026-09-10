import time
import json
import logging
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from app.models.detection import DetectionRecord
from app.schemas.detection import DetectionResponse, PlateUpdateRequest, HistoryResponse
from app.services.detector import detect_license_plate
from app.services.ocr_service import extract_plate_text_and_crop
from app.services.cloudinary_service import upload_image_bytes
from app.services.gemini_service import analyze_plate_with_gemini

logger = logging.getLogger("anpr.routes.detection")

router = APIRouter(tags=["Detection"])

# Create tables if not already created
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Could not auto-create database tables on startup: {e}")

@router.post("/api/detect-plate", response_model=DetectionResponse)
@router.post("/detect-plate", response_model=DetectionResponse)
async def detect_plate_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Detects license plate in an uploaded image:
    1. Reads multipart image
    2. Runs YOLOv8 detector to find plate bbox
    3. Crops and preprocesses with OpenCV
    4. Performs EasyOCR + regex formatting
    5. Uploads images to Cloudinary
    6. Analyzes with Gemini AI
    7. Stores detection record in Neon PostgreSQL
    8. Returns comprehensive JSON response
    """
    start_time = time.time()

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image (JPEG, PNG, WEBP, etc.)"
        )

    try:
        # Read file bytes
        file_bytes = await file.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image_bgr is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to decode image. File may be corrupted."
            )

        # 1. YOLOv8 / OpenCV Plate Detection
        bbox, yolo_conf = detect_license_plate(image_bgr)

        # 2. OpenCV Preprocessing + EasyOCR & Multimodal Text Extraction
        cleaned_plate, raw_text, ocr_conf, crop_b64, crop_bytes = extract_plate_text_and_crop(
            image_bgr, bbox, full_image_bytes=file_bytes
        )

        # Compute overall confidence score combining YOLO and OCR
        combined_conf = round((yolo_conf * 100 * 0.4) + (ocr_conf * 0.6), 1)
        combined_conf = max(10.0, min(99.9, combined_conf))

        # 3. Upload to Cloudinary (original + cropped plate)
        orig_url = upload_image_bytes(file_bytes, folder="car_scanner/originals", public_id_prefix="vehicle")
        crop_url = upload_image_bytes(crop_bytes, folder="car_scanner/plates", public_id_prefix="plate") if crop_bytes else None

        # 4. Gemini AI Plate Insights
        ai_insights = analyze_plate_with_gemini(cleaned_plate, raw_ocr_text=raw_text)

        # If Gemini AI validated a formatted plate that corrects OCR artifacts (e.g. green EV stripe mistaken as 'I')
        if ai_insights and ai_insights.get("formatted_plate"):
            import re
            ai_formatted_clean = re.sub(r'[^A-Z0-9]', '', ai_insights["formatted_plate"].upper())
            if ai_formatted_clean and len(ai_formatted_clean) >= 4:
                cleaned_plate = ai_formatted_clean

        # 5. Persist to Neon PostgreSQL
        record_id = None
        try:
            record = DetectionRecord(
                plate_number=cleaned_plate,
                confidence=combined_conf,
                bbox_coordinates=json.dumps(bbox),
                original_image_url=orig_url,
                cropped_image_url=crop_url or (crop_b64 if len(crop_b64) < 1000 else None),
                ai_insights=json.dumps(ai_insights),
                is_verified=False,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            record_id = record.id
        except Exception as db_err:
            db.rollback()
            logger.warning(f"Failed to persist detection record to database: {db_err}")

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return DetectionResponse(
            success=True,
            plate_number=cleaned_plate,
            confidence=combined_conf,
            bbox_coordinates=bbox,
            cropped_image=crop_b64,
            original_image_url=orig_url,
            cropped_image_url=crop_url,
            record_id=record_id,
            ai_insights=ai_insights,
            processing_time_ms=elapsed_ms,
            message="License plate processed successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing plate detection: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the license plate: {str(e)}"
        )


@router.get("/api/history", response_model=HistoryResponse)
def get_detection_history(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Retrieve past scan history from the Neon PostgreSQL database."""
    try:
        query = db.query(DetectionRecord).order_by(DetectionRecord.created_at.desc())
        total = query.count()
        records = query.offset(offset).limit(limit).all()

        return HistoryResponse(
            total=total,
            records=[r.to_dict() for r in records]
        )
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        return HistoryResponse(total=0, records=[])


@router.put("/api/plates/{record_id}")
def update_plate_number(
    record_id: int,
    payload: PlateUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Allow user to manually correct/update the detected plate number.
    Marks record as verified.
    """
    try:
        record = db.query(DetectionRecord).filter(DetectionRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Detection record not found")

        record.plate_number = payload.plate_number.upper().strip()
        record.is_verified = True
        db.commit()
        db.refresh(record)
        return {"success": True, "record": record.to_dict()}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update plate record: {e}")
        raise HTTPException(status_code=500, detail=f"Database update error: {str(e)}")


@router.delete("/api/plates/{record_id}")
def delete_plate_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    """Delete a scan record."""
    try:
        record = db.query(DetectionRecord).filter(DetectionRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Detection record not found")

        db.delete(record)
        db.commit()
        return {"success": True, "message": f"Record {record_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete plate record: {e}")
        raise HTTPException(status_code=500, detail=f"Database deletion error: {str(e)}")
