@echo off
rem Hub klasowy - ZIP z pusta aplikacja do przekazania innym (BEZ folderu "dane" z uczniami).
cd /d "%~dp0"
echo Tworze plik ZIP z pusta aplikacja (bez folderu "dane")...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$src = (Get-Location).Path; $tmp = Join-Path $env:TEMP ('hub-klasowy-' + [guid]::NewGuid().ToString('N')); $dst = Join-Path $tmp 'Hub klasowy'; New-Item -ItemType Directory -Path $dst | Out-Null; Get-ChildItem -LiteralPath $src -Force | Where-Object { $_.Name -ne 'dane' -and $_.Name -notlike 'unins*' } | Copy-Item -Destination $dst -Recurse -Force; $zip = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Hub klasowy - pusta aplikacja.zip'; if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }; Compress-Archive -Path $dst -DestinationPath $zip; Remove-Item -LiteralPath $tmp -Recurse -Force; Write-Host ('Gotowe: ' + $zip)"
pause
