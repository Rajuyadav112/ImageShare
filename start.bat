@echo off
title ImageShare Starter
echo ==========================================
echo Starting ImageShare Development Servers...
echo ==========================================

echo [1/2] Starting FastAPI Backend (Port 8000)...
cd /d "%~dp0apps\api"
start "ImageShare Backend" cmd.exe /k "call .venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Next.js Frontend (Port 3000)...
cd /d "%~dp0apps\web"
start "ImageShare Frontend" cmd.exe /k "npm run dev"

echo.
echo Both servers are launching in new windows!
echo Once they load, open: http://localhost:3000
echo.
pause
