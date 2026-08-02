#!/usr/bin/env bash
# dont-stop-ask - macOS/Linux launcher.
# Starts the companion server and opens the viewer in your browser.
set -u
cd "$(dirname "${BASH_SOURCE[0]}")"
DSA_PORT="${DSA_PORT:-8010}"

# Reuse the current cosmic viewer when it is already running.
if curl -fsS --max-time 2 "http://127.0.0.1:${DSA_PORT}/viewer/" 2>/dev/null | grep -q 'galaxy-nebula\.webp'; then
  if command -v open >/dev/null 2>&1; then
    open "http://127.0.0.1:${DSA_PORT}/viewer/"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://127.0.0.1:${DSA_PORT}/viewer/"
  fi
  exit 0
fi

# Prefer python3 (the only name macOS ships by default); fall back to python.
PYTHON_BIN=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" --version >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  echo "Python 3 is required but was not found."
  echo
  case "$(uname -s)" in
    Darwin) echo "Install it with: brew install python3" ;;
    *) echo "Install it with your distro's package manager, e.g.:" ;
       echo "  sudo apt install python3   # Debian/Ubuntu" ;
       echo "  sudo dnf install python3   # Fedora" ;;
  esac
  echo "or download it from https://www.python.org/downloads/"
  echo "Then run this script again."
  exit 1
fi

exec "$PYTHON_BIN" scripts/serve.py --open
