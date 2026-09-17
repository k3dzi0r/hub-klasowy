@echo off
rem Hub klasowy - zatrzymanie serwera (np. przed aktualizacja plikow).
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
echo Hub klasowy zatrzymany.
timeout /t 2 >nul
