# Foodics API Configuration with Authentication - PowerShell Script
# This script handles login first, then configures Foodics API

Write-Host "🚀 Foodics API Configuration (with Authentication)" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

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

# Step 1: Authentication
Write-Host ""
Write-Host "🔐 Step 1: Authentication" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Please enter your system credentials:" -ForegroundColor Gray

$username = Read-Host "Username"
$password = Read-Host "Password" -AsSecureString
$passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

if (-not $username -or -not $passwordText) {
    Write-Host "❌ Username and password are required!" -ForegroundColor Red
    exit 1
}

# Login to get access token
try {
    Write-Host ""
    Write-Host "🔄 Logging in..." -ForegroundColor Yellow
    
    # Prepare login data (form-encoded)
    $loginBody = @{
        username = $username
        password = $passwordText
    }
    
    $loginResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/token" -Method POST -Body $loginBody -UseBasicParsing -TimeoutSec 30
    
    if ($loginResponse.StatusCode -eq 200) {
        $loginResult = $loginResponse.Content | ConvertFrom-Json
        $accessToken = $loginResult.access_token
        Write-Host "✅ Authentication successful!" -ForegroundColor Green
        
        # Step 2: Configure Foodics API
        Write-Host ""
        Write-Host "🔗 Step 2: Foodics API Configuration" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "Please enter your Foodics API credentials:" -ForegroundColor Gray
        Write-Host "   (You can find this in your Foodics dashboard under Settings > API)" -ForegroundColor Gray
        
        $apiToken = Read-Host "Foodics API Token"
        
        if (-not $apiToken) {
            Write-Host "❌ Foodics API token is required!" -ForegroundColor Red
            exit 1
        }
        
        # Configure Foodics API with authentication header
        try {
            Write-Host ""
            Write-Host "🔄 Configuring Foodics API..." -ForegroundColor Yellow
            
            $headers = @{
                "Authorization" = "Bearer $accessToken"
            }
            
            $foodicsBody = @{
                api_token = $apiToken
            }
            
            $configResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/configure" -Method POST -Body $foodicsBody -Headers $headers -UseBasicParsing -TimeoutSec 30
            
            if ($configResponse.StatusCode -eq 200) {
                Write-Host "✅ Foodics API configured successfully!" -ForegroundColor Green
                
                # Test the connection
                Write-Host ""
                Write-Host "🧪 Testing Foodics connection..." -ForegroundColor Yellow
                
                $testResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/test-connection" -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 30
                
                if ($testResponse.StatusCode -eq 200) {
                    Write-Host "✅ Connection test successful!" -ForegroundColor Green
                    
                    # Get available branches
                    Write-Host ""
                    Write-Host "📍 Fetching available branches..." -ForegroundColor Yellow
                    
                    try {
                        $branchesResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/branches" -Headers $headers -UseBasicParsing -TimeoutSec 30
                        
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
                                            
                                            $defaultResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/configure-branch" -Method POST -Body $branchBody -Headers $headers -UseBasicParsing -TimeoutSec 30
                                            
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
                            
                            # Test sales data access
                            Write-Host ""
                            Write-Host "📊 Testing sales data access..." -ForegroundColor Yellow
                            
                            try {
                                $salesResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/foodics/status" -Headers $headers -UseBasicParsing -TimeoutSec 30
                                
                                if ($salesResponse.StatusCode -eq 200) {
                                    Write-Host "✅ Sales data access confirmed!" -ForegroundColor Green
                                } else {
                                    Write-Host "⚠️ Sales data access limited" -ForegroundColor Yellow
                                }
                            } catch {
                                Write-Host "⚠️ Could not test sales data access" -ForegroundColor Yellow
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
                Write-Host "❌ Foodics configuration failed!" -ForegroundColor Red
                Write-Host "   Status: $($configResponse.StatusCode)" -ForegroundColor Red
                Write-Host "   Error: $($configResponse.Content)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Foodics configuration error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "   Make sure your Foodics API token is correct" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Authentication failed!" -ForegroundColor Red
        Write-Host "   Status: $($loginResponse.StatusCode)" -ForegroundColor Red
        Write-Host "   Error: $($loginResponse.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Authentication error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please check your username and password" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuration Process Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host "✅ If successful, your Foodics API is now configured and ready to use" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Available authenticated endpoints:" -ForegroundColor Cyan
Write-Host "   GET  /api/foodics/status - Check integration status"
Write-Host "   GET  /api/foodics/branches - List all branches" 
Write-Host "   GET  /api/foodics/default-branch/sales - Get sales data"
Write-Host "   GET  /api/reports/inventory-summary - Inventory reports"
Write-Host "   GET  /api/search/global - Global search"
Write-Host ""
Write-Host "🌐 View all endpoints: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "💡 Remember to include Authorization: Bearer [your-token] in API requests" -ForegroundColor Yellow 