<h1>dont-stop-ask</h1>

<p><a href="README.zh-CN.md">中文</a></p>

<table>
  <tr>
    <td width="50%">
      <img src="docs/assets/dont-stop-ask-entry.png" alt="Do Not Stop Ask galaxy landing page" />
    </td>
    <td width="50%">
      <img src="docs/assets/dont-stop-ask-question.png" alt="Do Not Stop Ask question page" />
    </td>
  </tr>
  <tr>
    <td align="center"><strong>Enter the question world</strong></td>
    <td align="center"><strong>Ask in your own words</strong></td>
  </tr>
</table>

**A research tool that never answers the question.**

Give it something you actually wonder about, and it gives back a map of sharper questions — each
anchored to real, verified readings, each carrying a fact-checking move to run *before* you read.
Explore the map; when a question gets interesting, grow it into more — up to nine, and fewer when
fewer are useful. It does not summarise the sources, does not write the essay, and does not tell you
which side to take. That is the design, not a limitation.

**Ask in any language.** A Chinese question returns a Chinese question set, and the viewer's
interface can be switched between English and Chinese.

---

## Quick start

Clone the current release from the default `main` branch:

```bash
git clone https://github.com/cadillacyz/dont-stop-ask.git
cd dont-stop-ask
python scripts/serve.py
```

Then open <http://127.0.0.1:8010/viewer/>. On Windows, you can double-click `start.bat` instead.

### Tell an AI coding agent to run it

After cloning, paste this into Codex, Claude Code, or another coding agent:

> Read `AGENTS.md` and `SECURITY.md`, then start this repository's local companion app without
> changing the code. Verify `/api/status` and the viewer, open the viewer for me if you can, and tell
> me whether Codex or Claude Code generation is available. Keep the server on `127.0.0.1` and do not
> expose or proxy its port.

The repository-level [`AGENTS.md`](AGENTS.md) gives compatible AI agents the exact startup,
verification, old-UI recovery, and safety instructions automatically.

---

## The five rules

Every set is generated under these; they override everything else.

| | Rule |
|---|---|
| 1 | **Never fabricate a source** — every citation verified by live search before it ships, or honestly marked unconfirmed |
| 2 | **Never answer its own questions** — if you could finish the work without opening a source, the set has failed |
| 3 | **Moves, not verdicts** — you get the search that reveals a source's slant, not a conclusion about it |
| 4 | **No leading questions** — two careful people must be able to disagree defensibly |
| 5 | **No disguised recall** — every question requires judgment, not lookup |

## Use it in Claude Code

```bash
git clone https://github.com/cadillacyz/dont-stop-ask.git
cp -r dont-stop-ask/skills/dont-stop-research ~/.claude/skills/
```

Windows PowerShell: `Copy-Item -Recurse dont-stop-ask\skills\dont-stop-research $HOME\.claude\skills\`

Then start the companion server and open the viewer:

```bash
python scripts/serve.py
```

Or just double-click `start.bat` on Windows.

The helper is intentionally local-only and now serves an allowlisted surface rather than the
repository. Do not publish or proxy its port. See [SECURITY.md](SECURITY.md) for the threat boundary
and [docs/production-boundary.md](docs/production-boundary.md) before turning it into a hosted app.

Open <http://127.0.0.1:8010/viewer/>, click the question world, type your question, and hit **Ask**.
The helper runs Codex (preferred) or Claude Code directly. **The graph loads itself** when the file
appears — no prompt copy/paste or file picker needed. Install one of those CLIs first.

## Use it in ChatGPT or any other assistant

The whole tool also exists as one self-contained prompt:
[`portable/dont-stop-research.md`](portable/dont-stop-research.md).

1. Paste the file's contents into ChatGPT (or Gemini, or any assistant **with web search
   enabled** — verification is non-negotiable), add your question at the bottom, send.
2. It returns the question set in chat plus a JSON code block. Save that block as
   `question-sets/anything.json` in this folder (or anywhere).
3. The viewer picks it up automatically if the server is running — or drag the file onto the page.

To expand a question, click its dot and choose **Expand into more**. Nine is the ceiling, not the
target; the local agent generates fewer whenever more would be padding.

To remove a question from the visible map, select its dot and choose **Archive branch**. Descendant
questions and readings used nowhere else leave the graph together, while every record remains in the
JSON with `archived_at` and `archived_with` metadata.

## What's in here

| Path | What |
|---|---|
| `skills/dont-stop-research/` | The Claude Code skill |
| `portable/dont-stop-research.md` | The same tool as one pasteable prompt, for any assistant |
| `viewer/` | The interactive graph. Static; d3 from a CDN |
| `scripts/serve.py` | Companion server: watches `question-sets/`, runs the skill when a CLI is available. Binds 127.0.0.1 only |
| `scripts/validate.py` | Checks a set against `schema/question-set.schema.json` |
| `start.bat` | Double-click launcher for Windows |

## What it will not do

No essay, no outline, no draft, no summarising a source so the reading can be skipped, no telling
you which side to take. The test: if you end up with a position you cannot defend out loud,
something went wrong.

## Honest limits

Verification confirms a source exists and says what we claim — at abstract level, not full text, so
it can be defeated by a source that is real, well-indexed, and wrong. Difficulty is calibrated from
one paragraph of self-description, which is a guess. And nothing enforces that anyone actually
reads: the tool changes incentives and makes gaps visible out loud; it enforces nothing.

## Contributing

Found a citation we got wrong? That's the most valuable issue you can file — say what was wrong and
how you checked. See [CONTRIBUTING.md](CONTRIBUTING.md).

Before a release, run the validator and the local security/UI contract tests:

```bash
python -m unittest discover -s tests -v
python scripts/validate.py
node --check viewer/graph.js
```

## Licence

[MIT](LICENSE). The readings a set points to remain their authors' and publishers' property; this
project links and never reproduces.
