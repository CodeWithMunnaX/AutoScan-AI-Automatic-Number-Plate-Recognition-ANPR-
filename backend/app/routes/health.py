from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["System"])

@router.get("/api/health")
@router.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "License Plate Recognition API (ANPR)",
        "version": "1.0.0",
        "cloudinary_configured": bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("YOUR_")),
    }
