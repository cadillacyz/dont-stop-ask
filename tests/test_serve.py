import importlib.util
import json
import pathlib
import tempfile
import threading
import unittest
import urllib.error
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("dsa_serve", ROOT / "scripts" / "serve.py")
SERVE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SERVE)


class ServerSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original_available_agents = SERVE.available_agents
        SERVE.available_agents = lambda: []
        cls.server = SERVE.Server(("127.0.0.1", 0), SERVE.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        SERVE.available_agents = cls.original_available_agents

    def request(self, route, method="GET", payload=None, headers=None):
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.base + route,
            data=body,
            method=method,
            headers=headers or {},
        )
        try:
            with urllib.request.urlopen(req) as response:
                return response.status, dict(response.headers), response.read()
        except urllib.error.HTTPError as exc:
            return exc.code, dict(exc.headers), exc.read()

    def status(self):
        code, headers, body = self.request("/api/status")
        self.assertEqual(code, 200)
        return headers, json.loads(body)

    def auth_headers(self, token, **extra):
        return {"Content-Type": "application/json", "X-DSA-Token": token, **extra}

    def test_generation_prompt_uses_the_checked_in_skill(self):
        prompt = SERVE.build_prompt("Why do cities flood?", "", "solo")
        self.assertIn("./skills/dont-stop-research/SKILL.md", prompt)
        self.assertIn("including every referenced instruction file", prompt)

    def test_static_server_does_not_expose_repository(self):
        self.assertEqual(self.request("/viewer/")[0], 200)
        self.assertEqual(self.request("/.git/config")[0], 404)
        self.assertEqual(self.request("/README.md")[0], 404)
        self.assertEqual(self.request("/viewer/..%2F.git/config")[0], 404)

    def test_status_hides_local_paths_and_sets_security_headers(self):
        headers, body = self.status()
        self.assertTrue(body["token"])
        self.assertNotIn("root", body)
        self.assertNotIn("cli_path", body)
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("frame-ancestors 'none'", headers["Content-Security-Policy"])

    def test_mutation_requires_token_json_and_same_origin(self):
        _, status = self.status()
        question = {"question": "How should cities adapt to extreme heat?", "mode": "solo"}
        self.assertEqual(
            self.request("/api/ask", "POST", question, {"Content-Type": "application/json"})[0],
            403,
        )
        self.assertEqual(
            self.request(
                "/api/ask",
                "POST",
                question,
                {"Content-Type": "text/plain", "X-DSA-Token": status["token"]},
            )[0],
            415,
        )
        self.assertEqual(
            self.request(
                "/api/ask",
                "POST",
                question,
                self.auth_headers(status["token"], Origin="https://evil.example"),
            )[0],
            403,
        )

    def test_valid_question_reports_missing_local_agent_without_handoff_prompt(self):
        _, status = self.status()
        code, _, body = self.request(
            "/api/ask",
            "POST",
            {"question": "How should cities adapt to extreme heat?", "context": "", "mode": "solo"},
            self.auth_headers(status["token"]),
        )
        response = json.loads(body)
        self.assertEqual(code, 501)
        self.assertEqual(response["error"], "no-cli")
        self.assertIn("Codex or Claude Code", response["message"])
        self.assertNotIn("prompt", response)

    def test_auto_agent_prefers_codex_then_claude(self):
        codex = {"id": "codex", "label": "Codex"}
        claude = {"id": "claude", "label": "Claude Code"}
        original = SERVE.available_agents
        try:
            SERVE.available_agents = lambda: [codex, claude]
            self.assertEqual(SERVE.select_agent()["id"], "codex")
            self.assertEqual(SERVE.select_agent("claude")["id"], "claude")
        finally:
            SERVE.available_agents = original

    def test_unlaunchable_desktop_binary_is_not_advertised_as_an_agent(self):
        original_path = SERVE.provider_path
        original_run = SERVE.subprocess.run
        try:
            SERVE.provider_path = lambda provider: "C:/Program Files/WindowsApps/codex.exe"

            def denied(*args, **kwargs):
                raise PermissionError("Access is denied")

            SERVE.subprocess.run = denied
            self.assertEqual(self.original_available_agents.__func__(), [])
        finally:
            SERVE.provider_path = original_path
            SERVE.subprocess.run = original_run

    def test_question_fields_are_bounded_and_typed(self):
        _, status = self.status()
        headers = self.auth_headers(status["token"])
        cases = [
            ({"question": 123, "mode": "solo"}, 400),
            ({"question": "short", "mode": "solo"}, 400),
            ({"question": "A sufficiently complete question", "mode": "invalid"}, 400),
            ({"question": "x" * (SERVE.MAX_QUESTION_CHARS + 1), "mode": "solo"}, 400),
        ]
        for payload, expected in cases:
            with self.subTest(payload=payload):
                self.assertEqual(self.request("/api/ask", "POST", payload, headers)[0], expected)

    def test_archive_cascades_to_descendants_and_only_unshared_sources(self):
        document = {
            "questions": [
                {"id": "Q1", "parent": "root", "readings": [{"source": "S1"}]},
                {"id": "E1", "parent": "Q1", "readings": [{"source": "S2"}]},
                {"id": "Q2", "parent": "root", "readings": [{"source": "S1"}]},
            ],
            "sources": {"S1": {}, "S2": {}},
        }
        result = SERVE.archive_question_branch(document, "Q1", "2026-07-31T12:00:00Z")
        self.assertEqual(result["questions"], ["E1", "Q1"])
        self.assertEqual(result["sources"], ["S2"])
        self.assertNotIn("archived_at", document["questions"][2])
        self.assertNotIn("archived_at", document["sources"]["S1"])
        self.assertEqual(document["sources"]["S2"]["archived_with"], "Q1")

    def test_archive_set_persists_records_atomically(self):
        document = {
            "meta": {"working_question": "Test"},
            "questions": [{"id": "Q1", "parent": "root", "readings": [{"source": "S1"}]}],
            "sources": {"S1": {"citation": "Source"}},
        }
        original_root, original_dir, original_scan = SERVE.ROOT, SERVE.SETS_DIR, SERVE.SCAN
        try:
            with tempfile.TemporaryDirectory() as directory:
                base = pathlib.Path(directory)
                sets = base / "question-sets"
                sets.mkdir()
                path = sets / "question-set-test.json"
                path.write_text(json.dumps(document), encoding="utf-8")
                SERVE.ROOT = base
                SERVE.SETS_DIR = sets
                SERVE.SCAN = [("question-sets", sets)]
                result = SERVE.archive_set("/question-sets/question-set-test.json", "Q1")
                saved = json.loads(path.read_text(encoding="utf-8"))
                self.assertEqual(result["questions"], ["Q1"])
                self.assertEqual(saved["questions"][0]["archived_with"], "Q1")
                self.assertTrue(saved["questions"][0]["archived_at"])
        finally:
            SERVE.ROOT, SERVE.SETS_DIR, SERVE.SCAN = original_root, original_dir, original_scan

    def test_running_job_can_be_cancelled(self):
        class FakeProcess:
            def __init__(self):
                self.terminated = False

            def poll(self):
                return None

            def terminate(self):
                self.terminated = True

        job_id = "a" * 32
        proc = FakeProcess()
        with SERVE.JOBS_LOCK:
            SERVE.JOBS[job_id] = {
                "id": job_id,
                "state": "running",
                "started": 0,
                "log": [],
                "proc": proc,
            }
        try:
            _, status = self.status()
            self.assertEqual(self.request(f"/api/jobs/{job_id}")[0], 403)
            self.assertEqual(
                self.request(f"/api/jobs/{job_id}", headers={"X-DSA-Token": status["token"]})[0],
                200,
            )
            self.assertEqual(SERVE.cancel_job(job_id), "cancelled")
            self.assertTrue(proc.terminated)
            self.assertEqual(SERVE.JOBS[job_id]["state"], "cancelled")
        finally:
            with SERVE.JOBS_LOCK:
                SERVE.JOBS.pop(job_id, None)


if __name__ == "__main__":
    unittest.main()
