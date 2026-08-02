@echo off
rem dont-stop-ask - double-click launcher.
rem Starts the companion server and opens the viewer in your browser.
cd /d "%~dp0"
set "DSA_PORT=8010"

rem Reuse the current cosmic viewer when it is already running.
powershell -NoProfile -Command "try { $page = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%DSA_PORT%/viewer/' -TimeoutSec 2).Content; if ($page -match 'galaxy-nebula\.webp') { Start-Process 'http://127.0.0.1:%DSA_PORT%/viewer/'; exit 0 } } catch {}; exit 1"
if not errorlevel 1 exit /b 0

rem "where python" alone is not enough: fresh Windows installs ship a
rem Microsoft Store "App Execution Alias" stub that sits on PATH under this
rem same name but is not a real interpreter, so it has to be run to be sure.
python --version >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required but was not found.
  echo.
  echo If Windows just opened the Microsoft Store or said "Python was not found",
  echo that is the built-in App Execution Alias stub, not a real Python install.
  echo Install the real thing, then run this again:
  echo   winget install -e --id Python.Python.3.12
  echo or download it from https://www.python.org/downloads/
  echo ^(check "Add python.exe to PATH" during setup^)
  pause
  exit /b 1
)
python scripts\serve.py --open
pause
