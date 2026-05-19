---
name: sponsor-research
description: Research and shortlist target sponsor companies (and the specific human inside each company to contact) for B2B marketing events — user conferences, virtual summits, industry events, webinar series, customer roadshows, field-event circuits, and podcast sponsorship slates. Use this skill whenever the user asks for help finding, sourcing, or identifying sponsors, sponsorship targets, exhibitors, partners-to-fund-an-event, or "companies like X" who might sponsor — even if they phrase it informally ("who could sponsor our user conference", "build me a list of 30 logos to pitch", "lookalike sponsor list", "companies similar to <Sponsor X> that might sponsor us"). Trigger on phrases like "sponsor list", "sponsorship targets", "find sponsors", "lookalike sponsors", "exhibitors", "who could fund this event", "companies to pitch for sponsorship", or any request where the user names example/seed sponsor companies and wants similar ones plus the right contact inside each. Do NOT trigger for finding speakers (that's speaker-research), venues (that's venue-research), or building an event budget (that's the budget skill).
---

# Sponsor Research for B2B Marketing Events

## What this skill does

Helps a B2B marketer building a sponsor pipeline for an event — user conference, virtual summit, webinar series, customer roadshow, podcast, or industry-event presence — produce a ranked shortlist of 15–40 target sponsor **companies**, each paired with the **specific human inside that company** most likely to own the sponsorship decision. The output is opinionated enough that the user can start outreach the same day.

## Why this skill exists

Sponsor sourcing is two problems stacked on top of each other and most marketers do them sloppily:

1. **Which companies should we even pitch?** The cleanest answer is "companies whose ICP overlaps materially with our attendee list, who have demonstrated willingness to spend on event sponsorship in the last 12 months, and who aren't direct competitors." Most lists fail at least one of those three tests.
2. **Who at that company actually decides?** Title varies wildly by company size. At a $50M-ARR startup the CMO signs the sponsorship contract; at a $5B public company it's a Director of Field Marketing assigned to a specific vertical or region. Sending a generic outreach to `marketing@<company>` is how 90% of sponsor pitches die.

This skill expands a small seed list into a defensible long list, layers in three sources of "they actually spend on this" signal, applies a hard competitor filter, and resolves each target company to a named human with a verifiable current title.

## Step 1 — Gather the required inputs

Before researching anything, confirm you have all of the following. If **any** are missing from the user's message, ask for **all missing ones in a single follow-up message** — never one at a time. Iterative questioning wastes the user's time.

**Required:**

1. **Description of the target sponsor company profile** — Qualitative. Capture as much as the user offers and ask for what's missing:
   - **What they sell / product category** — e.g., "developer tools that sell to platform teams", "security vendors selling to CISOs", "data infra companies", "RevOps tooling"
   - **Stage / size** — Series A–B startups? Series C–D scale-ups? Public companies? Mix?
   - **Why they would sponsor specifically *this* event** — what's the audience overlap? (E.g., "our attendees are CISOs, we want vendors who sell to CISOs and would pay to be in front of 500 of them")
   - **Geography** — are they fine with global / virtual, or do they need to be NA-based / EMEA-based, etc.?
   - **Budget tier expectations** — are these companies that would pay $10K, $50K, $250K? Affects which companies are realistic.

2. **Seed sponsor companies (3–8 ideal)** — Companies the user already wants on the list, or companies whose lookalikes the user wants. These can be:
   - Past sponsors of the user's events
   - Sponsors of competitor / peer events the user has seen
   - Aspirational "would love to land" logos
   - For each, ask the user to note **why they listed it** (past sponsor / aspirational / sponsors-a-similar-event) — this changes how the lookalike search runs.

3. **Target titles inside the sponsor company** — Who, by title, the user wants to reach. Common patterns:
   - Field / event marketing: `Head of Field Marketing`, `Director of Field Marketing`, `VP Field & Event Marketing`, `Event Marketing Manager`
   - Demand gen: `Head of Demand Gen`, `VP Marketing`, `VP Demand`
   - Partnerships: `Head of Partner Marketing`, `Director of Partnerships`, `VP Alliances`
   - Top of house: `CMO`, `VP Marketing`
   - Vertical / segment plays: sometimes a segment leader (`Director, Enterprise Marketing` or `Head of FSI Marketing`)
   Ask the user for **2–4 titles in priority order** — at smaller companies fall back to the higher / broader title, at larger companies use the more specific one.

4. **Companies to exclude (your competitors)** — Companies whose employees / logos must NOT appear on the shortlist. Always ask, even if the user seems to assume it's obvious. Sponsoring your event from a direct competitor is almost never a fit. If the user says "I'll let you guess", push back once and ask them to name 3–10 specifically; if they still won't, infer from the user's apparent product category and surface the inferred list back for confirmation before filtering.

5. **Event context** — Enough to judge sponsor fit:
   - **Event format** — user conference, virtual summit, webinar series, podcast sponsorship, roadshow circuit, single field event
   - **Audience persona and approximate size** — who is attending, how many, seniority mix
   - **Event date or window** — affects whether a sponsor's current-quarter budget is still open
   - **Shortlist size** — default 25 if the user doesn't specify; offer 15 / 25 / 50

**Optional but valuable:**

6. **What the user offers sponsors** — Tier structure, logo placement, speaking slot, attendee data share, branded experiences, podcast read, post-event content. Useful for matching sponsor type to tier.

7. **Companies to exclude beyond the competitor list** — Past sponsors the user has burned out on, companies in legal disputes with the user, anyone explicitly blocklisted.

If the user gave a partial answer, acknowledge what you have and ask only for what's missing.

## Step 2 — Reference the audience persona file (if it exists)

The plugin maintains a shared audience-research file used across skills:

**Path:** `~/.claude/event-marketing/audience-research.md`

If the file exists and contains an entry for the user's audience persona (e.g., "Enterprise CISOs", "Platform engineering managers", "RevOps leaders"), read it. Use any notes about which vendor categories sell to that audience — these are direct sponsor-target candidates.

If the file doesn't exist or has no relevant entry, skip this step. Do not block on it.

## Step 3 — Source the long list of target companies (parallel, three sources)

Three sources, in parallel where possible. Aim for ~40–80 raw company candidates before filtering and ranking.

### Source A — Lookalikes of the seed sponsor companies

For each seed company, identify:
- **Direct peers** — same product category, similar stage, similar GTM motion. (E.g., if the seed is `Snyk`, peers are `Veracode`, `Checkmarx`, `Sonatype`, `Endor Labs`, `Semgrep`.)
- **Adjacent categories** that sell to the same buyer — if your audience is CISOs and a seed sponsor is an EDR vendor, lookalikes include IAM vendors, SIEM vendors, network security vendors, etc. — all selling to the same persona.
- **One category up and down the stack** — companies whose product complements the seed company's product (and so are in the same buyer's portfolio).

Useful sources: Crunchbase / PitchBook for category competitors, G2 / Gartner Magic Quadrant / Forrester Wave reports for product-category sets, the seed company's own "competitors" section on G2.

### Source B — Sponsors of competitor / peer events

This is the highest-signal source. A company that paid to sponsor a competitor's user conference last year has demonstrated **three things at once**: budget, willingness to spend on this kind of marketing, and a belief that this audience matters to their pipeline.

**Search approach:**
1. Identify 4–8 events whose audience overlaps with the user's — the user's named competitors' conferences first, then adjacent vendor conferences, then industry conferences (RSA, KubeCon, SaaStr, etc.).
2. For each event, search for sponsor / exhibitor lists. Useful query patterns:
   - `"<event name> 2025" sponsors`
   - `"<event name> 2025" exhibitors`
   - `site:<event-domain> sponsor` and `site:<event-domain> partner`
   - Look at the event's "Thank you to our sponsors" page (almost every event has one)
3. Pull every company name + their sponsorship tier where visible. Tier signals budget — a `Platinum` sponsor at a major conference spent $100K+; a `Bronze` sponsor spent $10–25K. Note tier in the candidate record.
4. **Filter out** any sponsor that is the user's direct competitor (Step 5) — but keep sponsors that are themselves competitors-of-competitors, since that often signals an active market battle and a willing budget.

For each candidate company, note **which event/year they sponsored** so the user can reference it in outreach ("I saw you sponsored Re:Inforce 2025 — wanted to flag a similar opportunity...").

### Source C — Sponsors of industry conferences and trade publications

Pick 3–6 industry conferences and 2–4 trade publications / podcasts that match the user's audience persona. The user may name some; if not, infer from the seed companies' typical event presence and from the audience description.

Examples by space (illustrative — research the right ones for the user's audience):
- **Security:** RSA, Black Hat, Gartner Security & Risk Summit, AWS Re:Inforce, FS-ISAC; podcasts: Risky Business, CISO Series
- **DevOps / platform:** KubeCon, QCon, SREcon, Platform Engineering Day; podcasts: The Changelog, Software Engineering Daily
- **Data / AI:** Snowflake Summit, Databricks Data+AI Summit, AI Engineer Summit; podcasts: Latent Space, Practical AI
- **RevOps / GTM:** SaaStr Annual, Pavilion CMO Summit, Forrester B2B Summit; podcasts: Topline, GTM Now
- **Customer / CX:** Pulse (Gainsight), Customer Success Festival
- **Marketing / events:** B2B Marketing Exchange, MarketingProfs B2B Forum, Inbound

Pull sponsor / exhibitor lists from the last 1–2 years. Pull current sponsor slate from podcasts (look at the last 5–10 episodes for read-aloud sponsor mentions; podcast sponsor lists are also often on the show's website).

### Cross-source dedupe

Companies that appear in **multiple** sources are higher-confidence signals. After all three sources are pulled, dedupe by canonical company name and record which sources each company came from — this is a direct input to the reachability score in Step 6.

## Step 4 — Resolve each company to a specific human

For every surviving company, find the actual person whose title best matches the user's target-title list (Step 1, item 3).

**Resolution approach:**
1. For each company × each target title (in user's priority order), do a LinkedIn search. Useful query patterns:
   - `site:linkedin.com/in "<Title>" "<Company>"`
   - LinkedIn search URL: `https://www.linkedin.com/search/results/people/?keywords=<title>%20<company>`
2. If no exact title match, walk down the user's priority list. If still nothing, broaden to adjacent titles (e.g., if `Head of Field Marketing` returns nothing, try `Field Marketing Manager` or `Director of Demand Gen`).
3. If the company is small (<$50M ARR-equivalent), it's normal for the right person to have a broader title — fall back to `VP Marketing` or `CMO`.
4. For each matched person, capture: name, current title, LinkedIn URL, and **verification date**. If you cannot directly verify a current title, mark the entry as `⚠ unverified current title` and prefer companies where you could verify over those where you couldn't.

If a company genuinely has no matching contact under any acceptable title, it goes in honorable mentions, not the main list — a sponsor target without a person to email is not useful.

## Step 5 — Apply the competitor filter (HARD)

For every company on the candidate list, check against the user's exclusion list. Exclude any company whose name (or parent, or recently-acquired subsidiary the user named) matches.

This is a hard filter — do not present a competitor as a sponsor candidate even with a "but they're a special case" caveat. The one exception is if the user explicitly said "include competitors and let me decide" — in that case mark them clearly so the user can sort them out themselves.

**Soft signal (do not filter, but flag):** if a candidate company **sponsored a direct competitor's event in the last 6 months**, mark them with a `⚠ recently sponsored <Competitor>'s event` flag. The user may want to acknowledge that in outreach ("noticed you sponsored X — we run something similar with a different audience cut") rather than ignore it.

## Step 6 — Score and rank

For each remaining company, assign a fit score on three dimensions:

1. **Audience overlap (0–3)** — How tightly does this company's ICP match the user's attendee persona? (Direct overlap = 3. Adjacent buyer in the same org = 2. Tangential = 1. If <1, drop it — don't waste a row on a stretch.)
2. **Spend signal (0–3)** — Compound from Source B/C findings:
   - Appears as a sponsor in 1+ peer/competitor event in the last 12 months (+1)
   - Appears in 2+ events (+1 more, max +2)
   - Was a high-tier sponsor (Gold/Platinum/Diamond) at a major event (+1)
3. **Reachability (0–3)** — Compound signal on the *company* (not just the contact):
   - Recent funding round in the last 12 months (+1, marketing budget tends to expand post-raise)
   - Hiring for field/event marketing roles right now (+1, signals the team is actively building)
   - User has a warm path (mentioned a mutual contact, past customer relationship, etc.) (+1)
   - Cap at 3.

Total score = sum (max 9). Sort descending. Break ties in favor of companies the user has not previously approached.

If a company scored well but has `⚠ unverified current title` on the contact, push it one rank lower than its score would suggest — the value of a sponsor target collapses without a verified human to email.

## Step 7 — Format the output

Deliver as a ranked table the user can paste directly into a sheet or CRM, plus a short narrative cover note.

**Cover note (3–5 sentences):**
- How many companies were sourced raw, how many survived the competitor filter, how many resolved to a named contact
- Which seed companies proved most generative
- Notable gaps (e.g., "couldn't find any data-infra companies in the >$1B revenue band who weren't on your exclusion list — may need to expand the company stage or lower the title")
- Top 3 picks called out by name with the one-line reason for each

**Table columns (in this order):**

| Rank | Company | Score | Contact (name, title) | LinkedIn | Why they fit | Spend signal | Watchouts |

Field guidance:
- **Why they fit (1–2 lines)** — Tie back to the seed companies or the audience-overlap thesis. E.g., "Direct peer of Snyk — sells to platform engineering buyers who overlap heavily with your audience." Not generic flattery.
- **Spend signal** — Concrete artifact: `Platinum sponsor, KubeCon NA 2025`, `Bronze sponsor, AWS Re:Inforce 2025`, `Sponsored Risky Business podcast in 2025`. If there is no spend signal beyond "they exist", say so honestly (`No recent sponsorship visible`) — that's still useful information; the user knows it's a cold pitch.
- **Watchouts** — Use sparingly. Examples: `⚠ unverified contact title`, `⚠ sponsored <Competitor> 3 months ago`, `⚠ recent layoffs reported`, `⚠ acquisition in progress`.

Cap the table at the requested shortlist size. Below the table, list 8–15 honorable mentions (one line each: company + reason it didn't make the cut, e.g., "couldn't resolve a contact", "no spend signal", "tangential audience").

## Step 8 — Offer follow-ups

After delivering, offer 2–3 concrete next steps. Don't ask all of them — pick the ones that match the user's context:

- "Want me to draft outreach messaging for the top 5 contacts?"
- "Want me to expand the search to <adjacent persona / vertical>?"
- "Want me to cross-check the top picks against your CRM export to flag anyone already in pipeline?" (only if the user has mentioned a CRM context)
- "Want me to save this sponsor list to `~/.claude/event-marketing/sponsors/<event-name>.md` so you can refer back to it?"

## Persistent state — saving shortlists

Optional. If the user agrees, save the shortlist to:

```
~/.claude/event-marketing/sponsors/<event-name-slug>.md
```

Format: cover note + the table + the date the list was generated + the competitor exclusion list used at the time. This lets future sessions reference past sponsor lists ("don't show me anyone I already pitched for the Q1 event") and lets the user diff across events.

If `~/.claude/event-marketing/` does not exist, create it (`mkdir -p`). Do not write inside the plugin directory — the plugin is git-distributed and writes there will be lost.

## What this skill does NOT do

- **Outreach drafting** — Out of scope. Offer it as a follow-up but don't volunteer a draft inside the shortlist response.
- **Sponsorship pricing / tier design** — Out of scope.
- **Speaker sourcing** — Use `speaker-research`. (Note: a sponsor's CEO speaking on your stage is sometimes part of a sponsorship deal — but the sponsor-pitch and the speaker-booking are separate motions; this skill handles the company-and-contact pitch only.)
- **Venue or AV planning** — Use `venue-research`.
- **Full event budget** — Use the `budget` skill.

## Examples of strong vs. weak entries

**Strong entry:**
> **#4 — Vanta** — Score: 8/9
> *Contact:* Sarah Chen, Head of Field Marketing — https://www.linkedin.com/in/sarahchen-example/
> *Why fit:* Direct peer of your seed sponsor Drata. Sells compliance automation to security and engineering leaders — exact ICP overlap with your CISO + security-VP audience.
> *Spend signal:* Gold sponsor at SaaStr Annual 2025; sponsored CISO Series podcast Q3 2025.
> *Watchouts:* `⚠ sponsored Wiz's event 2 months ago — acknowledge in outreach`.

**Weak entry (do not produce this):**
> **#4 — Some SaaS Company** — Score: 7/9
> *Contact:* unknown contact
> *Why fit:* They are in SaaS and probably care about security.
> *Spend signal:* They have money.

The strong version names a specific person, cites verifiable events, ties back to a seed sponsor, and gives the user a single best link to start with. The weak version is generic and unactionable.
