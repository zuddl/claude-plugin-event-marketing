---
name: workback-schedule
description: Build and maintain a reverse-timeline ("T-minus") workback schedule for a single B2B marketing event — customer dinners, prospect happy hours, field events, executive retreats, ancillary tradeshow events, hackathons, curated VIP experiences. Tracks every prep task with a target date, projected date, and on/off-track signal, then updates the schedule as new information comes in. Use whenever a B2B event marketer is planning the prep timeline for a single event, OR is messaging an update about a planning task in a pinned event thread. Trigger on phrases like "workback", "workback schedule", "timeline", "T-minus", "build a schedule for <event>", "what's left before <event>", "we pushed X by a week", "X is delayed", "mark X done", "catch up on the thread", "status update on <event>". Designed to live in a per-event folder alongside the budget skill so the same thread can run both. Do NOT trigger for generic project planning, software roadmaps, conferences over 150 attendees, or events without a fixed date.
---

# Workback Schedule for B2B Event Marketing

## What this skill does

Generates and maintains a workback schedule for a single B2B marketing event. The schedule lives in a per-event folder the user picks on first run; the same skill is invoked repeatedly over weeks or months in a pinned thread to:

- create the schedule from a user-provided sample OR a built-in template
- record updates as the user messages in the thread ("venue pushed by a week", "invites sent")
- recompute on/off-track signals on every invocation
- regenerate a read-only interactive HTML view of the schedule

The markdown file `workback.md` is the source of truth. `workback.html` is a generated view.

This skill is meant to be paired with a budget skill in the same per-event folder. It never modifies the budget file; it only references it.

## Operations

Pick the operation that matches the user's intent:

| User intent | Operation |
|---|---|
| "Build a workback for X" / "Create a schedule" / first run for this event | `create` |
| "Where are we?" / "What's left?" / "Status" / no other instruction | `status` |
| "Mark X done" / "Push Y by 3 days" / "Z is blocked" | `update` (structured inline change) |
| Free-form thread message that implies a change | `interpret` (parse + confirm + apply) |
| "Catch up on the thread" / "Scan recent messages" | `catch-up` (batch interpret + confirm) |
| "Add a task" | `add` |
| "Remove X" / "Drop Y" | `remove` |
| "Move the target date for X" / "Rebaseline X" | `rebaseline` (always confirm) |
| "Give me a report" / "Stakeholder summary" | `report` |
| "Regenerate the HTML view" / "Refresh the view" | `view` |
| "Sync to Asana / Monday / Notion / Linear" / "Connect to <system>" | `sync connect` |
| "Push changes to Asana" / "Pull latest from Asana" / no-arg after sync is on | `sync` |
| "Stop syncing" / "Disconnect from Asana" | `sync disconnect` |
| "Switch source of truth to Asana" / "Asana is source of truth now" | `sync switch` |

If the user invokes the skill without context, default to `status` when there is an active event, or `create` otherwise.

## Step 1 — Determine the active event

Before any operation, figure out which event folder applies:

1. If an event has already been created or loaded earlier in this thread, that is the active event. Use its folder.
2. If the user passes a path or event name that matches an existing folder containing `workback.md`, switch to it.
3. If neither, and the operation is `create`, run the first-run flow (Step 2).
4. If the operation is anything other than `create` and there is no active event, ask the user which event folder to load, then read `workback.md` from it.

The skill does not maintain a global active-event pointer across threads. State lives in the conversation and in the event folder.

## Step 2 — First-run flow (`create`)

### 2a. Gather event metadata

Ask for these in a single follow-up if any are missing:

1. **Event name** (slugifies the folder)
2. **Event date** (anchor for every T-offset)
3. **Event type** — one of: `customer-dinner`, `prospect-happy-hour`, `field-event`, `ancillary-tradeshow`, `executive-retreat`, `hackathon`, `curated-experience`
4. **Headcount tier** — `<=15`, `16-40`, `41-80`, `81-150`
5. **Location** — city + venue status (`booked` / `shortlisting` / `not-started`)
6. **Owner** + key collaborators
7. **Special dependencies** — speakers, swag, printed collateral, travel coordination, dietary tracking, AV, anything unusual

### 2b. Ask where to create the event folder

Always ask the user for the **parent directory** where the event folder should live. Do not assume a default — the user has explicitly asked to be prompted per event. Examples: `~/Desktop/events`, `~/Documents/marketing/events`.

Slug the event folder as `YYYY-MM-DD-<kebab-cased-event-name>` (for example, `2026-09-15-ciso-dinner-nyc`).

Confirm the full path with the user before creating anything. Then create:

```
<parent-dir>/<event-slug>/
  workback.md
  workback.html
  budget.md           # empty placeholder; the budget skill will populate it
  notes.md            # empty placeholder for freeform log
  assets/             # any saved assets — invites, briefing docs, vendor quotes
```

Every saved asset from this point onward in the thread (from this skill OR the budget skill) goes into this folder. If the user later asks to "save the invite copy" or "save the vendor quote," put it under `<event-folder>/assets/`.

### 2c. Pick the source for the task list

Ask whether the user has a sample workback to start from:

- **Sample provided** — markdown task list, markdown table, CSV/TSV paste, plain bullets, or a screenshot path. Parse it (Step 3) and use as-is. Do not add template tasks unless the user asks "fill in the gaps."
- **No sample** — load the built-in template for the event type from `assets/templates/<event-type>.md` and use it as the starting point.
- **Hybrid** — user says "use my sample but add anything you'd normally include for a customer dinner." Merge, and clearly flag added rows so the user can prune.

### 2d. Write workback.md and generate workback.html

Apply the format in Step 4, write `workback.md`, then generate `workback.html` (Step 6).

Report the paths and a short summary: total tasks, count by status, next 5 upcoming, anything overdue.

### 2e. Offer downstream sync (Asana / Monday / Notion / Linear / etc.)

After the schedule is created and rendered, ask the user one question:

> Do you want to mirror this workback into a downstream system like Asana, Monday, Notion, or Linear? You can also skip this and connect later — just invoke the skill again with "connect to <system>".

- If **no** or **later** — say "OK, the schedule is local-only. Invoke me with `connect to <system>` any time to wire it up" and stop.
- If **yes** — proceed to Step 11 (`sync connect`).

Never block the local workback on downstream setup. The local files are always the immediate output; sync is additive.

## Step 3 — Parsing a user-provided sample

Accept markdown task lists, markdown tables, CSV/TSV pastes, plain bullets, or a screenshot path.

For each row, extract these canonical fields:

- **Task name** (required)
- **Target date** (absolute) OR **T-offset** (relative — convert to absolute using the event date)
- **Owner** (if present)
- **Status** (if present — map to `not-started`, `in-progress`, `done`, `blocked`)
- Any **extra columns** the sample had (vendor, cost, doc link, contract status, etc.) — preserve verbatim as additional per-task fields and record their names in the frontmatter's `extra_columns` list

For screenshots, use the Read tool (it accepts image files) to view the image, then transcribe rows into the canonical structure.

If any row is ambiguous (no clear date, no clear task name), surface that row to the user and ask rather than guessing. List all ambiguous rows in one batch so the user can resolve them together.

Initialize `projected = target` and `signal = on-track` for any not-started/in-progress row. For done rows, set `actual = <date the sample provided>` (or today if none) and `signal = done`.

## Step 4 — workback.md format

YAML frontmatter plus a `## Tasks` section and a `## Notes` section.

```markdown
---
event: CISO Dinner NYC
date: 2026-09-15
type: customer-dinner
headcount: 25
location: New York, NY
owner: vedha
collaborators: [sales-ops, ae-rachel]
created: 2026-05-18
status: in-progress
extra_columns: [vendor, doc_link]
sync:
  enabled: true
  system: asana
  project_id: "1209876543210"
  project_name: "CISO Dinner NYC — Prep"
  source_of_truth: workback     # workback | downstream | bootstrap
  bootstrapped: true             # only meaningful when source_of_truth was 'bootstrap'
  last_sync: 2026-05-18T15:30:00Z
  owner_map:                     # workback owner -> downstream user identifier
    vedha: vedha@zuddl.com
    sales-ops: ops@zuddl.com
    ae-rachel: rachel@zuddl.com
---

## Tasks

- [ ] T-60 | target: 2026-07-17 | projected: 2026-07-17 | on-track | Lock venue shortlist | vedha | downstream_id: 1209876543211
- [ ] T-45 | target: 2026-08-01 | projected: 2026-08-08 | at-risk | Send save-the-dates | sales-ops | vendor: SendGrid | doc_link: <url> | downstream_id: 1209876543212
  - 2026-07-28: legal still reviewing invite copy, vendor pushed by 1 wk
- [x] T-30 | target: 2026-08-16 | actual: 2026-08-14 | done | Confirm final menu | vedha | downstream_id: 1209876543213

## Notes

<freeform log>
```

The `sync` frontmatter block is absent when sync hasn't been set up. The `downstream_id` per-task extra appears only on tasks that exist in the downstream system.

**Task line grammar:**

```
- [<state>] T-<N> | target: <YYYY-MM-DD> | <projected-or-actual> | <signal> | <task name> | <owner>[ | <extra-key>: <extra-value>]*
```

- `<state>` is `x` for done, space for not done.
- For not-done tasks: `projected: <YYYY-MM-DD>` (or `projected: tbd` if blocked with no estimate).
- For done tasks: `actual: <YYYY-MM-DD>`.
- `<signal>` is one of: `on-track`, `at-risk`, `off-track`, `overdue`, `blocked`, `done`.
- Update log entries appear as sub-bullets immediately under the task: `- <YYYY-MM-DD>: <note>`.

Always keep `## Tasks` sorted by target date ascending.

Use `Edit` for incremental changes. Use `Write` only when generating the file for the first time or doing a full rewrite (e.g., after a `catch-up` with many approved changes).

## Step 5 — Status signal logic

Recompute every signal on every invocation. Today's date comes from the system context — do not hardcode.

Let `slip = projected - target` in days. Let `lead_time = max(1, target - created_date)` in days. Let `at_risk_buffer = max(3, ceil(lead_time * 0.10))` in days.

| Condition | Signal |
|---|---|
| Task checked done | `done` |
| Explicit blocker logged, no resolution | `blocked` |
| `today > target` AND not done AND not blocked | `overdue` |
| `slip <= 0` | `on-track` |
| `0 < slip <= at_risk_buffer` | `at-risk` |
| `slip > at_risk_buffer` | `off-track` |

At the top of every response, surface (in this order, only when non-empty):

1. **Overdue** — task, owner, days overdue
2. **Off-track** — task, owner, slip
3. **Blocked** — task, owner, reason
4. **At-risk** — task, owner, slip
5. **Due in next 7 days** — task, owner, target date

If everything is clean and nothing's due in 7 days, say so in one sentence.

Use bracketed text labels: `[on-track]`, `[at-risk]`, `[off-track]`, `[overdue]`, `[blocked]`, `[done]`. Do not use emojis in responses or in files.

## Step 6 — HTML view generation

After every change to `workback.md`, regenerate `workback.html`.

Read the template at `assets/workback-template.html` (relative to this skill's folder). The template contains a single placeholder `{{DATA}}` inside a `<script id="workback-data" type="application/json">` tag. Build a JSON payload and substitute it in.

JSON payload shape:

```json
{
  "event": {
    "name": "CISO Dinner NYC",
    "date": "2026-09-15",
    "type": "customer-dinner",
    "headcount": 25,
    "location": "New York, NY",
    "owner": "vedha",
    "today": "2026-05-18",
    "days_remaining": 120
  },
  "extra_columns": ["vendor", "doc_link"],
  "tasks": [
    {
      "t_offset": 60,
      "target": "2026-07-17",
      "projected": "2026-07-17",
      "actual": null,
      "signal": "on-track",
      "name": "Lock venue shortlist",
      "owner": "vedha",
      "done": false,
      "blocked": false,
      "log": [
        { "date": "2026-05-20", "note": "vendor shortlisted, awaiting hold confirmation" }
      ],
      "extras": { "vendor": null, "doc_link": null }
    }
  ]
}
```

Per-task fields the HTML uses:

- `t_offset`, `target`, `projected`, `actual` — dates drive the columns.
- `signal` — one of `on-track`, `at-risk`, `off-track`, `overdue`, `blocked`, `done`. Drives the status pill AND row tinting (at-risk = orange wash, off-track / overdue = red wash with overdue deeper).
- `name`, `owner` — straightforward.
- `done` — when true, the row is grayed out and the task name is struck through.
- `log` — array of `{ date, note }`. The HTML renders the **latest** note in the Notes column (truncated with ellipsis) and shows the full log on hover. A `(N)` badge appears when there's more than one note.
- `extras` — keys must match `extra_columns`. String values starting with `http(s)://` or `assets/` are auto-linkified.

Write the result to `<event-folder>/workback.html`. After writing, tell the user the path and suggest `open <path>` on macOS to view it.

Rendered HTML view characteristics (informational — the template handles this, not the skill):

- Light-mode only. Sortable table sorted by **target** ascending by default.
- Header highlights the **event date** in bold primary text and the **days remaining** as a blue pill (gray when past).
- Filter pills above the table (All + one per signal). Clicking a pill toggles it; clicking "All" clears.
- A blue "Today · YYYY-MM-DD" divider row is inserted in the body between the last task with `target <= today` and the first task with `target > today` — but only when the table is sorted by `target` or `projected`.
- "Due in" column shows time until target as `today`, `N day(s)`, `N week(s)`, or `N week(s) M day(s)`. Past targets read `N days late` in red. Done tasks show `—`.
- Notes column shows the latest log note inline, ellipsized; full log on hover.

The HTML view is **read-only**. All edits go through the skill via chat. Do not add edit affordances to the HTML.

## Step 7 — Inline updates (`update`)

When the user gives a structured instruction:

| Instruction shape | Action |
|---|---|
| "Mark X done" / "X is done" | Check box, set `actual: <today>`, drop projected, signal `done`. Append log. |
| "Push X by N days" / "X slipped to <date>" | Update projected, recompute signal. Append log. |
| "X is blocked because Y" | Set signal `blocked`, set projected `tbd`, append log with reason. |
| "Unblock X, back on for <date>" | Set projected, recompute signal. Append log. |
| "Reassign X to <owner>" | Update owner. Append log. |
| "Move target for X to <date>" | **Rebaseline** — confirm before changing target. The original baseline matters for retrospectives. |

Always append a log sub-bullet with today's date and a one-line summary of the change.

After applying:
1. Recompute all signals.
2. Sort `## Tasks` by target ascending.
3. Write `workback.md`, regenerate `workback.html`.
4. Report the delta: what moved, what's newly at-risk / off-track / overdue.

## Step 8 — Free-form interpretation (`interpret`)

When the user's message implies a change but isn't a structured instruction:

1. **Match the task** by fuzzy comparison against task names. If multiple plausible matches, ask which task. If no match, ask whether to add a new task or skip.
2. **Extract the delta** — new projected date, completion, blocker, owner change, rebaseline.
3. **Confirm before applying** when:
   - The change moves a `target` date (rebaseline).
   - Confidence in the task match is low.
   - The change affects more than one task.
4. **Apply, log, regenerate**.

Examples:

| Message | Proposed action |
|---|---|
| "Just sent the invites" | Mark "Send save-the-dates" done |
| "Venue contract still pending, probably another week" | Push projected on "Lock venue" by 7 days |
| "Catering vendor went dark, may need to switch" | Set "Confirm menu" blocked, log reason |
| "Pushed the briefing doc to Friday" | Set projected on "Briefing doc" to next Friday's date |
| "We need a new task for AV walkthrough at T-3" | Switch to `add` operation |
| "Rachel is now leading the seating chart" | Reassign owner on "Seating chart" |

## Step 9 — Catch-up scan (`catch-up`)

When the user runs `catch-up`, ask them to paste recent thread messages or summarize them. The skill cannot read external systems directly.

For each message that looks update-shaped:

1. Identify the task and the proposed change.
2. Score confidence as `high` / `medium` / `low`.
3. Present a batch table — one row per proposal: task, change, confidence.
4. Ask the user to **approve all**, **approve selected**, or **reject**.
5. Apply approved changes, append a log line per change, write `workback.md`, regenerate `workback.html`.

Never silently apply low-confidence changes. When in doubt, ask.

## Step 10 — Add / remove / rebaseline

- **`add`** — Ask for task name, T-offset (or absolute date), owner, and any extras. Compute target = event_date - N days. Set projected = target, signal = on-track. Insert sorted.
- **`remove`** — Confirm before removing (especially if the task has a log history). Log the removal in `notes.md` with reason if the user offers one.
- **`rebaseline`** — Show the user the old target, new target, slip from original, and ask to confirm. On confirm, update target, set projected = target, recompute signal, append log line marking the rebaseline.

## Step 11 — Downstream sync

The skill can mirror the workback into a project-management system the user already uses (Asana, Monday, Notion, Linear, ClickUp, etc.). Sync is **optional** and **additive** — the local `workback.md` and `workback.html` are always the immediate output. Sync just keeps a downstream project in lockstep with one or the other.

### 11a. `sync connect`

Triggered after `create` (Step 2e), OR any later time the user says "connect to <system>".

1. **Pick the system** — ask which downstream system. Map to the corresponding MCP server name (e.g., asana → `mcp__asana__*`, notion → `mcp__notion__*`). If the user named a system the skill doesn't recognize, ask whether an MCP for it is connected and what its tool prefix is.

2. **Check MCP availability** — try to list the available tools for that prefix (e.g., call a listing/metadata tool, or attempt a benign read like "list projects"). If the call fails because the MCP isn't connected:
   - Tell the user the MCP isn't connected.
   - Point them to `/mcp` (or the equivalent for their setup) to connect it.
   - Stop. Don't write any `sync:` frontmatter. They can re-invoke `connect to <system>` later.

3. **Find or create the downstream project**:
   - Ask the user whether the workback should live in an **existing** project (give them a way to identify it — name, URL, or ID) or a **new** project.
   - **Existing** → search the downstream system by the name/URL/ID provided. If multiple matches, list them and ask which. If none, fall through to "new."
   - **New** → ask for a project name (default: the event name + " — Prep"). Create the project. Default project description = a short blurb naming the event and linking the workback file path.

4. **Map owners to downstream users**:
   - For each unique owner in the workback (`vedha`, `sales-ops`, etc.), ask the user for the matching downstream identifier (email or handle, whichever the MCP expects).
   - If the user can't or won't map an owner, store it as `null` — tasks for that owner will be created unassigned and the skill will warn each time.
   - Store the map in `sync.owner_map`.

5. **Ask the source-of-truth question** (the most important step):

   > Which side is the source of truth?
   > 1. **Workback** — this skill is the source. Every change you make through me pushes to <system>. Updates made directly in <system> get overwritten on next sync.
   > 2. **<System>** — <system> is the source. On each invocation I pull the latest from <system> first, reconcile, and update the local workback. My local edits get overwritten on next sync.
   > 3. **Bootstrap then switch** — push the current workback to <system> once to seed the project, then <system> becomes the source. Common when the team works in <system> day-to-day but wants this skill to scaffold the initial plan.

   Store the answer in `sync.source_of_truth`. For option 3 (bootstrap), also set `sync.bootstrapped: false` — it flips to `true` after the first successful push, at which point the effective source of truth becomes `downstream`.

6. **Initial push** (workback → downstream): create one downstream task per workback task. For each created task, record the returned ID in the corresponding task line as `downstream_id: <id>`. Set:
   - Task name = workback task name
   - Due date = `target`
   - Assignee = `sync.owner_map[owner]` (if mapped)
   - Description = a short summary including the T-offset, projected date if different from target, and any extras
   - Status / done = mirror the workback `done` boolean to whatever "completed" concept the system uses

7. **Set sync state**:
   - `sync.enabled: true`
   - `sync.system`, `sync.project_id`, `sync.project_name`
   - `sync.last_sync` = current ISO-8601 timestamp
   - Append a note in `notes.md`: "Sync enabled with <system> project <name> (<id>) on <date>; source of truth: <mode>."

8. **Regenerate `workback.html`** and confirm: "Synced N tasks to <system>. Source of truth: <mode>."

### 11b. `sync` (push or pull, based on source of truth)

Behavior depends on `sync.source_of_truth`:

| Source of truth | What `sync` does |
|---|---|
| `workback` | **Push.** Diff the current workback against the last known downstream state (using `downstream_id` per task). Apply adds, removes, and field changes to the downstream project. Update `sync.last_sync`. |
| `downstream` | **Pull.** Fetch all tasks from the downstream project. Reconcile against the workback. Show the user a diff (per task: added downstream, removed downstream, field changes). Confirm before applying to `workback.md`. |
| `bootstrap` and `bootstrapped: false` | **Push** (as workback mode). On success, flip `bootstrapped: true` and start treating the effective SoT as `downstream` from now on. Tell the user: "Bootstrap complete. <System> is now the source of truth — I'll pull from there on next sync." |
| `bootstrap` and `bootstrapped: true` | Same as `downstream`. |

Push semantics:
- Adds (workback has a task with no `downstream_id`) → create downstream, record ID.
- Removes (downstream has a task whose ID is no longer in workback) → archive or delete in downstream. Confirm before deleting if the MCP supports archive instead.
- Field changes — overwrite downstream fields with workback values.
- Closed/done tasks — mark complete in downstream; don't delete.

Pull semantics:
- Adds (downstream has a task with no matching `downstream_id` in workback) → propose adding it to the workback. Ask the user for T-offset since downstream tasks won't have one. Ask whether owner can be mapped back to a workback owner.
- Removes (workback has a task whose `downstream_id` no longer exists downstream) → ask: remove from workback, or treat as un-synced and clear `downstream_id`?
- Field changes — propose overwriting workback fields. Show old → new per task. Confirm.

Always recompute signals after a sync and regenerate `workback.html`.

### 11c. Inline sync after every change

If `sync.enabled` is true and the effective source of truth is `workback`, push the relevant delta to the downstream project after **every** local change (any `update`, `add`, `remove`, `rebaseline`, interpreted update, or catch-up apply). Failures here must not block the local change — log a warning in `notes.md` ("Sync push failed at <timestamp>: <reason>; will retry on next `sync`.") and keep going.

If the effective source of truth is `downstream`, do **not** push local changes. Tell the user: "I've updated the local workback, but <system> is the source of truth — these edits will be overwritten on next sync unless you mirror them in <system> manually or run `sync switch` to flip the source."

### 11d. `sync switch`

Lets the user change `sync.source_of_truth` mid-flight. The common case: bootstrap mode auto-flips to downstream after first push, but sometimes the user wants to flip back (e.g., they're doing heavy local restructuring before re-handing off to the team). Confirm before flipping; warn about the risk of overwriting whichever side they're about to demote.

### 11e. `sync disconnect`

Set `sync.enabled: false`. Leave `downstream_id` on each task in case the user reconnects later. Tell the user: "Sync paused. The downstream project (<id>) is unchanged. Invoke `sync connect` to resume."

### 11f. Conflict and failure handling

- **MCP disconnects mid-session** — surface the error, set a soft flag in memory, fall back to local-only for the rest of the session.
- **Owner mapping has no match** — task gets pushed unassigned; log a warning.
- **Downstream rate limit / 5xx** — back off, retry once, then defer to next manual `sync`.
- **Schema mismatch** (e.g., custom field doesn't exist) — degrade gracefully: skip that field, write a note in `notes.md`, suggest the user add the custom field in the downstream system if they want it tracked.

### 11g. What sync never does

- Sync the **budget skill's** `budget.md`. That's a separate skill with its own sync surface (or none).
- Touch downstream projects outside the configured `sync.project_id`.
- Sync without `sync.enabled: true`.
- Overwrite a downstream value when the effective source of truth is `downstream` (pull-only direction).

## Step 12 — Report (`report`)

A compact, stakeholder-friendly markdown summary, suitable for pasting into a status update:

```
# CISO Dinner NYC — Status as of 2026-05-18
Event date: 2026-09-15 (120 days out)
Progress: 8 of 24 tasks done

Overdue (0):
  — none —

Off-track (1):
  - Send save-the-dates [sales-ops] — projected 2026-08-08, slipped 7 days

At-risk (2):
  - Venue contract sign-off [vedha] — slipped 2 days
  - Briefing doc [ae-rachel] — slipped 3 days

Blocked (0):
  — none —

Due next 7 days:
  - Lock venue shortlist [vedha] — 2026-05-22
  - Vendor outreach [sales-ops] — 2026-05-24

Full schedule: <event-folder>/workback.html
```

## Built-in templates

When the user has no sample, load `assets/templates/<event-type>.md` (relative to this skill's folder).

Templates are markdown lists in this minimal shape (no absolute dates, no signals):

```
- T-60 | Lock venue shortlist | event-marketing
- T-45 | Send save-the-dates | sales-ops
```

When applying:
- Compute target date = event_date - N days.
- Set projected = target.
- Set signal = on-track.
- Use the suggested owner from the template if the user hasn't supplied one. If the template owner doesn't match the user's team naming, ask.

Available templates:

- `customer-dinner.md`
- `prospect-happy-hour.md`
- `field-event.md`
- `ancillary-tradeshow.md`
- `executive-retreat.md`
- `hackathon.md`
- `curated-experience.md`

Each template is opinionated — the user should prune. When loading, say something like: "Loaded the customer-dinner template with 18 tasks. Want to keep all, or prune any?"

## Headcount scaling

Adjust template task density based on headcount tier:

- **≤15** — drop "seating chart", drop "name cards", combine "briefing doc" + "run-of-show".
- **16-40** — full template.
- **41-80** — add a second "headcount confirmation" checkpoint at T-21.
- **81-150** — add "venue walkthrough rehearsal" at T-7 and "registration / check-in plan" at T-14.

When loading a template with a known headcount tier, apply these adjustments automatically and tell the user what changed.

## Budget skill coupling

The budget skill writes `budget.md` in the same event folder. The workback skill should:

- **Read** `budget.md` if it exists, when computing or reporting on cost-sensitive milestones ("T-35: send venue deposit — see budget for amount and vendor").
- **Never write** to `budget.md`.
- When the user mentions a spend in a workback message ("we sent the deposit"), update the workback task and suggest: "Want me to log that spend in the budget? Invoke the budget skill."

## Saving assets

When the user says "save the invite copy" / "save this PDF" / "save the vendor quote," save under `<event-folder>/assets/`. Use a clear filename like `assets/invite-copy-v2.md` or `assets/vendor-quote-acme-catering.pdf`. Reference saved assets from the relevant task as an extra field (e.g., `| doc_link: assets/invite-copy-v2.md`) so the HTML view links to them.

## What this skill never does

- Modify any file outside the active event folder (except this skill's own assets when first reading templates).
- Maintain global state across threads.
- Apply updates without showing the user the delta.
- Add edit affordances to the HTML view.
- Send messages, emails, or calendar invites.
- Modify `budget.md`.
