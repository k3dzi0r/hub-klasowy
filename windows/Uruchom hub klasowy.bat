@echo off
rem Hub klasowy - uruchomienie (dwuklik).
cd /d "%~dp0"

rem 1. Serwer w tle (jesli juz dziala, drugi sie nie uruchomi).
start "Hub klasowy - serwer" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0serwer.ps1"

rem 2. Czekamy, az serwer odpowie (maks. ok. 15 s).
powershell -NoProfile -Command "for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://localhost:8080/ | Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 250 } }; exit 1"
if errorlevel 1 (
  echo Nie udalo sie uruchomic huba. Sprawdz, czy folder "aplikacja" jest obok tego pliku.
  pause
  exit /b 1
)

rem 3. Aplikacja w oknie Edge na pelnym ekranie (F11 - wyjscie z pelnego ekranu, Alt+F4 - zamkniecie okna).
start "" msedge --app=http://localhost:8080/ --start-fullscreen --autoplay-policy=no-user-gesture-required
