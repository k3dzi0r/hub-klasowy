@echo off
rem Hub klasowy - tworzy skrot z ikona na pulpicie (i opcjonalnie w autostarcie).
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dir = (Get-Location).Path; $shell = New-Object -ComObject WScript.Shell; $link = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'Hub klasowy.lnk')); $link.TargetPath = (Join-Path $dir 'Uruchom hub klasowy.bat'); $link.WorkingDirectory = $dir; $link.IconLocation = ((Join-Path $dir 'hub-klasowy.ico') + ',0'); $link.WindowStyle = 7; $link.Description = 'Hub klasowy'; $link.Save()"
if errorlevel 1 (
  echo Nie udalo sie utworzyc skrotu.
  pause
  exit /b 1
)
echo Skrot "Hub klasowy" jest na pulpicie.
echo.
choice /c TN /m "Uruchamiac hub automatycznie po zalogowaniu do Windows"
if errorlevel 2 goto koniec

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dir = (Get-Location).Path; $shell = New-Object -ComObject WScript.Shell; $link = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Startup')) 'Hub klasowy.lnk')); $link.TargetPath = (Join-Path $dir 'Uruchom hub klasowy.bat'); $link.WorkingDirectory = $dir; $link.IconLocation = ((Join-Path $dir 'hub-klasowy.ico') + ',0'); $link.WindowStyle = 7; $link.Description = 'Hub klasowy'; $link.Save()"
echo Dodano do autostartu. Usuniesz go, kasujac skrot z folderu shell:startup (Win+R).

:koniec
echo.
echo Jesli przeniesiesz folder "Hub klasowy" w inne miejsce, uruchom "Zainstaluj na pulpicie" ponownie.
pause
