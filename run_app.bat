@echo off
echo ========================================================
echo   Launching FixTrail - Smart IT Problem Solver
echo ========================================================
echo Starting Backend API (FastAPI) in a new window...
start "FixTrail Backend API" cmd /k "start_backend.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend UI (React + Vite) in a new window...
start "FixTrail Frontend UI" cmd /k "start_frontend.bat"

echo.
echo FixTrail is now running!
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000/docs
echo.
pause
