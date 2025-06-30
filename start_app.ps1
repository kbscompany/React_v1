Write-Host "Starting Warehouse Management System..." -ForegroundColor Cyan

# Kill any existing processes on port 8000
Write-Host "Checking for existing processes on port 8000..." -ForegroundColor Yellow
$processId = (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($processId) {
    Write-Host "Killing process on port 8000..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start Backend
Write-Host "`nStarting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Backend Server' -ForegroundColor Green; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "`nStarting Frontend Development Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\fastapi-warehouse-management\frontend'; Write-Host 'Frontend Development Server' -ForegroundColor Blue; npm run dev"

Write-Host "`nApplications starting..." -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Blue
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C in each window to stop the servers" -ForegroundColor Red 