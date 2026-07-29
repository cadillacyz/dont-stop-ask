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

import copy
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

# Pruning is guarded by the real validator rather than a second copy of the
# rules, so scripts/ has to be importable however this file was launched.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import validate  # noqa: E402

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
# WebSearch and WebFetch are named explicitly because the tool's first rule is
# that every source is verified by live search, and acceptEdits covers file
# writes only — a headless run with no one to approve them gets them denied,
# and then the agent correctly refuses to write anything at all.
AGENT_CLIS = [
    ("claude", "Claude Code",
     ["claude", "-p", "{prompt}", "--allowed-tools", "WebSearch WebFetch",
      "--permission-mode", "acceptEdits"]),
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


def set_stamps():
    """name -> (mtime, size) for every set on disk.

    Judging a run by which *names* are new would call every expansion a
    failure, because an expansion writes the union of old and new nodes back
    to the same file. Stamps catch a rewrite as well as a new file, and
    mtime_ns keeps a fast rewrite from hiding inside a one-second mtime.
    """
    stamps = {}
    for _, base in SCAN:
        if not base.exists():
            continue
        for path in base.rglob("*.json"):
            if not path.name.startswith("question-set"):
                continue
            try:
                stat = path.stat()
            except OSError:
                continue
            stamps[path.name] = (stat.st_mtime_ns, stat.st_size)
    return stamps


# --------------------------------------------------------------------------
# Pruning a set
#
# A generated set is a first draft: a card can miss, a reading can be wrong.
# Deleting either is a write, and a write has to leave a file that still passes
# scripts/validate.py — question-sets/ is tracked and CI validates it. So the
# mutation runs on a copy, the real validator judges the result, and the delete
# is refused when it would introduce a problem the file did not already have.
# Nothing here is duplicated in the viewer; the browser only renders verdicts.
# --------------------------------------------------------------------------

INLINE_WIDTH = 88
UNDO_CAP = 20
UNDO = {}
UNDO_LOCK = threading.Lock()
# Requests are served on threads, so read-decide-write has to be one step or a
# second delete arriving mid-flight would be computed against stale bytes and
# silently undo the first.
WRITE_LOCK = threading.Lock()


def _inline(obj):
    if isinstance(obj, dict):
        if not obj:
            return "{}"
        body = ", ".join(f"{json.dumps(k, ensure_ascii=False)}: {_inline(v)}"
                         for k, v in obj.items())
        return "{ " + body + " }"
    if isinstance(obj, list):
        return "[" + ", ".join(_inline(v) for v in obj) + "]" if obj else "[]"
    return json.dumps(obj, ensure_ascii=False)


def set_style(raw):
    """True when this file keeps short leaf objects on one line.

    Sets are written by whichever agent generated them and the two styles are
    both in the wild. Rewriting a file in the other one turns a one-card delete
    into a hundred-line diff, so each file keeps its own shape.
    """
    return bool(re.search(r'^\s*(?:"[^"]+":\s*)?\{ "', raw, re.M))


def dump_set(doc, compact):
    def flat(obj):
        values = obj.values() if isinstance(obj, dict) else obj
        return all(not isinstance(v, (dict, list)) for v in values)

    def go(obj, depth):
        pad, inner = "  " * depth, "  " * (depth + 1)
        if isinstance(obj, (dict, list)) and obj:
            if compact and flat(obj) and len(pad) + len(_inline(obj)) <= INLINE_WIDTH:
                return _inline(obj)
            if isinstance(obj, dict):
                body = ",\n".join(f"{inner}{json.dumps(k, ensure_ascii=False)}: {go(v, depth + 1)}"
                                  for k, v in obj.items())
                return "{\n" + body + "\n" + pad + "}"
            return "[\n" + ",\n".join(inner + go(v, depth + 1) for v in obj) + "\n" + pad + "]"
        if isinstance(obj, dict):
            return "{}"
        if isinstance(obj, list):
            return "[]"
        return json.dumps(obj, ensure_ascii=False)

    return go(doc, 0) + "\n"


def resolve_set(url):
    """The file a client-supplied set url names, or None if it is not ours.

    This is the only path that writes, so it refuses anything that does not
    resolve to a real question-set file inside question-sets/. resolve()
    settles both traversal and symlinks before the containment test.
    """
    if not isinstance(url, str) or not url.strip():
        return None
    wanted = urllib.parse.unquote(urllib.parse.urlparse(url).path).lstrip("/")
    try:
        path = (ROOT / wanted).resolve()
        base = SETS_DIR.resolve()
    except (OSError, ValueError):
        return None
    if base not in path.parents:
        return None
    if not path.name.startswith("question-set") or path.suffix != ".json":
        return None
    return path if path.is_file() else None


def read_set(path):
    raw = path.read_text(encoding="utf-8")
    return json.loads(raw), raw


def write_atomic(path, text):
    """Replace path in one step, so a reader never sees a half-written set."""
    tmp = path.with_name(f".{path.name}.tmp-{uuid.uuid4().hex[:8]}")
    try:
        tmp.write_text(text, encoding="utf-8")
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()
    return int(path.stat().st_mtime)


def push_undo(path, raw):
    """Keep the exact bytes we replaced, so undo restores them verbatim."""
    with UNDO_LOCK:
        stack = UNDO.setdefault(str(path), [])
        stack.append(raw)
        del stack[:-UNDO_CAP]


def apply_delete(doc, qid, source=None, reason=None, promote=None):
    """Return (new_doc, effects), or (None, {"error": ...}). Never mutates doc."""
    out = copy.deepcopy(doc)
    questions = out.get("questions") or []
    target = next((q for q in questions if q.get("id") == qid), None)
    if target is None:
        return None, {"error": f"there is no {qid} in this set"}

    effects = {"question": qid, "source": source, "reparented": [],
               "pruned_sources": [], "teach_back": [], "expansions": []}

    if source is None:
        # Children keep their work and move up a level. Only direct children
        # point at this node, so one pass is the whole cascade.
        parent = target.get("parent")
        for q in questions:
            if q.get("parent") == qid:
                q["parent"] = parent
                effects["reparented"].append(q.get("id"))
        out["questions"] = [q for q in questions if q.get("id") != qid]

        for tb in out.get("teach_back") or []:
            anchors = tb.get("anchors") or []
            if qid in anchors:
                # Keep the teach-back itself: it tests cards that still exist,
                # and dropping it would delete work nobody asked to delete.
                tb["anchors"] = [a for a in anchors if a != qid]
                effects["teach_back"].append(tb.get("id"))

        meta = out.get("meta") or {}
        expansions = meta.get("expansions")
        if expansions:
            kept = [e for e in expansions if e.get("node") != qid]
            if len(kept) != len(expansions):
                effects["expansions"].append(qid)
            if kept:
                meta["expansions"] = kept
            else:
                del meta["expansions"]
    else:
        readings = target.get("readings") or []
        if not any(r.get("source") == source for r in readings):
            return None, {"error": f"{qid} does not cite {source}"}
        target["readings"] = [r for r in readings if r.get("source") != source]
        if promote:
            for r in target["readings"]:
                if r.get("source") == promote:
                    r["role"] = "primary"
        if reason and reason.strip():
            target["single_reading_reason"] = reason.strip()

    # Record the prune. This is what tells validate.py that a thinner ladder
    # here was chosen rather than generated, and it keeps the set honest about
    # having been edited by hand.
    record = qid if source is None else f"{qid}/{source}"
    out.setdefault("meta", {}).setdefault("pruned", []).append(record)
    effects["record"] = record

    # An uncited source is a validation error, so pruning is required here,
    # not a tidy-up. A source another card still cites is left alone.
    cited = {r.get("source")
             for q in out.get("questions") or []
             for r in (q.get("readings") or [])}
    sources = out.get("sources") or {}
    for sid in [s for s in sources if s not in cited]:
        del sources[sid]
        effects["pruned_sources"].append(sid)
    effects["pruned_sources"].sort()

    return out, effects


def problems_of(doc):
    found = list(validate.check(doc))
    # Ladder coverage is advisory once a set records a hand prune, so the second
    # delete is no more refused than the first. The delete that introduces the
    # record relaxes itself, which is the intent: thinning is the reader's call.
    soft = validate.advisory(doc, found)
    found = [p for p in found if p not in soft]
    schema_problems = validate.schema_check(doc)
    if schema_problems:
        found = [f"schema: {p}" for p in schema_problems] + found
    return found


COVERAGE = re.compile(r"^cluster under '(.+?)' is missing ladder types: (.+)$")


def explain(problems):
    """(structured, english) for a refusal.

    Structured, because a set written in Chinese gets a Chinese viewer and a
    refusal is the one moment the reader most needs to understand. The English
    string stays for API callers that are not the viewer.
    """
    codes, said = [], []
    for p in problems:
        found = COVERAGE.match(p)
        if found:
            where, missing = found.group(1), [m.strip() for m in found.group(2).split(",")]
            codes.append({"code": "coverage", "where": where, "missing": missing})
            said.append(
                f"that would leave {'this set' if where == 'root' else 'the cluster under ' + where}"
                f" with no {', '.join(missing)} {'cards' if len(missing) > 1 else 'card'} —"
                " every cluster carries all seven rungs of the ladder"
            )
        elif p == "no questions in set":
            codes.append({"code": "last_question"})
            said.append("that is the last question in the set")
        elif p == "no sources in set":
            codes.append({"code": "last_source"})
            said.append("that is the last reading in the set")
        else:
            codes.append({"code": "other", "text": p})
            said.append(p)
    return codes, "; ".join(said)


# Two validator rules describe a card that is now under-specified rather than a
# set that is broken, and the person deleting can answer both on the spot. They
# are asked for instead of refused; everything else is a refusal.
def needs_for(qid):
    return {
        f"{qid}: fewer than two readings without a single_reading_reason": "single_reading_reason",
        f"{qid}: has readings but no primary": "promote",
    }


def probe(doc, before, qid, source, reason=None, promote=None):
    """Simulate one delete and report what the validator makes of the result."""
    new, effects = apply_delete(doc, qid, source, reason, promote)
    if new is None:
        return {"ok": False, "error": effects["error"], "needs": [],
                "reason": effects["error"], "blocked": [{"code": "other", "text": effects["error"]}]}

    askable = needs_for(qid)
    needs, blocking = [], []
    for p in problems_of(new):
        if p in before:
            continue
        if p in askable:
            needs.append(askable[p])
        else:
            blocking.append(p)

    codes, english = explain(blocking)
    return {
        "ok": not needs and not blocking,
        "needs": needs,
        "blocked": codes,
        "reason": english or None,
        "effects": effects,
        "doc": new,
    }


def deletable_map(doc):
    """Every question and every reading, judged once, for the panel to render."""
    before = problems_of(doc)
    out = {}
    for q in doc.get("questions") or []:
        qid = q.get("id")
        if not qid:
            continue
        out[qid] = {k: v for k, v in probe(doc, before, qid, None).items() if k != "doc"}
        for r in q.get("readings") or []:
            sid = r.get("source")
            if sid:
                verdict = probe(doc, before, qid, sid)
                out[f"{qid}/{sid}"] = {k: v for k, v in verdict.items() if k != "doc"}
    return out


def start_job(prompt):
    """Run the tool through the agent CLI, streaming output into the job record."""
    job_id = uuid.uuid4().hex[:12]
    before = set_stamps()
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
        # print a notice, exit 0, and write nothing. Judge it on the file —
        # written or rewritten both count, since expansions rewrite in place.
        after = set_stamps()
        produced = sorted(n for n, s in after.items() if before.get(n) != s)
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

    def open_set(self, url):
        """(path, doc, raw), or None once the error response has been sent."""
        path = resolve_set(url)
        if not path:
            self.send_json({"error": "that is not a question set in question-sets/"}, 400)
            return None
        try:
            doc, raw = read_set(path)
        except (OSError, ValueError) as err:
            self.send_json({"error": f"could not read that set: {err}"}, 400)
            return None
        return path, doc, raw

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
                "prune": True,
                "sets": list_sets(),
            })
        if route == "/api/sets":
            return self.send_json({"sets": list_sets()})
        if route == "/api/deletable":
            query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            opened = self.open_set((query.get("set") or [""])[0])
            if not opened:
                return
            return self.send_json({"targets": deletable_map(opened[1])})
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

    def api_delete(self, body):
        qid = (body.get("question") or "").strip()
        source = (body.get("source") or "").strip() or None
        if not re.fullmatch(r"[A-Za-z]+[0-9]*", qid):
            return self.send_json({"error": "bad question id"}, 400)
        if source is not None and not re.fullmatch(r"[A-Za-z0-9_.-]{1,40}", source):
            return self.send_json({"error": "bad source id"}, 400)

        with WRITE_LOCK:
            opened = self.open_set(body.get("set"))
            if not opened:
                return
            path, doc, raw = opened

            # The browser's dry run is a courtesy for the panel, never the
            # authority: judge it again against the file as it is right now.
            verdict = probe(doc, problems_of(doc), qid, source,
                            reason=body.get("single_reading_reason"),
                            promote=(body.get("promote") or "").strip() or None)
            if verdict.get("error"):
                return self.send_json({"error": verdict["error"]}, 400)
            if not verdict["ok"]:
                return self.send_json({
                    "error": verdict["reason"] or "that delete needs a little more from you",
                    "needs": verdict["needs"],
                    "blocked": verdict["blocked"],
                }, 409)

            push_undo(path, raw)
            mtime = write_atomic(path, dump_set(verdict["doc"], set_style(raw)))

        return self.send_json({"ok": True, "mtime": mtime, "effects": verdict["effects"]})

    def api_undo(self, body):
        path = resolve_set(body.get("set"))
        if not path:
            return self.send_json({"error": "that is not a question set in question-sets/"}, 400)
        with WRITE_LOCK:
            with UNDO_LOCK:
                stack = UNDO.get(str(path)) or []
                raw = stack.pop() if stack else None
                depth = len(stack)
            if raw is None:
                return self.send_json(
                    {"error": "nothing to undo — this server kept no earlier copy"}, 404)
            mtime = write_atomic(path, raw)
        return self.send_json({"ok": True, "mtime": mtime, "depth": depth})

    def do_POST(self):
        route = urllib.parse.urlparse(self.path).path
        if route not in ("/api/ask", "/api/expand", "/api/delete", "/api/undo"):
            return self.send_json({"error": "not found"}, 404)

        body = self.read_json()

        # Pruning is local file surgery — no agent CLI is involved, so it works
        # in the same sessions where asking only hands you a prompt.
        if route == "/api/delete":
            return self.api_delete(body)
        if route == "/api/undo":
            return self.api_undo(body)

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
