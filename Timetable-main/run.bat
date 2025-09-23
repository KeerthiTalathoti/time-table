@echo off
echo ===============================
echo   College Timetable Scheduler
echo ===============================

REM Check Node.js
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js not found. Please install Node.js from https://nodejs.org/
  pause
  exit /b
)

REM Install dependencies
echo Installing dependencies...
call npm install

REM Start server
echo Starting server at http://localhost:5000
echo Press CTRL+C to stop
node server.js
