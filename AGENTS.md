# AI agent runbook

This repository is a local-first research-question app. When a user asks you to run it, start the
companion server and verify the real viewer; do not replace it with a generic static file server.

## Start the app

1. Work from the repository root.
2. Confirm Python 3 is available with `python --version`.
3. Start `python scripts/serve.py` in a persistent terminal or background task.
   - On Windows, a human can instead double-click `start.bat`.
   - The default URL is `http://127.0.0.1:8010/viewer/`.
4. Verify both `http://127.0.0.1:8010/api/status` and the viewer respond.
5. Open the viewer for the user when your environment supports browser navigation.

Do not expose, tunnel, proxy, or bind the server beyond `127.0.0.1`. It can launch a locally
installed Codex or Claude Code CLI and is not a public web backend.

## Expected behavior

- The landing page shows one question-world.
- Clicking it opens the question form.
- If Codex or Claude Code is installed and authenticated, **Ask** runs that local agent.
- Generated files are written to the ignored `question-sets/` directory and appear in the viewer
  automatically.
- The EN/中文 control changes interface labels; research content keeps its authored language.

If no supported CLI is available, the viewer still opens, but generation reports that an agent is
needed. Explain that state instead of changing application code.

## If an old UI appears

An older server is probably still using the port. Stop that process, start this checkout's
`scripts/serve.py` again, and reload the page without cache. Do not work around it by serving the
repository root.

## Verification before changing or publishing code

```bash
python -m unittest discover -s tests -v
python scripts/validate.py
python -m py_compile scripts/serve.py scripts/validate.py
node --check viewer/graph.js
```

Keep generated `question-sets/`, local context, credentials, and provider configuration out of git.
Read `SECURITY.md` before changing the server boundary and `docs/production-boundary.md` before
proposing public hosting.
