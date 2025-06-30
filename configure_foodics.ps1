# Foodics API Configuration PowerShell Script
# This script helps configure your Foodics API integration

Write-Host "🚀 Foodics API Configuration" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if server is running
try {
    $serverCheck = Invoke-WebRequest -Uri "http://127.0.0.1:8000/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ FastAPI server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ FastAPI server is not running!" -ForegroundColor Red
    Write-Host "   Please start the server first with:" -ForegroundColor Yellow
    Write-Host "   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000" -ForegroundColor Yellow
    exit 1
}

# Get API token from user
Write-Host ""
Write-Host "📝 Please enter your Foodics API credentials:" -ForegroundColor Cyan
Write-Host "   (You can find this in your Foodics dashboard under Settings > API)" -ForegroundColor Gray

$apiToken = Read-Host "Foodics API Token"

if (-not $apiToken) {
    Write-Host "❌ API token is required!" -ForegroundColor Red
    exit 1
}

# Configure the API token
try {
    Write-Host ""
    Write-Host "🔄 Configuring Foodics API..." -ForegroundColor Yellow
    
    $body = @{
        api_token = $apiToken
    }
    
    $configResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/configure" -Method POST -Body $body -UseBasicParsing -TimeoutSec 30
    
    if ($configResponse.StatusCode -eq 200) {
        Write-Host "✅ Foodics API configured successfully!" -ForegroundColor Green
        
        # Test the connection
        Write-Host ""
        Write-Host "🧪 Testing Foodics connection..." -ForegroundColor Yellow
        
        $testResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/test-connection" -Method POST -UseBasicParsing -TimeoutSec 30
        
        if ($testResponse.StatusCode -eq 200) {
            Write-Host "✅ Connection test successful!" -ForegroundColor Green
            
            # Get available branches
            Write-Host ""
            Write-Host "📍 Fetching available branches..." -ForegroundColor Yellow
            
            try {
                $branchesResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/branches" -UseBasicParsing -TimeoutSec 30
                
                if ($branchesResponse.StatusCode -eq 200) {
                    $branches = $branchesResponse.Content | ConvertFrom-Json
                    $branchList = $branches.branches
                    
                    Write-Host "✅ Found $($branchList.Count) branches:" -ForegroundColor Green
                    
                    for ($i = 0; $i -lt $branchList.Count; $i++) {
                        $branch = $branchList[$i]
                        Write-Host "   $($i + 1). $($branch.name) (ID: $($branch.id))" -ForegroundColor White
                    }
                    
                    # Ask about setting default branch
                    if ($branchList.Count -gt 0) {
                        Write-Host ""
                        $setupDefault = Read-Host "🎯 Would you like to set a default branch? (y/n)"
                        
                        if ($setupDefault.ToLower() -eq "y") {
                            $branchNum = Read-Host "Enter branch number"
                            
                            try {
                                $selectedIndex = [int]$branchNum - 1
                                if ($selectedIndex -ge 0 -and $selectedIndex -lt $branchList.Count) {
                                    $selectedBranch = $branchList[$selectedIndex]
                                    
                                    $branchBody = @{
                                        branch_id = $selectedBranch.id
                                        branch_name = $selectedBranch.name
                                    }
                                    
                                    $defaultResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/configure-branch" -Method POST -Body $branchBody -UseBasicParsing -TimeoutSec 30
                                    
                                    if ($defaultResponse.StatusCode -eq 200) {
                                        Write-Host "✅ Default branch set to: $($selectedBranch.name)" -ForegroundColor Green
                                    } else {
                                        Write-Host "⚠️ Could not set default branch" -ForegroundColor Yellow
                                    }
                                } else {
                                    Write-Host "⚠️ Invalid selection" -ForegroundColor Yellow
                                }
                            } catch {
                                Write-Host "⚠️ Invalid selection" -ForegroundColor Yellow
                            }
                        }
                    }
                } else {
                    Write-Host "⚠️ Could not fetch branches, but connection is working" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️ Could not fetch branches: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Connection test failed" -ForegroundColor Red
            Write-Host "   Error: $($testResponse.Content)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Configuration failed!" -ForegroundColor Red
        Write-Host "   Status: $($configResponse.StatusCode)" -ForegroundColor Red
        Write-Host "   Error: $($configResponse.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the FastAPI server is running and your API token is correct" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuration Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Foodics API is now configured and ready to use" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Available endpoints:" -ForegroundColor Cyan
Write-Host "   GET  /api/foodics/status - Check integration status"
Write-Host "   GET  /api/foodics/branches - List all branches" 
Write-Host "   GET  /api/foodics/default-branch/sales - Get sales data"
Write-Host "   GET  /api/reports/inventory-summary - Inventory reports"
Write-Host "   GET  /api/search/global - Global search"
Write-Host ""
Write-Host "🌐 View all endpoints: http://127.0.0.1:8000/docs" -ForegroundColor Cyan 