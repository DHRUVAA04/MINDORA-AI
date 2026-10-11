$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Write-Host "[MINDORA AI] Starting FastAPI backend on http://localhost:5000..." -ForegroundColor Cyan
python -m uvicorn backend.app.main:app --port 5000 --reload
