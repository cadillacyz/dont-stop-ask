<h1>不停问 · dont-stop-ask</h1>

**A research tool that never answers the question.**

Give it something you actually wonder about — *"would US tariffs on China affect the rest of the
world?"* — and it gives back a map of better questions, each anchored to real, verified readings, each
carrying a fact-checking move to run *before* you read. You explore the map, and when a question gets
interesting, you grow it into nine more.

It does not summarise the sources. It does not write the essay. It does not tell you which side to
take. That is the design, not a limitation.

[中文说明](README.zh.md) · [Try it](#try-the-example) · [Worked example](examples/us-china-tariffs/)

---

## Why this exists

Most research, done honestly, goes: search, skim, paraphrase, cite. The research that actually
teaches you something goes: sharpen the question, find out who disagrees, work out what each study
*measured*, and take a position you can defend out loud.

An AI that summarises sources makes the first kind faster. This one tries to make the second kind
possible — by inverting the usual assistant pattern. A research assistant checks sources silently on
your behalf, because you already know how. Here **the checking is the point**, so every judgment the
tool could make for you is handed back as a move for you to perform.

Two findings drive the whole design:

- Professional fact-checkers evaluate an unfamiliar source in about 90 seconds by **leaving the page**
  to see what independent sources say. Students *and university professors* instead read down the
  page, hunting cues that are trivially faked, and take five times as long to be wrong more often
  (Wineburg & McGrew, 2017, 2019). **The professors failing too is why this isn't a tool for
  beginners** — knowing a field doesn't teach you to evaluate a source in it.
- Generating an explanation beats re-reading by a wide margin, but only when you have enough prior
  knowledge to generate one at all (Pressley et al., 1992; Woloshyn et al., 1994). So question order
  matters, and a hard question asked too early just produces silence.

## Who it's for

Anyone with a question worth investigating properly. Someone writing a paper. Someone making a
decision at work and wanting the actual evidence. Someone who read one article and wants to know
whether it was true. A study group. A journalist. A curious person on a Sunday.

It runs two ways:

- **solo** — you're researching your own question. The briefing addresses your later self, and warns
  you which sections spoil the inquiry if you read them early.
- **guided** — someone is supporting the research: a teacher, mentor, manager, study partner, or
  parent. The briefing addresses them, and assumes they know nothing about the subject.

Difficulty and reading level are calibrated from what you say you already know, not from an assumed
age or education level.

## The five rules

Every question set is generated under these, and they override everything else:

| | Rule | Why |
|---|---|---|
| 1 | **Never fabricate a source** | A real author + a real journal + a plausible year is the most dangerous hallucination there is, because checking the author's name appears to confirm it |
| 2 | **Never answer its own questions** | If the set lets you produce the work without opening a source, the set has failed |
| 3 | **Issue moves, not verdicts** | Not "this think tank is industry-funded" but "search its name plus *funding*, then decide" |
| 4 | **No leading questions** | Two careful people must be able to reach different defensible answers |
| 5 | **No disguised recall** | "What is a tariff?" is retrieval. "Why impose one you know raises your own prices?" is inquiry |

When a source cannot be verified it ships **marked unconfirmed**, with a plain statement of what
could not be confirmed. The example contains one. That is a correct outcome, not a bug — and the
briefing tells you to start your spot-check there.

## How it works

```
  your rough question
        │
        ▼
  /dont-stop-research  ──── Claude Code, with live web search
        │                     · sharpens the question (and shows its working)
        │                     · generates up to 9 questions across 7 question types
        │                     · attaches 1–3 ranked readings each, verified by search
        │                     · groups by relevance, rates difficulty for your background
        ▼
  three files ─────────┬─── question-set.md    the full record, including the anticipated answers
                       ├─── question-set.json  spoiler-free working surface (schema-enforced)
                       └─── research-briefing.md   the prose companion
                                │
                                ▼
                          viewer/  ── a force-directed graph of the JSON
                                      click a dot → readings + how to read them
                                      click expand → grow that question into 9 more
```

**Claude Code is the engine; this repo is the skill and the map.** Source verification needs live web
search, so generation happens inside a Claude Code session rather than in the browser. The viewer is
static — no server, no API key, nothing to deploy.

## Install

You need [Claude Code](https://claude.com/claude-code), plus Python 3 if you want the validator or a
local preview.

```bash
git clone https://github.com/USER/dont-stop-ask.git
```

Then make the skill available to Claude Code:

```bash
cp -r dont-stop-ask/skills/dont-stop-research ~/.claude/skills/
```

…or, on Windows PowerShell:

```powershell
Copy-Item -Recurse dont-stop-ask\skills\dont-stop-research $HOME\.claude\skills\
```

## Use it

Generate a set from inside a Claude Code session:

```bash
claude "/dont-stop-research Does intermittent fasting do anything that ordinary calorie restriction doesn't? context: I read the popular coverage, comfortable with statistics, no biology background"
```

Three files land in `./question-sets/`. Open the graph:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/viewer/`. It opens on a question mark — click *Open your own…* and
hand it the JSON, or pass it directly:
`http://localhost:8000/viewer/?data=../question-sets/question-set-fasting-2026-07-28.json`.

Opening `viewer/index.html` straight from disk works too. Browsers block reading local files, so drop
the JSON anywhere on the page.

**To grow a question:** click its dot, hit *Copy expansion prompt*, paste into Claude Code. It runs
the ladder again on that question, reuses sources it has already verified, verifies any new ones, and
writes an updated JSON containing everything. Reload the viewer and the branch is there.

### Try the example

The repository ships a complete worked example: nine questions on whether the US–China tariffs
rerouted world trade or shrank it, expanded once into a seven-question cluster on what tariffs are
actually *for*. Sixteen questions, fourteen verified sources, one honestly-flagged unconfirmed one.

```bash
python -m http.server 8000   # then open http://localhost:8000/viewer/ and click "See a finished example"
```

Files: [question-set.json](examples/us-china-tariffs/question-set.json) ·
[the artifact](examples/us-china-tariffs/question-set.md) ·
[the briefing](examples/us-china-tariffs/research-briefing.md)

## What's in here

| Path | What |
|---|---|
| `skills/dont-stop-research/SKILL.md` | The skill. Four stages: triage, generate, brief, emit JSON — plus expansion |
| `skills/dont-stop-research/shared/` | The rules, the question ladder, the card format, the two output formats |
| `schema/question-set.schema.json` | The JSON contract the viewer depends on |
| `viewer/` | Static force-directed graph. d3 from a CDN; nothing else |
| `examples/us-china-tariffs/` | The worked example, all three files |
| `scripts/validate.py` | Checks a set against the schema and the project's invariants |

## The seven question types

A set must cover all seven, weighted toward **Mechanism** and **Tension** — the two places research
reliably dies, at every level of expertise. Readers collect *what* and never reach *why*; and a set
with no real disagreement in it produces a summary rather than a position, however many sources it
cites.

| | Type | The move it teaches |
|---|---|---|
| 1 | Meaning | What are we actually asking? Which words are doing work? |
| 2 | Landscape | Who has looked at this, what did they find? |
| 3 | **Mechanism** | *Why* would that happen? What's the story underneath? |
| 4 | **Tension** | Who disagrees, and what is their strongest point? |
| 5 | Evidence | How would anyone know? What would count as proof? |
| 6 | Scope | Where does this stop being true? |
| 7 | Stake | Who cares, what changes if the answer flips? |

The Tension card must present a **real** disagreement at its strongest. Where a topic has no live
expert dispute, the skill is instructed to say so rather than manufacture one.

## The briefing

Every set comes with a companion briefing written for someone with **no knowledge of the subject** —
because on any given question, that's most people, including experts in adjacent fields. It's
layered: read the first screen and you can act in ten minutes; read the rest if you want the
reasoning.

It gives you three questions that can be asked cold by someone who knows nothing, what a genuine
answer sounds like versus a recited one, a glossary of words that will show up in the answer, and —
the part that makes it trustworthy — instructions for checking our citations, starting with the one
we could not confirm.

In solo mode it opens with a spoiler warning, because two of its sections contain the answers you're
likely to reach for first, and reading those early spoils the work.

## What it will not do

No essay. No argument outline. No draft. No telling you which side to take. No summarising a source
so the reading can be skipped.

The falsifiable test: **if you end up with work you cannot defend out loud, something went wrong** —
and the three teach-back questions are how you'd find out.

## Limitations worth knowing before you rely on it

1. **The evidence base is strong for the parts and untested for the whole.** Lateral reading,
   elaborative interrogation, central-question design and learning-by-teaching are each
   well-evidenced. Assembling them into this is a reasoned bet, not a validated intervention.
2. **Verification is only as good as the search behind it.** The skill confirms a source exists and
   that its abstract supports the claim attached to it. It cannot read paywalled full text, and it can
   be defeated by a source that is real, well-indexed and wrong.
3. **Numbers travel worse than citations.** On technical topics the bigger risk is not a fake
   reference but a real figure quoted without its scope — "$14bn lost" was one half of one year, goods
   only. The briefing says so explicitly.
4. **Calibration comes from one paragraph of free text.** Better than assuming an age, still a guess.
   A specialist who describes themselves modestly gets a set pitched too low. Say more than feels
   necessary.
5. **In solo mode the spoiler boundary is self-enforced.** The JSON withholds the anticipated answers;
   the artifact and briefing contain them, and nothing stops you reading ahead.
6. **It cannot tell whether anyone read anything.** It changes incentives and makes gaps visible when
   you try to explain yourself. It enforces nothing.
7. **There is no content policy for sensitive topics.** For an adult researching their own question
   that's appropriate. If you're using `guided` mode with a young person, choosing the topic and
   reviewing the sources first is your job — the skill does not do it for you.

## Contributing

Bug reports, new question sets, and translations are all welcome. Run `python scripts/validate.py`
before opening a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

If you find a citation we got wrong, that is the most valuable issue you can file. Please say what
was wrong and how you checked.

## Evidence base

Bargh & Schul (1980) · Beck et al. (2013) · Bjork et al. (2013) · Breakstone et al. (2021) ·
Caulfield (2019) · Chin (2007) · Fisher & Frey (2012) · Ji et al. (2023) · Nystrand et al. (1997) ·
Paul & Elder (2008) · Pressley et al. (1992) · Reisman (2012) · Roscoe & Chi (2007) ·
Shanahan et al. (2012) · Wiggins & McTighe (2005) · Wineburg & McGrew (2017, 2019) ·
Woloshyn et al. (1994)

Citation is not endorsement: none of these researchers has reviewed or approved this tool.

## Licence

[MIT](LICENSE). The readings a generated set points to remain the property of their authors and
publishers; this project links to them and never reproduces them.
