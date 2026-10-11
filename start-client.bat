@echo off
set PATH=C:\Program Files\nodejs;%PATH%
echo [MINDORA AI] Starting frontend client on http://localhost:5173...
call "C:\Program Files\nodejs\npm.cmd" --prefix client run dev
