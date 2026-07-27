#!/usr/bin/env python3
"""Validate a dont-stop-ask question set against schema/question-set.schema.json.

Usage:
    python scripts/validate.py                       # validate every example
    python scripts/validate.py path/to/set.json ...  # validate specific files

Uses jsonschema when installed for full schema validation. The project-specific
invariants below are checked either way, because they are the ones that matter:
a leaked spoiler field turns the working surface into an answer key, and an
unverified source breaks Rule 1.
"""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "schema" / "question-set.schema.json"

SPOILER = ("why_this", "they_might_say", "if_stuck")
TEACHBACK_SPOILER = ("telling_signature", "building_signature", "follow_up")
DIFFICULTY = {"easy", "middle", "technical"}
GROUPS = {"core", "supporting", "context"}
TYPES = {"Meaning", "Landscape", "Mechanism", "Tension", "Evidence", "Scope", "Stake"}


def check(data):
    """Return a list of problem strings. Empty list means the set is clean."""
    problems = []
    questions = data.get("questions") or []
    sources = data.get("sources") or {}

    if not questions:
        problems.append("no questions in set")
    if not sources:
        problems.append("no sources in set")

    ids = set()
    for q in questions:
        qid = q.get("id", "<no id>")
        if qid in ids:
            problems.append(f"{qid}: duplicate question id")
        ids.add(qid)

        for field in SPOILER:
            if field in q:
                problems.append(f"{qid}: leaks spoiler field '{field}'")

        if q.get("difficulty") not in DIFFICULTY:
            problems.append(f"{qid}: difficulty {q.get('difficulty')!r} not in {sorted(DIFFICULTY)}")
        if q.get("relevance_group") not in GROUPS:
            problems.append(f"{qid}: relevance_group {q.get('relevance_group')!r} not in {sorted(GROUPS)}")

        name = (q.get("type") or {}).get("name")
        if name not in TYPES:
            problems.append(f"{qid}: ladder type {name!r} not one of the seven")

        readings = q.get("readings")
        if readings is None:
            problems.append(f"{qid}: missing readings (use [] for a thinking-only card)")
            readings = []
        if len(readings) > 3:
            problems.append(f"{qid}: {len(readings)} readings, ceiling is 3")
        if len(readings) < 2 and not q.get("single_reading_reason"):
            problems.append(f"{qid}: fewer than two readings without a single_reading_reason")

        roles = [r.get("role") for r in readings]
        if roles.count("primary") > 1:
            problems.append(f"{qid}: more than one primary reading")
        if readings and "primary" not in roles:
            problems.append(f"{qid}: has readings but no primary")
        for role in ("supporting", "background"):
            if roles.count(role) > 1:
                problems.append(f"{qid}: more than one {role} reading")

        for r in readings:
            if r.get("source") not in sources:
                problems.append(f"{qid}: cites unknown source {r.get('source')!r}")

        for field in ("check_first", "read_for", "level", "question", "label", "parent"):
            if not q.get(field):
                problems.append(f"{qid}: missing {field}")

    parents = {q.get("parent") for q in questions}
    known = ids | {(data.get("root") or {}).get("id", "root")}
    for p in parents - known:
        problems.append(f"parent {p!r} is not root and not a question in this set")

    # Ladder coverage: all seven types must appear at least once per cluster.
    clusters = {}
    for q in questions:
        clusters.setdefault(q.get("parent"), set()).add((q.get("type") or {}).get("name"))
    for parent, names in clusters.items():
        missing = TYPES - names
        if missing:
            problems.append(
                f"cluster under {parent!r} is missing ladder types: {', '.join(sorted(missing))}"
            )

    for sid, s in sources.items():
        if s.get("verified") not in ("confirmed", "unconfirmed"):
            problems.append(f"{sid}: verified {s.get('verified')!r} must be confirmed or unconfirmed")
        if s.get("verified") == "unconfirmed" and not s.get("unconfirmed_detail"):
            problems.append(f"{sid}: unconfirmed without unconfirmed_detail")
        if s.get("access_tier") == "T4" and not s.get("paired_with"):
            problems.append(f"{sid}: T4 source without a paired_with free route")
        if not s.get("url") and not s.get("reachable_at"):
            problems.append(f"{sid}: no url and no reachable_at — the reader cannot find it")
        if not s.get("citation"):
            problems.append(f"{sid}: missing citation")

    cited = {r.get("source") for q in questions for r in (q.get("readings") or [])}
    for sid in set(sources) - cited:
        problems.append(f"{sid}: in the inventory but cited by no card")

    for tb in data.get("teach_back") or []:
        for field in TEACHBACK_SPOILER:
            if field in tb:
                problems.append(f"{tb.get('id')}: leaks spoiler teach-back field '{field}'")
        for anchor in tb.get("anchors") or []:
            if anchor not in ids:
                problems.append(f"{tb.get('id')}: anchors unknown card {anchor!r}")

    return problems


def schema_check(data):
    try:
        import jsonschema
    except ImportError:
        return None
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = jsonschema.Draft202012Validator(schema)
    return [
        f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}"
        for e in validator.iter_errors(data)
    ]


def main(argv):
    paths = [pathlib.Path(a) for a in argv[1:]]
    if not paths:
        paths = sorted((ROOT / "examples").rglob("*.json"))
    if not paths:
        print("no question sets found")
        return 1

    failed = False
    for path in paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as err:
            print(f"FAIL {path}\n  unreadable: {err}")
            failed = True
            continue

        problems = check(data)
        schema_problems = schema_check(data)
        if schema_problems is None:
            note = "  (install jsonschema for full schema validation)"
        else:
            note = ""
            problems = [f"schema: {p}" for p in schema_problems] + problems

        n_q = len(data.get("questions") or [])
        n_s = len(data.get("sources") or {})
        if problems:
            failed = True
            print(f"FAIL {path}  ({n_q} questions, {n_s} sources)")
            for p in problems:
                print(f"  - {p}")
        else:
            print(f"OK   {path}  ({n_q} questions, {n_s} sources){note}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
