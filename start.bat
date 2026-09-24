@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed or is not in PATH.
  echo Install Node.js 18+ and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Checking port 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo Stopping old process on port 3000: %%P
  taskkill /PID %%P /F >nul 2>&1
)

echo.
echo Starting Spy or Safe...
echo Opening http://localhost:3000
start "" http://localhost:3000
node server.js
pause
