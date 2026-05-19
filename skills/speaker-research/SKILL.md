---
name: speaker-research
description: Research and shortlist target speakers for B2B marketing events — webinars, fireside chats, customer panels, podcast guests, virtual summits, conference sessions, and roadshow keynotes. Use this skill whenever the user asks for help finding, sourcing, or identifying speakers, panelists, podcast guests, fireside-chat guests, customer advocates to put on stage, or "people like X" for an event — even if they phrase it informally ("we need 5 CISOs for our Q3 webinar", "looking for speakers like Jane Doe at Acme", "who could we book as a keynote for our user conference", "build me a lookalike list of speakers"). Trigger on phrases like "speaker list", "lookalike speakers", "find speakers", "panelists", "keynote", "fireside guest", "podcast guest", "webinar speakers", "target speakers", or any request where the user names one or more example/seed speakers and wants similar people. Do NOT trigger for venue or event-format planning (that's venue-research) or for full event-budget planning (that's the budget skill).
---

# Speaker Research for B2B Marketing Events

## What this skill does

Helps a B2B marketer (or anyone owning webinars, field events, customer marketing, virtual summits, or thought-leadership programs) build a ranked, deduplicated, competitor-filtered shortlist of 10–20 target speakers for a specific event. The output is opinionated enough that the user can start outreach to their top 3–5 picks the same day.

## Why this skill exists

Speaker quality is the single biggest driver of registration, attendance, and on-event NPS for B2B marketing events. The same content with a Forrester analyst, a recognized CISO from a Fortune 500, or a well-followed practitioner converts dramatically differently than with a generic vendor employee. But sourcing those people is brutal work — the user usually starts with two or three names they admire ("someone like Jane Doe at Acme") and has to manually expand that into a list of 15+ similar people, while remembering to exclude direct competitors, while staying inside the persona the audience will actually show up for.

This skill exists to do that expansion the right way: anchor on the user's seed list, expand via three complementary sources (LinkedIn lookalikes, competitor event rosters, industry conference rosters), apply the user's hard competitor filter, and surface reachability signals so the user knows which names to chase first.

## Step 1 — Gather the required inputs

Before doing any research, confirm you have all of the following. If **any** are missing from the user's message, ask for **all missing ones in a single follow-up message** — never one at a time. Iterative questioning wastes the user's time and they have explicitly stated this preference.

**Required:**

1. **Seed speakers (3–8 ideal)** — Names of people the user would love to have, with the person's company and title if known. These anchor the entire search. If the user can only give 1–2 names, that's fine but flag that the lookalike search will be noisier — ask if they can add 1–2 more. Examples:
   - `Wendy Nather, Head of Advisory CISOs at Cisco`
   - `Andy Ellis, formerly CSO at Akamai`
   - `someone like the security leader at Stripe — I forget her name`

2. **Qualitative description of the ideal speaker** — What ties the seed list together. Capture as much of this as the user offers, and ask for what's missing:
   - **Seniority** — VP+, Director+, IC practitioner, board-level, analyst?
   - **Industry / vertical** — financial services, healthcare, public sector, cross-industry?
   - **Company profile** — Fortune 500 only? Hyperscaler? Series B–D startup? Mix?
   - **Expertise / topic** — what should they be able to speak to (e.g., "running a SOC at scale", "zero trust rollout", "post-quantum migration")
   - **Geography** — North America only? EMEA? APAC? Global is fine for virtual events but matters for in-person
   - **Demographic mix goals** — many B2B marketers explicitly want diverse panels; ask if there are representation goals (gender, race, geography, company size mix). Treat this as input, not as something to assume.
   - **"Voice / personality" notes** — punchy contrarian? Calm subject-matter authority? Storyteller? Optional but useful.

3. **Competitor list (REQUIRED — do not skip)** — Explicit list of companies whose employees must be excluded from the final shortlist. Always ask, even if the user seems to assume it's obvious. Examples: "exclude anyone currently at Okta, Ping, ForgeRock, OneLogin". Treat the user's answer as authoritative — do not infer competitors from product category or "I think these are competitors". If the user says "I'll let you guess", push back once and ask them to name 3–10 specifically; if they still won't, infer from the seed speakers' apparent industry and surface the inferred list back to them for confirmation before filtering.

4. **Event context** — Enough to judge speaker fit:
   - **Format** — webinar, fireside chat, panel, keynote, podcast, virtual summit session, in-person session
   - **Audience persona** — who is registering / attending (role, seniority, industry)
   - **Date / timing** — affects who's already over-committed at that time of year (e.g., RSA week, Black Hat week, Dreamforce week)
   - **In-person vs. virtual** — virtual opens up the geography, in-person constrains it
   - **Shortlist size** — default 15 if the user doesn't specify; offer 10/15/25 if they want a number

**Optional but valuable:**

5. **"Why would they say yes" hook** — Anything the user can offer a speaker (audience size, distribution, paid honorarium, co-marketing, the user's executive on stage with them). Helps rank reachability later.

6. **Speakers to exclude beyond the competitor filter** — People the user has already approached, burned out on, or who have spoken at the user's events too recently.

If the user gave a partial answer, acknowledge what you have and ask only for what's missing.

## Step 2 — Reference the audience persona file (if it exists)

The plugin maintains a shared audience-research file used across skills:

**Path:** `~/.claude/event-marketing/audience-research.md`

If the file exists and contains an entry for the user's audience persona (e.g., "Enterprise CISOs", "DevOps managers", "RevOps leaders"), read it. Use any notes about what this audience responds to, which speakers they already over-index on, and which conferences they actually attend — these are direct inputs to who you'll surface.

If the file doesn't exist or has no relevant entry, skip this step. Do not block on it.

## Step 3 — Source the long list (parallel, three sources)

Three sources, in parallel where possible. Each contributes different signal. Aim for ~30–60 raw candidates before filtering and ranking.

### Source A — LinkedIn lookalikes from the seed companies

For each seed speaker, identify:
- **Their current company** and 5–10 **peer companies** (similar size, similar industry, similar product category). For each peer company, search LinkedIn for people with the **same or adjacent title** as the seed speaker. Adjacent titles matter — "Head of Security Engineering" and "VP, Security" and "Chief Security Architect" all live in the same persona.
- **Other people at the seed speaker's own company** with similar titles — sometimes the lookalike of "Jane Doe at Acme" is "John Smith, also at Acme but two levels down and a stronger storyteller".

Use LinkedIn search URLs the user can paste into their own session if direct scraping isn't possible. Example construction:
```
https://www.linkedin.com/search/results/people/?keywords=CISO&currentCompany=%5B"<companyId>"%5D
```
You don't always have access to LinkedIn's company IDs, so a name-based fallback (`keywords="CISO" AND "Stripe"`) is fine. If you can't fetch LinkedIn results directly, do a Google search constrained to `site:linkedin.com/in` for the title + company combination.

For each candidate found, note:
- Name, current title, current company
- Whether they are currently at one of the user's listed competitors (HARD filter — exclude in Step 5)
- A link to their LinkedIn profile or to the source page

### Source B — Speakers at competitors' webinars, podcasts, and events

This is the highest-signal source and is often overlooked. People who have spoken at a competitor's webinar or event are:
- Demonstrably willing to do this kind of speaking gig
- Already vetted by an adjacent marketing team
- Likely to fit the user's audience because the user and the competitor share an ICP

**Search approach:**
1. For each competitor, search the web for:
   - `"<competitor>" webinar speakers`
   - `"<competitor>" "fireside" OR "panel" OR "speaker"` site-restricted to the competitor's own domain
   - `<competitor> podcast guests` — many vendors run podcasts and the guest list is public
   - `<competitor> "user conference" OR "summit" agenda` — look at the past 2 years of agendas
2. Pull the **named guest/speaker** from each event, along with their title and company **as listed at the time of the event** — then verify their **current** title and company (people move; the version on a 2023 webinar page is often stale).
3. **Then exclude** anyone whose current employer is the competitor itself (those are the competitor's own staff, not lookalike candidates). The valuable names here are the **external** speakers — customers, analysts, partners, practitioners — that the competitor was able to book.

For each candidate, note the **source event/webinar URL** so the user can see exactly what kind of session this person already agreed to do.

### Source C — Industry conference and podcast speaker rosters

Pick 3–6 conferences and 3–6 podcasts that match the user's audience persona and topic. The user may name some; if not, infer from the seed speakers' bios (people typically list past speaking gigs) and from the audience description.

Examples by space (illustrative, not exhaustive — research the right ones for the user's domain):
- **Security:** RSA, Black Hat, BSides, Defcon, Gartner Security & Risk Summit, Risky Business podcast, CISO Series podcast
- **DevOps / platform:** KubeCon, QCon, SREcon, Platform Engineering Day, The Changelog podcast
- **Data / AI:** Snowflake Summit, Databricks Data+AI Summit, NeurIPS, Latent Space podcast
- **RevOps / GTM:** SaaStr, Pavilion events, Topline podcast, GTM Now
- **Customer / CX:** Pulse (Gainsight), Customer Success Festival
- **Marketing / events:** B2B Marketing Exchange, MarketingProfs B2B Forum

For each conference: pull the past 1–2 years of agendas/speaker pages. For each podcast: pull the last 12–24 months of guest lists. Filter to titles that match the persona. Many of these names will overlap with Source A and B — that's good, repeated appearance is a reachability signal (see Step 6).

## Step 4 — Verify current role for every candidate

Speaker titles and companies churn constantly. Before ranking, verify each candidate's **current** title and company. The cheapest check is a Google search for `"<name>" linkedin` and reading the title on the LinkedIn search result snippet, or fetching their LinkedIn profile page if accessible.

Update the candidate record with the verified current title + company. Note the verification date.

If a candidate has moved to a competitor company since their last public talk, they get filtered out in Step 5. If a candidate has moved to a company that is itself an interesting lookalike, upgrade their fit score.

## Step 5 — Apply the competitor filter (HARD)

For every candidate, check current employer against the user's competitor list. Exclude anyone whose current employer matches, including subsidiaries and recently-acquired brands the user named.

This is a hard filter — do not present a competitor employee as a candidate even with a "but..." caveat. The one exception is if the user explicitly said "include people from competitors and let me decide" — in that case mark them clearly so the user can see and choose.

**Soft signal (do not filter, but flag):** if a candidate has spoken at a competitor's webinar or event within the **last 6 months**, mark them with a `⚠ recent competitor stage` flag. They may have a contractual or relationship reason to space out their next vendor appearance — outreach should acknowledge that.

## Step 6 — Score and rank

For each remaining candidate, assign a fit score on three dimensions:

1. **Persona fit (0–3)** — How closely does their current title, company, and apparent expertise match the user's qualitative description?
2. **Lookalike strength (0–3)** — How tightly do they cluster with the seed speakers? (Same title at a peer company = 3. Adjacent title at an adjacent company = 2. Same persona but stretched = 1.)
3. **Reachability (0–3)** — Compound signal:
   - Has spoken at a vendor webinar / podcast in the last 12 months (+1)
   - Active on LinkedIn (posts, comments) in the last 90 days (+1)
   - Has a personal podcast, Substack, or book (+1, they are clearly building an audience and benefit from your distribution)
   - User has a warm intro path (the user mentioned a mutual contact, the candidate has worked at a customer of the user's company, etc.) (+1, cap at 3)

Total score = sum (max 9). Sort descending. Break ties in favor of people the user has not previously approached.

## Step 7 — Format the output

Deliver as a ranked table the user can paste into a sheet, plus a short narrative cover note.

**Cover note (3–5 sentences):**
- How many candidates were sourced raw, how many survived the competitor filter
- Which seed speakers proved most generative (i.e., produced the most lookalikes)
- Any notable gaps the user should be aware of (e.g., "couldn't find any healthcare CISOs at >$10B companies who weren't at your competitor list — may need to expand the company filter or accept Director-level")
- Top 3 picks called out by name with the one-line reason for each

**Table columns (in this order):**

| Rank | Name | Current title @ company | Why they fit | Reachability signals | Source / link | Watchouts |

Field guidance:
- **Why they fit (1–2 lines)** — Tie back to the seed speakers or qualitative criteria. E.g., "Direct peer of Jane Doe — same title at a similar-scale fintech." Not generic flattery.
- **Reachability signals** — Comma-separated facts, not paragraphs. E.g., "Spoke on Stripe Sessions 2024; active on LinkedIn; hosts own podcast."
- **Source / link** — The single most useful URL. LinkedIn profile if they're a "find them and message them" target, the past-talk URL if the user should reference that talk in outreach.
- **Watchouts** — Use sparingly. Examples: `⚠ recent competitor stage (Okta webinar, Feb 2026)`, `⚠ unverified current role`, `⚠ may be in quiet period (company just IPO'd)`.

Cap the table at the requested shortlist size. Below the table, list 5–10 honorable mentions in a single line each — sometimes the user wants to see who *almost* made it.

## Step 8 — Offer follow-ups

After delivering, offer 2–3 concrete next steps. Don't ask all of them — pick the ones that match the user's context:

- "Want me to draft outreach messaging for the top 3?"
- "Want me to expand the LinkedIn search to <adjacent persona>?"
- "Want me to save this shortlist to `~/.claude/event-marketing/speakers/<event-name>.md` so you can refer back to it?"
- "Want me to cross-check the top picks against your CRM export to flag anyone already in an active deal?" (only if the user has mentioned a CRM context)

## Persistent state — saving shortlists

Optional. If the user agrees, save the shortlist to:

```
~/.claude/event-marketing/speakers/<event-name-slug>.md
```

Format: the cover note + the table + the date the list was generated + the competitor list used at the time. This lets future sessions reference past lists ("don't show me anyone I already had on the Q1 webinar list") and lets the user diff lists over time.

If `~/.claude/event-marketing/` does not exist, create it (`mkdir -p`). Do not write inside the plugin directory — the plugin is git-distributed and writes there will be lost.

## What this skill does NOT do

- **Outreach drafting** — Out of scope. Offer it as a follow-up but don't volunteer a draft inside the shortlist response.
- **Honorarium / contracting negotiation** — Out of scope.
- **Venue or AV planning** — Use `venue-research`.
- **Full event budget** — Use the `budget` skill.
- **Speaker bureau lookup** — These rarely produce the right kind of B2B practitioner; mention them only if the user specifically asks about paid keynote bookings (e.g., for headline keynotes at user conferences). In that case, name Leading Authorities, WSB, and CAA Speakers Bureau as starting points, but emphasize that for most B2B webinar/panel use cases, direct LinkedIn outreach is faster and cheaper.

## Examples of strong vs. weak entries

**Strong entry:**
> **#3 — Kelly Shortridge** — VP of Security Products @ Fastly
> *Why fit:* Direct peer of your seed pick Andy Ellis (both ex-Akamai-adjacent, both write publicly on resilience engineering). Punchy, contrarian voice your audience over-indexes on.
> *Reachability:* Active on LinkedIn weekly; co-author of *Security Chaos Engineering* (O'Reilly); spoke at QCon SF 2024.
> *Source:* https://www.linkedin.com/in/kellyshortridge/
> *Watchouts:* None.

**Weak entry (do not produce this):**
> **#3 — Some Person** — VP of Security @ A Big Company
> *Why fit:* Senior leader in security at a large company.
> *Reachability:* Probably reachable.
> *Source:* google.com

The strong version names a specific reason, cites verifiable public artifacts, and gives the user a single best link to start with. The weak version is generic and the user has to do the work themselves.
