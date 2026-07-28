#!/usr/bin/env python3
"""Local companion server for the dont-stop-ask viewer.

    python scripts/serve.py            # then open http://127.0.0.1:8000/viewer/

Two jobs:

1. **Auto-discovery.** The viewer asks this server which question sets exist and
   loads the newest one by itself, then watches for changes. Generate or expand a
   set and the graph updates without anyone picking a file.

2. **Generation, when possible.** If any supported agent CLI is on PATH —
   claude, codex, or gemini — the Ask box in the viewer runs the tool directly.
   If none is (for example when Claude Code is installed as a desktop app only)
   the server says so and the viewer hands you a prompt to paste instead.

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

# Any coding-agent CLI that can take a prompt, use its tools, and write files
# can run the tool. First one found on PATH wins; DSA_AGENT picks a specific
# one by name, and DSA_AGENT_CMD (a JSON list using {prompt}) overrides the
# invocation entirely — so a wrong flag here never blocks anyone.
#
# Only the invocation shape is claimed, not that every build accepts it. If a
# run fails, the log shows why and DSA_AGENT_CMD is the fix.
AGENT_CLIS = [
    ("claude", "Claude Code",
     ["claude", "-p", "{prompt}", "--permission-mode", "acceptEdits"]),
    ("codex", "OpenAI Codex",
     ["codex", "exec", "{prompt}", "--sandbox", "workspace-write",
      "--ask-for-approval", "never"]),
    ("gemini", "Gemini CLI",
     ["gemini", "-p", "{prompt}", "--yolo"]),
]

JOBS = {}
JOBS_LOCK = threading.Lock()


def find_agent():
    """(binary, label, template) for the first usable CLI, or None."""
    if os.environ.get("DSA_AGENT_CMD"):
        template = json.loads(os.environ["DSA_AGENT_CMD"])
        return (template[0], f"custom ({template[0]})", template)

    wanted = (os.environ.get("DSA_AGENT") or "").strip().lower()
    for binary, label, template in AGENT_CLIS:
        if wanted and binary != wanted:
            continue
        if shutil.which(binary):
            return (binary, label, template)
    return None


def agent_cmd(prompt):
    found = find_agent()
    if not found:
        return None
    cmd = [part.replace("{prompt}", prompt) for part in found[2]]
    # On Windows these CLIs are .CMD shims, and CreateProcess will not find a
    # bare name — resolve it to the full path shutil.which already located.
    resolved = shutil.which(cmd[0])
    if resolved:
        cmd[0] = resolved
    return cmd


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


def set_names():
    return {s["name"] for s in list_sets()}


def start_job(prompt):
    """Run the tool through the agent CLI, streaming output into the job record."""
    job_id = uuid.uuid4().hex[:12]
    before = set_names()
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
                agent_cmd(prompt),
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
                JOBS[job_id]["log"].append(f"could not start the agent CLI: {err}")
            return

        for line in proc.stdout:
            with JOBS_LOCK:
                log = JOBS[job_id]["log"]
                log.append(line.rstrip())
                del log[:-400]
        code = proc.wait()
        # A clean exit is not success: an unauthenticated or confused CLI can
        # print a notice, exit 0, and write nothing. Judge it on the file.
        produced = sorted(set_names() - before)
        with JOBS_LOCK:
            JOBS[job_id]["exit_code"] = code
            JOBS[job_id]["produced"] = produced
            if code != 0:
                JOBS[job_id]["state"] = "failed"
            elif produced:
                JOBS[job_id]["state"] = "done"
            else:
                JOBS[job_id]["state"] = "empty"

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
            found = find_agent()
            return self.send_json({
                "helper": True,
                "root": ROOT.as_posix(),
                "sets_dir": SETS_DIR.as_posix(),
                "cli": bool(found),
                "cli_path": shutil.which(found[0]) if found else None,
                "agent": found[1] if found else None,
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
                    "produced": job.get("produced") or [],
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
        if not find_agent():
            return self.send_json({
                "error": "no-cli",
                "message": ("No agent CLI (claude, codex, gemini) is on PATH, so this server "
                            "cannot run the tool for you. Paste the prompt into your AI tool "
                            "instead."),
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
    found = find_agent()
    print("dont-stop-ask · 不停问")
    print(f"  serving   {ROOT}")
    print(f"  open      http://127.0.0.1:{PORT}/viewer/")
    print(f"  sets in   {SETS_DIR}")
    if found:
        print(f"  agent     {found[1]} ({shutil.which(found[0])}) — the Ask box generates directly")
    else:
        names = ", ".join(a[0] for a in AGENT_CLIS)
        print(f"  agent     none found ({names}) — the Ask box will hand you a prompt to paste")
        print("            any one of them enables one-click; DSA_AGENT_CMD overrides the call")
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
