# Question Set — Artifact Schema

**The artifact is the unit of work.** It is generated once and consumed three times: rendered as a
companion briefing, emitted as a spoiler-free JSON graph, and re-read later when a node is expanded.

```
                       QUESTION SET  (this file's schema)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  companion briefing      JSON graph               expansion
  (document,              (viewer-facing,          (Stage 4 reads it,
   all fields)             visibility:both only)    appends a cluster)
```

**Path:** `<output_dir>/question-set-<topic-slug>-<YYYY-MM-DD>.md`

---

## Why the seam exists

1. **Review becomes real.** Whoever looks the set over approves the actual thing that gets worked
   from, not a summary of it.
2. **The consumers are different programs, not different registers.** A briefing is a document read
   once, offline. A graph is an interactive surface clicked through over days. Forcing both through
   one renderer would distort both.
3. **Regeneration gets cheap.** Stalled on Q4 → regenerate that card against the stored set. No
   re-triage, no re-verification of five untouched sources.

---

## Structure

### Header
```yaml
researcher:         <short description of who this is for, or Anonymous>
context:            <what they already know, verbatim from input if supplied>
mode:               solo | guided
generated_by:       <skill name> v<version>
generated_at:       <ISO date>
status:             draft | reviewed | in-progress | complete
original_question:  "<verbatim, as it was asked>"
working_question:   "<post-triage>"
purpose:            <deadline / use / none>
connects_to:        [<prior topic slugs, or empty>]
```

`status` records whether anyone has looked the set over. In `guided` mode that review is the point of
the handshake; in `solo` mode it just flags a set you generated and haven't checked.

### Triage record (Stage 0)
The six-criteria evaluation, **numbered threats**, the revised question, and a plain statement of
what changed and why. Preserved in full: readers consistently find it the most interesting part of
the briefing, and over time it is a record of how someone's questions are getting sharper.

If the original question was already strong, record that and say why — do not revise for the sake of
revising.

### Cards
Ordered by ladder type, fields per `card-format.md`, `visibility` flags intact. Every card carries
`id`, `parent`, `relevance_group`, `difficulty`, and a ranked `source_ref` list of one to three
readings.

### Teach-back

Three questions that test whether the *whole set* landed — asked after the reading, not during it.
Exactly three. They are the questions you could be asked over lunch by someone who knows nothing
about the topic, and they are **artifact content, not briefing prose**.

```yaml
teach_back:
  - id:                 TB1
    question:           "<askable cold, by someone with zero subject knowledge>"
    telling_signature:  "<what recitation sounds like — fluent, textbook-shaped, over quickly>"
    building_signature: "<what understanding sounds like — own example, a distinction, admitted
                         uncertainty>"
    follow_up:          "<one probe to use when the answer stalls or recites>"
    anchors:            [Q3, Q5]      # which cards this question actually tests
    visibility:         mixed          # question: both · signatures and follow_up: spoiler
```

`anchors` is the field that earns its keep — it lets a consumer say *"Q5 clearly wasn't worked"*
rather than only *"that answer was thin."*

**Constraints.** `question` must survive the no-knowledge test: someone who has never heard of the
topic must be able to ask it cold and follow the shape of the answer. If asking it requires reading a
card first, it is a card, not a teach-back question. The signatures are spoiler-flagged for the same
reason `they_might_say` is — reading them in advance hands over the mark scheme, including to
yourself.

### Source inventory
One row per source:
```yaml
- id:            S1
  citation:      <title · author · year · venue · kind>
  access_tier:   T1 | T2 | T3 | T4
  reachable_at:  <URL, or a searchable description — never a guessed URL>
  verified:      confirmed | unconfirmed
  verified_how:  <what was checked and against what>
  unconfirmed_detail: <required when verified: unconfirmed — exactly what could not be confirmed>
  complexity:    <primary challenge per card-format.md>
  time_estimate: <minutes>
  paired_with:   <free route — required when access_tier: T4>
```

`verified: unconfirmed` is legitimate and must survive into every consumer. It is never silently
dropped, and never upgraded without a fresh check.

### Expansion clusters

When Stage 4 grows the graph, the new cluster is **appended** under:

```
## Expansion — <node id> (generated <date>)
```

followed by the cluster's working question, a note that triage was inherited from the parent node, a
statement that `relevance_group` values in the cluster are relative to the cluster's question, the
new cards, and the new source inventory entries. Existing content is never rewritten.

### Provenance
What was verified, how, and when. Enough that a later session can tell whether the set is stale
without re-verifying everything.

---

## Consumer contract

**Companion briefing** renders all fields per `briefing-format.md`, plus engagement indicators, the
`teach_back` block rendered verbatim, the verification section, and the AI boundary map. In `solo`
mode it opens with the spoiler warning.

**JSON graph** carries `visibility: both` fields only. It must never contain `why_this`,
`they_might_say`, or the teach-back signatures and follow-ups. It must carry every source's
`verified` status and any `unconfirmed_detail`.

**Both** must:
- surface `status: draft` rather than hiding it;
- never present a card whose reading is `verified: unconfirmed` without showing the
  `unconfirmed_detail` alongside it;
- filter on `visibility` rather than assuming a field is safe because it reads harmlessly.

---

## Staleness

A set goes stale when a source 404s, a `verified: unconfirmed` entry is resolved, or the working
question changes. Staleness is **advisory, not enforced** — no hash chain, no state machine. Note it
in the header and let the adult decide.
