@echo off
setlocal

cd /d "%~dp0"

echo.
echo Rebuilding dashboard...
cmd /c npm run build

if errorlevel 1 (
  echo.
  echo Rebuild failed.
  pause
  exit /b 1
)

echo.
echo Rebuild complete.
pause
