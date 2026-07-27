#!/usr/bin/env python3
"""Local companion server for the dont-stop-ask viewer.

    python scripts/serve.py            # then open http://127.0.0.1:8000/viewer/

Two jobs:

1. **Auto-discovery.** The viewer asks this server which question sets exist and
   loads the newest one by itself, then watches for changes. Generate or expand a
   set and the graph updates without anyone picking a file.

2. **Generation, when possible.** If the `claude` CLI is on PATH, the Ask box in
   the viewer can run the skill directly. If it is not — for example when Claude
   Code is installed as the desktop app only — the server says so and the viewer
   falls back to handing you the command to paste.

Binds to 127.0.0.1 by design: it can start a local process, so it must not be
reachable from the network.
"""

import http.server
import json
import mimetypes
import os
import pathlib
import re
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
import uuid

ROOT = pathlib.Path(__file__).resolve().parent.parent
SETS_DIR = ROOT / "question-sets"
SCAN = [("question-sets", SETS_DIR)]
PORT = int(os.environ.get("DSA_PORT", "8000"))

# Overridable so a broken default flag never blocks anyone:
#   set DSA_CLAUDE_CMD to a JSON list, using {prompt} where the prompt goes.
DEFAULT_CMD = ["claude", "-p", "{prompt}", "--permission-mode", "acceptEdits"]

JOBS = {}
JOBS_LOCK = threading.Lock()


def claude_path():
    return shutil.which("claude")


def claude_cmd(prompt):
    raw = os.environ.get("DSA_CLAUDE_CMD")
    template = json.loads(raw) if raw else DEFAULT_CMD
    return [part.replace("{prompt}", prompt) for part in template]


def list_sets():
    """Every question-set JSON we can find, newest first."""
    out = []
    for origin, base in SCAN:
        if not base.exists():
            continue
        for path in base.rglob("*.json"):
            if not path.name.startswith("question-set"):
                continue
            try:
                stat = path.stat()
                meta = {}
                with path.open(encoding="utf-8") as fh:
                    doc = json.load(fh)
                if isinstance(doc, dict):
                    m = doc.get("meta") or {}
                    meta = {
                        "working_question": m.get("working_question"),
                        "status": m.get("status"),
                        "questions": len(doc.get("questions") or []),
                        "sources": len(doc.get("sources") or {}),
                    }
            except (OSError, json.JSONDecodeError, ValueError):
                continue
            out.append({
                "name": path.name,
                "url": "/" + path.relative_to(ROOT).as_posix(),
                "origin": origin,
                "mtime": int(stat.st_mtime),
                **meta,
            })
    # Generated sets outrank the bundled example when timestamps tie.
    out.sort(key=lambda s: (s["mtime"], s["origin"] == "question-sets"), reverse=True)
    return out


def build_prompt(question, context, mode):
    # Tool-agnostic: routes through portable/dont-stop-research.md, which any
    # agent can follow (AGENTS.md / CLAUDE.md pick it up in a repo context).
    bits = ["Follow portable/dont-stop-research.md in this repository and run it on this question:",
            "", question.strip()]
    if context and context.strip():
        bits += ["", f"context: {context.strip()}"]
    bits += [f"mode: {mode if mode in ('solo', 'guided') else 'solo'}", "",
             f"Verify every source by web search, then write the JSON to {SETS_DIR.as_posix()}/ "
             "per AGENTS.md."]
    return "\n".join(bits)


def build_expand_prompt(set_url, node, question):
    rel = set_url.lstrip("/")
    return (
        "Follow the Expansion section of portable/dont-stop-research.md in this repository.\n\n"
        f'Expand node {node} of {rel}: "{question}"\n\n'
        "Generate up to nine verified follow-up questions (fewer if any would be padding), each "
        "with one to three ranked readings, grouped by relevance to this node's question. Write a "
        "new JSON to the same file containing the union of the old and new nodes."
    )


def start_job(prompt):
    """Run the skill through the CLI, streaming output into the job record."""
    job_id = uuid.uuid4().hex[:12]
    with JOBS_LOCK:
        JOBS[job_id] = {
            "id": job_id,
            "state": "running",
            "started": time.time(),
            "log": [],
            "prompt": prompt,
        }

    def run():
        SETS_DIR.mkdir(parents=True, exist_ok=True)
        try:
            proc = subprocess.Popen(
                claude_cmd(prompt),
                cwd=str(ROOT),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=False,  # the question is user text; never hand it to a shell
            )
        except OSError as err:
            with JOBS_LOCK:
                JOBS[job_id]["state"] = "failed"
                JOBS[job_id]["log"].append(f"could not start the claude CLI: {err}")
            return

        for line in proc.stdout:
            with JOBS_LOCK:
                log = JOBS[job_id]["log"]
                log.append(line.rstrip())
                del log[:-400]
        code = proc.wait()
        with JOBS_LOCK:
            JOBS[job_id]["state"] = "done" if code == 0 else "failed"
            JOBS[job_id]["exit_code"] = code

    threading.Thread(target=run, daemon=True).start()
    return job_id


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or "") and "GET /api/sets" not in (fmt % args):
            sys.stderr.write("  %s\n" % (fmt % args))

    # -- helpers ------------------------------------------------------------

    def send_json(self, payload, code=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > 64_000:
                return {}
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            return {}

    def end_headers(self):
        # Everything here changes under the browser's feet — the JSON as sets are
        # generated, the viewer while it is being edited. Never cache any of it.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    # -- routes -------------------------------------------------------------

    def do_GET(self):
        route = urllib.parse.urlparse(self.path).path
        if route == "/api/status":
            cli = claude_path()
            return self.send_json({
                "helper": True,
                "root": ROOT.as_posix(),
                "sets_dir": SETS_DIR.as_posix(),
                "cli": bool(cli),
                "cli_path": cli,
                "tool": "portable/dont-stop-research.md",
                "sets": list_sets(),
            })
        if route == "/api/sets":
            return self.send_json({"sets": list_sets()})
        if route.startswith("/api/jobs/"):
            job_id = route.rsplit("/", 1)[-1]
            if not re.fullmatch(r"[0-9a-f]{12}", job_id):
                return self.send_json({"error": "bad job id"}, 400)
            with JOBS_LOCK:
                job = JOBS.get(job_id)
                if not job:
                    return self.send_json({"error": "no such job"}, 404)
                return self.send_json({
                    "id": job["id"],
                    "state": job["state"],
                    "exit_code": job.get("exit_code"),
                    "elapsed": int(time.time() - job["started"]),
                    "log": job["log"][-60:],
                })
        if route == "/":
            self.send_response(302)
            self.send_header("Location", "/viewer/")
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self):
        route = urllib.parse.urlparse(self.path).path
        if route not in ("/api/ask", "/api/expand"):
            return self.send_json({"error": "not found"}, 404)

        body = self.read_json()
        if not claude_path():
            return self.send_json({
                "error": "no-cli",
                "message": ("The claude CLI is not on PATH, so this server cannot run the skill "
                            "for you. Copy the prompt into Claude Code instead."),
                "prompt": (build_prompt(body.get("question", ""), body.get("context", ""),
                                        body.get("mode", "solo"))
                           if route == "/api/ask" else
                           build_expand_prompt(body.get("set", ""), body.get("node", ""),
                                               body.get("question", ""))),
            }, 501)

        if route == "/api/ask":
            question = (body.get("question") or "").strip()
            if len(question) < 8:
                return self.send_json({"error": "Ask a fuller question than that."}, 400)
            prompt = build_prompt(question, body.get("context", ""), body.get("mode", "solo"))
        else:
            node = (body.get("node") or "").strip()
            if not re.fullmatch(r"[A-Za-z]+[0-9]*", node):
                return self.send_json({"error": "bad node id"}, 400)
            prompt = build_expand_prompt(body.get("set", ""), node, body.get("question", ""))

        return self.send_json({"job": start_job(prompt), "prompt": prompt})


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    # A Windows console defaults to a codepage that cannot encode 不停问.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass

    mimetypes.add_type("application/json", ".json")
    cli = claude_path()
    print("dont-stop-ask · 不停问")
    print(f"  serving   {ROOT}")
    print(f"  open      http://127.0.0.1:{PORT}/viewer/")
    print(f"  sets in   {SETS_DIR}")
    if cli:
        print(f"  claude    {cli} — the Ask box can generate sets directly")
    else:
        print("  claude    not on PATH — the Ask box will hand you a prompt to paste instead")
        print("            (install the CLI for one-click generation: npm i -g @anthropic-ai/claude-code)")
    print("  bound to 127.0.0.1 only. ctrl-c to stop.\n")
    try:
        with Server(("127.0.0.1", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    except OSError as err:
        print(f"could not bind port {PORT}: {err}\nTry DSA_PORT=8010 python scripts/serve.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
