from typing import Optional, Any
from pydantic import BaseModel

class DetectionResponse(BaseModel):
    success: bool
    plate_number: str
    confidence: float
    bbox_coordinates: list[int]
    cropped_image: Optional[str] = None  # Base64 data URI for immediate display
    original_image_url: Optional[str] = None
    cropped_image_url: Optional[str] = None
    record_id: Optional[int] = None
    ai_insights: Optional[dict[str, Any]] = None
    processing_time_ms: Optional[float] = None
    message: Optional[str] = None

class PlateUpdateRequest(BaseModel):
    plate_number: str

class DetectionRecordSchema(BaseModel):
    id: int
    plate_number: str
    confidence: float
    bbox_coordinates: Optional[str] = None
    original_image_url: Optional[str] = None
    cropped_image_url: Optional[str] = None
    ai_insights: Optional[str] = None
    is_verified: bool = False
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    total: int
    records: list[dict[str, Any]]
