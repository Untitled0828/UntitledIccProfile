@echo off
setlocal

cd /d "%~dp0"
set "PORT=8766"

where node >nul 2>nul
if not %errorlevel%==0 (
  echo Node.js was not found. Install Node.js 20+ to build protected assets.
  pause
  exit /b 1
)

node .\scripts\build-assets.mjs
if not %errorlevel%==0 (
  echo.
  echo Asset build failed.
  pause
  exit /b 1
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Starting ICC Live Editor at http://127.0.0.1:%PORT%/
  py -3 -m http.server %PORT% --bind 127.0.0.1 --directory build/web
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Starting ICC Live Editor at http://127.0.0.1:%PORT%/
  python -m http.server %PORT% --bind 127.0.0.1 --directory build/web
  goto :eof
)

echo Python was not found. Install Python or add it to PATH.
pause
