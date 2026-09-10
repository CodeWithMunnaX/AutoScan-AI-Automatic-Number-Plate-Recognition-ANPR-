@echo off
echo ========================================================
echo Starting AutoScan ANPR FastAPI Backend on http://localhost:8000
echo ========================================================
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
