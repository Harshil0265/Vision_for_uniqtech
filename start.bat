@echo off
echo ========================================
echo   VISION PROJECT MANAGEMENT
echo ========================================
echo.
echo Checking for running processes...
echo.

REM Kill any process using port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting both frontend and backend...
echo.
echo Keep this window open while working!
echo.
npm run dev
