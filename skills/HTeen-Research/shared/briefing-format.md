# Adult Briefing — Format

The briefing is **rendered from the artifact**, not composed alongside it. Every fact in it comes
from `question-set-<slug>-<date>.md`. If something belongs in the briefing but has nowhere to live in
the artifact, that is a schema gap — fix the schema, do not invent the field here.

---

## The problem this format solves

The briefing serves two readers at once:

- a **parent with five minutes** who wants to know what to do, and
- a **teacher or a returning adult** who wants the reasoning and the full card set.

Earlier versions were structured for the second reader and were therefore unusable by the first. The
fix is **layering, not cutting**. Nothing is removed. The order changes so that an adult who stops
reading at 20% has already got the part that matters.

**The governing rule: actionable first, justifying last.** Anything the adult *does* goes above
anything that explains *why*.

---

## Section order — mandatory

| # | Section | For whom | Cut if short of time? |
|---|---|---|---|
| 0 | **The 10-Minute Version** | Parent | Never — this is the floor |
| 1 | **Three Questions You Can Ask** | Parent | Never |
| 2 | **What Good Engagement Looks Like** | Parent | Never |
| 3 | **Words You Might Hear** *(glossary)* | Parent | Never |
| 4 | **What We Changed About the Question** *(short form)* | Both | Never |
| 5 | **Sources at a Glance** | Both | Reference |
| 6 | **The Question Set** *(3 cards in full, rest summarised)* | Teacher | Reference |
| 7 | **Checking Our Homework** | Both | Reference |
| 8 | **What This Skill Will Not Do** | Both | Reference |
| 9 | **Appendix** — full triage record, evidence base, limitations | Teacher | Reference |

Sections 0–3 are **the briefing**. Sections 4–9 are **the manual**. Mark the boundary visibly in the
document with a horizontal rule and the line: *Everything below is reference. You do not need it to
start.*

---

## Section 0 — The 10-Minute Version

The single most important section. **Never longer than one screen.** Four parts, in this order:

**a. What they're actually chasing** — the working question in one plain sentence, no jargon, no
subordinate clauses. If it cannot be said in one sentence, the triage was not finished.

**b. Your three jobs, with honest time costs.** A checklist, formatted as a table. Times are real,
not aspirational:

| | Job | Time |
|---|---|---|
| ☐ | Read this box, then skim §1 and §2 | 5 min |
| ☐ | Spot-check one source (we say which) | 2 min |
| ☐ | Ask the three questions, once, whenever | 10 min |

**c. The one tell.** A single bolded sentence naming the most reliable observable signal for *this
topic*. Not a generic principle — something specific enough that the adult knows it when they hear
it. Derive it from the set's hardest card.

**d. Where to go next.** One line pointing at the reference half.

Nothing else. No citations, no pedagogy, no tier codes, no card numbers.

---

## Section 1 — Three Questions You Can Ask

Rendered directly from the artifact's `teach_back` block. **Do not regenerate them here** — they are
artifact content.

Render per question:

- The question itself, bolded, in quotation marks, exactly as it appears in the artifact
- *Telling:* — what recitation sounds like, with an example phrase in the student's voice
- *Building:* — what genuine understanding sounds like
- Where useful, one follow-up the adult can use if the answer stalls

Frame the adult as **a genuinely curious peer, not an examiner**, and say so in one line at the top.
Include the two standing notes: *"I still don't follow" beats a hint*, and **hedging is a good sign,
not a bad one**.

State plainly that these require **no subject knowledge to ask**. An adult who does not believe that
will not try them.

---

## Section 2 — What Good Engagement Looks Like

Three lists, always in this order:

1. **Signs they actually read it**
2. **Signs they skimmed**
3. **Signs it's going well even though it looks like it isn't**

The general principle, stated once: *a student who read the source can say something the source did
not say; one who skimmed can only restate the title.*

**Tells must be specific to THIS set.** "They seem engaged" is useless. "Every source seems to
agree — a sure sign Q6 wasn't opened, because it directly conflicts with Q4" is a tell an adult can
actually use. Derive each one from a named card or source.

List 3 is not optional and is not padding. Confusion at the hardest card is the **correct** response,
and an adult who does not know that will read the design working as the design failing.

---

## Section 3 — Words You Might Hear

Six to eight terms, one line each, chosen by a single criterion: **would the adult hear this word in
the dinner-table answer and lose the thread?**

- Draw from the *answers*, not from the sources. This is not the student's vocabulary list.
- Tier 3 terms (topic-specific) get a plain gloss.
- Tier 2 terms (transferable) get a gloss plus a note that it is worth the teen knowing properly.
- No etymology, no nuance, no hedging. One line.

This section is the difference between an adult who can follow the conversation and one who nods.

---

## Section 4 — What We Changed About the Question

The **short form** — numbered threats compressed to a bolded claim plus one sentence each, then
*What changed* in a short paragraph. Two hundred words, hard ceiling.

The full triage record goes in the appendix. Adults consistently find this the most interesting
section, which is exactly why the long version must not sit between them and section 0.

If the original question was already strong, say so here and explain why. Do not manufacture a
revision.

---

## Section 5 — Sources at a Glance

One table: source · tier · verified · time · what makes it hard.

- **Column header is "What makes it hard", never "primary complexity challenge."**
- Tier codes survive here and only here, with a one-line legend directly beneath the table:
  *T1 research paper or public institutional report · T2 named-author journalism or analysis ·
  T3 reference entry or textbook · T4 paywalled (always paired with something reachable).*
- Every `verified: unconfirmed` row carries ⚠ and is followed by a short paragraph saying **exactly
  what could not be confirmed and what to check**. Never silently dropped, never softened.
- Total reading time, stated honestly, plus how many cards need no reading.

---

## Section 6 — The Question Set

**Three cards rendered in full; the rest in one summarising paragraph.** Choose the three to show:
the opener, the hardest, and the load-bearing Tension card. Say plainly that the full set is in the
artifact.

Per rendered card, in this order: question · *Why this card (for you, not them)* · readings with
role, tier and time · *Check first* · *Read for* · *Level* · *They might say*.

Label the adult-only fields visibly — **"(for you, not them)"** reads better to a parent than
`visibility: adult` and carries the same warning.

**Drop the ladder type name from the parent surface.** "Q4 · MECHANISM" is fine as a heading;
"probing assumptions · contrastive why" is Paul & Elder vocabulary that means nothing to a parent.

---

## Section 7 — Checking Our Homework

The section that makes the whole document trustworthy.

- State that AI citations fail in a specific way: **a real author + a real venue + a study that never
  existed.** Explain why that is more dangerous than an obvious fabrication.
- Give the two-move check: *does it exist?* / *does it say what we claimed?*
- Point at the `unconfirmed` entry **by name** and tell them to start there.
- Invite them to find our error, and say what to do if they find one: show the teen.
- Disclose honestly which sources were retrieved and read in full versus confirmed at abstract level.

Add a topic-specific failure mode when one exists. For technical topics, plausible-sounding **numbers**
that propagate detached from their source are a distinct and worse risk than fake citations; say so.

---

## Section 8 — What This Skill Will Not Do

Component-level boundary table — AI-BENEFICIAL / AI-NEUTRAL / AI-UNDERMINING — for *this* piece of
work. Blanket policies are not defensible; component-level ones are (Wiggins & McTighe, 2005).

Close with the plain statement, unhedged: **no essay, no argument outline, no draft, and no telling
them which side to take.** Then the falsifiable test — if the teen ends up with work they cannot
defend out loud, something went wrong, and section 1 is how you would find out.

The **temptation varies by context and the table should follow it.** With a deadline the temptation
is "get it written." Without one it is "get it explained to me" — a subtler boundary that needs
naming explicitly.

---

## Section 9 — Appendix

Everything demoted for readability, in this order: full six-criteria triage record · full ladder
coverage note and Type 4 quality assessment · the evidence base with citations · what this briefing
cannot do.

**Pedagogy citations live here and nowhere above.** Roscoe & Chi, Wiggins & McTighe, Chin, Bjork —
authority for a teacher, noise for a parent. The *ideas* appear in plain language above; the *names*
appear only here.

---

## Writing rules — apply to sections 0–4

These are what actually make it readable. Sections 5–9 may be denser.

1. **One idea per paragraph. Three sentences maximum.**
2. **Bold marks actionable things only.** When everything is bold, nothing is. If a sentence is
   bolded, the adult should be able to *do* something about it.
3. **No tier codes, no ladder types, no field names, no citations.** Say "a research paper," not
   "T1." Say "what makes it hard," not "complexity challenge."
4. **Every section carries a time cost** where one is meaningful.
5. **Second person, active voice.** "Ask them this," not "the adult may wish to enquire."
6. **Name cards by number when referring to them** — "Q4 is the hard one" is usable; "the mechanism
   card" is not, because the adult is scanning for a label they can find.
7. **Never imply the adult should already understand the subject.** Where the topic is technical,
   say once, explicitly, that they do not need to.

---

## Self-check before writing the file

- [ ] Section 0 fits one screen and contains no jargon, no citations, no card numbers
- [ ] Sections 1–3 appear **before** any card, any tier code, and any triage detail
- [ ] The reference boundary is marked with a visible rule and the standing line
- [ ] Every teach-back question is rendered verbatim from the artifact's `teach_back` block
- [ ] Every engagement tell names a specific card or source
- [ ] The glossary has 6–8 entries drawn from the *answers*, not the sources
- [ ] Every `unconfirmed` source is flagged in the table **and** narrated beneath it
- [ ] Bold appears only on actionable text in sections 0–4
- [ ] No pedagogy citation appears above Section 9
- [ ] `teacher_time` in the skill frontmatter matches Section 0's checklist total
