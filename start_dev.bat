@echo off
echo Starting AI Finance Assistant Development Environment...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0 && python start_backend.py"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting Frontend Development Server...
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul