@echo off
setlocal

cd /d "%~dp0"

echo.
echo Private Equity Report Builder
echo Leave a field blank to use the default value.
echo Default range uses the recent 5 trading days.
echo.

set "START_ARG="
set "END_ARG="
set "MARKET=ALL"
set "LIMIT=100"

set /p "START=Start date (YYYYMMDD, default: recent 5 trading days): "
if not "%START%"=="" set "START_ARG=--start %START%"

set /p "END=End date (YYYYMMDD, default: most recent trading day): "
if not "%END%"=="" set "END_ARG=--end %END%"

set /p "MARKET_INPUT=Market [ALL/KOSPI/KOSDAQ/KONEX] (default: ALL): "
if not "%MARKET_INPUT%"=="" set "MARKET=%MARKET_INPUT%"

set /p "LIMIT_INPUT=Top N per investor group (default: 100): "
if not "%LIMIT_INPUT%"=="" set "LIMIT=%LIMIT_INPUT%"

echo.
echo Building report...
python scripts\build_private_equity_ranking.py %START_ARG% %END_ARG% --market %MARKET% --limit %LIMIT% --open

if errorlevel 1 (
  echo.
  echo Failed to build report.
  pause
  exit /b 1
)

echo.
echo Report created and opened.
pause
