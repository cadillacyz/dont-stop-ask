# Card Format, Readings, Tiers, and Complexity

Field names are canonical — the artifact schema, the JSON schema, and the viewer all depend on them.

---

## Card fields

| Field | Visibility | Contents |
|---|---|---|
| `id` | both | `Q1`…`Q9` for a first-pass set; `E1`…`E9`, `F1`…`F9` for successive expansions |
| `question` | both | The question, in plain language — no field jargon the reader hasn't met yet |
| `type` | both | Ladder type + Paul & Elder move |
| `parent` | both | `root`, or the id of the node this card expands |
| `relevance_group` | both | `core` · `supporting` · `context` — distance from the working question |
| `difficulty` | both | `easy` · `middle` · `technical` — see below |
| `why_this` | **spoiler** | One line: what this unlocks. Orients; never answers. |
| `source_ref` | both | Ranked list of 1–3 readings, each with a role (or `none`) |
| `check_first` | both | A lateral-reading move to run **before** reading. A search they perform. |
| `read_for` | both | A pointer *into* the text — which part, what to notice. Not a summary. |
| `level` | both | Prose: primary complexity challenge + realistic time |
| `they_might_say` | **spoiler** | 2–3 likely answers, each with a follow-up that takes it seriously |

Spoiler fields carry `visibility: adult` in the artifact — a field value kept for compatibility, read
it as *spoiler*. They must be filtered out of the JSON output and out of any surface the researcher
works from. `they_might_say` in particular converts the card into an answer key, and that applies
whether the reader is a student, a colleague, or the researcher themselves.

**Follow-ups in `they_might_say` never open with "Good" or "Not quite"** (Chin, 2007). They respond
with a question that takes the answer seriously, including when the answer is wrong.

---

## Readings: one to three, ranked by role

Each card carries **one to three** readings. `source_ref` is an ordered list; each entry declares a
role:

| Role | Count | What it is |
|---|---|---|
| `primary` | exactly 1 | The reading this card exists to make the reader open |
| `supporting` | 0 or 1 | A second account that complicates, corroborates, or contradicts the primary |
| `background` | 0 or 1 | Orientation only — a chart, a timeline, a glossary-grade explainer |

**Rank by relevance to this card's question, not by source quality.** A T2 explainer can outrank a T1
paper on an orientation card.

**A single-reading card must justify itself.** Either it is a thinking-only card (`source_ref: none`),
or the primary is so central that a second reading would dilute it — and the card says which.

**Reuse across cards is encouraged.** One paper serving three cards under three different roles is
not duplication; it is the shape of a real literature, and in the graph viewer it is what makes a
load-bearing source visible.

---

## Access tiers

Rank sources in this order. Every source in the inventory declares its tier.

| Tier | What | Use |
|---|---|---|
| **T1** | Open-access paper, public institutional report | Free, permanent, citable |
| **T2** | Reputable journalism or explainer, named author, editorial standards | Workhorse tier |
| **T3** | Textbook, encyclopedia, established reference | Definitional scaffolding |
| **T4** | Paywalled academic or trade book | Name only if genuinely central; **always pair with a reachable alternative** |

**Never assign a source the reader cannot open.** A paywalled paper nobody can reach is a dead end
that teaches them research is for other people. T4 entries carry `paired_with` naming a free route —
a review, an interview, a repository preprint.

Lead with T1. A capable reader can get what they need from a well-written paper's abstract,
introduction, and conclusion even when the middle is beyond them — say so in `level` when true.

---

## Difficulty: the coarse three-way rating

`difficulty` is a sorting and colour-coding value, not a substitute for `level`. **It is relative to
the reader described in `context`**, not absolute: the same paper is `technical` for a newcomer and
`easy` for a specialist, and the rating must describe the actual reader.

| Value | Means |
|---|---|
| `easy` | This reader gets what the card needs on a first pass. Includes thinking-only cards. |
| `middle` | Readable, but something specific blocks it — assumed background, register, or volume of numbers. |
| `technical` | Parts are genuinely beyond this reader, and the card says which parts to skip. Expect frustration here; that is the design working, not failing. |

A set of nine cards should not be nine `technical` cards. If it is, the working question is pitched
above the reader and Stage 0 should have caught it. Nine `easy` cards is the opposite failure: the
question was too easy to be worth a set.

---

## Complexity: name the *kind* of hard

Per Shanahan et al. (2012), text complexity is three-dimensional, and quantitative measures alone
mislead badly. `level` must name the **primary complexity challenge**, not just a rating:

| Dimension | The barrier is… | Typical fix |
|---|---|---|
| **Quantitative** | Sentence length, word frequency, sheer length | Extract a section |
| **Levels of meaning** | Implicit meaning; the point isn't stated | Tell them what to infer toward |
| **Structure** | Unfamiliar organisation | Say which parts to read and in what order |
| **Language conventionality** | Register — archaic, legalistic, heavy passive | Warn them; give one decoded example |
| **Knowledge demands** | Assumes background they lack | Supply the missing premise up front |

Example: an economics paper is quantitatively hard but **structurally** rescuable — abstract and
conclusion carry the finding. A government report is quantitatively moderate but blocked by
**language conventionality**. Different problems, different guidance.

**Scaffold the reader, not the text** (Fisher & Frey, 2012). Never simplify or paraphrase the source
into the card — support access to it. Simplification removes the thing they came for.

---

## Vocabulary tiers

Flag separately (Beck et al., 2013):

- **Tier 2** — high-utility academic words that transfer across subjects (*incidence*, *pass-through*,
  *offset*, *mechanism*). **Worth teaching.** Name them; they compound.
- **Tier 3** — technical terms specific to this topic (*tariff*, *importer*, *customs duty*).
  **Just gloss them.** One sentence each, no ceremony.

---

## Cards without sources

Scope and Stake cards frequently need no new reading — they run on what earlier cards established.
Set `source_ref: none`, set `check_first: N/A`, and say plainly in `level` that this is thinking time
rather than reading time. These are often the best dinner-table cards.
