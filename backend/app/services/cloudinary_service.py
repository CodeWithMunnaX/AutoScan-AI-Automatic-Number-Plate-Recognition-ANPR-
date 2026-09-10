import logging
import io
import cloudinary
import cloudinary.uploader
from app.config import settings

logger = logging.getLogger("anpr.cloudinary")

# Configure Cloudinary SDK
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

def upload_image_bytes(image_bytes: bytes, folder: str = "car_scanner", public_id_prefix: str = "plate") -> str | None:
    """
    Upload image bytes to Cloudinary and return the secure HTTPS URL.
    Returns None if upload fails or credentials are not configured.
    """
    try:
        if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY):
            logger.warning("Cloudinary credentials missing, skipping upload.")
            return None

        result = cloudinary.uploader.upload(
            image_bytes,
            folder=folder,
            resource_type="image",
            overwrite=True,
        )
        url = result.get("secure_url") or result.get("url")
        logger.info(f"Successfully uploaded image to Cloudinary: {url}")
        return url
    except Exception as e:
        logger.warning(f"Cloudinary upload error: {e}")
        return None
