@echo off
echo ========================================================
echo   FixTrail - Smart IT Problem Solver Backend (FastAPI)
echo ========================================================
cd /d "%~dp0"
call .\backend\venv\Scripts\activate.bat
echo Initializing database schema and default seeds...
python -m backend.init_db
echo Starting Uvicorn API server on http://localhost:8000...
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
