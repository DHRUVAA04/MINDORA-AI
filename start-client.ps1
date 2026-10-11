$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Write-Host "[MINDORA AI] Starting frontend client on http://localhost:5173..." -ForegroundColor Cyan
& "C:\Program Files\nodejs\npm.cmd" --prefix client run dev
