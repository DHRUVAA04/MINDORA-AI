Write-Host "[MINDORA AI] Running test suite (Backend Pytest + Client Vitest)..." -ForegroundColor Cyan
python -m pytest backend/tests
node client/node_modules/vitest/vitest.mjs run --root client
