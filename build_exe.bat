@echo off
setlocal

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$pyinstaller = Get-Command pyinstaller -ErrorAction SilentlyContinue;" ^
  "if (-not $pyinstaller) { python -m PyInstaller --version *> $null; if ($LASTEXITCODE -ne 0) { Write-Error 'PyInstaller was not found. Install it with: python -m pip install pyinstaller'; exit 1 } }" ^
  "$profiles = @(Get-ChildItem -LiteralPath . -File | Where-Object { $_.Extension -match '^\.(icc|icm)$' } | Sort-Object Name | ForEach-Object { $_.Name });" ^
  "ConvertTo-Json -InputObject $profiles | Set-Content -LiteralPath profiles.json -Encoding UTF8;" ^
  "$pyiArgs = @('--noconfirm','--clean','--onefile','--name','ICC Live Editor - Untitled0828','--version-file','version_info.txt','--add-data','index.html;.','--add-data','styles.css;.','--add-data','app.js;.','--add-data','profiles.json;.');" ^
  "foreach ($profile in $profiles) { $pyiArgs += @('--add-data', ($profile + ';.')) }" ^
  "$pyiArgs += 'launcher.py';" ^
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
