# Kill any process using port 3000
$port = 3000
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($proc in $processes) {
        Write-Host "Killing process $proc using port $port..." -ForegroundColor Yellow
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port $port is now free!" -ForegroundColor Green
    Start-Sleep -Seconds 1
} else {
    Write-Host "Port $port is already free!" -ForegroundColor Green
}
