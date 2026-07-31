import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("dsa_validate", ROOT / "scripts" / "validate.py")
VALIDATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATE)


def valid_set():
    names = ["Meaning", "Landscape", "Mechanism", "Tension", "Evidence", "Scope", "Stake"]
    questions = []
    for index, name in enumerate(names, 1):
        questions.append({
            "id": f"Q{index}",
            "parent": "root",
            "question": f"Question {index}?",
            "label": f"Question {index}",
            "type": {"n": index, "name": name},
            "relevance_group": "core",
            "difficulty": "middle",
            "readings": [{"role": "primary", "source": "S1"}],
            "single_reading_reason": "One primary source is sufficient for this fixture.",
            "check_first": "Check the publisher.",
            "read_for": "Read for the method.",
            "level": "About ten minutes.",
        })
    return {
        "meta": {
            "generated_by": "test",
            "generated_at": "2026-07-31",
            "status": "draft",
            "original_question": "Test?",
            "working_question": "Test?",
        },
        "root": {"id": "root", "label": "Test"},
        "questions": questions,
        "sources": {
            "S1": {
                "citation": "Example source",
                "access_tier": "T1",
                "verified": "confirmed",
                "url": "https://example.com/source",
            }
        },
    }


class ValidatorTests(unittest.TestCase):
    def test_valid_set_passes_project_invariants(self):
        self.assertEqual(VALIDATE.check(valid_set()), [])

    def test_active_url_scheme_is_rejected(self):
        data = valid_set()
        data["sources"]["S1"]["url"] = "javascript:alert(1)"
        self.assertIn("S1: url must use http or https", VALIDATE.check(data))

    def test_spoiler_field_is_rejected(self):
        data = valid_set()
        data["questions"][0]["why_this"] = "spoiler"
        self.assertIn("Q1: leaks spoiler field 'why_this'", VALIDATE.check(data))

    def test_archived_question_remains_valid_document_history(self):
        data = valid_set()
        data["questions"][0]["archived_at"] = "2026-07-31T12:00:00Z"
        data["questions"][0]["archived_with"] = "Q1"
        self.assertEqual(VALIDATE.check(data), [])
        schema_problems = VALIDATE.schema_check(data)
        if schema_problems is not None:
            self.assertEqual(schema_problems, [])


if __name__ == "__main__":
    unittest.main()
