---
name: venue-research
description: Entry point for B2B event marketers sourcing venues for customer- or prospect-facing events — executive dinners, dinners, happy hours, workshops, mini-conferences, ancillary tradeshow events, and exclusive VIP experiences (Sphere tours, F1 hospitality, helicopter rides, weekend getaways, concerts, golf with a pro). Use whenever a B2B event marketer is sourcing a venue OR an experience to engage prospects and customers. Trigger on phrases like "venue", "restaurant for a dinner", "happy hour spot", "event space", "experience for customers", "place to host", "workshop venue", "executive offsite", "VIP experience", "F1 suite", "Sphere tour". This skill handles intake for all event types and delegates experience sourcing to the experience-research skill internally. Do NOT trigger for personal events (weddings, birthdays) or conferences over 150 attendees.
---

# Venue Research for B2B Event Marketing

## What this skill does

Helps a B2B event marketer shortlist 5–8 well-fitted venues for a customer- or prospect-facing event. It is the single entry point — it handles intake for every event format, then either does the venue research itself (for fixed-location events findable on Google Maps) or delegates to the `experience-research` skill (for VIP experiences sourced from hospitality programs).

The skill reasons explicitly about **persona-to-venue fit**: not just budget and capacity, but whether the audience will accept the invite, show up, and feel respected when they walk in.

## Step 1 — Gather required inputs

Before any research, confirm you have all five inputs. If **any** are missing, ask for **all missing ones in a single follow-up message** — never iterate one at a time.

1. **Budget** — overall total OR per-person. Either is fine; infer the other.
2. **Persona** — who they're targeting (role, seniority, industry, plus any demographic detail offered, e.g. "C-level security execs, mostly men in their 40s–50s, US-based").
3. **Event goals** — what success looks like (top-of-funnel pipeline, accelerate stuck deals, expansion in existing accounts, executive relationship-building, IC community-building, recruiting).
4. **Expected turnout** — number of attendees.
5. **Location** — city, region, OR `anywhere` (the latter is valid for luxury experiences not tied to a city).

Acknowledge what the user already gave; ask only for what's missing.

## Step 2 — Confirm scope

This skill does NOT cover:
- Events with more than ~150 attendees
- Large public-facing conferences

If the request is out of scope, say so and offer an adjacent option (e.g., shortlisting a 100-person sub-event within a larger conference).

## Step 3 — Route: venue or experience?

After intake, classify the event family. **This is the most important decision in the skill** — get it right, then either continue or delegate.

| Event family | Path |
|---|---|
| Executive dinner / Michelin-style dinner / chef's table | Continue (Step 4) — Google Maps |
| Dinner (any persona / level) | Continue — Google Maps |
| Happy hour / cocktail mixer | Continue — Google Maps |
| Workshop / hackathon / hands-on session | Continue — Google Maps + Peerspace / Bizly |
| Mini-conference (sessions + networking + dinner) | Continue — Google Maps + The Vendry / Peerspace |
| Ancillary tradeshow event (dinner / happy hour near a convention center) | Continue — Google Maps anchored on convention center |
| Suite at a sporting event / concert / NBA / NFL / Taylor Swift / etc. | **Delegate to `experience-research`** |
| F1 / motorsports / Velocity Invitational / Goodwood / Monterey Car Week | **Delegate** |
| Sphere tour or buyout | **Delegate** |
| Helicopter ride / aviation experience | **Delegate** |
| Golf with a pro / golf hospitality (Masters, Ryder Cup, PGA Tour) | **Delegate** |
| Weekend luxury retreat at a destination resort | **Delegate** |
| Museum after-dark / cultural buyout | **Delegate** |
| Celebrity-led dinner or fireside chat | **Delegate** |
| Other "I want a unique VIP experience" with no fixed venue in mind | **Delegate** |

Mixed brief (e.g., "F1 weekend with a kickoff dinner the night before") → handle the dinner here AND delegate the F1 portion. State the split to the user before doing both.

### How to delegate

When the brief is an experience, invoke the experience-research skill using the Skill tool. Pass all collected intake in `args` as a compact summary:

```
Skill(
  skill: "event-marketing:experience-research"  # use the plugin-namespaced form; if that errors, fall back to "experience-research"
  args: "Budget: $X total ($Y per head). Persona: <details>. Event goals: <goals>. Turnout: <N>. Location: <city or 'anywhere'>. Notes: <anything else the user said, including specific experiences they named>"
)
```

Then **stop**. Let the experience-research skill produce the shortlist. Do not duplicate its work.

If the brief is a fixed-location venue, continue to Step 4.

## Step 4 — Read the audience research file

The persona research file lives **outside the plugin** at a user-level path so it persists across projects and survives plugin updates:

**Path:** `~/.claude/event-marketing/audience-research.md`

Always reference this exact path. Never write to a copy inside the plugin folder — the plugin is git-distributed and any writes there will be lost.

1. **Read** the file at that path.
2. **If the file does not exist**, create the directory (`mkdir -p ~/.claude/event-marketing`) and seed the file with the template at the bottom of this skill (see "Audience research file template"). Then proceed as if the file is empty.
3. **If the persona is documented** and `Last researched` is within ~6 months, use the existing entry.
4. **If not**, do fresh research via:
   - **Luma** (`lu.ma/discover`) — what events pull this audience now
   - **Eventbrite** — broader, older
   - **LinkedIn** — search competitor companies + `"hosted"` / `"thank you to everyone who joined us at"`. Reveals what other B2B companies have been doing for this persona.

   Then **append** findings to that same file using the entry template. Never fork into a new file.

## Step 5 — Build the candidate pool via Google Maps

WebFetch / WebSearch on Google Maps with category-specific queries:
- `"private dining room <city>"` / `"chef's table <neighborhood>"`
- `"upscale cocktail bar <neighborhood>"` / `"rooftop bar <city> private events"`
- `"event space <city>"` / `"corporate event venue <neighborhood>"`
- `"workshop space <city>"` (also check Peerspace, Splacer, Bizly, The Vendry, Convene)
- For ancillary tradeshow events, anchor the search on the convention center address.

Also include any **user-supplied candidate venues** in this pool — pull their Maps listing the same way so they're evaluated on equal footing.

**Build a candidate pool of 12–20 venues** that pass:
- Right category and neighborhood
- Rating ≥ 4.3 with ≥ 50 reviews (a 4.9 with 8 reviews is noise)
- Visibly still operating
- Plausible fit for the brief

Don't read individual reviews yet — just collect name, neighborhood, rating, review count, category.

## Step 6 — Narrow to 5–8 via reviews

For each candidate, read enough recent reviews (last ~18 months) to answer:
- Do they actually do private events at this headcount / layout?
- Does the crowd and ambiance match the persona?
- Recent service drops or ownership changes?
- Any standout signature touches (sommelier, chef's surprise course, view, quiet back room)?

**Disqualifying signal:** a run of recent reviews citing the same problem (service decline, new chef worse, etc.). Drop the venue even if the long-term average is still high.

**Weighting heuristic:** a 4.6 with 800 recent reviews beats a 4.9 with 60 old ones. Newer venues (open <12 months) need ≥100 reviews and ≥4.5 to clear the noise.

## Step 7 — Cross-reference

For your final 5–8, verify key claims (private room capacity, price tier, AV, booking process) against one secondary source:
- **Dining:** Michelin Guide, Resy, OpenTable, Tablet Hotels, Eater city guides, The Infatuation
- **Event spaces:** Cvent, Bizly, Peerspace, Splacer, The Vendry, Convene, hotel group event-sales pages (Four Seasons, Aman, Rosewood, Mandarin Oriental for high-end)
- **Recent press:** search `"best private dining rooms <city> 2025"` for newly-opened spaces

**Don't fabricate prices, links, or capacity.** Say "estimated" or "confirm directly" rather than inventing precision. Wrong numbers damage the user's credibility with their internal team.

## Step 8 — Reason about persona-to-venue fit

For each finalist, ask:
- **Status signal** — does this venue tell the guest "we respect your time and seniority"?
- **Conversation quality** — can people actually talk? Loud rooms kill the conversation the host paid to enable.
- **Peer density** — does the typical patron look like a peer of the guest?
- **Photo-worthiness** — will the guest want to post about it?
- **Logistical respect** — parking, proximity to where guests are staying, gracefully-handled dietary needs.

**Rank for fit, not prestige.** A well-matched mid-tier venue beats an over-the-top one that signals "we're trying too hard".

## Step 9 — Output

Markdown report in chat. Don't write a file unless asked.

```
# Venue shortlist: <event> — <city>

**Brief:** <one-line restatement: format, persona, headcount, budget, location, goal>

---

## 1. <Venue Name> — <Neighborhood>
**Why it fits:** <1–2 sentences tying to persona + goal>
**Capacity:** <private room: X | full buyout: Y>
**Estimated price:** <$X–Y per head | $Z total> — *confirm directly*
**Notable features:**
- <cuisine / format>
- <ambiance + crowd>
- <AV / private space / layout>
- <standout signature>
- <parking / accessibility>
**Booking:** <link or "events@venue.com — request private dining manager">
**Caveats:** <lead time, min spend, midweek-only, etc.>

## 2. <Venue Name> — ...
[same structure]

[5–8 total]

---

## How to proceed
**Top picks:** <top 1–2 with one sentence each on why>
**Confirm via direct outreach:** exact capacity, pricing/min spend, date availability, AV, dietary, accessibility
**Logistics flags:** peak-season, deposit/cancel terms, dietary lead time
```

## Rules of thumb

- 5–8 venues, not 15. Long lists signal indecision.
- Position 1 is your real recommendation. Rank for fit, not alphabetically or by price.
- Include one bold/unconventional option alongside safe picks if the brief allows.
- Be honest about what you can't verify. "Estimated", "based on recent reviews", "confirm directly" preserve trust.
- Respect the stated budget. If it seems off for the persona, flag once at the end.
- One move almost no one makes: tell the user to ask 5–10 actual target accounts what they'd love to do. Highest-leverage discovery step there is.

## Audience research file template

Use this exact content when seeding `~/.claude/event-marketing/audience-research.md` on first run:

```markdown
# Audience Research

Persistent notes on what types of events, venues, and experiences different B2B personas respond to. Skills in the event-marketing plugin (`venue-research`, `experience-research`, future skills) read from this file before fresh research, and append to it when researching a new persona.

**Path:** `~/.claude/event-marketing/audience-research.md`

## How to use

1. Before researching a new event for a persona, search this file for that persona (close-enough matches count — e.g. "CISO" covers "VP Security", "Head of Security").
2. If a match exists and `Last researched` is within ~6 months, use the existing entry. Do not re-research.
3. If no match or the entry is stale, do fresh research via Luma, Eventbrite, and LinkedIn. Then append a new entry below using the template.
4. For general-appeal experiences (F1, Sphere, Taylor Swift, weekend retreats, helicopter, golf), skip this file — reason from demographics.

## Entry template

### <Persona name — e.g. "CISO / VP Security at mid-market SaaS">
**Last researched:** YYYY-MM-DD
**Sources checked:** Luma (<queries>), Eventbrite (<queries>), LinkedIn (<competitor companies searched>)

**Event formats that pull this persona:**
-

**Hosts they accept invites from:**
-

**Format preferences (size, time of day, structure):**
-

**Signature experiences that have worked:**
-

**Avoid:**
-

**Notes:**
-

---

## Persona entries

<!-- Append new persona entries below, alphabetical by persona name. -->
```
