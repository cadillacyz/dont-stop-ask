@echo off
rem dont-stop-ask - double-click launcher.
rem Starts the companion server and opens the viewer in your browser.
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required but was not found on PATH.
  echo Install it from https://www.python.org/downloads/ and run this again.
  pause
  exit /b 1
)
start "" http://127.0.0.1:8000/viewer/
python scripts\serve.py
pause
