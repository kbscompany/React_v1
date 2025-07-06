@echo off
REM Clean FastAPI Server Startup for Windows
REM Avoids the virtual environment file watching issues

echo 🚀 Starting FastAPI Server (Clean Mode)...
echo 📂 Current directory: %CD%
echo 🔧 Avoiding venv file watching issues
echo 🌐 Server will be available at: http://localhost:8000
echo ⚡ Press CTRL+C to stop the server
echo -------------------------------------------------

REM Start the server using our clean startup script
python start_server_clean.py

echo.
echo ✅ Server stopped
pause 