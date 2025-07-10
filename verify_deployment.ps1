Write-Host "Verifying EC2 Deployment..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://100.29.4.72:8000"

# Test the new simple endpoints that should work after deployment
Write-Host "Testing new simple endpoints (should work without authentication):" -ForegroundColor Yellow
Write-Host ""

$simpleEndpoints = @(
    @{endpoint="/api/expenses/cheques"; description="Expenses Cheques (Simple)"},
    @{endpoint="/api/expenses/search?limit=1"; description="Expenses Search (Simple)"}
)

$success = $true

foreach ($test in $simpleEndpoints) {
    Write-Host "Testing: $($test.description)" -ForegroundColor Cyan
    Write-Host "URL: $baseUrl$($test.endpoint)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$($test.endpoint)" -Method GET -UseBasicParsing
        Write-Host "✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Parse JSON to check structure
        $json = $response.Content | ConvertFrom-Json
        if ($json.success -eq $true) {
            Write-Host "✅ Response has correct structure (success=true)" -ForegroundColor Green
        }
    }
    catch {
        $success = $false
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ FAILED - Status: $statusCode" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

if ($success) {
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL! All endpoints are working." -ForegroundColor Green
    Write-Host "The new main.py is active on the EC2 server." -ForegroundColor Green
} else {
    Write-Host "⚠️ DEPLOYMENT INCOMPLETE - Some endpoints are still failing." -ForegroundColor Yellow
    Write-Host "The server may still be using the old main.py file." -ForegroundColor Yellow
    Write-Host "" 
    Write-Host "Troubleshooting steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure you uploaded the new main.py to the correct directory" -ForegroundColor White
    Write-Host "2. Verify the FastAPI service was properly restarted" -ForegroundColor White
    Write-Host "3. Check the server logs for any startup errors" -ForegroundColor White
} 