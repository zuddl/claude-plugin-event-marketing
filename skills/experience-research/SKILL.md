---
name: experience-research
description: INTERNAL skill — invoked by the venue-research skill (in this plugin) when an event is an experience rather than a fixed-location venue, OR invoked manually by the user with /experience-research. Sources VIP experiences from hospitality programs, suite brokers, motorsports/F1 corporate hospitality, golf-with-a-pro programs, Sphere, helicopter operators, museum buyouts, celebrity-led experiences, luxury weekend retreats, and novel curated experiences. DO NOT auto-trigger from general user messages about events, venues, dinners, happy hours, workshops, or conferences — venue-research is the entry point and will delegate here when appropriate. Only trigger when (a) called via the Skill tool by venue-research, or (b) the user explicitly references this skill by name or types /experience-research.
---

# Experience Research

## Invocation rules

This skill is **not** a general-purpose entry point. It is invoked in two ways:

1. **Delegated from `venue-research`** — after that skill collects intake (budget, persona, event goals, expected turnout, location) and determines the request is for an experience, not a fixed-location venue. The intake is passed in via `args`.
2. **Direct user invocation** — the user types `/experience-research` or explicitly references this skill.

When invoked directly (case 2) without intake context, gather the same five inputs first (Step 1 below). When delegated from `venue-research` (case 1), the inputs are already in the conversation — skip the intake step and use them.

## Step 1 — Confirm inputs (only if invoked directly)

Required:
1. **Budget** — total or per-person
2. **Persona** — role, seniority, industry, demographic detail
3. **Event goals** — what success looks like
4. **Expected turnout**
5. **Location** — city, region, or `anywhere` (valid for experiences not tied to a city)

If anything is missing, ask for all missing items in a single message.

## Step 2 — Read the audience research file

The persona research file lives at a user-level path so it persists across projects and survives plugin updates:

**Path:** `~/.claude/event-marketing/audience-research.md`

Always reference this exact path. Never write to a copy inside the plugin folder — the plugin is git-distributed and any writes there will be lost.

1. **Read** the file at that path.
2. **If the file does not exist**, create the directory (`mkdir -p ~/.claude/event-marketing`) and seed the file with the template that `venue-research` defines (see its "Audience research file template" section). Then proceed as if empty.
3. **If the persona is documented** and `Last researched` is within ~6 months, use the existing entry.
4. **If not**, do fresh research via **Luma** (`lu.ma/discover`), **Eventbrite**, and **LinkedIn** (search competitor companies + `"hosted"` / `"thank you to everyone who joined us at"`). Append findings using the entry template.
5. For **general-appeal experiences** (F1, Sphere, Taylor Swift, weekend retreats, helicopter, golf), skip persona-specific research — reason from demographics. These cross industries.

## Step 3 — Classify the experience type

Two parallel jobs:

- **A. Known experience** — user has named something specific ("F1 Miami suite", "Sphere group package", "Taylor Swift Eras Tour", "Pebble Beach golf with a pro"). Go direct to the official hospitality program or broker.
- **B. Novel discovery** — user wants ideas they haven't thought of. Browse curated sources for 2–4 unexpected, defensible picks.

Most briefs need both. Even when the user names a specific experience, add 1–2 novel options they can react to.

## Step 4 — Source playbook

### A. Known experiences — go direct to official programs / brokers

**Suite hospitality (any team, any venue):**
- SuiteHop
- Suite Experience Group
- Premier Sports & Concerts

**Premium ticketing:**
- Vivid Seats Premium
- StubHub Premium
- Ticketmaster VIP

**Event-specific official hospitality programs** (better inventory + on-site treatment than third-party):
- **On Location Experiences** — NFL, World Cup 2026, Ryder Cup, Olympics, Masters
- **QuintEvents** — F1, Kentucky Derby, Super Bowl, NBA
- **F1 Experiences / Paddock Club** — official F1 hospitality
- **PGA Tour Experiences** — corporate hospitality at tour events
- **Keith Prowse** — Wimbledon, Six Nations, Royal Ascot (UK-strong)
- **USTA premium hospitality** — US Open

**Motorsports / Velocity Invitational tier** (go to the event's own "Corporate Hospitality" page):
- Velocity Invitational
- Goodwood Revival / Festival of Speed
- Monterey Car Week (The Quail, Pebble Beach Concours — direct to their corporate sales)
- Rolex 24 at Daytona
- Le Mans (via ACO hospitality)

**Golf with a pro:**
- Excel Sports Management, Wasserman Golf, GSE Worldwide, IMG Golf — book tour pros and retired majors winners
- Charitybuzz — auctioned rounds with named pros
- Resort corporate days — Pebble Beach, Pinehurst, Streamsong

**Sphere (Las Vegas):**
- Sphere Entertainment corporate events team (direct)
- Suite packages via SuiteHop

**Aviation / scenic:**
- Blade — NYC, LA, Miami, Hamptons
- Maverick — Vegas, Grand Canyon
- Wheels Up — fixed-wing charter
- Local charter operators in target city

**Museum after-dark / cultural buyouts:**
- Direct to the museum's private events team. Every major museum has one:
  - Met, MoMA, Whitney, AMNH (NYC)
  - Getty, LACMA (LA)
  - SFMOMA, de Young (SF)
  - Art Institute of Chicago, Field Museum (Chicago)
  - Smithsonian (DC)
  - V&A, Tate (London)

**Celebrity-led dinners / fireside chats / surprise appearances:**
- **Mid-tier speaker bureaus:** Harry Walker Agency, Washington Speakers Bureau, Keppler, BigSpeak, Leading Authorities
- **Talent agencies (A-list, athletes, musicians):** CAA Speakers, WME, Wasserman, Octagon, 160over90
- **Auctioned experiences:** Charitybuzz

**Luxury weekend retreats:**
- Top-of-market hotel groups (direct to corporate events team): Aman, Rosewood, Four Seasons, Mandarin Oriental, Six Senses, Auberge Resorts, Belmond
- Bespoke design: Black Tomato, Inspirato Experiences, Brown + Hudson, Original Travel

### B. Novel discovery — browse curated sources

Pattern-match across these for unexpected ideas:

- **BizBash** — best single source for novel B2B activations. Quarterly "10 unique venues in <city>" and "innovative activations of the year" features.
- **Bespoke experiential agencies' case studies** (and many will custom-build): 160over90 (Endeavor), Engine Shop, Magnetic Collaborative, Inspira Marketing, Jack Morton Worldwide, George P. Johnson, Octagon, Wasserman Experiential
- **Luxury-experience marketplaces:** VeryFirstTo, Sotheby's Experiences, Christie's Lots, Inspirato Experiences, Cloud9 Living
- **Lifestyle / wealth media** (HNW psychographic = senior B2B exec psychographic): Robb Report, Departures (Amex Platinum), Bloomberg Pursuits, WSJ Off Duty, Condé Nast Traveler, Town & Country
- **Concierge service published content:** Quintessentially, Ten Lifestyle Group, Knightsbridge Circle, John Paul (Accor)
- **Atlas Obscura + city culture press:** Atlas Obscura for unusual + bookable (private observatories, hidden libraries, working scientific sites); NYT Style, LA Times, Time Out, The Infatuation Hit List, Eater "best new openings"
- **Members-only clubs' programming / buyouts:** Soho House, NeueHouse, Casa Cipriani, Core Club, The Battery, Chief
- **Pop-ups, residencies, time-limited:** Chef residencies, immersive theater + art (Meow Wolf, Punchdrunk descendants), major museum special exhibits with buyout potential
- **Competitor signal on LinkedIn:** search competitor companies + `"hosted"` / `"thank you to everyone who joined us at"` / `"had a great time at"`. Shows the bar competitors are setting.

### Vertical-specific angles (match the audience's identity)

Always check these for the user's vertical. These differentiate because competitors can't easily copy live:

- **Security / CISO:** private threat-intel briefings, Spy Museum buyouts, lockpick villages, custom CTF nights, hacker history tours
- **Finance:** NYSE bell ringing, trading-floor tours, private art-collection viewings, central bank archive tours
- **Tech / AI:** SpaceX or vintage Apollo hardware tours, AI lab visits, observatory nights
- **Aerospace:** private hangar dinners, vintage aircraft rides, flight-simulator sessions
- **Healthcare / biotech:** private lab tours, medical-history museum buyouts, Cold Spring Harbor-style retreats

## Step 5 — Build the candidate pool

Aim for **8–15 options** mixing:
- All user-named experiences (verified through the direct sources above)
- 2–4 novel discoveries you'd defend

For each, capture: experience name, vendor/provider, location, format (suite vs. buyout vs. private session vs. retreat), rough capacity, rough price tier.

## Step 6 — Filter to 5–8

Experiences mostly lack Google Maps review pools, so filter on:
- **Vendor reputation** — years operating, named clients they've delivered for
- **Recent press / case studies** — within last ~18 months. A glowing 2019 write-up means less than a quiet one from last quarter.
- **Attendee chatter on LinkedIn / X** — search the experience name + `"thank you"` / `"had a great time"`
- For agency-built custom experiences, the quality and recency of public case studies

## Step 7 — Persona-to-experience fit

Before finalizing, for each candidate:

- **Status signal** — does it tell the guest "we respect your time and seniority"?
- **Peer density** — will the rest of the room (other companies' guests, fellow attendees) read as peers?
- **Conversation quality** — can people actually talk during the experience, or is it pure spectacle? (Tradeoff is real: an F1 race during the race is loud; the paddock walk before is golden.)
- **Photo-worthiness** — will the guest want to post? Often matters for marketing reach.
- **Logistical respect** — travel logistics handled, dietary needs covered, no awkward gaps in the agenda
- **ICP preferences** — if the audience-research file or user input flags hobbies (whisky, classic cars, jazz, golf), lean into them.

**Rank for fit, not for prestige.** A perfectly-matched mid-tier experience beats an over-the-top one that signals "we're trying too hard".

## Step 8 — Output

Markdown report in chat. Don't write a file unless asked.

```
# Experience shortlist: <event> — <city or "various">

**Brief:** <one-line restatement: format, persona, headcount, budget, location, goal>

---

## 1. <Experience Name> — <Vendor / Provider, Location>
**Why it fits:** <1–2 sentences tying to persona + goal>
**Format:** <suite | buyout | private session | retreat | hospitality package>
**Capacity:** <X guests>
**Estimated price:** <$X–Y per head | $Z total> — *confirm directly*
**Notable features:**
- <signature element>
- <on-site treatment / hospitality detail>
- <photo / story moment>
- <logistics: travel, lodging, dietary handling>
**Booking:** <vendor link / contact path>
**Caveats:** <lead time, blackout dates, contract minimums, weather risk, etc.>

## 2. <Experience Name> — ...
[same structure]

[5–8 total — mix of user-named + novel discoveries]

---

## How to proceed
**Top picks:** <top 1–2 with one sentence each on why>
**Confirm via direct outreach:** exact capacity, pricing, date availability, lead time, dietary, travel/lodging block
**Logistics flags:** lead time on premium hospitality (often 3–6 months for F1/Masters), weather risk, blackout dates, deposit and cancellation terms
```

## Rules of thumb

- 5–8 experiences, not 15.
- Position 1 is your real recommendation.
- Always include at least one novel discovery — that's the value of this skill over a brokerage site.
- Don't fabricate prices, dates, or vendor names. "Estimated" and "confirm directly" preserve trust.
- Respect the stated budget. Premium hospitality blows past budgets easily — if the budget is too tight for the named experience, say so once at the end with a downgrade suggestion.
- Lead times matter: F1/Masters/Ryder Cup hospitality often sells out 3–6+ months out. Always surface lead time in caveats.
