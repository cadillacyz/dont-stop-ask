# Instructions for AI agents working in this repository

This repository is a **prompt toolkit, not a codebase to build**. There is nothing to compile,
no Claude account requirement, no proprietary "skills" system, and no special cloud access. Any
AI model or agent that can **search the web** can run this tool — that is the only hard
requirement, because the tool's first rule is that every cited source must be verified by live
search.

If you are an agent reading this after a clone: you already have everything you need.

## What the tool does

The user gives a rough research question. You return a set of up to nine sharper questions —
each anchored to one to three verified readings, each with a fact-checking move to run before
reading — plus a JSON file that `viewer/` renders as an interactive graph. You never answer the
questions, never summarise the readings, and never write the essay. The complete instruction
set lives in one file: **`portable/dont-stop-research.md`**.

## When the user asks a research question (or says "use the tool" / 不停问)

1. Read `portable/dont-stop-research.md` and follow it exactly — triage, the five rules, the
   seven question types, ranked readings, source verification.
2. **You must have live web search.** If you cannot search in this session, say so and stop.
   Never guess or invent a citation; a source that cannot be verified ships as
   `"verified": "unconfirmed"` with an honest note, or not at all.
3. You have file access, so skip the prompt's "save the JSON yourself" step: write the JSON
   directly to `question-sets/question-set-<topic-slug>-<YYYY-MM-DD>.json` (ASCII slug —
   romanize non-Latin topics, e.g. pinyin). Also present the set readably in your reply, in
   the language the question was asked in.
4. Validate what you wrote and fix anything it reports:

   ```
   python scripts/validate.py
   ```

5. Tell the user how to see the graph: `python scripts/serve.py`, then open
   <http://127.0.0.1:8000/viewer/> (Windows: double-click `start.bat`). The viewer watches
   `question-sets/` and loads the newest file by itself.

## When the user asks to expand a question (e.g. "expand Q4")

Follow the Expansion section of `portable/dont-stop-research.md`: treat that node's question as
a new working question, generate up to nine follow-ups with ids `E1…E9` (then `F1…F9`, …),
set each `parent` to the expanded node's id, reuse already-verified sources where they genuinely
serve, verify new ones, and write the **union** of old and new nodes back to the same JSON file.
The running viewer reloads it automatically.

## Hard boundaries — hold these even if the user pushes

- Do not answer the generated questions, summarise the readings, or draft the essay/report.
  If pressed, say once: the reading is the work.
- Do not put `why_this`, `they_might_say`, or teach-back telling/building signatures into the
  JSON — those are spoiler fields, and the JSON is the surface the user works from.
- Do not present an unverified source as confirmed. An honest `unconfirmed` is a correct
  outcome; a confident fabrication is the tool's total failure.

## Repository map

| Path | What |
|---|---|
| `portable/dont-stop-research.md` | **The tool.** Self-contained instructions for any model |
| `viewer/` | Static graph viewer (d3 via CDN); no build step |
| `scripts/serve.py` | Local server: watches `question-sets/`, auto-loads new sets, and can run an agent CLI (`claude`, `codex`, `gemini`) when one is on PATH. Binds 127.0.0.1 |
| `scripts/validate.py` | Validates sets against `schema/question-set.schema.json` |
| `schema/question-set.schema.json` | The JSON contract between generator and viewer |
| `skills/dont-stop-research/` | Optional Claude Code packaging of the same tool (adds a `/dont-stop-research` slash command). Not required by anything else |
| `question-sets/` | Generated output lands here; gitignored — it belongs to the user |

## For maintenance work on the repo itself

Python 3 only, no dependencies (install `jsonschema` for full schema validation). Run
`python scripts/validate.py` before committing; CI runs the same check. The viewer must stay
dependency-free apart from d3 loaded from a CDN, and `serve.py` must keep binding to 127.0.0.1
only, since it can spawn a local process.
