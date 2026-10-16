import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.detection import router as detection_router
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.database import Base, engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("anpr.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    logger.info("Initializing ANPR API and database connection...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.warning(f"Database table verification warning: {e}")

    # Yield control during app lifecycle
    yield

    logger.info("Shutting down ANPR API...")

app = FastAPI(
    title="License Plate Recognition (ANPR) API",
    description="Automatic Number Plate Recognition backend powered by YOLOv8, OpenCV, EasyOCR, and Gemini AI.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
# Allowing all localhost origins and wildcard for development flexibility
origins = settings.ALLOWED_ORIGINS + [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows any client or frontend to connect seamlessly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(detection_router)
app.include_router(health_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "License Plate Recognition (ANPR) API is online",
        "docs_url": "/docs",
        "endpoints": {
            "detect_plate": "POST /api/detect-plate",
            "history": "GET /api/history",
            "update_plate": "PUT /api/plates/{id}",
            "delete_plate": "DELETE /api/plates/{id}",
            "health": "GET /api/health",
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
