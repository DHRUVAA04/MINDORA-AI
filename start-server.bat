@echo off
set PATH=C:\Program Files\nodejs;%PATH%
echo [MINDORA AI] Starting FastAPI backend on http://localhost:5000...
python -m uvicorn backend.app.main:app --port 5000 --reload
