@echo off
setlocal

cd /d "%~dp0"
set "PORT=8766"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$profiles = @(Get-ChildItem -LiteralPath . -File | Where-Object { $_.Extension -match '^\.(icc|icm)$' } | Sort-Object Name | ForEach-Object { $_.Name }); ConvertTo-Json -InputObject $profiles | Set-Content -LiteralPath profiles.json -Encoding UTF8"

where py >nul 2>nul
if %errorlevel%==0 (
  echo Starting ICC Live Editor at http://127.0.0.1:%PORT%/
  py -3 -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Starting ICC Live Editor at http://127.0.0.1:%PORT%/
  python -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

echo Python was not found. Install Python or add it to PATH.
pause
