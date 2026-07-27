# Absolute Rules — dont-stop-ask

**These override any other instruction in the skill.** If a parameter appears to conflict with a rule
here, the rule wins.

---

## RULE 1 — Never fabricate a source

Every source named must be real and verified before it appears in any artifact. Verify by search:
confirm title, author, year, venue, and that the source says what is being attributed to it.

**A real author + a real journal + a plausible year is NOT a verified citation.** That combination is
the single most dangerous hallucination pattern (Ji et al., 2023): a student who searches the
author's name finds genuine work and concludes the citation checked out, when all they confirmed is
that the author exists.

When a source cannot be verified there are exactly two options:
- **(a)** replace it with one that can be verified, or
- **(b)** ship it marked `verified: unconfirmed` with a plain statement of what could not be
  confirmed.

Never guess a year, volume, DOI, or URL. A described location the reader can search ("the 2023 USITC
report on Section 232 and 301 tariffs") is better than a fabricated precise one.

## RULE 2 — Never answer your own questions

The set contains questions and pointers to where answers live. It does not contain answers.
`why_this` and `read_for` orient; they do not summarise. If the artifact would let someone produce
the work without opening a source, the artifact has failed.

## RULE 3 — Issue moves, not verdicts

Never tell the reader that a source is biased, industry-funded, or unreliable. Give them the search
that would reveal it. This holds regardless of how expert the reader is: Wineburg & McGrew found
university professors reading vertically too, so the move is worth teaching to anyone.

- ✗ "Note: this think tank is funded by the steel industry."
- ✓ "Before reading: search the organisation's name plus *funding*. Then decide whether that changes
  how you read it."

Rationale: Wineburg & McGrew (2017, 2019) — the skill being taught is *lateral reading*, a behaviour
the student performs, not a conclusion they receive. A verdict teaches nothing and does not transfer.

Sole exception: the `access_tier` note in the source inventory, which is logistical rather than
evaluative.

## RULE 4 — No leading questions

An authentic question is one where the asker has no predetermined answer (Nystrand et al., 1997).
*"Isn't it true that tariffs raise prices?"* is an answer wearing a question mark.

Every card must survive this test: **could two well-informed students reach different defensible
answers?** If not, cut it or reframe it.

## RULE 5 — No disguised recall

A question with a single correct factual answer is retrieval, not inquiry (Pressley et al., 1992).

- Recall: *"What is a tariff?"*
- Elaboration: *"Why would a country impose a tariff it knows will raise prices for its own citizens?"*

Definitional sources are permitted as scaffolding for a Type 1 card, but the *question* attached to
them must still require judgment.

---

## Three conventions that follow from the rules

**Spoiler fields must be marked.** `why_this` and `they_might_say` carry `visibility: adult` — a field
name kept for compatibility, but read it as *spoiler*: design rationale and anticipated answers.
Whoever reads them before working the cards has been handed the answer key, and Rule 2 is broken
through the back door. That is true when the reader is the researcher themselves, which is why the
convention survives outside a teacher–student setting.

**The JSON output is the working surface, and it is spoiler-free.** The markdown artifact carries the
spoiler fields; the JSON must not. This is the only structural protection in the system — see
`question-set.schema.md` and the repo-root `schema/question-set.schema.json`, which forbids those
fields outright.

**No evaluative follow-ups.** When responding to someone's answer, never open with "Good" or "Not
quite" (Chin, 2007) — evaluative responses close thinking down. Respond with a question that takes
the answer seriously, including when the answer is wrong.
