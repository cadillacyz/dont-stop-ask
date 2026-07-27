# Contributing to 不停问 · dont-stop-ask

Thank you for looking. The most valuable contributions here are probably not code.

## The single most useful issue you can file

**A citation we got wrong.** Rule 1 says never fabricate a source, and the whole project rests on it.
If a generated set in this repository points at something that does not exist, does not say what we
claim, or has drifted (moved URL, retracted paper, replaced report), please open an issue saying:

- which file and which source id (e.g. `examples/us-china-tariffs/question-set.json`, `S7`)
- what is wrong
- **how you checked** — this matters as much as the finding

We would rather ship a source marked `unconfirmed` than a confident wrong one, so "this should be
downgraded to unconfirmed" is a perfectly good outcome.

## Ways to help

| | What | Notes |
|---|---|---|
| **Question sets** | Add a worked example on a new topic | Must pass `scripts/validate.py`; every source verified by search |
| **Translations** | The README exists in English and Chinese | Skill prompts are English-only for now; translating them is a real project, discuss first |
| **Viewer** | Layout, accessibility, keyboard navigation | Keep it dependency-free apart from d3 via CDN |
| **The skill** | Improvements to the rules, ladder, or formats | These change every future set — open an issue before a PR |
| **Docs** | Anything that was confusing | Say what you expected to happen |

## Before opening a pull request

```bash
python scripts/validate.py
```

This checks every JSON in `examples/` against `schema/question-set.schema.json` plus the project's
own invariants. Install `jsonschema` for full validation:

```bash
pip install jsonschema
```

Then open the viewer and click through what you changed:

```bash
python -m http.server 8000   # http://localhost:8000/viewer/
```

## Hard rules for any contributed question set

These are not style preferences. A set that breaks one of them cannot be merged.

1. **Every source verified by search** before it enters the file, with `verified_how` recording what
   was actually checked. Unverifiable sources ship as `verified: unconfirmed` with
   `unconfirmed_detail`, never silently.
2. **No answers anywhere.** `read_for` points into a text; it never summarises one.
3. **No verdicts about sources.** `check_first` is a search the student performs, not a conclusion
   they receive.
4. **No adult-only fields in the JSON.** `why_this`, `they_might_say`, and the teach-back signatures
   belong in the markdown artifact only. The validator fails the build if they leak.
5. **All seven ladder types present** in every cluster, with at least one real Tension card. If the
   topic has no genuine expert disagreement, say so explicitly rather than manufacturing one.
6. **No paywalled source without a free route** in `paired_with`.

## Privacy

Never commit a real student's context, name, school, or assignment. `question-sets/` is gitignored
for exactly this reason. Examples use `Anonymous` plus a one-line description of the band and
motivation.

## Scope

This version covers ages 16–18 (`HTeen`) only. A 13–15 band and student-facing session consumers
exist in the design but are deliberately not in this repository yet. The content-boundary policy for
sensitive topics is unset, and it is the highest-priority open question — see Known Limitations in
the skill. Contributions there are especially welcome, and should start as an issue.
