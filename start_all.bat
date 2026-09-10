@echo off
echo Starting AutoScan ANPR Application (Backend + Frontend)...
start "ANPR FastAPI Backend" cmd /k "start_backend.bat"
start "ANPR Next.js Frontend" cmd /k "start_frontend.bat"
echo Both servers started!
echo Frontend: http://localhost:3000
echo Backend API Docs: http://localhost:8000/docs
