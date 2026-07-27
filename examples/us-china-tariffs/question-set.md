# Question Set — US–China Tariffs and the World

```yaml
researcher:         Anonymous
context:            Comfortable with basic supply-and-demand reasoning; no background in
                    trade policy or international economics
mode:               guided
generated_by:       dont-stop-research v1.0
generated_at:       2026-07-27
status:             draft
original_question:  "How's the US tariff on China would affect the world?"
working_question:   "Did the US tariffs on China reroute world trade or shrink it — and who actually came out ahead?"
purpose:            none (personal curiosity; no deadline)
connects_to:        []
```

---

## Triage record (Stage 0)

Evaluated as stated: *"How's the US tariff on China would affect the world?"*

**THREATS**

1. **Not evidence-dependent.** A reasonably informed adult can answer it from general
   knowledge — "prices go up, trade shifts elsewhere, tensions rise" — without opening a single
   source. The sources become decoration.
2. **Not contested as framed.** "It affects the world in many ways" is a list, and everyone's list
   looks the same. Two people working the question as stated will produce interchangeable
   catalogues, not defensible positions.
3. **Not specific.** "The world" spans at least five separate literatures: US consumer prices,
   supply-chain reallocation, third-country trade, macro fragmentation, and geopolitics. Each is a
   book. None is answerable in one project.
4. **Time-unanchored.** "The US tariff on China" is at least three distinct policies: the 2018–19
   Section 301 trade war, the 2025 escalation (which at its peak covered 100% of goods on both
   sides), and the current truce (10% reciprocal rate, holding until November 2026). Findings about
   one do not automatically transfer to the others.
5. **No skill demand.** As stated it asks for collection, not judgment. Nothing in it forces the
   reader to weigh two accounts against each other.

**REVISED QUESTION**

> **Did the US tariffs on China reroute world trade or shrink it — and who actually came out ahead?**

**WHAT CHANGED AND WHY**

The revision narrows "the world" to the one place where the evidence genuinely disagrees: what
happened to everyone who *wasn't* the US or China. Serious researchers looked at the same episode
and reached different verdicts — one team found bystander countries gained net new export
opportunities; a UN study found trade diversion plus a net global loss; supply-chain work found the
"reallocation" partly cosmetic, with Chinese content still flowing through Vietnam and Mexico. That
is a real dispute a reader can take a position in. "Reroute or shrink" forces a judgment;
"who came out ahead" forces them to separate winners from losers instead of averaging them. The
question cannot be answered without sources, and the answer is genuinely not settled.

---

## Cards

### Q1 · MEANING (clarification)

```yaml
question: >
  "The US tariff on China" — which one? The 2018–19 trade war, the 2025 escalation, or the
  truce running now? Before arguing about effects: are these one policy that grew, or three
  different policies that happen to share a name?
type: 1 — Meaning · clarification
why_this: >
  (spoiler) Everything downstream depends on this. Nearly all the measured evidence comes from
  2018–19; the 2025 round was far bigger and hit nearly every country. Anyone who never
  separates the episodes will quote 2019 findings as if they describe 2026.
source_ref:
  - {id: S6, role: primary}
  - {id: S8, role: background}
relevance_group: supporting
check_first: >
  Search "Peterson Institute for International Economics funding" and "PIIE trade policy
  position." Decide what you think their vantage point is before reading — then read anyway.
read_for: >
  The chart's timeline shape: when did average tariff rates jump, when did they plateau, when
  did they spike and fall back? You want the episodes, not the percentages.
level: >
  Moderate. The obstacle is knowledge demands — the chart assumes you know terms like
  "Section 301." Skim past labels you don't know on the first pass; the line shape carries
  the story. ~20 min.
they_might_say:
  - answer: "It's all one policy — America taxing China."
    follow_up: >
      The average rate went from 3% to 21% to over 40%, then back to around 10% under a truce.
      At what point does a policy change so much it stops being the same policy?
  - answer: "Three different things — trade war, escalation, truce."
    follow_up: >
      Then which one is your question about? And which one is the evidence about?
visibility: why_this and they_might_say are spoiler fields
```

### Q2 · LANDSCAPE (probing evidence)

```yaml
question: >
  In the first year of the tariffs, Taiwan, Mexico, the EU and Vietnam all sold billions more
  to the US. Was that new trade being created, or existing trade taking a detour — and how
  would anyone tell the difference from the numbers?
type: 2 — Landscape · probing reasons and evidence
why_this: >
  (spoiler) This is the entry point to the whole dispute. The UNCTAD study is the cleanest
  early measurement: ~25% drop in tariffed US imports from China, ~$21bn diverted to
  bystanders, ~$14bn simply lost. The distinction between "diverted" and "lost" is the
  question's engine.
source_ref:
  - {id: S4, role: primary}
  - {id: S2, role: supporting}
relevance_group: core
check_first: >
  Search "UNCTAD" alone first. What kind of body is it, who funds it, what is its stated
  mission? A UN research paper is not the same animal as a university journal article —
  decide what that difference means before you read.
read_for: >
  The tables splitting the fall in Chinese imports into "trade diversion" (picked up by
  others) versus "trade loss" (vanished). Note WHICH sectors diverted where — office
  machinery to Taiwan, furniture to Vietnam. The sector detail is what makes the argument.
level: >
  Readable. The obstacle is structure — it's a research paper, but the executive summary and
  tables carry everything you need. Read summary, then tables, then only the sections the
  tables make you curious about. ~35 min.
they_might_say:
  - answer: "It's a detour — the same goods just ship from somewhere else."
    follow_up: >
      Then why did $14bn of it vanish instead of detouring? What would make trade disappear
      rather than reroute?
  - answer: "You can't tell the difference from trade numbers alone."
    follow_up: >
      The researchers thought they could. What did they compare the numbers AGAINST to make
      the split? (Hint: what would exports have looked like with no tariff?)
visibility: why_this and they_might_say are spoiler fields
```

### Q3 · MECHANISM (contrastive why)

```yaml
question: >
  Vietnam and Mexico gained enormously from the tariffs. India, Indonesia and most of Africa —
  also low-wage, also outside the fight — mostly didn't. Why them and not the others?
type: 3 — Mechanism · contrastive why
why_this: >
  (spoiler) The contrastive form is deliberate — "why X and not Y" forces a mechanism, not a
  description. The paper's own answer is surprising: country-specific factors, not what the
  countries happened to specialise in, drove who gained. A reader who can restate that
  finding in their own example has understood it.
source_ref:
  - {id: S2, role: primary}
  - {id: S3, role: supporting}
  - {id: S4, role: background}
relevance_group: core
check_first: >
  Search the five authors' names plus "affiliation." Note where they sit (universities, World
  Bank). Then search "NBER working paper peer review" — is a working paper the same as a
  published article? Decide how much weight to give each version.
read_for: >
  The introduction and conclusion of the working paper. You are hunting for their explanation
  of WHY some bystanders gained and others didn't — and note that they find bystanders grew
  exports to the whole world, not just to the US. That detail breaks the simple "detour" story.
level: >
  Hard middle, readable ends. A capable reader can get what they need from the abstract,
  introduction and conclusion; the estimation sections in between are genuinely graduate-level
  and are skippable without loss for this question. ~40 min.
they_might_say:
  - answer: "Vietnam is closer to China so factories could move there easily."
    follow_up: >
      Mexico isn't close to China at all, and it gained too. What do Vietnam and Mexico share
      that India doesn't?
  - answer: "They already made the right products."
    follow_up: >
      The authors tested exactly that and rejected it. If it wasn't the products, what's left?
visibility: why_this and they_might_say are spoiler fields
```

### Q4 · MECHANISM (how) — *the hardest card*

```yaml
question: >
  If a component that used to ship from China now ships from Vietnam — but the Vietnamese
  factory buys its parts from China — has the world's dependence on China actually gone down,
  or just become harder to see?
type: 3 — Mechanism · how does X lead to Y
why_this: >
  (spoiler) This is the hardest card and the one that separates reading from skimming. Alfaro &
  Chor document that US direct sourcing from China fell while Vietnam's and Mexico's imports
  FROM China rose — the dependence partly went underground rather than away. Expect visible
  frustration here; that is the design working, not failing.
source_ref:
  - {id: S3, role: primary}
  - {id: S2, role: supporting}
relevance_group: core
check_first: >
  This paper was presented at the Federal Reserve's Jackson Hole symposium. Search "Jackson
  Hole economic symposium" — who gets invited to present there, and what does that tell you
  about how this paper was received before you weigh what it says?
read_for: >
  The sections tracking where Vietnam and Mexico get THEIR inputs. The paper never announces
  "dependence just moved" in one sentence — you assemble that conclusion from their evidence,
  and you should also collect their evidence that some reallocation is real. Both are there.
level: >
  Hard. The obstacle is implicit meaning — the point you need is distributed across sections
  and never stated as a slogan. Budget real time and expect to re-read. ~50 min.
they_might_say:
  - answer: "It's fake — everything still comes from China underneath."
    follow_up: >
      The authors also show wages and value-added rising in Vietnam. If it were purely a
      relabelling exercise, would that happen?
  - answer: "It went down — the US buys less from China, that's what the tariff was for."
    follow_up: >
      If China's parts are inside Vietnam's exports, what happens to the US if China cuts
      Vietnam off? Has the risk the tariff aimed at actually moved?
visibility: why_this and they_might_say are spoiler fields
```

### Q5 · TENSION (viewpoints at their strongest) — *the load-bearing card*

```yaml
question: >
  Two serious teams measured the same episode. One concludes bystander countries won net new
  trade — the world traded MORE. A UN study concludes the world lost about $14bn of trade net.
  The IMF warns that if this fragmentation continues, everyone ends up poorer. They cannot all
  be fully right. Where exactly do they disagree — in the numbers, or in what they counted?
type: 4 — Tension · viewpoints and perspectives
why_this: >
  (spoiler) The load-bearing card. The disagreement is real and empirical, not political: it
  turns on time windows (first year vs. five years), what counts as "trade" (to the US only
  vs. to the world), and baselines. Whoever can state the position they end up rejecting
  fairly has done the hardest thing this set asks.
source_ref:
  - {id: S2, role: primary}
  - {id: S4, role: supporting}
  - {id: S7, role: background}
relevance_group: core
check_first: >
  For each of the three: search the institution's name plus "criticism." Every one of these
  bodies has informed critics. Find one criticism of each BEFORE deciding whose account you
  find most convincing.
read_for: >
  Not the conclusions — the definitions. What time window does each cover? Does "trade" mean
  exports to the US or exports to everyone? What is each comparing against? Write the three
  answers in a table before you take a side.
level: >
  Hard, but mostly thinking-hard rather than reading-hard — you have already read S2 and S4
  for earlier cards; only the IMF framing is new. The obstacle is holding three accounts in
  your head at once. ~45 min including re-skimming.
they_might_say:
  - answer: "The UN one is right because it's neutral."
    follow_up: >
      Neutral about what? Walk me through what the UN study counted that the other one didn't —
      does neutrality change the counting?
  - answer: "They're all right — they measured different things."
    follow_up: >
      That's a real position, but it has a consequence: if they measured different things, your
      question "reroute or shrink?" might have a different answer at different timescales.
      Which timescale does YOUR answer live at?
visibility: why_this and they_might_say are spoiler fields
```

### Q6 · EVIDENCE (how would anyone know)

```yaml
question: >
  Politicians said China would pay the tariffs. Economists measured US import prices and
  concluded American buyers paid nearly all of it. What exactly did they measure to be able
  to say that — and what would the data have looked like if China HAD paid?
type: 5 — Evidence · probing reasons and evidence
why_this: >
  (spoiler) This is the card that teaches "what a study measured vs. what it concluded" — the
  one tell for this whole set. Amiti, Redding & Weinstein tracked prices at the border: if
  exporters had absorbed the tariff, pre-tariff border prices would have fallen. They didn't.
  Whoever can explain the counterfactual owns the method.
source_ref:
  - {id: S1, role: primary}
  - {id: S6, role: background}
relevance_group: supporting
check_first: >
  Two of the three authors work at the Federal Reserve Bank of New York and Princeton. Search
  "Journal of Economic Perspectives" — what kind of journal is it, and who is it written for?
  (The answer will make the reading easier, not just more trustworthy.)
read_for: >
  The section on import prices at the border. The key move: compare the price BEFORE the
  tariff is added, before vs. after. You want to be able to draw the two possible graphs —
  "China pays" vs. "America pays" — and say which one the data matched.
level: >
  Moderate. JEP is deliberately written for non-specialists — the obstacle is quantitative
  (graphs and percentages), not conceptual. The abstract, intro and price sections suffice.
  ~35 min.
they_might_say:
  - answer: "Consumers paid because companies always pass costs on."
    follow_up: >
      Always? The same authors note theory predicted China would absorb part of it. Why might
      an exporter cut prices to hold onto a market — and why didn't that happen here?
  - answer: "They measured prices at the border before the tariff got added."
    follow_up: >
      Right — so describe the graph in the world where China pays. What line moves, and
      which way?
visibility: why_this and they_might_say are spoiler fields
```

### Q7 · SCOPE (where does the evidence stop)

```yaml
question: >
  Nearly every number you've now read comes from 2018–19, when the tariffs hit one country.
  In 2025 the US tariffed nearly everyone at once, then settled into a truce. Which of your
  findings still hold when there's nowhere left to reroute trade TO — and which break?
type: 6 — Scope · implications and consequences
why_this: >
  (spoiler) The scope card converts everything before it from trivia into a model. The
  rerouting mechanism (Q2–Q4) requires an untaxed elsewhere; a universal tariff removes it.
  Anyone who sees that has stopped reciting findings and started using them.
source_ref:
  - {id: S8, role: primary}
  - {id: S6, role: background}
relevance_group: context
check_first: >
  Search "Congressional Research Service" — who do they write for, and are they allowed to
  take sides? That answer tells you how to read a CRS timeline differently from a newspaper's.
read_for: >
  Skim the timeline only for what changed in 2025 versus 2018: coverage (which countries),
  rates, and what the truce suspended. You are collecting differences, not the whole history.
level: >
  Light reading, heavy thinking. The reading is a skim (~15 min); the card's real work is
  applying Q2–Q4's mechanisms to a changed world, and no source will do that for you.
  ~30 min total.
they_might_say:
  - answer: "Everything still holds, tariffs work the same way."
    follow_up: >
      In 2019 a company could dodge the China tariff by moving to Vietnam. Under a tariff on
      everyone, what's the dodge? If there isn't one, what happens instead?
  - answer: "None of it holds, it's a different world now."
    follow_up: >
      The finding that importers, not exporters, paid — does that one depend on there being
      an untaxed elsewhere? Some findings travel; which ones?
visibility: why_this and they_might_say are spoiler fields
```

### Q8 · STAKE (what were they for)

```yaml
question: >
  The tariffs didn't measurably raise employment in the industries they protected — yet the
  regions most exposed to them voted for more tariffs, not fewer. If they failed on jobs and
  succeeded politically, what does that tell you about what tariffs are actually FOR?
type: 7 — Stake · questions about the question
why_this: >
  (spoiler) This card blocks the easy ending ("economists say tariffs are bad, the end") by
  taking the pro-tariff position seriously at its strongest: the case was never mainly about
  aggregate efficiency — it's about distribution, symbolism, and security. Autor et al.
  measured both the economic null and the electoral win.
source_ref:
  - {id: S5, role: primary}
  - {id: S1, role: supporting}
relevance_group: context
check_first: >
  Search "David Autor China shock" first. This team spent a decade documenting the DAMAGE
  Chinese imports did to US towns — they are not reflexive free-traders. Knowing that, decide
  what it means that THEY found no employment gain from the tariffs.
read_for: >
  Two findings, kept separate: the employment result (no gain in protected sectors; real
  losses in agriculture from retaliation) and the electoral result (exposed regions moved
  toward the tariff party). Your job is to hold both without letting one erase the other.
level: >
  Moderate. Readable ends again — abstract, intro, conclusion. The obstacle is knowledge
  demands around US electoral mechanics; skim those, keep the direction of the effects.
  ~35 min.
they_might_say:
  - answer: "People just voted on feelings, not facts."
    follow_up: >
      Or did voters value something the employment statistics don't measure? What might a
      town want from a tariff besides jobs?
  - answer: "Tariffs are really about security, not economics."
    follow_up: >
      Then Q4 matters again — did the tariff actually reduce dependence on China, or move it?
      Judge the policy by ITS OWN goal.
visibility: why_this and they_might_say are spoiler fields
```

### Q9 · STAKE (thinking card — no reading)

```yaml
question: >
  Suppose your final answer is "mostly rerouted, world trade survived." Who, specifically,
  should relax — and who should still be worried? Now flip it: "mostly shrank." Who changes
  their behaviour? If nobody would act differently either way, is the question worth asking?
type: 7 — Stake · questions about the question
why_this: >
  (spoiler) The closing move: attach consequences to the answer. This is the best dinner-table
  card in the set — it needs no reading and reveals immediately whether the earlier cards
  built a model or a pile of facts.
source_ref: none — single-reading exemption: thinking-only card; it runs on what Q1–Q8
  established, and any reading attached here would convert judgment into recall
relevance_group: context
check_first: N/A
read_for: N/A
level: >
  No reading — thinking time only. Best done out loud with someone. ~20 min.
they_might_say:
  - answer: "Governments should care, obviously."
    follow_up: >
      Which government, doing what differently? Name one decision that flips with the answer.
  - answer: "A company deciding where to build its next factory."
    follow_up: >
      Good, make it concrete: what does that company do in the "rerouted" world that it
      doesn't do in the "shrank" world?
visibility: why_this and they_might_say are spoiler fields
```

---

## Teach-back

```yaml
teach_back:
  - id: TB1
    question: >
      "I keep hearing Vietnam sells way more to America since the China tariffs. Is that
      Vietnam winning, or is it just China's stuff taking a detour?"
    telling_signature: >
      "Trade diverted to Vietnam" delivered as one fluent sentence, no distinction between
      detour and genuine gain, over in ten seconds.
    building_signature: >
      They separate the cases — some detour (Chinese parts flowing through), some real gain
      (Vietnamese wages and capacity rising) — and admit the split is genuinely hard to
      measure. An own example ("like a nightclub with a new door") is gold.
    follow_up: >
      "So if I'm Vietnam's government, am I happy about this or nervous?"
    anchors: [Q2, Q3, Q4]
    visibility: mixed
  - id: TB2
    question: >
      "Who ended up actually paying the tariff money — China, American companies, or people
      like me?"
    telling_signature: >
      "Consumers pay, companies pass it on" — textbook-shaped, instant, no mention of how
      anyone could know that.
    building_signature: >
      They mention what was MEASURED — prices at the border before the tariff gets added —
      and can say what the data would have looked like if China had paid. Hedging about
      exceptions is a good sign.
    follow_up: >
      "How could anyone possibly know that? What would you measure?"
    anchors: [Q6]
    visibility: mixed
  - id: TB3
    question: >
      "So after all your reading — did the tariffs work? What were they even supposed to do?"
    telling_signature: >
      "Economists say tariffs are bad" or "No, everyone lost." Tidy, one-sided, and over
      quickly — the question 'supposed to do' goes unanswered.
    building_signature: >
      They split the goals — prices, jobs, dependence on China, politics — and score them
      separately, including at least one the tariffs arguably achieved. Steelmanning the
      side they disagree with is the highest bar in this set.
    follow_up: >
      "Say the best case FOR the tariffs, as if you believed it."
    anchors: [Q5, Q8, Q9]
    visibility: mixed
```

---

## Source inventory

```yaml
- id: S1
  citation: "The Impact of the 2018 Tariffs on Prices and Welfare · Amiti, Redding & Weinstein · 2019 · Journal of Economic Perspectives 33(4), 187–210 · peer-reviewed article"
  access_tier: T1
  reachable_at: https://www.aeaweb.org/articles?id=10.1257/jep.33.4.187 (JEP is open access; NBER WP 25672 version also open)
  verified: confirmed
  verified_how: Search confirmed title, authors, year, venue, and the core claim (near-complete pass-through; incidence on US importers/consumers; ~$1.4bn/month real income loss).
  complexity: quantitative — graphs and percentages; written for non-specialists
  time_estimate: 35
- id: S2
  citation: "The US-China Trade War and Global Reallocations · Fajgelbaum, Goldberg, Kennedy, Khandelwal & Taglioni · 2024 · AER: Insights 6(2), 295–312 · peer-reviewed article"
  access_tier: T1
  reachable_at: https://www.nber.org/papers/w29562 (open working-paper version; journal version at aeaweb.org)
  verified: confirmed
  verified_how: Search confirmed title, authors, year, venue, DOI, and core claim (bystander countries gained net export opportunities; country-specific factors, not specialisation, drove variation).
  complexity: structure — readable abstract/intro/conclusion, graduate-level middle
  time_estimate: 40
- id: S3
  citation: "Global Supply Chains: The Looming 'Great Reallocation' · Alfaro & Chor · 2023 · Jackson Hole Symposium / NBER WP 31661 · working paper"
  access_tier: T1
  reachable_at: https://www.kansascityfed.org/documents/9747/JH_Paper_Alfaro.pdf
  verified: confirmed
  verified_how: Search confirmed title, authors, year, venues (Jackson Hole, NBER, HBS WP 24-012), and core claim (US direct sourcing from China down; Vietnam/Mexico up; Chinese content persists in their inputs).
  complexity: levels of meaning — the key conclusion is assembled, not stated
  time_estimate: 50
- id: S4
  citation: "Trade and Trade Diversion Effects of United States Tariffs on China · Nicita · 2019 · UNCTAD Research Paper No. 37 · institutional research paper"
  access_tier: T1
  reachable_at: https://unctad.org/publication/trade-and-trade-diversion-effects-united-states-tariffs-china
  verified: confirmed
  verified_how: Search confirmed title, author, year, series number, and core figures (~25% import drop, ~$21bn diverted, ~$14bn net loss, gains to Taiwan/Mexico/EU/Vietnam).
  complexity: structure — executive summary and tables carry the argument
  time_estimate: 35
- id: S5
  citation: "Help for the Heartland? The Employment and Electoral Effects of the Trump Tariffs in the United States · Autor, Beck, Dorn & Hanson · 2024 · NBER WP 32082 · working paper"
  access_tier: T1
  reachable_at: https://www.nber.org/papers/w32082 (open PDF also at ddorn.net/papers/ABDH-Heartland.pdf)
  verified: confirmed
  verified_how: Search confirmed title, authors, year, number, and core claims (no employment gain in protected sectors; agricultural losses from retaliation; electoral gains for tariff party in exposed regions).
  complexity: knowledge demands — assumes US electoral context
  time_estimate: 35
- id: S6
  citation: "US-China Trade War Tariffs: An Up-to-Date Chart · Bown · 2019, continuously updated · Peterson Institute for International Economics · data chart with commentary"
  access_tier: T2
  reachable_at: https://www.piie.com/research/piie-charts/2019/us-china-trade-war-tariffs-date-chart
  verified: confirmed
  verified_how: Search confirmed author, venue, ongoing updates, and current headline figures (peak coverage 100% of goods both directions).
  complexity: knowledge demands — assumes terms like "Section 301"
  time_estimate: 20
- id: S7
  citation: "IMF analysis of geoeconomic fragmentation costs (global output loss ranging roughly 0.2% to 7% of GDP across scenarios) · IMF staff · 2023 · IMF publication"
  access_tier: T1
  reachable_at: Search "IMF geoeconomic fragmentation staff discussion note 2023" on imf.org
  verified: unconfirmed
  verified_how: The 0.2%–7% range is widely reported and attributed to IMF staff work; the April 2023 WEO Chapter 4 on fragmentation and FDI is confirmed to exist.
  unconfirmed_detail: >
    Could not confirm exactly WHICH IMF document carries the 0.2%–7% figure — likely the 2023
    Staff Discussion Note on Geoeconomic Fragmentation (Aiyar et al.), but we verified this
    only through secondary reporting, not the document itself. An adult should confirm the
    title and figure on imf.org before citing it. Start here.
  complexity: language conventionality — IMF institutional register
  time_estimate: 25
  paired_with: S4
- id: S8
  citation: "Presidential 2025 Tariff Actions: Timeline and Status · Congressional Research Service · R48549 · government report"
  access_tier: T1
  reachable_at: https://www.congress.gov/crs-product/R48549
  verified: confirmed
  verified_how: Search confirmed the CRS product number and title; CRS is a nonpartisan research arm of the US Congress. Current truce status (10% reciprocal rate suspended-escalation, extended to November 10, 2026) cross-confirmed against multiple news reports.
  complexity: language conventionality — legislative register; skim for dates and rates only
  time_estimate: 15
```

---

## Expansion — Q8 (generated 2026-07-28)

Working question for this cluster: **"If the tariffs failed on jobs and succeeded politically,
what are tariffs FOR?"** (Q8's card question, taken as-is — it already passes triage: contested,
evidence-dependent, specific.) Seven cards, not nine: an eighth and ninth would have been padding.
All seven ladder types present. Relevance groups are relative to THIS cluster's question.

### E1 · MEANING · green
```yaml
question: >
  If one policy has four possible goals — revenue, jobs, security, politics — what would
  "the tariffs worked" even mean? Who gets to pick the yardstick?
source_ref: [{id: S9, role: primary}]
relevance_group: supporting
check_first: "Search 'Hoover Institution funding' before listening — then listen anyway."
read_for: "Irwin's three eras of what US tariffs were FOR: revenue, restriction, reciprocity. Ask which era today resembles — or whether it's a fourth."
level: "Easier — a long-form interview, listenable. ~40 min"
they_might_say:
  - answer: "'Worked' means it did what the president said it would."
    follow_up: "Presidents said several different things. Which statement counts?"
visibility: why_this and they_might_say are spoiler fields
```

### E2 · LANDSCAPE · amber
```yaml
question: >
  Historians split US tariff history into three eras by purpose: revenue, restriction,
  reciprocity. Which one are we in now — or is this a fourth era with a new purpose?
source_ref: [{id: S9, role: primary}, {id: S12, role: background}]
relevance_group: core
check_first: "Search 'Douglas Irwin trade policy views' — decide where he stands before reading."
read_for: "The transition points: WHAT made each era end. Then hold Sullivan's 2023 speech against the three labels and see if any fits."
level: "Middle — the framework is simple; the judgment call is yours. ~45 min"
```

### E3 · MECHANISM (causal why) · amber
```yaml
question: >
  Tariff costs are spread across every shopper; tariff benefits land on visible industries
  in visible towns. Why would a democracy keep a policy whose measured costs exceed its
  measured benefits — and is that a bug or a feature of democracy?
source_ref: [{id: S5, role: primary}, {id: S10, role: supporting}]
relevance_group: core
check_first: "Re-run the S5 check from Q8 — this team documented the China Shock damage first."
read_for: "The 'expressive voting' interpretation in Autor et al.'s conclusion — voters rewarding the gesture, not the outcome. Decide if you buy it."
level: "Middle — you've already read S5's ends for Q8; this is a second, closer pass. ~30 min"
```

### E4 · EVIDENCE · red
```yaml
question: >
  China aimed its retaliation at products from counties that swung to Trump — more precisely
  than chance allows. What does the TARGETING tell you about what every government involved
  believed tariffs were really for?
source_ref: [{id: S10, role: primary}, {id: S5, role: background}]
relevance_group: core
check_first: "Search 'Economic Journal peer review' and both authors' affiliations."
read_for: "How they built counterfactual retaliation lists to prove targeting was deliberate. The method is the finding: retaliators optimised for politics, not economics."
level: "Technical — econometrics in the middle; abstract, intro and the counterfactual figures suffice. ~40 min"
```

### E5 · TENSION · red — the load-bearing card of this cluster
```yaml
question: >
  Lighthizer: efficiency and low prices should be SECONDARY to working people's lives, and
  tariffs are the tool. Posen: zero-sum trade thinking backfires on its own goals — jobs,
  innovation, security. They disagree about what economies are for, not just about tariffs.
  State the position you end up rejecting, fairly enough that its holder would sign it.
source_ref: [{id: S14, role: primary}, {id: S13, role: supporting}, {id: S12, role: background}]
relevance_group: core
check_first: "Search both names plus 'background': one ran US trade policy, one runs a trade-friendly think tank. Neither is neutral; neither is fringe."
read_for: "Lighthizer's own priority ordering (via the review if the book is unavailable) and Posen's list of goals he claims the policy defeats. Note they don't even share a scoreboard."
level: "Technical in a different way — the disagreement is about values wearing empirical clothes. Name which claims are testable and which aren't. ~50 min"
```

### E6 · SCOPE · amber
```yaml
question: >
  The China Shock hit US factory towns hardest between 1999 and 2011. The tariffs arrived in
  2018. Can a tariff fix a wound that finished forming a decade earlier — and if not, what
  was the policy that COULD have, and why didn't it happen?
source_ref: [{id: S11, role: primary}, {id: S5, role: supporting}]
relevance_group: supporting
check_first: "Search 'China Shock criticism' — this famous paper has serious critics; find one."
read_for: "The adjustment-speed finding: depressed wages and participation lasting a decade-plus. That timescale is the argument — compare it to the tariff's timing."
level: "Middle — the review article is readable; the tables are skippable. ~40 min"
```

### E7 · STAKE · green — thinking card, no reading
```yaml
question: >
  If tariffs are really for security and politics rather than jobs, how should you judge the
  current US–China truce — success, failure, or the wrong question? Who has an interest in
  NOT saying which goal is the real one out loud?
source_ref: none — runs on E1–E6 plus the original set's Q7
relevance_group: context
check_first: N/A
read_for: N/A
level: "No reading — ~20 min of thinking, best out loud."
```

### Expansion source inventory additions

```yaml
- id: S9
  citation: "Clashing over Commerce: A History of US Trade Policy · Irwin · 2017 · University of Chicago Press · book"
  access_tier: T3
  reachable_at: Book (library/purchase); free alternative — long-form Irwin interviews at hoover.org and mercatus.org (search "Irwin history of US trade policy interview")
  verified: confirmed
  verified_how: Search confirmed title, author, year, publisher, and the revenue/restriction/reciprocity framework attributed to it.
  complexity: quantitative — sheer length; use the interviews plus one era's chapters
  time_estimate: 40 (interview route)
- id: S10
  citation: "Tariffs and Politics: Evidence from Trump's Trade Wars · Fetzer & Schwarz · 2021 · The Economic Journal 131(636), 1717–1741 · peer-reviewed article"
  access_tier: T1
  reachable_at: https://wrap.warwick.ac.uk/id/eprint/142997/ (open repository copy; journal version paywalled at OUP)
  verified: confirmed
  verified_how: Search confirmed title, authors, venue, volume/pages, and core claim (retaliation disproportionately targeted areas that swung to Trump; China most precisely).
  complexity: quantitative — econometric middle; readable ends
  time_estimate: 40
- id: S11
  citation: "The China Shock: Learning from Labor-Market Adjustment to Large Changes in Trade · Autor, Dorn & Hanson · 2016 · Annual Review of Economics 8, 205–240 · peer-reviewed review article"
  access_tier: T1
  reachable_at: https://www.ddorn.net/papers/Autor-Dorn-Hanson-ChinaShock.pdf
  verified: confirmed
  verified_how: Search confirmed title, authors, year, venue, pages, and core claim (local labor-market adjustment remarkably slow; effects persist a decade-plus).
  complexity: structure — long review; intro and adjustment sections carry it
  time_estimate: 40
- id: S12
  citation: "Remarks on Renewing American Economic Leadership (the 'new Washington consensus' speech) · Sullivan · 2023 · Brookings Institution / White House transcript · primary-source speech"
  access_tier: T1
  reachable_at: https://bidenwhitehouse.archives.gov/briefing-room/speeches-remarks/2023/04/27/remarks-by-national-security-advisor-jake-sullivan-on-renewing-american-economic-leadership-at-the-brookings-institution/
  verified: confirmed
  verified_how: Search confirmed speaker, date (2023-04-27), venue, and content (industrial strategy rationale; three criteria for support).
  complexity: language conventionality — political register; read for claims, not applause lines
  time_estimate: 30
- id: S13
  citation: "America's Zero-Sum Economics Doesn't Add Up · Posen · 2023 · Foreign Policy (note: Foreign Policy, not Foreign Affairs) · named-author essay"
  access_tier: T2
  reachable_at: https://foreignpolicy.com/2023/03/24/economy-trade-united-states-china-industry-manufacturing-supply-chains-biden/ (may be metered; free alternative — Posen's Marketplace interview, April 2023)
  verified: confirmed
  verified_how: Search confirmed author, title, venue, year, and core argument (zero-sum reshoring backfires on jobs, innovation, decarbonisation; coordinate with allies instead).
  complexity: levels of meaning — polemic; separate the testable claims from the rhetoric
  time_estimate: 30
- id: S14
  citation: "No Trade Is Free: Changing Course, Taking on China, and Helping America's Workers · Lighthizer · 2023 · Broadside Books · book"
  access_tier: T4
  reachable_at: Book (library/purchase)
  paired_with: free substantive reviews — Law & Liberty ("The Tariff Man Cometh", lawliberty.org) and the PBS Firing Line interview with Lighthizer
  verified: confirmed
  verified_how: Search confirmed title, author, year, publisher, and core stance (balanced trade; efficiency secondary to workers' lives; aggressive tariff use).
  complexity: knowledge demands — a practitioner's brief, not a study; read AS an argument
  time_estimate: 45 (review + interview route)
```

---

## Provenance

All sources verified by web search on 2026-07-27 (titles, authors, years, venues, and the claims
attached to them, at abstract/summary level — full texts not read end-to-end). S7 is the sole
`unconfirmed` entry; see its detail. The truce status (10% rate, expiry 2026-11-10) is current as
of generation date and will go stale at or before that date — re-check S6 and S8 if used after
November 2026.
