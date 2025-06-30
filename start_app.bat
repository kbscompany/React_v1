@echo off
echo Starting Warehouse Management System...
echo.

REM Kill existing process on port 8000
echo Stopping any existing processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /F /PID %%a 2>NUL
)
timeout /t 2 /nobreak > NUL

REM Start Backend
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %cd% && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak > NUL

REM Start Frontend
echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "cd /d %cd%\fastapi-warehouse-management\frontend && npm run dev"

echo.
echo Applications starting...
echo Backend API: http://localhost:8000
echo Frontend App: http://localhost:5173
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C in each window to stop the servers
pause 