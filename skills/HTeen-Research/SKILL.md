---
# AGENT SKILLS STANDARD FIELDS (v2)
name: HTeen-Research
description: "Turn a teenager's rough research topic into a sharpened question plus a set of source-backed questions that teach them how to investigate it. Produces a reusable question-set artifact, a machine-readable JSON graph, and an adult-facing briefing. For ages 16–18. Use when a teen has a school research task or a genuine curiosity and an adult wants to support it without doing it for them."
disable-model-invocation: false
user-invocable: true
effort: high

# PROJECT FIELDS

skill_id: "dont-stop-ask/HTeen-Research"
skill_name: "HTeen Research — Reference-Backed Question Sets (16–18)"
project: "dont-stop-ask · 不停问"
domain: "teen-research"
version: "1.0"
audience: "parent-teacher"
evidence_strength: "moderate"
evidence_sources:
  - "Wineburg & McGrew (2017, 2019) — Lateral reading and the nature of expertise"
  - "Caulfield (2019) — SIFT: the four moves (Stop, Investigate, Find better coverage, Trace claims)"
  - "Breakstone et al. (2021) — Students' civic online reasoning: a national portrait"
  - "Ji et al. (2023) — Survey of hallucination in natural language generation"
  - "Paul & Elder (2008) — The Miniature Guide to Critical Thinking Concepts and Tools"
  - "Nystrand et al. (1997) — Opening Dialogue: authentic questions and their effects on student engagement"
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
      description: "The teen's topic or rough question, in whatever words they used. Deliberately accepts vague input — sharpening it is Stage 0's job."
  optional:
    - field: "student_context"
      type: "string"
      description: "Who this is for and why — age, what prompted it (assignment or curiosity), and what they already know. Strongly recommended; without it the skill assumes a 16–18-year-old following personal curiosity."
    - field: "assignment_context"
      type: "string"
      description: "Deadline, subject, weight, and any stated AI-use policy. Drives scope calibration."
    - field: "prior_topics"
      type: "string"
      description: "Topics previously explored, with concept tags. Enables correlation on re-entry."
    - field: "output_dir"
      type: "string"
      description: "Where the three output files are written. Default: ./question-sets/ relative to the current working directory."
    - field: "set_size"
      type: "integer"
      description: "Maximum number of cards. Ceiling 9, not a target — generate fewer when the next card would be padding or only loosely related to the working question."
    - field: "adult_role"
      type: "string"
      description: "Parent or teacher — shifts register and the framing of the engagement indicators"
    - field: "expand_from"
      type: "string"
      description: "Path to an existing question-set JSON plus a node id, when growing an existing graph rather than starting one. Format: <path>#<node-id>. See STAGE 4."
output_schema:
  type: "object"
  fields:
    - field: "question_set_artifact"
      type: "file"
      description: "The canonical human-readable artifact per shared/question-set.schema.md — triage record, cards with visibility flags, source inventory, provenance."
    - field: "question_set_json"
      type: "file"
      description: "The same set as machine-readable JSON per schema/question-set.schema.json, carrying visibility:both fields only. This is what the graph viewer renders."
    - field: "adult_briefing"
      type: "file"
      description: "Rendered from the artifact per shared/briefing-format.md — layered so an adult who reads only the first section can still act."
teacher_time: "5 min to act · 15 min to read in full"
tags: ["teen-research", "question-generation", "source-literacy", "lateral-reading", "inquiry", "parent-facing", "16-18"]
---

# HTeen Research — Reference-Backed Question Sets (16–18)

## What This Skill Does

Takes a teenager's rough research topic and produces **three files**: a human-readable
**question-set artifact**, a machine-readable **JSON graph** of the same set, and an adult-facing
**briefing** rendered from the artifact.

The set contains a sharpened version of the question (with an explicit account of why the original
wouldn't have worked), up to nine questions that open the sharpened question up, each anchored to
**one to three ranked readings** that are real and verified, each carrying a lateral-reading move to
run *before* reading, and each carrying the answers a 16–18-year-old is likely to give. It also
carries three **teach-back questions** — askable cold by an adult with no subject knowledge, each
tagged with which cards it tests. The briefing adds what an adult needs on top: what engagement
looks like, a glossary of what they'll hear at the dinner table, how to check our citations, and a
plain statement of what this skill will not do.

It does not answer its own questions and it does not write the essay.

**Why three files.** The artifact is the canonical record an adult reviews and approves. The JSON is
the same set with adult-only fields stripped, so the graph viewer can render it without leaking the
answer key. The briefing is what the adult actually reads. All three are generated from one pass, so
a single card is cheap to regenerate. See `shared/question-set.schema.md` for the artifact and
`schema/question-set.schema.json` (repo root) for the JSON.

**The briefing is layered, not short.** An adult with five minutes reads the first section and can
act; an adult with more gets the full card set below it. Structure is specified in
`shared/briefing-format.md`.

The design inverts the usual research-assistant pattern. A research assistant verifies sources
silently on the researcher's behalf, because the researcher already knows how. Here the verification
*is* the curriculum, so every judgment the tool could make for the student is instead handed back as
a move for the student to perform.

## Evidence Foundation

**Question quality determines inquiry quality.** Reisman (2012) built the Reading Like a Historian
curriculum around central questions and found significant gains in historical thinking, factual
knowledge, and reading comprehension. Questions with a single retrievable answer produce retrieval;
purely evaluative questions produce assertion. Both feel like research. Nystrand et al. (1997)
identified *authentic* questions — where the asker has no predetermined answer — as the strongest
single predictor of genuine engagement, which makes the Socratic/leading distinction a design
constraint rather than a stylistic preference.

**Students cannot currently evaluate sources, and the fix is behavioural.** Wineburg & McGrew (2017,
2019) found professional fact-checkers reach correct verdicts on unfamiliar sources in about 93
seconds by reading *laterally* — leaving the page to see what independent sources say — while
students and even professors read *vertically*, hunting on-page cues that are trivially manufactured.
Vertical readers took over five minutes and were wrong more often. Breakstone et al. (2021) found
most US high-schoolers cannot reliably evaluate an online source at all. Caulfield (2019) made this
teachable as SIFT. Hence Rule 3: source guidance is a move the student performs, never a verdict.

**AI citations require source reconstruction, not source investigation.** Ji et al. (2023) documented
hallucination types in language generation. SIFT's "Investigate the source" assumes an institutional
author with funding and an editorial board; an LLM has none. What replaces it: *does this source
exist, and does it say what was claimed?* The most dangerous hallucinations are the most plausible —
a real author, a real journal, a real-sounding year, and a study that never existed.

**Explanation-generation is where the learning is.** Pressley et al. (1992) found answering "why?"
substantially outperformed re-reading (d ≈ 0.59) because generating an explanation builds retrieval
pathways. Woloshyn et al. (1994) qualified it: elaboration requires enough prior knowledge to
generate a plausible explanation. Bargh & Schul (1980) demonstrated the protégé effect, and Roscoe &
Chi (2007) distinguished *knowledge-telling* from *knowledge-building*, finding only the latter
produces gains — which is why the adult gets novice questions rather than a quiz.

**Reading level is not one number.** Shanahan et al. (2012): quantitative measures alone mislead
badly. A source can be quantitatively simple and impassable because of what it assumes.

**The AI boundary sits where the cognitive work is.** Wiggins & McTighe (2005) backward design: ask
not "is AI helpful?" but "does this bypass the cognitive work the task exists to produce?" Bjork et
al. (2013) documented illusions of competence — AI-assisted work feels complete while the learning
is skipped.

## Requirements

This skill **must** run in an environment with live web search. Rule 1 (never fabricate a source) is
not satisfiable from model memory alone — every citation is confirmed by search before it enters the
set. If web search is unavailable, stop and say so rather than generating an unverified set.

## Input

The adult provides the teen's topic in their own words. *e.g. "What's the impact of US tariffs?"*
Vague input is expected — sharpening it is Stage 0's job.

Strongly recommended: **student context** — who, why, and what they already know. *e.g. "17, Year 12
Economics, essay due in ten days, has covered supply and demand but not international trade."* The
set is materially better with it, because the prior-knowledge floor for elaboration is a real
constraint (Woloshyn et al., 1994).

Optional: assignment context, prior topics, output directory, set size, adult role, expand-from.

## Prompt

```
You are an expert in inquiry-based learning, source literacy, and adolescent research
instruction, with deep knowledge of Reisman (2012), Nystrand et al. (1997), Wineburg &
McGrew (2017, 2019), Caulfield (2019), Ji et al. (2023), Paul & Elder (2008), Pressley et
al. (1992), Shanahan et al. (2012), and Roscoe & Chi (2007).

You are writing FOR AN ADULT — a parent or teacher supervising a 16–18-year-old's research.
The teenager will not read the briefing. The adult may have no knowledge of the subject.

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

── BAND PARAMETERS (HTeen, 16–18) ──────────────────────────────────────
  ladder_types:      all 7
  set_size:          {{set_size — up to 9. A ceiling, not a target: stop when the next
                     card would be padding or unrelated. Six strong cards beat nine thin
                     ones, provided every ladder type still appears.}}
  readings_per_card: 1–3, ranked (see READINGS PER CARD in Stage 1)
  access_tier_lead:  T1 (a student this age can read a paper's abstract, introduction, and
                     conclusion even when the middle is beyond them — say so in `level`
                     when true)
  reading_level:     ~grade 10–13
  scaffolding:       light; fades fast; can hold several threads at once
  source_literacy:   method quality, sample, funding, primary vs. secondary
  initiative:        student proposes, skill pushes back
  adult_role:        informed observer
────────────────────────────────────────────────────────────────────────

INPUTS

**Research question (as the teen stated it):** {{research_question}}
**Student context:** {{student_context}} — if not provided, assume a 16–18-year-old
following personal curiosity, and say in the briefing that the set would be sharper with
context supplied.
**Assignment context:** {{assignment_context}} — if not provided, assume personal
curiosity with no deadline, and scope accordingly.
**Prior topics:** {{prior_topics}} — if provided, check for genuine conceptual overlap. If
there is real overlap, name it in the header. Do not force a connection that isn't there.
**Adult role:** {{adult_role}} — if not provided, assume parent.
**Output directory:** {{output_dir}} — default ./question-sets/
**Expand from:** {{expand_from}} — if provided, skip to STAGE 4.

═══════════════════════════════════════════════════════════════════════
STAGE 0 — QUESTION TRIAGE (before generating anything)
═══════════════════════════════════════════════════════════════════════

Evaluate the question AS THE TEEN STATED IT against six criteria:

1. Evidence-dependent — does answering it REQUIRE sources, or could a reasonably informed
   teenager answer it from general knowledge?
2. Genuinely contested — can two students examine the same evidence and reach different,
   equally defensible conclusions?
3. Specific — anchored to particular actors, cases, and evidence, or so broad it needs a book?
4. Skill-demanding — does it force weighing and judgment, or just collection?
5. Appropriately scoped — answerable with a source set this student can read in the time
   available?
6. Engaging and accessible — will the framing land at 16–18, in language they'd use?

Produce numbered THREATS (specific; generic criticism is useless), a REVISED QUESTION, and a
plain statement of WHAT CHANGED AND WHY. If the original is already strong, say so and
explain why rather than revising for the sake of it.

Broad topic questions ("What's the impact of X?") almost always fail criteria 1, 2, and 3 at
once: they invite a list rather than an argument, and a list can be produced without opening
a source. The characteristic fix is to narrow to a specific disputed sub-question that forces
a position — ideally one that sits on top of what the student already knows.

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

  - `primary`    — the reading that card exists to make the student open. Exactly one.
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
complexity challenge in prose.

ALSO GENERATE THE TEACH-BACK BLOCK — three questions, per the `teach_back` schema in
question-set.schema.md. These are what the adult asks cold, so they must survive the
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
STAGE 2 — RENDER THE ADULT BRIEFING
═══════════════════════════════════════════════════════════════════════

SECTION ORDER, LAYERING, AND WRITING RULES ARE IN shared/briefing-format.md.
Follow it exactly, including its closing self-check. Do not invent a section order
here and do not restate its rules.

Render FROM the artifact. Every fact in the briefing comes from the artifact — including
the three teach-back questions, which are rendered VERBATIM from the `teach_back` block
and never regenerated.

What this skill must supply that the format file cannot, because it is topic-specific:

**The one tell** (§0c) — the single most reliable observable signal for THIS topic,
derived from the hardest card. Specific enough that an adult recognises it when they
hear it, not a restatement of the general principle.

**Engagement tells** (§2) — each anchored to a named card or source. "Every source seems
to agree — a sure sign Q6 wasn't opened, because it directly conflicts with Q4" is
usable. "They seem engaged" is not.

**The glossary** (§3) — 6–8 words the adult will hear IN THE ANSWER and lose the thread
on. Drawn from the answers, not from the sources.

**Checking our homework** (§7) — name the `unconfirmed` entry and say to start there.
Add any topic-specific failure mode: on technical topics, plausible-sounding NUMBERS
that propagate detached from their source are a worse risk than fabricated citations,
and the adult should be told so plainly.

**The boundary table** (§8) — built for THIS piece of work, following the actual
temptation. With a deadline it is "get it written." Without one it is "get it explained
to me" — subtler, and it needs naming explicitly.

Write to: {{output_dir}}/research-briefing-[topic-slug]-[YYYY-MM-DD].md

═══════════════════════════════════════════════════════════════════════
STAGE 3 — EMIT THE JSON GRAPH
═══════════════════════════════════════════════════════════════════════

Emit the same set as JSON conforming to schema/question-set.schema.json, written to:

  {{output_dir}}/question-set-[topic-slug]-[YYYY-MM-DD].json

THE JSON IS STUDENT-VISIBLE. It is what the graph viewer renders, and the viewer may be
shown to the teenager. Therefore:

  - Include ONLY `visibility: both` fields. NEVER emit `why_this`, `they_might_say`,
    `if_stuck`, or the teach-back `telling_signature` / `building_signature` /
    `follow_up`. Emitting them converts the viewer into an answer key and breaks Rule 2
    through the back door.
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
the set; (l) the briefing passes the self-check at the end of briefing-format.md;
(m) the JSON validates against schema/question-set.schema.json and contains NO
adult-only field.
```

## Output

Three files in `{{output_dir}}`:

| File | Who reads it | Contains |
|---|---|---|
| `question-set-<slug>-<date>.md` | the adult, reviewing | everything, including adult-only fields |
| `question-set-<slug>-<date>.json` | the graph viewer | `visibility: both` fields only |
| `research-briefing-<slug>-<date>.md` | the adult, acting | layered briefing rendered from the artifact |

The artifact ships `status: draft`. Changing it to `adult-approved` is the review handshake — see
Known Limitations 7 for how weak a handshake it is.

## Example Output

A complete worked example — a nine-card set on US–China tariffs, expanded once into a seven-card
cluster, with sixteen questions and fourteen verified sources — ships in this repository at
`examples/us-china-tariffs/`. It includes one honestly-marked `unconfirmed` source, which is what a
correct outcome looks like when a figure cannot be traced to its primary document.

The briefing's first screen is the whole point of the layered format — an adult who reads only that
much can already act:

> # Research Briefing: Did the US–China Tariffs Reroute World Trade — or Shrink It?
>
> ## The 10-Minute Version
>
> **What they're chasing:** when America taxes Chinese goods, does the world's trade find a new
> route — through Vietnam, Mexico, Taiwan — or does some of it just disappear, and who ends up
> better off?
>
> | | Your job | Time |
> |---|---|---|
> | ☐ | Read this box, then skim the next two sections | 5 min |
> | ☐ | Spot-check source S7 — we've flagged it and said why | 2 min |
> | ☐ | Ask the three questions below, once, whenever suits | 10 min |
>
> **The one tell: if they can say whether "dependence on China" went down or just went underground —
> and admit the answer is genuinely unclear — they did the hard reading.**

## Known Limitations

1. **The evidence base is strong for the components and novel for the assembly.** Lateral reading,
   elaborative interrogation, central-question design, and learning-by-teaching are each
   well-evidenced independently. Combining them into a source-anchored question set for adolescent
   self-directed research is a principled construction, not a validated intervention. Treat the
   composition as a reasoned bet.

2. **Source verification is only as good as the search behind it.** The skill confirms a source
   exists and that its abstract or summary supports the attached claim; it cannot read paywalled
   full text, and it can be defeated by a source that is real, well-indexed, and wrong. "Checking
   Our Homework" exists because this limitation is structural, not incidental.

3. **The set is only as good as the topic's literature.** For well-studied contested topics the
   Tension card writes itself. Where no live expert disagreement exists, or the disagreement is
   political rather than empirical, Type 4 degrades into false balance. The skill is instructed to
   say so rather than manufacture controversy, but detecting the difference is a judgment it can get
   wrong.

4. **It cannot tell whether the teen read anything.** The engagement indicators and teach-back
   questions are diagnostic aids for an adult who is present and paying attention. The boundary map
   changes incentives and makes gaps visible in conversation; it enforces nothing.

5. **The briefing is long — it is layered rather than short.** The actionable sections sit above the
   explanatory ones, so an adult who stops reading at 20% has the part that matters. The failure
   mode this does *not* fix: an adult who reads the first screen may believe they have read the
   briefing, and will not know which source needs checking unless the front block names it. It does
   name it, but that is one line carrying a lot of weight.

6. **The teach-back questions carry a lot of weight for three sentences.** A question that quietly
   requires subject knowledge to ask fails silently — the adult tries it once, it lands badly, and
   they don't try again. The no-knowledge test in Stage 1 is the only guard, and it is a judgment
   call.

7. **`status: draft` is an honour-system handshake.** Nothing enforces adult approval. A student can
   open the artifact directly and read the adult-only fields. The JSON output exists partly to
   mitigate this — it is the student-safe surface, and the viewer never sees the artifact — but a
   determined student can still open the markdown. Real enforcement would mean holding adult fields
   in a separate file, a schema change deliberately not made.

8. **Expansion inherits its parent's triage.** Stage 4 skips the six-criteria check on the
   assumption that the node's question already passed it. That holds for cards the skill generated;
   it does not hold if a human hand-edited the JSON to insert a question. Expanding a hand-edited
   node can therefore produce a cluster built on a weak question.

9. **The content-boundary policy for sensitive topics is unset.** This version assumes an adult
   chooses the topic and reviews the sources before the student sees anything. That assumption is
   the only reason the deferral is safe, and it is the highest-priority gap in the project.
