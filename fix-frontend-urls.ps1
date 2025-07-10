# PowerShell script to replace all localhost:8000 URLs with EC2 IP
$ec2IP = "100.29.4.72"
$searchPattern = "http://localhost:8000"
$replacePattern = "http://${ec2IP}:8000"

Write-Host "Replacing all instances of localhost:8000 with ${ec2IP}:8000..." -ForegroundColor Green

# Get all TypeScript, JavaScript, and JSX files
$files = Get-ChildItem -Path "src" -Include "*.ts","*.tsx","*.js","*.jsx" -Recurse
$files += Get-ChildItem -Path "." -Include "vite.config.ts","vite.config.js" -File

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace [regex]::Escape($searchPattern), $replacePattern
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $replacementCount = ([regex]::Matches($content, [regex]::Escape($searchPattern))).Count
        $totalReplacements += $replacementCount
        $totalFiles++
        Write-Host "✓ Updated $($file.Name) - $replacementCount replacements" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Complete! Updated $totalFiles files with $totalReplacements total replacements" -ForegroundColor Green
Write-Host "`nNow run 'npm run build' to rebuild the frontend" -ForegroundColor Cyan 