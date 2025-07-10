Write-Host "EC2 API Diagnostics" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://100.29.4.72:8000"

# Check basic connectivity
Write-Host "1. Testing basic connectivity..." -ForegroundColor Yellow
try {
    $test = Invoke-WebRequest -Uri "$baseUrl/test" -Method GET -UseBasicParsing
    Write-Host "✅ Server is reachable" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not reachable" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "2. Testing authenticated endpoints (these SHOULD fail with 401):" -ForegroundColor Yellow

$authEndpoints = @(
    "/expenses",
    "/expenses/cheques"
)

foreach ($endpoint in $authEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
        Write-Host "  ✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "  ✅ $endpoint - Correctly returns 401 (auth required)" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "3. Testing simple/public endpoints (these SHOULD work):" -ForegroundColor Yellow

$simpleEndpoints = @(
    "/safes-simple",
    "/api/safes", 
    "/api/expense-categories-simple",
    "/api/expenses/cheques",
    "/api/expenses/search?limit=1"
)

foreach ($endpoint in $simpleEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
        Write-Host "  ✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  ❌ $endpoint - Status: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "4. Checking if the API router is properly configured..." -ForegroundColor Yellow

# Try accessing the endpoints with different prefixes
$testPrefixes = @(
    "",
    "/api",
    "/v1"
)

$testEndpoint = "/expenses/cheques"

foreach ($prefix in $testPrefixes) {
    $url = "$baseUrl$prefix$testEndpoint"
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing
        Write-Host "  ✅ Found working endpoint at: $url" -ForegroundColor Green
        break
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "  ⚠️  $url - Not found (404)" -ForegroundColor Gray
        } elseif ($statusCode -eq 401) {
            Write-Host "  ⚠️  $url - Requires auth (401)" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ $url - Error: $statusCode" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Diagnosis Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Key findings:" -ForegroundColor Yellow
Write-Host "- If /api/expenses/cheques returns 401, the new code is NOT deployed" -ForegroundColor White
Write-Host "- If /api/expenses/cheques returns 404, check the API router configuration" -ForegroundColor White
Write-Host "- If /api/safes works but /api/expenses/cheques doesn't, main.py is outdated" -ForegroundColor White 