---
name: post-event-brief
description: Generate a post-event brief for a single B2B marketing event — customer dinners, prospect happy hours, field events, ancillary tradeshow events, executive retreats, hackathons, curated experiences. Combines registrants vs attendees data with optional Salesforce enrichment (top accounts touched, hot leads, pipeline influenced, new contacts created) to produce a stakeholder-ready markdown brief plus an interactive HTML view. Use whenever a B2B event marketer is wrapping up an event and wants to summarize what happened, what landed, and what the pipeline impact looks like. Trigger on phrases like "post-event brief", "post-event report", "event recap", "wrap-up", "what happened at <event>", "ROI summary for <event>", "show rate", "who actually showed up", "pipeline from <event>", "did <event> work". Designed to live in the same per-event folder as workback-schedule and budget. Do NOT trigger for in-flight prep status (use workback-schedule), budget reconciliation (use the budget skill), or large conferences (this skill is tuned for events under ~150 attendees).
---

# Post-Event Brief for B2B Event Marketing

## What this skill does

Generates and iterates on a post-event brief for a single B2B marketing event. The brief lives in the same per-event folder as the workback and budget for that event, so the same thread can run all three.

Inputs:

- The user's high-level description of what they want in the brief (mandatory, asked up front).
- A registrants list (file upload OR pulled from an event-platform MCP).
- An attendees list (file upload OR pulled from an event-platform MCP).
- Optional: a Salesforce MCP connection, for account / contact / lead / pipeline enrichment.
- Optional: free-form context the user wants reflected — highlights, qualitative feedback, photos, exec sponsor quotes.

Outputs:

- `brief.md` — source of truth, structured markdown with YAML frontmatter.
- `brief.html` — generated, read-only interactive view. Regenerated on every change.

The brief is **stakeholder-facing** by default — short, scannable, leadership-ready. The user can ask for variants (e.g., "make it sales-team-flavored", "rewrite for the CMO") and the skill rewrites the narrative without touching the underlying data.

## Operations

| User intent | Operation |
|---|---|
| "Build a brief for <event>" / "Wrap up <event>" / first run | `create` |
| "Reload the attendee data" / "Updated attendee list" / "New CSV" | `refresh-rosters` |
| "Connect to Salesforce" / "Pull SF data" | `enrich` |
| "Update the highlights section" / "Add a quote from X" | `update` |
| "Rewrite for <audience>" / "Make it more <tone>" / "Shorter" | `reframe` |
| "Regenerate the HTML view" / "Refresh" | `view` |
| "Export to PDF" / "Send to leadership" | `export` (Step 10) |
| "Show me the brief" / no other instruction | `show` |

Default to `create` when there's no active event with a brief; default to `show` otherwise.

## Step 1 — Determine the active event

Before any operation:

1. If an event folder has already been used in this thread (any sibling skill — workback, budget — may have created it), that's the active event.
2. If the user passes a path or event name that matches an existing folder containing `workback.md`, `budget.md`, or `brief.md`, switch to it.
3. If neither, and the operation is `create`, run the first-run flow (Step 2).
4. Otherwise ask the user which event folder to load.

The skill does not maintain global state across threads.

## Step 2 — First-run flow (`create`)

### 2a. Confirm event metadata

If a `workback.md` already exists in the active folder, read its frontmatter and reuse: `event`, `date`, `type`, `headcount` (becomes the **registered headcount**, which the rosters will validate), `location`, `owner`. Confirm by showing the user what was found and asking if anything has changed since the workback was written (location moved, date shifted, type changed).

If no workback exists, ask for these in a single follow-up:

1. **Event name**
2. **Event date** (the actual date the event happened — used to compute "new since event" cutoffs in Salesforce enrichment)
3. **Event type** — one of: `customer-dinner`, `prospect-happy-hour`, `field-event`, `ancillary-tradeshow`, `executive-retreat`, `hackathon`, `curated-experience`
4. **Location** — city + venue
5. **Owner** + key collaborators
6. **Parent directory** for the event folder if creating fresh (Step 2 of workback-schedule explains the convention)

If creating fresh, slug the folder as `YYYY-MM-DD-<kebab-cased-event-name>` and create:

```
<parent-dir>/<event-slug>/
  brief.md
  brief.html
  rosters/           # raw uploaded CSVs go here
  assets/            # any saved photos / quotes / decks
```

(If the folder already exists from workback or budget, just add `brief.md`, `brief.html`, and the `rosters/` subdirectory.)

### 2b. Ask the user what they want in the brief — *up front, before generating anything*

This is the first real prompt of the create flow. Ask in plain language:

> Before I pull together the brief: at a high level, what do you want this brief to land? A few examples to anchor:
> - "A 1-pager for the CMO showing pipeline influenced + which top-20 accounts showed."
> - "Sales-team-flavored — focus on hot leads and which AEs got face-time with which accounts."
> - "Recap for the broader marketing team — show rate, sentiment, what worked, what to change next time."
> - "Just the numbers."

Capture the answer in `brief.md` frontmatter as `intent: <verbatim>`. Every later section of the brief should be shaped to deliver that intent — section ordering, depth, and tone.

Also offer to load a **default outline** matched to the event type (Step 8). Phrase it as: "I can start from the default `<event-type>` outline and shape it to that intent — sound good, or do you want to define the sections yourself?"

### 2c. Get the registrants list

Ask the user for the registrants list. Accept any of:

- **File upload / path** — CSV, TSV, XLSX. Drop a copy into `rosters/registrants.<ext>`.
- **MCP-pulled** — if the user has an event-platform MCP connected (Zuddl, Hopin, Goldcast, Bizzabo, Splash, Cvent, Luma, etc.), offer to pull directly. Detect by looking for tool prefixes like `mcp__zuddl__*`, `mcp__splash__*`, etc. If the MCP isn't connected, point the user at `/mcp` and fall back to file upload — don't block.

Parse to a canonical schema (Step 3). Validate row count against the workback's `headcount` if one existed; surface the diff (e.g., "Workback said 25, registrants list has 31. Use 31?").

### 2d. Get the attendees list

Same shape as 2c, but for who actually showed. Store at `rosters/attendees.<ext>`.

If the user only has one combined export with an "attended" boolean column, accept that as both inputs — parse once, split by the boolean.

Compute and immediately surface:

- **Registered**: total registrants.
- **Attended**: total attendees.
- **Show rate**: attended / registered, as a percentage.

If show rate looks suspicious (>100% — walk-ins counted in attendees but not registrants; <20% — possible data error), flag it before continuing.

### 2e. Offer Salesforce enrichment (optional)

Ask one question:

> Want me to enrich this with Salesforce data? If your SF MCP is connected I can pull:
> - **Top accounts touched** — which existing accounts had at least one attendee.
> - **Hot leads** — using your org's definition of hot (I'll ask).
> - **Pipeline influenced** — open opps tied to attendee contacts / accounts.
> - **New contacts and leads** created in SF since the event date, tied to the attendee list or this event's campaign.
>
> Skip this and the brief covers attendance and qualitative only.

If **skip** — note `salesforce.enabled: false` in frontmatter and continue.

If **yes** — proceed to Step 4. If the SF MCP isn't connected, surface that, point at `/mcp`, and offer to continue without SF for now (the user can re-run `enrich` later without redoing rosters).

### 2f. Optional: ask for qualitative input

Ask the user (one prompt):

> Anything qualitative you want reflected? Examples: standout moments, attendee quotes, exec sponsor comments, NPS / pulse-survey numbers, photos to link, things to change next time. Skip if you'd rather add this later.

Store as `qualitative` in frontmatter and render in the **Highlights** section of the brief.

### 2g. Generate `brief.md` and `brief.html`

Apply the format in Step 5, write `brief.md`, then generate `brief.html` (Step 6).

Report:
- The paths.
- A one-line summary of headline numbers (registered / attended / show rate / + SF KPIs if enabled).
- An offer: "Want me to reframe, drill into any section, or add anything?"

## Step 3 — Parsing rosters

Accept CSV, TSV, XLSX, or a pasted markdown / plain-text list.

Canonical per-row fields:

- **email** (required — the join key for Salesforce and for dedup)
- **name** (first + last, or full)
- **company** / **account name**
- **title**
- **registered_at** (registrants only — useful for "when did we sell out")
- **attended** (boolean — only meaningful in a combined export)
- **dwell_minutes** (online events only)
- Any **extra columns** — preserve as additional per-row fields and record their names in `extra_columns`.

Normalize email to lowercase. Strip whitespace. Dedup by email — if duplicates exist, keep the latest row and log the count.

For XLSX files, look at the first sheet by default. If multiple sheets, ask which.

For pasted lists, accept lines of `email`, `email,name,company,title`, or a markdown table. If the shape is ambiguous, ask.

If any required field (email) is missing from a row, list those rows in a batch and ask the user how to handle (skip / fill in / drop column).

## Step 4 — Salesforce enrichment

Triggered by `create` step 2e (yes) or by the `enrich` operation later.

### 4a. Check MCP and pick a campaign

1. Look for a Salesforce MCP tool prefix (commonly `mcp__salesforce__*`). If the call fails or the prefix isn't present, tell the user and stop. They can connect via `/mcp` and re-run `enrich`.
2. Ask whether this event has a **Salesforce Campaign** record (most B2B teams do — every dinner / field event gets a campaign for attribution). Accept:
   - **Yes, and here's the ID / name** — much easier; we can use Campaign Member status directly.
   - **Yes but I don't know the ID** — search by event name + date.
   - **No campaign** — fall back to email matching against the attendee list.
   - **Create one for me** — only if the user explicitly asks; default to **not** creating SF objects. If creating, confirm name + start/end date + type before writing.
3. Store campaign info in `salesforce.campaign_id` / `salesforce.campaign_name` if found.

### 4b. Ask for the hot-lead definition

Hot lead means different things at different orgs. Ask:

> How does your team define a "hot lead"? Pick the closest:
> 1. **Lead status** is one of: <user lists> (e.g., "MQL", "SQL", "Hot").
> 2. **Lead score** above a threshold (user provides the threshold and field name).
> 3. **Has a meeting booked** since the event date (Activity / Task / Meeting with a future Date).
> 4. **Custom SOQL** — user pastes a WHERE clause.

Store as `salesforce.hot_lead_rule`. Reuse it on later re-enrichments without re-asking.

### 4c. Run the enrichment queries

For each attendee, match against Salesforce by email. Use `Contact.Email` first, then `Lead.Email`. Domain-match (`@acme.com` → Account named Acme) only as a tiebreaker, never as a primary join — it produces too many false positives at scale.

Build these aggregates:

- **Top accounts touched** — group matched contacts by `Account.Id`. For each account: name, contacts attending, AE owner, account tier / segment if a custom field exists, current ARR if available. Sort by contacts attending desc, then by ARR desc. Cap the rendered list to 20; the rest go in the appendix.
- **Hot leads** — apply the rule from 4b across the attendee list. For each: name, company, title, source (lead or contact), owner, what makes it hot (rule that matched).
- **Pipeline influenced** — opportunities where:
  - `IsClosed = false`
  - At least one attendee appears in `OpportunityContactRole` for that opp, OR the opp's `AccountId` is in the matched accounts set AND the opp was open as of the event date.
  - For each opp: name, account, stage, amount, close date, owner. Sum `Amount` to get total influenced pipeline.
  - Distinguish **pre-existing** (`CreatedDate < event_date`) vs **new** (`CreatedDate >= event_date`) opps. Both count, but render them separately.
- **New contacts created** — `Contact` records where `CreatedDate >= event_date` AND (`Email IN attendee_emails` OR `Campaign Member` linked to the event campaign). For each: name, company, title, owner, created date.
- **New leads created** — same shape as contacts, against the `Lead` object.

Run these in parallel where the MCP supports it. Cap any individual query at a reasonable limit (e.g., 500) and warn the user if a cap was hit — they may need a narrower attendee list or a campaign-scoped query.

### 4d. Persist a snapshot

Write the raw query results to `rosters/sf-snapshot-<YYYY-MM-DD>.json` so the brief is reproducible later without re-querying. The HTML view should read from the snapshot, not re-query SF.

### 4e. Render in the brief

Add a **Salesforce signal** section to `brief.md` with sub-sections in this order:
1. Top accounts touched
2. Hot leads
3. Pipeline influenced (pre-existing + new, with totals)
4. New contacts / leads created

Always include the hot-lead rule used, the campaign reference if any, and the snapshot timestamp — so a reader can tell exactly what the numbers mean and when they were pulled.

## Step 5 — `brief.md` format

YAML frontmatter plus narrative sections.

```markdown
---
event: CISO Dinner NYC
date: 2026-09-15
type: customer-dinner
location: New York, NY
owner: vedha
created: 2026-09-17
intent: "1-pager for the CMO — show pipeline influenced and which top-20 accounts showed; keep tone exec-ready."
rosters:
  registered: 31
  attended: 24
  show_rate: 0.774
  registrants_file: rosters/registrants.csv
  attendees_file: rosters/attendees.csv
  extra_columns: [persona, region]
salesforce:
  enabled: true
  campaign_id: "7011x000000ABCD"
  campaign_name: "CISO Dinner NYC — 2026-09"
  hot_lead_rule: "Lead.Status IN ('MQL', 'Hot')"
  snapshot: rosters/sf-snapshot-2026-09-17.json
  snapshot_at: 2026-09-17T18:42:00Z
  totals:
    accounts_touched: 18
    hot_leads: 6
    pipeline_influenced_total: 2450000
    pipeline_influenced_preexisting: 1800000
    pipeline_influenced_new: 650000
    new_contacts: 4
    new_leads: 2
qualitative:
  highlights:
    - "Acme CISO confirmed budget for Q1 expansion — AE following up Monday."
    - "Globex VP Security asked to be intro'd to our founder."
  quotes:
    - person: "Acme CISO"
      quote: "Best dinner I've been to all year. The peer conversation was the value."
  nps: 9.2
  what_to_change_next_time:
    - "Start 30 min earlier — too many people had to leave by 9pm."
---

# Post-event brief — CISO Dinner NYC

## Executive summary

<2–3 sentences synthesizing intent, headline numbers, and the single most important takeaway.>

## Attendance

<registered / attended / show rate, with brief commentary>

## Audience

<top accounts present, persona / title mix, region mix if applicable>

## Salesforce signal

### Top accounts touched
### Hot leads
### Pipeline influenced
### New contacts and leads

## Highlights

<qualitative — quotes, standout moments, NPS, photos>

## Follow-up

<recommended next steps — owner + date — pulls from workback T+ tasks if a workback exists>

## Appendix

<raw rosters, sf snapshot path, methodology notes>
```

Use `Edit` for incremental changes (e.g., adding a quote, rewriting the executive summary). Use `Write` only for full regenerations.

Never invent numbers. Every figure in the brief must trace back to a roster row or an SF snapshot entry. If a section can't be filled (e.g., user said "skip SF"), omit the section rather than fabricating.

## Step 6 — HTML view generation

After every change to `brief.md`, regenerate `brief.html`.

Read the template at `assets/brief-template.html` (relative to this skill's folder). The template contains a single placeholder `{{DATA}}` inside a `<script id="brief-data" type="application/json">` tag. Build a JSON payload and substitute it.

JSON payload shape:

```json
{
  "event": {
    "name": "CISO Dinner NYC",
    "date": "2026-09-15",
    "type": "customer-dinner",
    "location": "New York, NY",
    "owner": "vedha",
    "generated_at": "2026-09-17",
    "intent": "1-pager for the CMO..."
  },
  "kpis": [
    { "label": "Registered", "value": 31 },
    { "label": "Attended", "value": 24 },
    { "label": "Show rate", "value": "77%" },
    { "label": "Accounts touched", "value": 18, "sf": true },
    { "label": "Hot leads", "value": 6, "sf": true },
    { "label": "Pipeline influenced", "value": "$2.45M", "sf": true },
    { "label": "New contacts", "value": 4, "sf": true },
    { "label": "New leads", "value": 2, "sf": true }
  ],
  "executive_summary": "<markdown>",
  "attendance": {
    "registered": 31,
    "attended": 24,
    "show_rate": 0.774,
    "no_shows": 7,
    "walkins": 0
  },
  "audience": {
    "top_companies": [ { "name": "Acme", "count": 3 } ],
    "by_title_tier": [ { "tier": "C-level", "count": 6 }, { "tier": "VP", "count": 9 } ],
    "by_region": []
  },
  "salesforce": {
    "enabled": true,
    "campaign": { "id": "...", "name": "..." },
    "hot_lead_rule": "Lead.Status IN ('MQL', 'Hot')",
    "snapshot_at": "2026-09-17T18:42:00Z",
    "top_accounts": [
      { "name": "Acme", "contacts_attending": 3, "ae_owner": "Rachel", "tier": "Strategic", "arr": 480000 }
    ],
    "hot_leads": [ { "name": "Jane Doe", "company": "Globex", "title": "VP Sec", "source": "Lead", "owner": "Alex", "why_hot": "Lead.Status = Hot" } ],
    "pipeline": {
      "total": 2450000,
      "preexisting": 1800000,
      "new": 650000,
      "opps": [ { "name": "Acme Expansion", "account": "Acme", "stage": "Negotiation", "amount": 480000, "close_date": "2026-12-15", "owner": "Rachel", "pre_existing": true } ]
    },
    "new_contacts": [ { "name": "...", "company": "...", "title": "...", "owner": "...", "created": "2026-09-16" } ],
    "new_leads": []
  },
  "highlights": [ { "type": "moment", "text": "Acme CISO confirmed budget..." }, { "type": "quote", "person": "Acme CISO", "text": "Best dinner..." } ],
  "follow_up": [ { "task": "Founder intro to Globex VP Security", "owner": "vedha", "due": "2026-09-22" } ]
}
```

HTML view characteristics (the template handles all of this — the skill just supplies data):

- Light-mode only. Stakeholder-ready, no clutter.
- Header shows event name, date, location, generated-on date, and the intent line as a subtitle.
- KPI tiles row across the top. SF-derived KPIs render with a small "SF" badge so the reader knows the source.
- Top-accounts table is sortable and shows: name, contacts attending, AE owner, tier, ARR.
- Hot-leads table shows the rule used as a caption.
- Pipeline section splits pre-existing vs new visually; totals render as a bar.
- Highlights renders quotes as pull-quotes; moments as bullets.
- Follow-up renders as a checklist with owner and date.
- The brief is **read-only**. All edits go through chat.

## Step 7 — Iterating: `update` and `reframe`

### `update`

When the user wants to tweak content (add a quote, fix a number, edit the exec summary):

1. Locate the relevant section.
2. Apply the change via `Edit`.
3. Regenerate `brief.html`.
4. Confirm: "Updated <section>. Anything else?"

Numerical changes must come from data (re-uploaded roster, re-run SF query). If the user wants to overwrite a number without data backing it, push back once: "That doesn't match the snapshot — should I re-pull from Salesforce, or do you want to override and I'll add a footnote?"

### `reframe`

When the user wants the same data presented differently:

> "Rewrite for sales team — punchier, focus on hot leads and account-level wins."
> "Make it CMO-flavored — pipeline impact + strategic narrative."
> "Cut it in half."
> "Add a 'what we'd do differently' section."

This rewrites narrative sections (executive summary, attendance commentary, highlights tone) but does **not** change underlying numbers, table contents, or frontmatter totals. Update `intent` in frontmatter so the new tone persists, then regenerate `brief.html`.

## Step 8 — Built-in templates by event type

When the user accepts the default outline (Step 2b), load `assets/templates/<event-type>.md` (relative to this skill's folder). Each template defines:

- The default **section order** for the brief.
- Which **KPIs** to surface in the top tile row.
- Which **SF signals** matter most for that event type (e.g., dinners weight account expansion; happy hours weight new leads).
- A **tone note** the skill uses when drafting narrative.

Available templates:

- `customer-dinner.md` — emphasis on existing accounts, expansion signal, exec relationships. Pipeline section leads with **pre-existing** opps influenced. Hot-leads section often empty (mostly existing contacts).
- `prospect-happy-hour.md` — emphasis on new contacts, new leads, conversion to pipeline. Top-accounts section weighted by *new* logos.
- `field-event.md` — balanced existing + prospect. Show breakdown by AE territory if region data is present.
- `ancillary-tradeshow.md` — emphasis on net-new meetings booked, badge scans, surrounding-tradeshow context (e.g., "during RSA week"). Reference the parent tradeshow.
- `executive-retreat.md` — small headcount; emphasis on per-account relationship depth, not pipeline volume. Each attending account gets a mini-narrative.
- `hackathon.md` — emphasis on developer / product signal, qualitative feedback, NPS. SF section optional.
- `curated-experience.md` — small VIP format; emphasis on qualitative + per-guest narrative. SF section minimal unless explicitly asked.

Each template is opinionated. When loading, say: "Loaded the `<event-type>` outline. Want to tweak the section order or which KPIs lead, or run with it?"

## Step 9 — Workback / budget coupling

If `workback.md` exists in the same folder, the skill should:

- **Read** the workback frontmatter for event metadata (Step 2a).
- **Read** the workback `## Tasks` section for any `T+` (post-event) tasks. Suggest these as the seed for the **Follow-up** section: "I see 3 T+ tasks in the workback — want me to pull them into the Follow-up section?"
- **Never write** to `workback.md`.

If `budget.md` exists:

- **Read** the total spend if surfacing cost-per-attendee or ROI ratio in the brief.
- **Never write** to `budget.md`.

Cost-per-attendee = total_spend / attended (only render if both numbers are present and the user wants it — some intents skip cost entirely).

## Step 10 — Export (`export`)

Default outputs are `brief.md` + `brief.html`. On `export`, ask which format:

- **PDF** — print `brief.html` to PDF via the platform's default print-to-PDF flow. Place at `<event-folder>/brief.pdf`.
- **PPTX** — only if the user explicitly asks. Invoke the `pptx` skill with the brief content shaped as: cover slide → KPI summary slide → top accounts → hot leads → pipeline → highlights → follow-up. Drop at `<event-folder>/brief.pptx`.
- **Email-ready markdown** — a trimmed copy without the appendix, suitable for pasting into an email or Slack post.

Never send the brief anywhere. Generating files and handing back the path is the boundary.

## Step 11 — Refreshing later

Salesforce numbers shift after the event — hot leads convert, new opps open. If the user invokes `enrich` again days/weeks later:

1. Re-run the queries with the same hot-lead rule and campaign.
2. Write a **new** snapshot at `rosters/sf-snapshot-<today>.json` (do not overwrite the previous one).
3. Update `brief.md` frontmatter totals and section content.
4. Add a note to the **Appendix → Methodology** section: "Salesforce data refreshed on <date>; prior snapshot at <path> shows the state as of <prior date>."

This lets a reader see how the impact has evolved over time without losing the original.

## What this skill never does

- Create, update, or delete Salesforce records (Accounts, Contacts, Leads, Opps, Tasks) unless the user explicitly asks AND confirms each create. Default is read-only.
- Send emails, calendar invites, or post to Slack.
- Modify `workback.md` or `budget.md`.
- Invent attendance numbers, account matches, or pipeline figures. Every number traces to a roster row or an SF snapshot row.
- Persist roster CSVs anywhere outside `<event-folder>/rosters/`.
- Maintain global state across threads.
- Add edit affordances to `brief.html`.
