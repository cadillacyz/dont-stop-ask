# Example: US–China tariffs

The worked example shipped with the project. Generated on 2026-07-27 and expanded once on 2026-07-28.

**Asked as:** "How's the US tariff on China would affect the world?"

**Triage sharpened it to:** "Did the US tariffs on China reroute world trade or shrink it — and who
actually came out ahead?"

The original failed three of the six triage criteria at once: it could be answered from general
knowledge, it invited a catalogue rather than an argument, and "the world" spanned five separate
literatures. It also left "the tariff" ambiguous across three distinct policies — the 2018–19 trade
war, the 2025 escalation, and the truce running at the time of generation. The full six-criteria
record is in [question-set.md](question-set.md).

## The three files

| File | Who it's for |
|---|---|
| [question-set.md](question-set.md) | Whoever reviews the set. Contains everything, including the spoiler fields — what each card unlocks and the answers a reader is likely to reach for first. |
| [question-set.json](question-set.json) | The viewer. Same set, spoiler fields stripped. This is the surface you work from. |
| [research-briefing.md](research-briefing.md) | The reader acting on it. Layered: the first screen is enough to start. |

This example was generated in **`guided` mode**, which is why the briefing addresses a second person
supporting the research ("ask them this"). In `solo` mode the same briefing addresses the
researcher's own later self and opens with a spoiler warning instead.

The `context` recorded for this example is *"comfortable with basic supply-and-demand reasoning; no
background in trade policy or international economics"* — every difficulty rating in the set is
relative to that. A trade economist running the same question would get the same questions rated
differently.

## What it contains

Sixteen questions in two clusters, fourteen verified sources.

The first pass produced nine questions on the working question. Q8 — *"the tariffs didn't raise
employment in protected industries, yet the most-exposed regions voted for more tariffs; so what are
tariffs actually FOR?"* — was then expanded into a seven-question cluster (E1–E7) with its own
working question and its own relevance grouping. Seven, not nine: an eighth would have been padding,
which the ceiling rule permits and encourages.

Both clusters cover all seven ladder types. Each has a load-bearing Tension card presenting a real
disagreement at its strongest: in the first cluster, three research teams reaching different verdicts
on the same episode because they counted different things; in the second, a values dispute about what
economies are for, where the skill is instructed to note which claims are testable and which are not.

## The unconfirmed source

**S7** is flagged `verified: unconfirmed`. The widely-quoted IMF estimate that geoeconomic
fragmentation could cost 0.2%–7% of global GDP is real reporting of real IMF work, but we could not
confirm from a primary document *which* IMF publication carries that figure. The card that uses it
shows the warning, and the briefing tells the reader to start their spot-check there.

This is what a correct outcome looks like when a figure cannot be traced. Shipping it confidently
attributed would have been the failure.

## Load-bearing sources

Two sources carry several cards each, which is visible in the graph as a dot with many edges:
Fajgelbaum et al. (2024) serves four cards across the set, and Autor et al. (2024) serves three,
spanning both clusters. Re-use across cards under different roles is deliberate — it is the shape of
a real literature, not duplication.

## Open it

From the repository root:

```bash
python -m http.server 8000
```

Then <http://localhost:8000/viewer/> — this example is the viewer's default.
