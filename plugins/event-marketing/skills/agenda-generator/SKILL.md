---
name: agenda-generator
description: Build and deploy a personalized agenda generator website for a conference — a here.now-hosted page that lists sessions in a filterable grid, lets visitors describe who they are in natural language to get "Great fit / Good fit" recommendations, lets them add sessions to a personalized agenda, and publishes the agenda as a shareable here.now link. Also supports a marketer-driven flow where Claude curates and deploys a standalone personalized agenda for a specific named attendee (a customer or prospect VIP). Use whenever the user asks to build a conference agenda site, a session picker, a personalized schedule tool, an agenda recommender, or wants to make a custom agenda page for a specific person attending a conference. Trigger on phrases like "agenda generator", "session picker", "personalized agenda", "build an agenda site", "conference website with filterable sessions", "make a custom agenda for <person>", "share an agenda with <person>", "publish to here.now". Do NOT trigger for general workback/prep timelines (use workback-schedule) or single-event venue selection (use venue-research).
---

# Personalized Conference Agenda Generator

## What this skill does

Generates a self-contained, here.now-hostable website that:

1. Lists every session from a CSV in a filterable grid (filters auto-derived from any tag-like CSV columns).
2. Includes a natural-language "Who is this agenda for?" search box. The page scores each session against the description and tags it `Great fit` / `Good fit` / `Maybe` and sorts by fit.
3. Lets visitors hit "Add to personalized agenda" on any session. Once one session is added, the layout splits — sessions on the left, the in-progress personalized agenda on the right.
4. On "Publish personalized agenda", encodes the picked session IDs into a shareable URL on the same here.now domain. Anyone who opens that URL sees the personalized agenda view (sorted by session time).
5. Adopts the visual identity (colors, typography, logo) of a reference site or design system the user points at, so the page feels like part of the conference's own brand.

The same skill also supports a **marketer-driven** workflow: "Make an agenda for <persona>" → Claude picks sessions, writes a standalone personalized agenda HTML file, deploys it to here.now, and hands back the link to share.

Everything is hosted on **here.now**. The skill installs the `here-now` skill if it isn't already available, then invokes it to deploy.

## Operations

| User intent | Operation |
|---|---|
| "Build an agenda site for <conference>" / first run | `create` |
| "Update the sessions" / new CSV | `refresh-sessions` |
| "Change the branding" / new reference site | `rebrand` |
| "Redeploy" / "Push to here.now again" | `deploy` |
| "Make an agenda for <person>" / "Curate sessions for <persona>" | `curate` |
| "Show me the deployed URL" / "What's the link?" | `info` |

Default to `create` if there is no active project, `info` otherwise.

## Step 1 — Determine the active project

Before any operation, figure out which project folder applies:

1. If a conference project has already been created or loaded earlier in this thread, that's active.
2. If the user passes a path or conference name that matches an existing folder containing `agenda.json`, switch to it.
3. If neither, and the op is `create`, run the first-run flow (Step 2).
4. Otherwise ask the user which conference folder to load.

State lives in the project folder. The skill does not maintain global cross-thread state.

## Step 2 — First-run flow (`create`)

### 2a. Gather conference metadata

Ask for these in a single follow-up if any are missing:

1. **Conference name**
2. **Conference dates** (start + end, or single day)
3. **Location** (city + venue, optional but helps with display)
4. **Sessions CSV** — ask the user to upload or point at a path. See Step 3 for parsing.
5. **Design system reference** — accept any of:
   - A URL to a design system docs page (e.g., Storybook, ZeroHeight, Figma published file)
   - A path to a JSON of design tokens
   - A path to a CSS file
   - "Skip" — fall back to using the branding reference alone
6. **Branding reference** — a URL to either:
   - The conference's own website
   - An agenda site the user likes the look of
   - Both — primary first
7. **here.now subdomain** — what should the site live at? Default: kebab-case of the conference name (e.g., `acme-summit-2026.here.now`). Confirm before deploying.

### 2b. Ask where to create the project folder

Always ask for the **parent directory** where the project folder should live. Do not assume a default. Examples: `~/Desktop/conferences`, `~/Documents/marketing/conferences`.

Slug the folder as `<YYYY>-<kebab-cased-conference-name>` (e.g., `2026-acme-summit`).

Confirm the full path with the user, then create:

```
<parent-dir>/<project-slug>/
  agenda.json            # source of truth: sessions, tags, branding, event meta
  agenda.html            # generated, deployed page
  sessions.csv           # original CSV the user provided (saved verbatim)
  brand.json             # extracted design tokens (colors, fonts, logo, hero img)
  personalized/          # standalone personalized agendas curated by Claude (see Step 8)
    <persona-slug>.html
  assets/                # any saved logos, hero images, etc.
  .heredotnow/           # here.now project state (CLI creates this on first deploy)
```

### 2c. Parse the CSV (Step 3), extract branding (Step 4), build agenda.json (Step 5), render HTML (Step 6), deploy (Step 7).

Then report:
- Total sessions parsed, count per tag column, any rows with warnings.
- The here.now URL once deployment completes.
- One-line summary of branding choices (colors, font family, logo).

## Step 3 — Parsing the sessions CSV

Accept any reasonable CSV layout. Map columns into this canonical session shape:

```json
{
  "id": "session-001",
  "title": "string",
  "abstract": "string",
  "speakers": ["string", ...],
  "start": "2026-09-15T09:00:00",
  "end":   "2026-09-15T10:00:00",
  "room": "string",
  "track": "string",
  "tags": { "format": ["talk"], "level": ["intermediate"], "topic": ["AI", "agents"] }
}
```

### 3a. Column detection

Use case-insensitive header matching. Common synonyms:

| Canonical | Accepted headers |
|---|---|
| `id` | id, session_id, code, ref |
| `title` | title, name, session, session_title |
| `abstract` | abstract, description, summary, blurb |
| `speakers` | speaker, speakers, presenter(s), host(s), facilitator(s) |
| `start` | start, start_time, starts_at, begin, time |
| `end` | end, end_time, ends_at, finish |
| `room` | room, location, venue, stage |
| `track` | track, theme, stream |

If a column maps to `speakers` and has multiple names separated by `,`, `;`, `&`, ` and `, or ` + `, split into an array.

If `start` is provided but `end` isn't, ask the user for a default session length and apply it.

If no `id` column exists, generate `session-001`, `session-002`, … in file order.

### 3b. Tag column detection

**Any column not in the canonical list above is a tag column.** Examples: `Track`, `Level`, `Format`, `Topic`, `Audience`, `Persona`, `Day`, `Industry`.

For each tag column:
- Treat the cell value as a list (split on `,`, `;`, `|`, ` / `).
- Trim whitespace, lowercase the key, preserve the display value.
- Record the column name in `tags` under its slug (e.g., `Audience Level` → `audience_level`).

The page generates one filter chip group per tag column, with one chip per distinct value, sorted by frequency descending.

### 3c. Ambiguous rows

If a row is missing a title, has no parseable date when other rows have dates, or has a tag cell that doesn't look like a list (e.g., free-form sentence), surface it to the user in a single batch and ask whether to:
- Keep as-is (no time / no tag)
- Fix the value
- Drop the row

Do not silently invent values.

### 3d. Save originals

Always save the user-supplied CSV verbatim as `<project>/sessions.csv` so the user can re-run with edits.

## Step 4 — Extracting branding

Goal: produce a `brand.json` that the HTML template reads to skin itself.

```json
{
  "name": "Acme Summit 2026",
  "logo_url": "assets/logo.svg",
  "hero_image_url": "assets/hero.jpg",
  "colors": {
    "primary":      "#2A5BD7",
    "primary_text": "#FFFFFF",
    "accent":       "#FFB547",
    "bg":           "#FAFAF7",
    "panel":        "#FFFFFF",
    "text":         "#111111",
    "muted":        "#666666",
    "border":       "#E5E5E5",
    "great_fit":    "#0E7A35",
    "good_fit":     "#9A6700"
  },
  "fonts": {
    "heading": "\"Söhne\", -apple-system, sans-serif",
    "body":    "\"Inter\", -apple-system, sans-serif",
    "mono":    "ui-monospace, monospace"
  },
  "radius":  "10px",
  "vibe":    "polished, editorial, lots of whitespace"
}
```

### 4a. From a design-system input

If the user supplied a JSON token file or CSS, parse it directly:
- JSON: look for `colors`, `tokens.color`, `palette`, `theme`. For fonts look for `font`, `typography.fontFamily`.
- CSS: extract `--primary`, `--bg`, `--text`, etc. from `:root`. Pull `font-family` from `body`.

If the input is a docs URL (Storybook, ZeroHeight, Figma published file), use `WebFetch` to read the page and pull whatever color hexes and font names are visibly listed. If extraction is sparse or ambiguous, tell the user what you found and ask whether to use those or override with the branding reference.

### 4b. From a branding reference URL

Use `WebFetch` to load the reference. Extract:
- **Colors** — scan the HTML/CSS for hex codes, `rgb()`, `rgba()`, and CSS custom properties on `:root`. Rank by frequency and pick a primary (most-used non-neutral), bg (most-used near-white/near-black), text (highest contrast with bg).
- **Fonts** — read `font-family` declarations from inline styles and linked stylesheets. Identify the heading family (used on `h1`/`h2`) and the body family.
- **Logo** — look for `<link rel="icon">` and prominent `<img>` tags in the header. Save the URL; offer to download into `assets/logo.<ext>`.
- **Hero image** — look for the largest image above the fold or a `<meta property="og:image">`. Save into `assets/hero.<ext>`.

When values are uncertain, default to a clean editorial neutral palette and a system font stack, and tell the user what was uncertain so they can override.

### 4c. Confirm before locking in

Always show the user the extracted palette and font choices before writing `brand.json` for the first time. One short table or list. Ask: "Look right, or tweak?"

## Step 5 — agenda.json shape (the source of truth)

```json
{
  "event": {
    "name": "Acme Summit 2026",
    "start_date": "2026-09-15",
    "end_date":   "2026-09-17",
    "location":   "San Francisco, CA",
    "subdomain":  "acme-summit-2026"
  },
  "brand": { /* contents of brand.json */ },
  "tag_columns": [
    { "key": "track",  "label": "Track",  "values": ["AI", "Security", "Platform"] },
    { "key": "level",  "label": "Level",  "values": ["Beginner", "Intermediate", "Advanced"] },
    { "key": "format", "label": "Format", "values": ["Talk", "Workshop", "Panel"] }
  ],
  "sessions": [ /* canonical session objects from Step 3 */ ],
  "fit_config": {
    "anthropic_api_key_configured": false,
    "model": "claude-haiku-4-5-20251001",
    "great_threshold": 0.65,
    "good_threshold":  0.40
  },
  "deploy": {
    "url": null,
    "last_deployed_at": null
  }
}
```

Use `Edit` for incremental changes. Use `Write` only when generating the file for the first time.

## Step 6 — Rendering agenda.html

After every change to `agenda.json`, regenerate `agenda.html`.

Read the template at `assets/agenda-template.html` (relative to this skill's folder). The template contains a single placeholder `{{DATA}}` inside a `<script id="agenda-data" type="application/json">` tag. Substitute it with the full `agenda.json` payload.

The template is self-contained — all CSS and JS inline, no external dependencies beyond optionally `<link>`-ing the brand fonts via Google Fonts when the font name is a known web font.

Rendered page behavior (informational — the template handles this, not the skill):

- **Header** uses `brand.colors.primary` as accent, brand fonts, brand logo on the left, conference name + dates as title.
- **Hero image** if `brand.hero_image_url` is set.
- **Filter bar** — one collapsed group per `tag_columns` entry. Clicking a chip toggles it. AND across groups, OR within a group.
- **NL search box** — large input: "Who are you building this agenda for? Describe their role, interests, seniority, and what they're hoping to take away." Submit button: "Find sessions for them."
- **Session grid** — cards with title, speakers, time, room, tags as small pills. When a fit search is active, each card shows a `Great fit` or `Good fit` ribbon (or nothing) and the grid is sorted by fit then time.
- **Add-to-agenda button** on each card. Once one session is added, the layout splits 60/40 — sessions on the left, the personalized agenda panel on the right, scrolling independently.
- **Personalized agenda panel** — sessions in time order, with a "Remove" button per session, conflict warnings when two picks overlap, and a header field "Whose agenda is this?" (free-text, optional).
- **Publish button** — encodes `{ picks: [session_ids], for: "<name>", note: "<optional>" }` into a URL-safe base64 string in the URL hash. Clicking copies the full URL to clipboard and shows a toast. The URL stays on the same here.now domain.
- **Personalized view mode** — when the page loads with `#a=<base64>` in the URL, it renders the personalized agenda view: just the picks, in time order, with the conference branding intact, and a "Build my own agenda" button that drops back into the full picker.

The HTML is **read-only** in the sense that the user does not hand-edit it — all source data lives in `agenda.json`.

## Step 7 — Deploying to here.now

### 7a. Ensure here-now is installed

Before any deploy step, check whether the `here-now` skill is available (look for it in the skill list visible in this session). If it isn't, install it.

1. Check whether `npx` is on PATH (`command -v npx`).
2. If yes, run: `npx skills add heredotnow/skill --skill here-now -g`
3. If no, run:  `curl -fsSL https://here.now/install.sh | bash`
4. Tell the user the install command being run and wait for it to finish.
5. After install, the `here-now` skill should be invocable via the Skill tool. If it still isn't, ask the user to restart their session or check that the install completed cleanly.

Never assume the install is needed — only run it if `here-now` isn't already listed in available skills.

### 7b. Deploy the project folder

Once `here-now` is available, invoke it via the Skill tool with the project folder path and the subdomain from `agenda.json`. Pass the request as:

> Deploy the static site at `<project-folder>/` to here.now at the subdomain `<subdomain>`. The entry point is `agenda.html`. Also include the `assets/` and `personalized/` subfolders. Return the live URL when done.

When the `here-now` skill returns the live URL, write it into `agenda.json` at `deploy.url` and `deploy.last_deployed_at`, then tell the user:

- The live URL
- That visitors can share personalized agendas via the `#a=…` URL fragment without any further deploys
- That re-running `deploy` after editing sessions will push an update to the same URL

### 7c. Subsequent deploys

For `refresh-sessions`, `rebrand`, or `deploy`, regenerate `agenda.html` first (Step 6), then call the `here-now` skill again with the same folder and subdomain. here-now is responsible for handling diffs and updating the existing site.

## Step 8 — Marketer-driven `curate` flow

Triggered when the user says things like:
- "Build a personalized agenda for Bob, a CISO at a Fortune 100 financial services company. He cares about platform-level controls, supply-chain risk, and is bringing two of his directors."
- "Make an agenda for a head-of-marketing prospect who's evaluating event tech"
- "Curate sessions for <persona description>"

### 8a. Gather inputs

1. **Persona description** — required. Free text. The longer and more specific, the better.
2. **Persona display name** — what to title the page. If the user only gave a description, propose a short name and confirm (e.g., "Bob, CISO @ Fortune 100 Financial Services").
3. **Optional note** — anything to add at the top of the personalized agenda (a personal greeting, a meeting invite for the conference, etc.).
4. **Time limits** — if the user has constraints ("Bob lands Tuesday afternoon", "limit to 6 sessions"), capture them.

### 8b. Score and pick sessions

Read `agenda.json`. For each session, score fit against the persona description:

- **If Claude is doing the scoring directly in this conversation** — read the persona description and the session list, internally rate each session as `great` / `good` / `maybe` / `skip` with a one-line reason, and pick a slate that:
  - prioritizes `great` then `good`,
  - respects any user-stated time limits,
  - avoids time conflicts (warn the user before keeping conflicting picks),
  - covers at least one session per day of the conference if possible,
  - includes the kickoff/keynote/closing if they exist (label them `mandatory`).
- Surface the slate to the user as a numbered list with title, time, why-it-fits in one sentence each.
- Ask: "Keep all, drop any, add anything?"

### 8c. Render and deploy the standalone personalized agenda

Write `<project>/personalized/<persona-slug>.html`. Reuse the same `agenda-template.html`, but pass a smaller payload where:

- `agenda.json` is the **same conference data** (so branding is preserved),
- `picks` is preset to the chosen session IDs,
- `for` is the persona display name,
- `note` is the optional greeting,
- the URL fragment is **also** populated at the top of the file as the canonical share URL (so the marketer can grab it from the page title or a copy-link button),
- the page opens in personalized view mode by default (no picker UI) but offers a "See the full agenda" button that drops into the main hosted picker.

The persona slug is kebab-case of the display name, deduped if necessary (`bob-ciso-f100-fs`, `bob-ciso-f100-fs-2`, …).

Deploy via the `here-now` skill so the file lives at `https://<subdomain>.here.now/personalized/<persona-slug>.html` (or whatever URL shape here-now produces). Add an entry to `agenda.json` at `deploy.personalized[]` with `{ slug, display_name, url, picked_session_ids, created_at }` so the user can list and audit prior curations later.

Hand the URL to the user with a one-line summary: who it's for, how many sessions, total run time, any conflicts.

### 8d. Updating an existing personalized agenda

If the user says "update Bob's agenda" or "swap session X for session Y in <persona-slug>", look up the slug in `agenda.json`'s `deploy.personalized[]`, edit the picks, regenerate the HTML, redeploy. The URL stays the same.

## Step 9 — Refresh and rebrand

### 9a. `refresh-sessions`

User points at a new CSV (or the same path with edits). Re-parse (Step 3), diff against the existing sessions, surface adds/removes/changes:

```
+ added: 3 new sessions
- removed: 1 session ("Closing fireside") — appears in personalized agenda for "Bob, CISO" — confirm?
~ changed: 2 sessions (time updated)
```

Ask the user to approve before writing. After write, regenerate `agenda.html`, regenerate any affected personalized pages (warn the user when a previously-picked session was removed — those personalized agendas now have a gap), and redeploy.

### 9b. `rebrand`

User points at a new reference site or design system. Re-extract brand tokens (Step 4), confirm the diff, write `brand.json`, regenerate `agenda.html` and all personalized HTML files, redeploy.

## Step 10 — Natural-language fit scoring

The deployed page scores sessions client-side. Two modes:

### 10a. Client-side keyword scoring (default, always available)

When the user submits a persona description on the live page:

1. Lowercase + tokenize the description (drop stopwords).
2. For each session, compute three sub-scores in [0, 1]:
   - **tag_score** — fraction of description tokens that match any tag value across all tag columns (with simple stem/synonym expansion: `cisos → ciso`, `engineering → engineer/engineers`).
   - **title_score** — fraction of description tokens that appear in `title`.
   - **abstract_score** — fraction that appear in `abstract`.
3. Combine: `fit = 0.55 * tag_score + 0.25 * title_score + 0.20 * abstract_score`.
4. Classify against `fit_config.great_threshold` and `fit_config.good_threshold`. Anything below `good_threshold` is unranked.
5. Sort: Great → Good → unranked, time-ascending within each band.

### 10b. Claude API mode (opt-in)

If `agenda.json.fit_config.anthropic_api_key_configured` is true, the page detects an `ANTHROPIC_API_KEY` cookie set at deploy time (the `here-now` skill handles secret injection — never embed a raw key in the HTML). On fit-search submit:

1. Build a single batch request to `claude-haiku-4-5-20251001` with the persona description and all sessions (id + title + abstract + tags only — no time/room).
2. Ask the model to rate each session `great` / `good` / `skip` and produce a one-sentence reason.
3. Render `Great fit` / `Good fit` ribbons with the model's reason on hover.
4. Fall back to keyword mode if the API call fails or no key is configured.

When the user runs `create`, ask whether to enable API mode. If yes, prompt them to provide the API key — pass it to the `here-now` skill as a deploy-time secret rather than writing it to disk. Default is off.

## Step 11 — `info`

Print a short status block:

```
Acme Summit 2026 — 2026-09-15 to 2026-09-17
Live at:  https://acme-summit-2026.here.now
Sessions: 47   Tracks: 5   Speakers: 38
Last deployed: 2026-05-18 14:32 (3 days ago)
Personalized agendas (3):
  - Bob, CISO @ F100 Financial Services — 5 sessions — https://acme-summit-2026.here.now/personalized/bob-ciso-f100-fs.html
  - Sarah, Head of Marketing @ Series-B SaaS — 4 sessions — …
  - Dimitri, VP Eng @ ScaleUp — 6 sessions — …
```

## What this skill never does

- Modify files outside the active project folder (except this skill's own assets when reading the template).
- Write a raw API key into `agenda.html` or `agenda.json` — secrets always go through the `here-now` skill's secret-injection mechanism.
- Deploy without confirming the subdomain.
- Silently drop CSV rows. Always surface ambiguous rows for the user to resolve.
- Replace the user's CSV. Their original lives verbatim at `sessions.csv`.
- Send anything to attendees, prospects, or speakers. Sharing the URL is up to the human.
