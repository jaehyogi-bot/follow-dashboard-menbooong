@echo off
setlocal

cd /d "%~dp0"

set "URL=http://127.0.0.1:3000"

call :check_server
if "%SERVER_READY%"=="1" goto open_browser

call :needs_rebuild
if "%NEEDS_REBUILD%"=="1" (
  echo.
  echo Building dashboard...
  cmd /c npm run build
  if errorlevel 1 (
    echo.
    echo Build failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting local dashboard server...
start "FollowDashboard" /min cmd /c "cd /d \"%~dp0\" && cmd /c npm run start > dev-server.log 2>&1"

set /a WAIT_COUNT=0
:wait_loop
if %WAIT_COUNT% geq 40 (
  echo.
  echo Server did not start in time. Check dev-server.log
  pause
  exit /b 1
)

timeout /t 1 /nobreak >nul
set /a WAIT_COUNT+=1
call :check_server
if "%SERVER_READY%"=="1" goto open_browser
goto wait_loop

:open_browser
start "" "%URL%"
exit /b 0

:check_server
set "SERVER_READY=0"
powershell -NoProfile -Command ^
  "try { $r = Invoke-WebRequest -Uri '%URL%' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 set "SERVER_READY=1"
exit /b 0

:needs_rebuild
set "NEEDS_REBUILD=0"
if not exist ".next\BUILD_ID" (
  set "NEEDS_REBUILD=1"
  exit /b 0
)

powershell -NoProfile -Command ^
  "$build = Get-Item '.next\BUILD_ID';" ^
  "$targets = @('src','scripts','package.json','package-lock.json','next.config.ts','tsconfig.json','requirements.txt');" ^
  "$latest = Get-Date '2000-01-01';" ^
  "foreach ($target in $targets) { if (Test-Path $target) { Get-ChildItem $target -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { if ($_.LastWriteTime -gt $latest) { $latest = $_.LastWriteTime } }; if ((Get-Item $target).PSIsContainer -eq $false -and (Get-Item $target).LastWriteTime -gt $latest) { $latest = (Get-Item $target).LastWriteTime } } }" ^
  "if ($latest -gt $build.LastWriteTime) { exit 0 } else { exit 1 }"
if not errorlevel 1 set "NEEDS_REBUILD=1"
exit /b 0
