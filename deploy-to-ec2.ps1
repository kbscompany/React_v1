# EC2 Deployment Script
Write-Host "🚀 Building frontend for EC2 deployment..." -ForegroundColor Green

try {
    # Copy production environment file
    Write-Host "📝 Setting up production environment..." -ForegroundColor Yellow
    Copy-Item .env.production .env

    # Build the frontend
    Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
    npm run build

    # Clean up
    Remove-Item .env

    Write-Host ""
    Write-Host "✅ Build complete!" -ForegroundColor Green
    Write-Host "📁 Files are in the 'dist' folder" -ForegroundColor Cyan
    Write-Host "🌐 Frontend will connect to: http://100.29.4.72:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Copy the 'dist' folder contents to your web server" -ForegroundColor White
    Write-Host "2. Make sure your backend is running on port 8000" -ForegroundColor White
    Write-Host "3. Restart your backend to apply CORS changes" -ForegroundColor White

} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 