Write-Host "Testing EC2 Endpoints..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://100.29.4.72:8000"

# Test endpoints that should work without authentication
$endpoints = @(
    "/test",
    "/api/safes",
    "/api/expense-categories-simple",
    "/api/expenses/cheques",
    "/api/expenses/search?from_date=2025-01-01&to_date=2025-01-08"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $baseUrl$endpoint" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
        Write-Host "✅ Status: $($response.StatusCode) - OK" -ForegroundColor Green
        
        # Show first 100 chars of response
        $content = $response.Content
        if ($content.Length -gt 100) {
            $content = $content.Substring(0, 100) + "..."
        }
        Write-Host "Response: $content" -ForegroundColor Gray
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Status: $statusCode - FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Test Complete!" -ForegroundColor Cyan 