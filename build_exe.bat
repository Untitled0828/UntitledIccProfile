@echo off
setlocal

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$node = Get-Command node -ErrorAction SilentlyContinue; if (-not $node) { Write-Error 'Node.js was not found. Install Node.js 20+ to build protected assets.'; exit 1 };" ^
  "& node .\scripts\build-assets.mjs | Out-Host;" ^
  "$pyinstaller = Get-Command pyinstaller -ErrorAction SilentlyContinue;" ^
  "if (-not $pyinstaller) { python -m PyInstaller --version *> $null; if ($LASTEXITCODE -ne 0) { Write-Error 'PyInstaller was not found. Install it with: python -m pip install pyinstaller'; exit 1 } }" ^
  "$pyiArgs = @('--noconfirm','--clean','desktop\ICC Live Editor - Untitled0828.spec');" ^
  "if ($pyinstaller) { & pyinstaller @pyiArgs } else { & python -m PyInstaller @pyiArgs }"

if not %errorlevel%==0 (
  echo.
  echo Build failed.
  pause
  exit /b 1
)

echo.
echo Done. EXE:
echo dist\ICC Live Editor - Untitled0828.exe
pause
