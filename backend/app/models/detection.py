from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.database import Base

class DetectionRecord(Base):
    __tablename__ = "detection_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate_number = Column(String(64), index=True, nullable=False)
    confidence = Column(Float, default=0.0)
    bbox_coordinates = Column(String(256), nullable=True)  # JSON string e.g. "[100, 200, 300, 250]"
    original_image_url = Column(Text, nullable=True)
    cropped_image_url = Column(Text, nullable=True)
    ai_insights = Column(Text, nullable=True)             # JSON string of Gemini analysis
    is_verified = Column(Boolean, default=False)          # Set to True if user manually edited/confirmed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "plate_number": self.plate_number,
            "confidence": round(self.confidence, 2) if self.confidence else 0.0,
            "bbox_coordinates": self.bbox_coordinates,
            "original_image_url": self.original_image_url,
            "cropped_image_url": self.cropped_image_url,
            "ai_insights": self.ai_insights,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
