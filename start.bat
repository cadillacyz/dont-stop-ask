@echo off
rem dont-stop-ask - double-click launcher.
rem Starts the companion server and opens the viewer in your browser.
cd /d "%~dp0"
set "DSA_PORT=8010"

rem Reuse the current cosmic viewer when it is already running.
powershell -NoProfile -Command "try { $page = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%DSA_PORT%/viewer/' -TimeoutSec 2).Content; if ($page -match 'galaxy-nebula\.webp') { Start-Process 'http://127.0.0.1:%DSA_PORT%/viewer/'; exit 0 } } catch {}; exit 1"
if not errorlevel 1 exit /b 0

where python >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required but was not found on PATH.
  echo Install it from https://www.python.org/downloads/ and run this again.
  pause
  exit /b 1
)
python scripts\serve.py --open
pause
