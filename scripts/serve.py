#!/usr/bin/env python3
"""Secure local companion server for the dont-stop-ask viewer.

    python scripts/serve.py            # then open http://127.0.0.1:8010/viewer/

The helper intentionally binds to loopback. It serves only the viewer and
validated question-set paths, and it requires a per-launch token for every
state-changing request that can start or stop a local model process.
"""

import http.server
import json
import mimetypes
import os
import pathlib
import re
import secrets
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
import uuid
import webbrowser

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIEWER_DIR = ROOT / "viewer"
SETS_DIR = ROOT / "question-sets"
SCAN = [("question-sets", SETS_DIR)]
HOST = "127.0.0.1"
PORT = int(os.environ.get("DSA_PORT", "8010"))
SKILL = (
    "Read and follow ./skills/dont-stop-research/SKILL.md completely, including every "
    "referenced instruction file required for this task. Then run the skill for:"
)

MAX_BODY_BYTES = 64_000
MAX_QUESTION_CHARS = 4_000
MAX_CONTEXT_CHARS = 8_000
MAX_RUNNING_JOBS = max(1, int(os.environ.get("DSA_MAX_JOBS", "2")))
JOB_TIMEOUT_SECONDS = max(30, int(os.environ.get("DSA_JOB_TIMEOUT", "900")))
JOB_TTL_SECONDS = max(60, int(os.environ.get("DSA_JOB_TTL", "3600")))
SESSION_TOKEN = secrets.token_urlsafe(32)

# Override any default with a JSON list containing {prompt}. DSA_AGENT_CMD
# defines one custom provider; DSA_CLAUDE_CMD remains supported for existing users.
# Cursor's and Copilot's exact flags come from their own docs as of 2026-08
# (cursor.com/docs/cli/headless; docs.github.com/copilot/.../autopilot) — not
# verified against a local install the way codex/claude were, since neither
# CLI is installed on the machine this was written on. If a flag has moved,
# override it with DSA_CURSOR_CMD / DSA_COPILOT_CMD without editing this file.
PROVIDERS = (
    {"id": "codex", "label": "Codex", "env": "DSA_CODEX_CMD",
     "template": ["codex", "exec", "--full-auto", "{prompt}"]},
    {"id": "claude", "label": "Claude Code", "env": "DSA_CLAUDE_CMD",
     "template": ["claude", "-p", "{prompt}", "--permission-mode", "acceptEdits"]},
    {"id": "cursor", "label": "Cursor", "env": "DSA_CURSOR_CMD",
     "template": ["agent", "-p", "--force", "{prompt}"]},
    {"id": "copilot", "label": "GitHub Copilot", "env": "DSA_COPILOT_CMD",
     "template": ["copilot", "-p", "{prompt}", "--allow-all", "--no-ask-user"]},
)

JOBS = {}
JOBS_LOCK = threading.Lock()
SETS_LOCK = threading.Lock()


def command_template(provider):
    raw = os.environ.get(provider["env"])
    template = json.loads(raw) if raw else provider["template"]
    if not isinstance(template, list) or not template or not all(isinstance(p, str) for p in template):
        raise ValueError(f'{provider["env"]} must be a non-empty JSON list of strings')
    return template


def _newest_versioned_binary(base_dir, exe_name):
    """base_dir holds one subfolder per installed version or build (desktop-app
    auto-updaters name them by version or build hash). Return the most recently
    modified exe_name found one level down, or None."""
    if not base_dir.is_dir():
        return None
    candidates = [child / exe_name for child in base_dir.iterdir()
                  if child.is_dir() and (child / exe_name).is_file()]
    if not candidates:
        return None
    return max(candidates, key=lambda exe: exe.stat().st_mtime)


def _roaming_data_dir():
    """Where Electron apps put per-user, synced app data: %APPDATA% on Windows,
    ~/Library/Application Support on macOS, $XDG_CONFIG_HOME or ~/.config on
    Linux. Verified against a real local Claude Desktop install on Windows;
    macOS/Linux follow the same documented Electron convention but are
    unverified on real hardware."""
    if sys.platform == "win32":
        appdata = os.environ.get("APPDATA")
        return pathlib.Path(appdata) if appdata else None
    if sys.platform == "darwin":
        return pathlib.Path.home() / "Library" / "Application Support"
    xdg = os.environ.get("XDG_CONFIG_HOME")
    return pathlib.Path(xdg) if xdg else pathlib.Path.home() / ".config"


def _local_data_dir():
    """Where Electron apps put per-user, non-synced app data: %LOCALAPPDATA%
    on Windows (this is where the real local Codex Desktop install landed,
    verified), same as _roaming_data_dir() on macOS/Linux since those
    platforms don't distinguish roaming vs. local app data."""
    if sys.platform == "win32":
        localappdata = os.environ.get("LOCALAPPDATA")
        return pathlib.Path(localappdata) if localappdata else None
    return _roaming_data_dir()


def _bundled_install_dirs(provider_id):
    """Desktop apps (Claude, Codex) bundle their own CLI outside PATH and
    outside the npm global root, in a version- or build-hash-named subfolder
    that changes on every auto-update."""
    exe = f"{provider_id}.exe" if sys.platform == "win32" else provider_id
    if provider_id == "claude":
        base = _roaming_data_dir()
        return [(base / "Claude" / "claude-code", exe)] if base else []
    if provider_id == "codex":
        base = _local_data_dir()
        if not base:
            return []
        # Windows nests the binary under bin/<build-hash>/; the same shape is
        # the best-effort mac/Linux guess.
        return [(base / "OpenAI" / "Codex" / "bin", exe)]
    return []


def provider_path(provider):
    try:
        executable = command_template(provider)[0]
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    path = pathlib.Path(executable)
    if path.is_absolute() and path.is_file():
        return str(path)
    # Windows Store app packages can shadow the runnable npm CLI with a
    # protected binary. Prefer the per-user npm shim when it exists.
    appdata = os.environ.get("APPDATA")
    if os.name == "nt" and appdata:
        npm_shim = pathlib.Path(appdata) / "npm" / f"{executable}.cmd"
        if npm_shim.is_file():
            return str(npm_shim)
    found = shutil.which(executable)
    if found:
        return found
    for base_dir, exe_name in _bundled_install_dirs(provider["id"]):
        newest = _newest_versioned_binary(base_dir, exe_name)
        if newest:
            return str(newest)
    return None


def provider_usable(provider):
    """Reject PATH entries (notably packaged desktop binaries) that cannot launch."""
    executable = provider_path(provider)
    if not executable:
        return False
    if provider["id"] == "custom":
        return True
    try:
        probe = subprocess.run(
            [executable, "--version"],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=5,
            check=False,
            shell=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return probe.returncode == 0


def available_agents():
    custom = os.environ.get("DSA_AGENT_CMD")
    if custom:
        provider = {"id": "custom", "label": "Configured agent", "env": "DSA_AGENT_CMD",
                    "template": ["agent", "{prompt}"]}
        return [provider] if provider_usable(provider) else []
    return [provider for provider in PROVIDERS if provider_usable(provider)]


def select_agent(preferred="auto"):
    agents = available_agents()
    if preferred == "auto":
        return agents[0] if agents else None
    return next((agent for agent in agents if agent["id"] == preferred), None)


def agent_cmd(provider, prompt):
    executable = provider_path(provider)
    if not executable:
        raise OSError(f'{provider["label"]} CLI was not found')
    template = command_template(provider)
    return [executable, *(part.replace("{prompt}", prompt) for part in template[1:])]


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
                with path.open(encoding="utf-8") as fh:
                    doc = json.load(fh)
                if not isinstance(doc, dict):
                    continue
                m = doc.get("meta") or {}
                questions = doc.get("questions") or []
                meta = {
                    "working_question": m.get("working_question"),
                    "status": m.get("status"),
                    "questions": sum(not question.get("archived_at") for question in questions),
                    "archived_questions": sum(bool(question.get("archived_at")) for question in questions),
                    "sources": len(doc.get("sources") or {}),
                }
            except (OSError, json.JSONDecodeError, TypeError, ValueError):
                continue
            out.append({
                "name": path.name,
                "url": "/" + path.relative_to(ROOT).as_posix(),
                "origin": origin,
                "mtime": int(stat.st_mtime),
                **meta,
            })
    out.sort(key=lambda s: (s["mtime"], s["origin"] == "question-sets"), reverse=True)
    return out


def build_prompt(question, context, mode):
    bits = [f"{SKILL} {question.strip()}"]
    if context and context.strip():
        bits.append(f"context: {context.strip()}")
    bits.append(f"mode: {mode if mode in ('solo', 'guided') else 'solo'}")
    bits.append("output_dir: question-sets/")
    return "\n".join(bits)


def build_expand_prompt(set_url, node, question):
    rel = set_url.lstrip("/")
    return (
        f"{SKILL} expand_from: {rel}#{node}\n\n"
        f'Expand this node: "{question}"\n'
        "Generate up to nine verified follow-up questions (fewer if any would be padding), each "
        "with one to three ranked readings, grouped by relevance to this node's question. Append "
        "the cluster to the existing artifact and write a new JSON containing the union of old and "
        "new nodes, per STAGE 4 of the skill.\n"
        "output_dir: question-sets/"
    )


def archive_question_branch(document, node_id, archived_at=None):
    """Archive one active question subtree and sources left without active users."""
    archived_at = archived_at or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    questions = document.get("questions") or []
    active = {q.get("id"): q for q in questions if not q.get("archived_at")}
    if node_id not in active:
        raise ValueError("question is missing or already archived")

    branch = {node_id}
    changed = True
    while changed:
        before = len(branch)
        branch.update(qid for qid, q in active.items() if q.get("parent") in branch)
        changed = len(branch) != before

    archived_refs = set()
    for qid in branch:
        question = active[qid]
        question["archived_at"] = archived_at
        question["archived_with"] = node_id
        archived_refs.update(reading.get("source") for reading in question.get("readings") or [])

    active_refs = {
        reading.get("source")
        for question in questions if not question.get("archived_at")
        for reading in question.get("readings") or []
    }
    archived_sources = []
    for source_id in sorted(archived_refs - active_refs):
        source = (document.get("sources") or {}).get(source_id)
        if source is not None and not source.get("archived_at"):
            source["archived_at"] = archived_at
            source["archived_with"] = node_id
            archived_sources.append(source_id)

    return {
        "node": node_id,
        "questions": sorted(branch),
        "sources": archived_sources,
        "archived_at": archived_at,
    }


def archive_set(set_url, node_id):
    """Persist an archive operation atomically behind one narrow interface."""
    if set_url not in {item["url"] for item in list_sets()}:
        raise ValueError("unknown question set")
    relative = set_url.removeprefix("/question-sets/")
    path = safe_child(SETS_DIR, relative)
    if not path or not path.is_file():
        raise ValueError("unknown question set")

    with SETS_LOCK:
        try:
            document = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as err:
            raise ValueError(f"question set could not be read: {err}") from err
        result = archive_question_branch(document, node_id)
        temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
        try:
            temporary.write_text(
                json.dumps(document, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            os.replace(temporary, path)
        finally:
            try:
                temporary.unlink(missing_ok=True)
            except OSError:
                pass
    return result


def prune_jobs(now=None):
    now = now or time.time()
    expired = []
    for job_id, job in JOBS.items():
        if job["state"] != "running" and now - job.get("finished", job["started"]) > JOB_TTL_SECONDS:
            expired.append(job_id)
    for job_id in expired:
        del JOBS[job_id]


def start_job(prompt, provider):
    """Run the skill through the CLI, streaming bounded output into a job record."""
    job_id = uuid.uuid4().hex
    with JOBS_LOCK:
        prune_jobs()
        running = sum(job["state"] == "running" for job in JOBS.values())
        if running >= MAX_RUNNING_JOBS:
            return None
        JOBS[job_id] = {
            "id": job_id,
            "state": "running",
            "started": time.time(),
            "log": [],
            "proc": None,
            "agent": provider["id"],
        }

    def append_log(line):
        with JOBS_LOCK:
            job = JOBS.get(job_id)
            if not job:
                return
            job["log"].append(line.rstrip())
            del job["log"][:-400]

    def run():
        SETS_DIR.mkdir(parents=True, exist_ok=True)
        try:
            proc = subprocess.Popen(
                agent_cmd(provider, prompt),
                cwd=str(ROOT),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=False,
            )
        except (OSError, TypeError, ValueError, json.JSONDecodeError) as err:
            with JOBS_LOCK:
                job = JOBS.get(job_id)
                if job:
                    job.update(state="failed", finished=time.time())
                    job["log"].append(f'could not start {provider["label"]}: {err}')
            return

        with JOBS_LOCK:
            JOBS[job_id]["proc"] = proc

        def read_output():
            if proc.stdout:
                for line in proc.stdout:
                    append_log(line)

        reader = threading.Thread(target=read_output, daemon=True)
        reader.start()
        try:
            code = proc.wait(timeout=JOB_TIMEOUT_SECONDS)
            reader.join(timeout=2)
            with JOBS_LOCK:
                job = JOBS.get(job_id)
                if job and job["state"] == "running":
                    job.update(
                        state="done" if code == 0 else "failed",
                        exit_code=code,
                        finished=time.time(),
                        proc=None,
                    )
        except subprocess.TimeoutExpired:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
            with JOBS_LOCK:
                job = JOBS.get(job_id)
                if job and job["state"] == "running":
                    job.update(state="timed_out", finished=time.time(), proc=None)
                    job["log"].append(f"stopped after {JOB_TIMEOUT_SECONDS} seconds")

    threading.Thread(target=run, daemon=True).start()
    return job_id


def cancel_job(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return "missing"
        if job["state"] != "running":
            return job["state"]
        proc = job.get("proc")
        job.update(state="cancelled", finished=time.time(), proc=None)
        job["log"].append("cancelled by user")
    if proc and proc.poll() is None:
        proc.terminate()
    return "cancelled"


def safe_child(base, relative):
    try:
        base = base.resolve()
        candidate = (base / relative).resolve()
        candidate.relative_to(base)
    except (OSError, RuntimeError, ValueError):
        return None
    return candidate


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "dont-stop-ask"
    sys_version = ""

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or "") and "GET /api/sets" not in (fmt % args):
            sys.stderr.write("  %s\n" % (fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Content-Security-Policy", (
            "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; "
            "object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
        ))
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        super().end_headers()

    def send_json(self, payload, code=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path):
        try:
            body = path.read_bytes()
        except OSError:
            return self.send_error(404)
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def valid_host(self):
        host = self.headers.get("Host", "")
        try:
            hostname = urllib.parse.urlsplit("//" + host).hostname
        except ValueError:
            return False
        return hostname in {"127.0.0.1", "localhost", "::1"}

    def authorize_write(self):
        if not secrets.compare_digest(self.headers.get("X-DSA-Token", ""), SESSION_TOKEN):
            self.send_json({"error": "forbidden"}, 403)
            return False
        origin = self.headers.get("Origin")
        if origin:
            parsed = urllib.parse.urlsplit(origin)
            expected = self.headers.get("Host", "")
            if parsed.scheme != "http" or parsed.netloc != expected:
                self.send_json({"error": "bad origin"}, 403)
                return False
        return True

    def read_json(self):
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            return None, "Content-Type must be application/json", 415
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return None, "bad Content-Length", 400
        if length <= 0 or length > MAX_BODY_BYTES:
            return None, "request body is empty or too large", 413
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None, "invalid JSON", 400
        if not isinstance(body, dict):
            return None, "JSON body must be an object", 400
        return body, None, None

    def text_field(self, body, name, maximum, required=False):
        value = body.get(name, "")
        if not isinstance(value, str):
            return None, f"{name} must be text"
        value = value.strip()
        if required and not value:
            return None, f"{name} is required"
        if len(value) > maximum:
            return None, f"{name} is too long (maximum {maximum} characters)"
        return value, None

    def do_GET(self):
        if not self.valid_host():
            return self.send_json({"error": "bad host"}, 400)
        route = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if route == "/api/status":
            agents = available_agents()
            return self.send_json({
                "helper": True,
                "token": SESSION_TOKEN,
                "sets_dir": "question-sets/",
                "cli": bool(agents),
                "agents": [{"id": agent["id"], "label": agent["label"]} for agent in agents],
                "default_agent": agents[0]["id"] if agents else None,
                "skill": SKILL,
                "limits": {"max_jobs": MAX_RUNNING_JOBS, "timeout_seconds": JOB_TIMEOUT_SECONDS},
                "sets": list_sets(),
            })
        if route == "/api/sets":
            return self.send_json({"sets": list_sets()})
        if route.startswith("/api/jobs/"):
            if not secrets.compare_digest(self.headers.get("X-DSA-Token", ""), SESSION_TOKEN):
                return self.send_json({"error": "forbidden"}, 403)
            job_id = route.rsplit("/", 1)[-1]
            if not re.fullmatch(r"[0-9a-f]{32}", job_id):
                return self.send_json({"error": "bad job id"}, 400)
            with JOBS_LOCK:
                prune_jobs()
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
        if route in {"/viewer", "/viewer/"}:
            return self.send_file(VIEWER_DIR / "index.html")
        if route.startswith("/viewer/"):
            path = safe_child(VIEWER_DIR, route.removeprefix("/viewer/"))
            if path and path.is_file():
                return self.send_file(path)
            return self.send_error(404)
        if route.startswith("/question-sets/"):
            path = safe_child(SETS_DIR, route.removeprefix("/question-sets/"))
            if path and path.is_file() and path.suffix.lower() == ".json" and path.name.startswith("question-set"):
                return self.send_file(path)
            return self.send_error(404)
        return self.send_error(404)

    def do_POST(self):
        if not self.valid_host():
            return self.send_json({"error": "bad host"}, 400)
        route = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if route not in ("/api/ask", "/api/expand", "/api/archive") and not re.fullmatch(
            r"/api/jobs/[0-9a-f]{32}/cancel", route
        ):
            return self.send_json({"error": "not found"}, 404)
        if not self.authorize_write():
            return

        body, error, code = self.read_json()
        if error:
            return self.send_json({"error": error}, code)

        cancel_match = re.fullmatch(r"/api/jobs/([0-9a-f]{32})/cancel", route)
        if cancel_match:
            state = cancel_job(cancel_match.group(1))
            if state == "missing":
                return self.send_json({"error": "no such job"}, 404)
            return self.send_json({"state": state})

        if route == "/api/archive":
            node, error = self.text_field(body, "node", 32, required=True)
            if error or not re.fullmatch(r"[A-Z]+[0-9]+", node):
                return self.send_json({"error": error or "bad node id"}, 400)
            set_url, error = self.text_field(body, "set", 512, required=True)
            if error:
                return self.send_json({"error": error}, 400)
            try:
                result = archive_set(set_url, node)
            except ValueError as err:
                return self.send_json({"error": str(err)}, 400)
            return self.send_json({"archived": result})

        if route == "/api/ask":
            question, error = self.text_field(body, "question", MAX_QUESTION_CHARS, required=True)
            if error or len(question) < 8:
                return self.send_json({"error": error or "Ask a fuller question than that."}, 400)
            context, error = self.text_field(body, "context", MAX_CONTEXT_CHARS)
            if error:
                return self.send_json({"error": error}, 400)
            mode = body.get("mode", "solo")
            if mode not in ("solo", "guided"):
                return self.send_json({"error": "mode must be solo or guided"}, 400)
            prompt = build_prompt(question, context, mode)
        else:
            node, error = self.text_field(body, "node", 32, required=True)
            if error or not re.fullmatch(r"[A-Z]+[0-9]+|root", node):
                return self.send_json({"error": error or "bad node id"}, 400)
            question, error = self.text_field(body, "question", MAX_QUESTION_CHARS, required=True)
            if error:
                return self.send_json({"error": error}, 400)
            set_url, error = self.text_field(body, "set", 512, required=True)
            known_urls = {item["url"] for item in list_sets()}
            if error or set_url not in known_urls:
                return self.send_json({"error": error or "unknown question set"}, 400)
            prompt = build_expand_prompt(set_url, node, question)

        preferred = body.get("agent", "auto")
        allowed_agents = {"auto", "custom"} | {p["id"] for p in PROVIDERS}
        if preferred not in allowed_agents:
            return self.send_json({"error": f"agent must be one of: {', '.join(sorted(allowed_agents))}"}, 400)
        provider = select_agent(preferred)
        if not provider:
            return self.send_json({
                "error": "no-cli",
                "message": "No supported local agent is available. Install Codex, Claude Code, Cursor, or "
                           "GitHub Copilot, then restart the helper.",
            }, 501)

        job_id = start_job(prompt, provider)
        if not job_id:
            return self.send_json({"error": "too many jobs are already running"}, 429)
        return self.send_json({"job": job_id, "agent": provider["id"]})


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass

    mimetypes.add_type("application/json", ".json")
    agents = available_agents()
    print("dont-stop-ask · 不停问")
    print(f"  serving   {VIEWER_DIR}")
    print(f"  open      http://{HOST}:{PORT}/viewer/")
    print("  sets in   question-sets/")
    if agents:
        print(f'  agent     {agents[0]["label"]} — questions run directly from the Ask box')
    else:
        print("  agent     unavailable — install Codex, Claude Code, Cursor, or GitHub Copilot to generate sets")
    print(f"  safety    loopback only · {MAX_RUNNING_JOBS} concurrent jobs · {JOB_TIMEOUT_SECONDS}s timeout")
    print("  stop      ctrl-c\n")
    try:
        with Server((HOST, PORT), Handler) as httpd:
            if "--open" in sys.argv[1:]:
                threading.Timer(0.2, webbrowser.open, args=(f"http://{HOST}:{PORT}/viewer/",)).start()
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    except OSError as err:
        print(f"could not bind port {PORT}: {err}\nTry another port, for example DSA_PORT=8011 python scripts/serve.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
