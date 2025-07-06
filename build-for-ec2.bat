@echo off
echo Building frontend for EC2 deployment...

REM Copy production environment file
copy .env.production .env

REM Build the frontend
npm run build

REM Clean up
del .env

echo.
echo ✅ Build complete! 
echo 📁 Files are in the 'dist' folder
echo 🌐 Frontend will connect to: http://100.29.4.72:8000
echo.
echo To deploy:
echo 1. Copy the 'dist' folder contents to your web server
echo 2. Make sure your backend is running on port 8000
echo.
pause 