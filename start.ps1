# Vision Project Management - Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   VISION PROJECT MANAGEMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cleaning up old processes..." -ForegroundColor Yellow

# Kill any process using port 3000
$port = 3000
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($proc in $processes) {
        Write-Host "  Killing process $proc on port $port..." -ForegroundColor Yellow
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Starting both frontend and backend..." -ForegroundColor Green
Write-Host ""
Write-Host "  [VITE] Frontend will start on http://localhost:5174" -ForegroundColor Cyan
Write-Host "  [API]  Backend will start on http://localhost:3000" -ForegroundColor Magenta
Write-Host ""
Write-Host "Keep this window open while working!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
