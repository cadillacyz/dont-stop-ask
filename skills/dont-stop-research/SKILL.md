---
# AGENT SKILLS STANDARD FIELDS (v2)
name: dont-stop-research
description: "Turn a rough research topic into a sharpened question plus a set of source-backed questions that teach you how to investigate it. Produces a reusable question-set artifact, a machine-readable JSON graph, and a companion briefing. For anyone doing real research — self-directed, or supporting someone else. Use when a question is worth investigating properly rather than skimming."
disable-model-invocation: false
user-invocable: true
effort: high

# PROJECT FIELDS

skill_id: "dont-stop-ask/dont-stop-research"
skill_name: "Don't Stop Research — Reference-Backed Question Sets"
project: "dont-stop-ask · 不停问"
domain: "research-literacy"
version: "1.0"
audience: "anyone investigating a question"
evidence_strength: "moderate"
evidence_sources:
  - "Wineburg & McGrew (2017, 2019) — Lateral reading and the nature of expertise"
  - "Caulfield (2019) — SIFT: the four moves (Stop, Investigate, Find better coverage, Trace claims)"
  - "Breakstone et al. (2021) — Students' civic online reasoning: a national portrait"
  - "Ji et al. (2023) — Survey of hallucination in natural language generation"
  - "Paul & Elder (2008) — The Miniature Guide to Critical Thinking Concepts and Tools"
  - "Nystrand et al. (1997) — Opening Dialogue: authentic questions and their effects on engagement"
  - "Reisman (2012) — Reading like a historian: a document-based curriculum intervention"
  - "Pressley et al. (1992) — Encouraging mindful use of prior knowledge: elaborative interrogation"
  - "Woloshyn et al. (1994) — Elaborative interrogation and prior knowledge effects"
  - "Shanahan et al. (2012) — An analysis of text complexity progression in CCSS"
  - "Beck et al. (2013) — Bringing Words to Life: robust vocabulary instruction"
  - "Bargh & Schul (1980) — On the cognitive benefits of teaching"
  - "Roscoe & Chi (2007) — Understanding tutor learning: knowledge-building vs knowledge-telling"
  - "Chin (2007) — Teacher questioning in science classrooms"
  - "Wiggins & McTighe (2005) — Understanding by Design"
  - "Bjork et al. (2013) — Self-regulated learning: beliefs, techniques, and illusions"
input_schema:
  required:
    - field: "research_question"
      type: "string"
      description: "The topic or rough question, in whatever words come naturally. Deliberately accepts vague input — sharpening it is Stage 0's job."
  optional:
    - field: "context"
      type: "string"
      description: "Who this is for and what they already know. Strongly recommended: it sets the prior-knowledge floor, which determines whether the hard questions are answerable at all. e.g. 'I work in logistics, comfortable with economics, no background in trade policy' or 'for a study group, mixed backgrounds'."
    - field: "purpose"
      type: "string"
      description: "Why the question is being asked, and any deadline — an essay, a decision at work, a policy brief, or plain curiosity. Drives scope calibration."
    - field: "prior_topics"
      type: "string"
      description: "Topics previously explored, with concept tags. Enables correlation on re-entry."
    - field: "output_dir"
      type: "string"
      description: "Where the three output files are written. Default: ./question-sets/ relative to the current working directory."
    - field: "set_size"
      type: "integer"
      description: "Maximum number of cards. Ceiling 9, not a target — generate fewer when the next card would be padding or only loosely related to the working question."
    - field: "mode"
      type: "string"
      description: "solo (default) or guided. In guided mode a second person is supporting the research and the briefing is addressed to them. In solo mode the briefing is addressed to the researcher's own later self and carries a spoiler warning."
    - field: "expand_from"
      type: "string"
      description: "Path to an existing question-set JSON plus a node id, when growing an existing graph rather than starting one. Format: <path>#<node-id>. See STAGE 4."
output_schema:
  type: "object"
  fields:
    - field: "question_set_artifact"
      type: "file"
      description: "The canonical artifact per shared/question-set.schema.md — triage record, cards with visibility flags, source inventory, provenance."
    - field: "question_set_json"
      type: "file"
      description: "The same set as machine-readable JSON per schema/question-set.schema.json, carrying visibility:both fields only. This is what the graph viewer renders."
    - field: "companion_briefing"
      type: "file"
      description: "Rendered from the artifact per shared/briefing-format.md — layered so a reader with five minutes can still act."
teacher_time: "5 min to act · 15 min to read in full"
tags: ["research-literacy", "question-generation", "source-literacy", "lateral-reading", "inquiry", "self-directed-learning"]
---

# Don't Stop Research — Reference-Backed Question Sets

## What This Skill Does

Takes a rough research topic and produces **three files**: a human-readable **question-set
artifact**, a machine-readable **JSON graph** of the same set, and a **companion briefing** rendered
from the artifact.

The set contains a sharpened version of the question (with an explicit account of why the original
wouldn't have worked), up to nine questions that open the sharpened question up, each anchored to
**one to three ranked readings** that are real and verified, each carrying a lateral-reading move to
run *before* reading, and each carrying the answers a reader is likely to reach for first. It also
carries three **teach-back questions** — askable by anyone with no subject knowledge, each tagged
with which cards it tests.

It does not answer its own questions, and it does not write the essay, the brief, or the memo.

**Who this is for.** Anyone with a question worth investigating properly: someone writing a paper,
someone making a decision at work, someone who read one article and wants to know whether it was
true, a study group, a journalist, a curious person on a Sunday. It works self-directed
(`mode: solo`) or with a second person supporting the research (`mode: guided`) — a teacher, mentor,
manager, study partner, or parent.

**Why three files.** The artifact is the canonical record. The JSON is the same set with the spoiler
fields stripped, so the graph viewer can render it without handing over the answers. The briefing is
the prose companion. All three are generated in one pass, so a single card is cheap to regenerate.
See `shared/question-set.schema.md` for the artifact and `schema/question-set.schema.json` (repo
root) for the JSON.

**The briefing is layered, not short.** A reader with five minutes reads the first section and can
act; a reader with more gets the full card set below it. Structure is in `shared/briefing-format.md`.

The design inverts the usual research-assistant pattern. A research assistant verifies sources
silently on your behalf, because you already know how. Here the verification *is* the point, so every
judgment the tool could make for you is instead handed back as a move for you to perform.

## Evidence Foundation

**Question quality determines inquiry quality.** Reisman (2012) built a document-based curriculum
around central questions and found significant gains in disciplinary thinking, factual knowledge, and
reading comprehension. Questions with a single retrievable answer produce retrieval; purely
evaluative questions produce assertion. Both feel like research. Nystrand et al. (1997) identified
*authentic* questions — where the asker has no predetermined answer — as the strongest single
predictor of genuine engagement, which makes the Socratic/leading distinction a design constraint
rather than a stylistic preference.

**Source evaluation fails at every level of expertise, and the fix is behavioural.** Wineburg &
McGrew (2017, 2019) found professional fact-checkers reach correct verdicts on unfamiliar sources in
about 93 seconds by reading *laterally* — leaving the page to see what independent sources say — while
students **and university professors** read *vertically*, hunting on-page cues that are trivially
manufactured. The vertical readers took over five minutes and were wrong more often. That the
professors failed too is the reason this skill is not scoped to any age or education level: subject
expertise does not confer source-evaluation skill. Breakstone et al. (2021) documented the same
deficit at population scale. Caulfield (2019) made the fix teachable as SIFT. Hence Rule 3: source
guidance is a move the reader performs, never a verdict they receive.

**AI citations require source reconstruction, not source investigation.** Ji et al. (2023) documented
hallucination types in language generation. SIFT's "Investigate the source" assumes an institutional
author with funding and an editorial board; an LLM has none. What replaces it: *does this source
exist, and does it say what was claimed?* The most dangerous hallucinations are the most plausible —
a real author, a real journal, a real-sounding year, and a study that never existed.

**Explanation-generation is where the learning is.** Pressley et al. (1992) found answering "why?"
substantially outperformed re-reading (d ≈ 0.59) because generating an explanation builds retrieval
pathways. Woloshyn et al. (1994) qualified it: elaboration requires enough prior knowledge to
generate a plausible explanation. This is why `context` matters as an input at every level of
expertise — the floor moves, but it never disappears.

**Explaining it to someone else is a test you cannot fake.** Bargh & Schul (1980) demonstrated the
protégé effect; Roscoe & Chi (2007) distinguished *knowledge-telling* from *knowledge-building* and
found only the latter produces gains. Hence the teach-back questions: a fluent recitation and a real
understanding sound different, and the difference is audible to a listener who knows nothing about
the topic.

**Reading level is not one number.** Shanahan et al. (2012): quantitative measures alone mislead
badly. A source can be quantitatively simple and impassable because of what it assumes.

**The AI boundary sits where the cognitive work is.** Wiggins & McTighe (2005) backward design: ask
not "is AI helpful?" but "does this bypass the cognitive work the task exists to produce?" Bjork et
al. (2013) documented illusions of competence — AI-assisted work feels complete while the learning is
skipped. This applies with full force to expert users, who are better at producing fluent output and
therefore better at fooling themselves.

## Requirements

This skill **must** run in an environment with live web search. Rule 1 (never fabricate a source) is
not satisfiable from model memory alone — every citation is confirmed by search before it enters the
set. If web search is unavailable, stop and say so rather than generating an unverified set.

## Input

The researcher provides the topic in their own words. *e.g. "how do tariffs actually work?"* Vague
input is expected — sharpening it is Stage 0's job.

Strongly recommended: **context** — what they already know, and why they're asking. *e.g. "I work in
logistics, comfortable with basic economics, no background in trade policy; want to understand the
news properly."* The set is materially better with it, because the prior-knowledge floor for
elaboration is a real constraint at every level of expertise (Woloshyn et al., 1994).

Optional: purpose and deadline, prior topics, output directory, set size, mode, expand-from.

## Prompt

```
You are an expert in inquiry design, source literacy, and self-directed research
instruction, with deep knowledge of Reisman (2012), Nystrand et al. (1997), Wineburg &
McGrew (2017, 2019), Caulfield (2019), Ji et al. (2023), Paul & Elder (2008), Pressley et
al. (1992), Shanahan et al. (2012), and Roscoe & Chi (2007).

You are writing for a capable adult reader who may have NO knowledge of this subject, and
who may be either the researcher themselves or someone supporting them. Assume
intelligence; assume nothing about domain background.

── LOAD THE SHARED CORE FIRST ──────────────────────────────────────────
Read these from THIS SKILL'S OWN DIRECTORY before generating anything. They are
authoritative; nothing below overrides them.

  shared/absolute-rules.md       the five rules + visibility conventions
  shared/question-ladder.md     the seven types and weighting
  shared/card-format.md         card fields, access tiers, complexity, difficulty, vocab tiers
  shared/question-set.schema.md the artifact you must produce
  shared/briefing-format.md     the briefing you must render (Stage 2)

Also read, from the repository root:

  schema/question-set.schema.json  the JSON you must emit in Stage 3

── PARAMETERS ──────────────────────────────────────────────────────────
  ladder_types:      all 7, every one present at least once
  set_size:          {{set_size — up to 9. A ceiling, not a target: stop when the next
                     card would be padding or unrelated. Six strong cards beat nine thin
                     ones, provided every ladder type still appears.}}
  readings_per_card: 1–3, ranked (see READINGS PER CARD in Stage 1)
  access_tier_lead:  T1. A capable reader can get what they need from a paper's abstract,
                     introduction, and conclusion even when the middle is beyond them —
                     say so in `level` when true.
  calibration:       Set the reading level and the amount of supplied background from
                     {{context}}, NOT from an assumed age or education level. Where
                     context is thin, pitch at an intelligent general reader with no
                     domain background, and say in the briefing that the set would be
                     sharper with context supplied.
  source_literacy:   method quality, sample, funding, primary vs. secondary
  initiative:        the researcher proposes, the skill pushes back
  mode:              {{mode — solo (default) or guided}}
  language:          MATCH THE QUESTION. If the question is asked in Chinese, the cards,
                     triage record, teach-back block, and briefing are written in Chinese;
                     same for any other language. Structure stays ASCII regardless: field
                     names, ids (Q1, S1, TB1), enum values (core, easy, confirmed…), and
                     the filename slug (romanize the topic — pinyin for Chinese). Sources
                     may be in the question's language, English, or both — verified by
                     search exactly the same way, and when a reading's language differs
                     from the card's, say so in `level` (reading an English paper is a
                     named difficulty like any other). Do not force sources into the
                     question's language: on many topics the strongest literature is in
                     English, and SAYING that is more useful than hiding it.
────────────────────────────────────────────────────────────────────────

INPUTS

**Research question (as stated):** {{research_question}}
**Context:** {{context}} — if not provided, pitch at an intelligent general reader with no
domain background, and say so in the briefing.
**Purpose:** {{purpose}} — if not provided, assume personal curiosity with no deadline, and
scope accordingly.
**Prior topics:** {{prior_topics}} — if provided, check for genuine conceptual overlap. If
there is real overlap, name it in the header. Do not force a connection that isn't there.
**Mode:** {{mode}} — if not provided, assume solo.
**Output directory:** {{output_dir}} — default ./question-sets/
**Expand from:** {{expand_from}} — if provided, skip to STAGE 4.

═══════════════════════════════════════════════════════════════════════
STAGE 0 — QUESTION TRIAGE (before generating anything)
═══════════════════════════════════════════════════════════════════════

Evaluate the question AS STATED against six criteria:

1. Evidence-dependent — does answering it REQUIRE sources, or could a reasonably informed
   person answer it from general knowledge?
2. Genuinely contested — can two careful people examine the same evidence and reach
   different, equally defensible conclusions?
3. Specific — anchored to particular actors, cases, and evidence, or so broad it needs a
   book?
4. Skill-demanding — does it force weighing and judgment, or just collection?
5. Appropriately scoped — answerable with a source set this reader can get through in the
   time available?
6. Engaging and clear — is the framing one the researcher will actually want to pursue?

Produce numbered THREATS (specific; generic criticism is useless), a REVISED QUESTION, and a
plain statement of WHAT CHANGED AND WHY. If the original is already strong, say so and
explain why rather than revising for the sake of it.

Broad topic questions ("What's the impact of X?") almost always fail criteria 1, 2, and 3 at
once: they invite a list rather than an argument, and a list can be produced without opening
a source. The characteristic fix is to narrow to a specific disputed sub-question that forces
a position — ideally one that sits on top of what the researcher already knows.

Generate Stage 1 against the REVISED question.

═══════════════════════════════════════════════════════════════════════
STAGE 1 — GENERATE THE ARTIFACT
═══════════════════════════════════════════════════════════════════════

Produce the question set per shared/question-set.schema.md. Ladder coverage and weighting per
shared/question-ladder.md. Card fields, tiers, difficulty, and complexity per
shared/card-format.md. All five absolute rules apply.

VERIFY EVERY SOURCE BY SEARCH BEFORE IT ENTERS THE INVENTORY. Confirm title, author, year,
venue, and that the source supports the claim attached to it. Record `verified` and
`verified_how` honestly. An `unconfirmed` entry with a clear `unconfirmed_detail` is a
correct outcome; a confidently fabricated citation is a total failure of the artifact.

READINGS PER CARD — each card carries ONE TO THREE readings, never exactly-one by default
and never more than three. `source_ref` is a ranked list; every entry declares a role:

  - `primary`    — the reading that card exists to make the reader open. Exactly one.
  - `supporting` — a second account that complicates, corroborates, or contradicts the
                   primary. Zero or one.
  - `background` — orientation only (a chart, a timeline, a glossary-grade explainer).
                   Zero or one.

A single-reading card is legitimate ONLY when the card says why one suffices (e.g. a
thinking-only card, or a primary so central that a second reading would dilute it).
Ranking is by relevance to THIS card's question, not by source quality — a T2 explainer
can outrank a T1 paper on an orientation card. Every entry, whatever its role, obeys
Rule 1: verified before it enters the inventory. Reuse of an inventory source across
cards under different roles is encouraged, not duplication — and in the graph viewer that
reuse is what makes load-bearing sources visible.

RELEVANCE GROUPS — every card carries `relevance_group`, assigned by how directly the card
bears on the working question:

  - `core`       — answers the working question directly; the set fails without it
  - `supporting` — establishes definitions, evidence, or method the core cards depend on
  - `context`    — scope, stakes, implications; valuable but one step removed

Groups are about the QUESTION's distance from the working question, not difficulty. An
empty `context` group is a finding about the topic, not a failure of the set.

DIFFICULTY — every card also carries `difficulty`: `easy`, `middle`, or `technical`, per
the definitions in shared/card-format.md. This is a coarse three-way rating for sorting
and colour-coding, and it does NOT replace `level`, which must still name the primary
complexity challenge in prose. Difficulty is judged RELATIVE TO {{context}}: a card that
is `technical` for a general reader may be `easy` for a specialist, and the rating must
reflect the actual reader.

ALSO GENERATE THE TEACH-BACK BLOCK — three questions, per the `teach_back` schema in
question-set.schema.md. These get asked after the reading, and they must survive the
NO-KNOWLEDGE TEST: someone who has never heard of this topic must be able to ask the
question and follow the shape of the answer with no card in front of them. If asking it
requires reading a source first, it is a card, not a teach-back question.

For each: the question; the knowledge-TELLING signature (recitation — fluent,
textbook-shaped, over quickly); the knowledge-BUILDING signature (own example, a
distinction drawn, uncertainty admitted) per Roscoe & Chi (2007); one follow-up for when
the answer stalls or recites; and `anchors` naming which cards it actually tests.

WEIGHT THEM ACROSS THE SET, not at the easy end — one on the opener, one on the Mechanism
work, one on the Tension card. If all three can be answered from Q1, nothing downstream
of Q1 is observable.

Write to: {{output_dir}}/question-set-[topic-slug]-[YYYY-MM-DD].md
Set `status: draft`.

═══════════════════════════════════════════════════════════════════════
STAGE 2 — RENDER THE COMPANION BRIEFING
═══════════════════════════════════════════════════════════════════════

SECTION ORDER, LAYERING, AND WRITING RULES ARE IN shared/briefing-format.md.
Follow it exactly, including its closing self-check. Do not invent a section order
here and do not restate its rules.

ADDRESS IT ACCORDING TO {{mode}}:

  - `guided` — address the companion (teacher, mentor, manager, study partner, parent).
    They may know nothing about the subject; say so explicitly and mean it.
  - `solo` — address the researcher's own later self. Same content, plus the SPOILER
    WARNING at the top of Section 0: sections 1 and 6 carry the anticipated answers, and
    reading them before working the cards spoils the inquiry the way reading a puzzle's
    solution does. Tell them to come back to those sections afterwards.

Render FROM the artifact. Every fact in the briefing comes from the artifact — including
the three teach-back questions, which are rendered VERBATIM from the `teach_back` block
and never regenerated.

What this skill must supply that the format file cannot, because it is topic-specific:

**The one tell** (§0c) — the single most reliable observable signal for THIS topic,
derived from the hardest card. Specific enough that a reader recognises it when they hear
it, or catches themselves doing it — not a restatement of the general principle.

**Engagement tells** (§2) — each anchored to a named card or source. "Every source seems
to agree — a sure sign Q6 wasn't opened, because it directly conflicts with Q4" is
usable. "They seem engaged" is not.

**The glossary** (§3) — 6–8 words that will show up IN THE ANSWER and lose a listener who
does not know the field. Drawn from the answers, not from the sources.

**Checking our homework** (§7) — name the `unconfirmed` entry and say to start there.
Add any topic-specific failure mode: on technical topics, plausible-sounding NUMBERS
that propagate detached from their source are a worse risk than fabricated citations,
and the reader should be told so plainly.

**The boundary table** (§8) — built for THIS piece of work, following the actual
temptation. With a deadline it is "get it written." Without one it is "get it explained
to me" — subtler, and it needs naming explicitly.

Write to: {{output_dir}}/research-briefing-[topic-slug]-[YYYY-MM-DD].md

═══════════════════════════════════════════════════════════════════════
STAGE 3 — EMIT THE JSON GRAPH
═══════════════════════════════════════════════════════════════════════

Emit the same set as JSON conforming to schema/question-set.schema.json, written to:

  {{output_dir}}/question-set-[topic-slug]-[YYYY-MM-DD].json

THE JSON IS THE WORKING SURFACE — what the graph viewer renders, and what the researcher
looks at while doing the work. Therefore:

  - Include ONLY `visibility: both` fields. NEVER emit `why_this`, `they_might_say`, or
    the teach-back `telling_signature` / `building_signature` / `follow_up`. Those are
    anticipated answers and design rationale: emitting them turns the working surface into
    an answer key and breaks Rule 2 through the back door. This holds in solo mode too —
    the person being spoiled is then the researcher themselves.
  - The teach-back `question` text MAY be included; its signatures MUST NOT.
  - Every source carries `verified`, and any `unconfirmed` source carries
    `unconfirmed_detail`. These never drop out — a viewer must be able to show the
    warning next to the card that depends on it.
  - `parent` on every question node: the working question's id (`root`) for a first-pass
    set, or the id of the node being expanded (STAGE 4).

Validate mentally against the schema before writing: required fields present, `difficulty`
and `relevance_group` from the allowed enums, every `source_ref` id resolving to a real
entry in `sources`, no orphan sources.

═══════════════════════════════════════════════════════════════════════
STAGE 4 — EXPANSION (when {{expand_from}} is supplied)
═══════════════════════════════════════════════════════════════════════

Growing an existing graph rather than starting one. Read the JSON at the given path, find
the node id after the `#`, and treat THAT NODE'S QUESTION as the working question for a
fresh Stage 1.

  - Skip Stage 0's six-criteria triage: the node's question already passed it when the
    parent set was generated. Record in the expansion header that triage was inherited.
    If the node's question is a thinking-only card with no source, it is still a valid
    expansion root.
  - Run the full ladder again within the cluster. Up to nine cards, same ceiling rule.
  - REUSE the existing source inventory wherever a source genuinely serves a new card.
    Re-verification is not required for a source already marked `confirmed` in the file
    being expanded, unless it is older than six months or marked `unconfirmed`. New
    sources are verified as normal.
  - Give new cards ids that do not collide: prefix by generation (E1…E9 for the first
    expansion, F1…F9 for the next, and so on), and set `parent` to the expanded node's id.
  - APPEND to the existing artifact under an `## Expansion — <node id> (<date>)` heading,
    and write a NEW JSON containing the union of old and new nodes. Never drop existing
    nodes: the graph is cumulative, and a viewer reloading the file must see the whole
    accumulated set.
  - `relevance_group` on new cards is relative to the CLUSTER's question, not the original
    root. Say so in the expansion header, or the groups will read as inconsistent.

**Self-check before returning output:** (a) every source verified by search, none
invented; (b) no question answered anywhere in any file; (c) every source note is a
move, not a verdict; (d) no leading cards — each admits multiple defensible answers;
(e) no disguised recall; (f) at least one Type 4 card presents a real disagreement at
its strongest, or the absence of one is stated explicitly; (g) all seven ladder types
present; (h) every source reachable, or marked and paired with an alternative;
(i) `level` names the primary complexity challenge, not just a rating; (j) `visibility`
flags set on `why_this`, `they_might_say`, and the teach-back signatures; (k) all three
teach-back questions askable with zero subject knowledge, with `anchors` spread across
the set; (l) the briefing passes the self-check at the end of briefing-format.md, and
carries the spoiler warning if mode is solo; (m) the JSON validates against
schema/question-set.schema.json and contains NO spoiler field.
```

## Output

Three files in `{{output_dir}}`:

| File | Who reads it | Contains |
|---|---|---|
| `question-set-<slug>-<date>.md` | whoever reviews the set | everything, including the anticipated answers |
| `question-set-<slug>-<date>.json` | the graph viewer | `visibility: both` fields only |
| `research-briefing-<slug>-<date>.md` | the companion, or your later self | layered briefing rendered from the artifact |

The artifact ships `status: draft`. In guided mode, moving it to `reviewed` is the handshake that
someone has looked the set over. In solo mode it simply marks a set you have not yet checked.

## Example Output

A complete worked example — a nine-card set on US–China tariffs, expanded once into a seven-card
cluster, with sixteen questions and fourteen verified sources — ships in this repository at
`examples/us-china-tariffs/`. It includes one honestly-marked `unconfirmed` source, which is what a
correct outcome looks like when a figure cannot be traced to its primary document.

The briefing's first screen is the whole point of the layered format — a reader who gets only that
far can already act:

> # Research Briefing: Did the US–China Tariffs Reroute World Trade — or Shrink It?
>
> ## The 10-Minute Version
>
> **What this is chasing:** when America taxes Chinese goods, does the world's trade find a new
> route — through Vietnam, Mexico, Taiwan — or does some of it just disappear, and who ends up
> better off?
>
> | | Your job | Time |
> |---|---|---|
> | ☐ | Read this box, then skim the next two sections | 5 min |
> | ☐ | Spot-check source S7 — we've flagged it and said why | 2 min |
> | ☐ | Ask the three questions below, once, whenever suits | 10 min |
>
> **The one tell: whoever can say whether "dependence on China" went down or just went underground —
> and admit the answer is genuinely unclear — did the hard reading.**

## Known Limitations

1. **The evidence base is strong for the components and novel for the assembly.** Lateral reading,
   elaborative interrogation, central-question design, and learning-by-teaching are each
   well-evidenced independently. Combining them into a source-anchored question graph is a principled
   construction, not a validated intervention. Treat the composition as a reasoned bet.

2. **Source verification is only as good as the search behind it.** The skill confirms a source
   exists and that its abstract or summary supports the attached claim; it cannot read paywalled
   full text, and it can be defeated by a source that is real, well-indexed, and wrong. "Checking
   Our Homework" exists because this limitation is structural, not incidental.

3. **The set is only as good as the topic's literature.** For well-studied contested topics the
   Tension card writes itself. Where no live expert disagreement exists, or the disagreement is
   political rather than empirical, Type 4 degrades into false balance. The skill is instructed to
   say so rather than manufacture controversy, but detecting the difference is a judgment it can get
   wrong.

4. **Difficulty and reading level are calibrated from a free-text `context` field.** That is a real
   improvement on assuming an age, but it is still a guess made from one paragraph. A specialist who
   describes themselves modestly gets a set pitched too low, and vice versa. Say more in `context`
   than feels necessary.

5. **In solo mode the spoiler boundary is self-enforced.** The JSON withholds the anticipated
   answers, but the artifact and the briefing contain them, and nothing stops you reading ahead. The
   briefing warns you; that is all it can do.

6. **It cannot tell whether anyone read anything.** The engagement indicators and teach-back
   questions are diagnostic aids for a conversation. The boundary map changes incentives and makes
   gaps visible when you try to explain yourself out loud; it enforces nothing.

7. **The briefing is long — it is layered rather than short.** The actionable sections sit above the
   explanatory ones, so a reader who stops at 20% has the part that matters. The failure mode this
   does *not* fix: someone who reads the first screen may believe they have read the briefing, and
   will not know which source needs checking unless the front block names it. It does name it, but
   that is one line carrying a lot of weight.

8. **Expansion inherits its parent's triage.** Stage 4 skips the six-criteria check on the
   assumption that the node's question already passed it. That holds for cards the skill generated;
   it does not hold if a human hand-edited the JSON to insert a question. Expanding a hand-edited
   node can therefore produce a cluster built on a weak question.

9. **There is no content policy for sensitive topics.** The skill will build a question set on
   anything, calibrated only by `context`. For an adult researching their own question, that is
   appropriate. If it is used *with a young person* — which `mode: guided` supports and which this
   project grew out of — then choosing the topic and reviewing the sources before they are handed
   over remains the adult's job, and the skill does not do it for you.
