@echo off
cls
echo ========================================
echo   VISION PROJECT MANAGEMENT
echo ========================================
echo.
echo Cleaning up old processes...

REM Kill any Node.js process using port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3000...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 1 /nobreak >nul

echo.
echo Starting both frontend and backend...
echo.
echo [94m[VITE][0m Frontend will start on http://localhost:5174
echo [95m[API][0m  Backend will start on http://localhost:3000
echo.
echo [93mKeep this window open while working![0m
echo [93mPress Ctrl+C to stop both servers[0m
echo.
echo ========================================
echo.

npm run dev
