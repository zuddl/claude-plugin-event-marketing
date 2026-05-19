---
name: linkedin-event-promos
description: Generate LinkedIn promotion graphics for the speakers and sponsors of a B2B marketing event — one branded image per person/company, rendered from a user-supplied HTML template and a CSV/list of attendees. Use whenever a B2B event marketer needs to bulk-produce social cards announcing speakers ("excited to welcome <name> to <event>") or thanking sponsors ("thanks to our Gold sponsor <company>"), especially when they have multiple template variants for different ramp points (save-the-date, 1 month out, 2 weeks out, 1 week out, day-of). Trigger on phrases like "speaker cards", "sponsor cards", "LinkedIn promo images", "speaker announcement graphics", "social cards for the event", "generate promo images for our speakers/sponsors", "we need the speaker images for our LinkedIn push", "1 month out posts", "speaker reveal graphics", "promote our sponsors on LinkedIn", "make the social assets for <event>". Do NOT trigger for writing the post copy itself (out of scope — this skill only produces images), for full brand-kit design from scratch (use a design tool), or for non-LinkedIn formats unless the user explicitly asks for additional sizes.
---

# LinkedIn Event Promo Image Generator

## What this skill does

Takes one or more HTML promo-card templates plus a CSV of speakers or sponsors and renders one PNG per row, ready to attach to a LinkedIn post. Designed for the moment when a B2B event marketer has 15 speakers and 8 sponsors to announce across a multi-week ramp and does not want to open Figma 23 times.

The skill produces **images only** — not the post copy. The marketer writes the caption; this skill produces the asset.

## Why this skill exists

Event marketers ship the same kind of LinkedIn card over and over: a square or landscape graphic with the speaker's headshot, name, title, company, event lockup, and date. Producing them one at a time in a design tool is slow and inconsistent — fonts drift, alignments drift, the "1 month out" version diverges from the "1 week out" version in ways that look unbranded.

The fast loop is: pin a template once, drop in a CSV, and bulk-render. This skill is that loop.

## Step 1 — Gather inputs

Confirm you have all of the following. If any are missing, ask for all missing ones in **a single follow-up message** — never one at a time.

**Required:**

1. **One or more HTML templates** — paths to `.html` files containing the card design with placeholder tokens (see Step 3). The user may supply:
   - A single template (one image per person), OR
   - Multiple templates for different ramp points (e.g., `1mo-out.html`, `2wk-out.html`, `1wk-out.html`, `day-of.html`). For each template, the skill produces a full set of images, written to a subfolder named after the template.
   - If the user has no template yet, offer the defaults shipped with this skill at `assets/templates/speaker-card-square.html` and `assets/templates/sponsor-card-square.html`. Treat those as starting points — confirm the user is OK using them as-is or wants to edit first.

2. **A CSV (or list) of speakers and/or sponsors** — file path, or an inline list the user pastes. The skill handles speakers and sponsors as two separate runs even if they live in one file (different templates, different placeholders). Expected columns:
   - **Speakers:** `name`, `title`, `company`, `headshot` (URL or local path), `session_title` *(optional)*, `linkedin_url` *(optional)*
   - **Sponsors:** `name` (company name), `tier` (Platinum/Gold/Silver/etc., optional), `logo` (URL or local path), `website` *(optional)*

   Treat the user's column names as authoritative — if they hand over a CSV with different headers, map them by asking the user once ("your CSV has `Full Name` and `Headshot URL` — should I treat those as `name` and `headshot`?") rather than guessing silently.

3. **Event metadata** — used to fill template tokens that are the same on every card:
   - `event_name` (e.g., "Signal 26")
   - `event_date` (e.g., "October 14, 2026" — keep the exact string the user wants printed on the card)
   - `event_location` *(optional — venue + city, or "Virtual")*
   - `event_hashtag` *(optional, e.g., "#Signal26")*
   - `event_logo` *(optional — path or URL; only needed if the template references `{{event_logo}}`)*

4. **Output type per run** — speakers, sponsors, or both. If "both", the skill runs twice (once per CSV) and writes to separate subfolders.

**Optional but useful:**

5. **Image size** — default is **1200x1200** (LinkedIn square, best feed real estate). Offer **1200x627** (landscape, link-preview-style) if the user prefers. The size flows into the render command; the template should already be authored at the matching aspect ratio.

6. **Event slug** — short kebab-case name used in the output path (e.g., `signal26`). Default: derive from `event_name` by lowercasing, stripping punctuation, and joining with hyphens. Confirm the derived slug with the user before writing.

If the user gave a partial answer, acknowledge what you have and ask only for what is missing.

## Step 2 — Resolve headshots and logos

For each row, the `headshot` (speakers) or `logo` (sponsors) field is either a URL or a local path.

- If it's a local path, verify the file exists. If not, flag the row and ask the user — do not silently substitute a placeholder.
- If it's a URL, download it once into `./social-promo-output/<event-slug>/assets/headshots/` (speakers) or `.../assets/logos/` (sponsors). Use the row's `name`/`company` (slugified) as the filename. Skip downloads if the file already exists from a prior run.
- If a row is missing a headshot/logo entirely, flag the row and ask the user whether to skip it or use a generic placeholder. Do not invent an image.

Downloaded files are referenced by relative path inside the per-row HTML so the rendered PNG resolves them correctly.

## Step 3 — Substitute template tokens

Each template is a normal HTML file with double-brace placeholder tokens. Standard token set:

**Speaker cards:**
- `{{name}}`, `{{title}}`, `{{company}}`, `{{headshot}}` (resolves to a path/URL usable in `<img src>`)
- `{{session_title}}`, `{{linkedin_url}}` *(optional — only substitute if the template references them)*

**Sponsor cards:**
- `{{name}}` (company name), `{{tier}}`, `{{logo}}`, `{{website}}`

**Shared event tokens (both types):**
- `{{event_name}}`, `{{event_date}}`, `{{event_location}}`, `{{event_hashtag}}`, `{{event_logo}}`

Substitution rule: read the template once, do a plain string replace for each `{{token}}` with the row's value, write the per-row HTML to a temp file under `./social-promo-output/<event-slug>/_html/<template-name>/<row-slug>.html`. The intermediate HTML is kept so the user can inspect/debug a card that looks wrong without re-running.

If a template references a token that is not present in the CSV row or event metadata, leave the literal `{{token}}` in place and warn the user after the run completes — do not crash, but surface the gap so they can either fix the CSV or remove the token from the template.

## Step 4 — Render each HTML file to PNG

Use **headless Chrome** to render. It is preinstalled on most macOS dev machines and needs no `npm install`.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless \
  --disable-gpu \
  --hide-scrollbars \
  --default-background-color=00000000 \
  --window-size=1200,1200 \
  --screenshot="<output.png>" \
  "file://<absolute-path-to-row-html>"
```

For the **1200x627** landscape size, change `--window-size` to `1200,627`.

Fallback if Chrome is not at the default path: try `which google-chrome-stable`, `which chromium`, then `npx playwright` as a last resort. Confirm the binary path with the user once at the start of the run rather than per-row.

Render rows in batches (e.g., 5 in parallel via background jobs) for speed — each invocation is independent, and a 20-row CSV renders in under 10 seconds on a modern Mac.

Validate every output: if the PNG is under 5 KB, something failed silently (often a missing image source or a font that didn't load). Re-run that single row with logging on and surface the error.

## Step 5 — Write output

Final layout under `./social-promo-output/<event-slug>/`:

```
social-promo-output/
  <event-slug>/
    speakers/
      <template-name>/        # one subfolder per template if multiple supplied
        <speaker-slug>.png
        ...
    sponsors/
      <template-name>/
        <sponsor-slug>.png
        ...
    assets/
      headshots/<speaker-slug>.<ext>
      logos/<sponsor-slug>.<ext>
    _html/                    # intermediate per-row HTML (kept for debugging)
      <template-name>/<row-slug>.html
    index.md                  # generated summary (below)
```

If a single template is supplied, drop the `<template-name>` subfolder layer — the images go directly under `speakers/` and `sponsors/`. Only nest by template when the user supplied 2+ templates, so the simple case stays simple.

The `index.md` summary lists, per template:
- Total rows processed, rows skipped (and why), rows with unresolved tokens
- A table: `name | role/tier | output path` so the user can scan-check before posting

## Step 6 — Hand off

After writing the assets, tell the user:

- How many images were generated, in which folders
- Any rows that were skipped or had warnings (unresolved tokens, missing images)
- The path to one representative image they should open and eyeball before bulk-posting (cards often look fine in 19/20 cases and break on a long company name in the 20th)

Then offer 1–2 concrete next steps, picking what matches the user's context:

- "Want me to regenerate with the `1wk-out` template now?"
- "Want me to crop/resize these to 1080x1080 for Instagram too?"
- "Want me to draft LinkedIn caption copy for these?" *(out of scope but you can offer to hand it to a different skill or just write copy in-thread)*

## Default templates

Shipped at `assets/templates/`:

- `speaker-card-square.html` — 1200x1200, headshot left + name/title/company stacked right, event lockup bottom
- `sponsor-card-square.html` — 1200x1200, large centered logo, tier strap, event lockup bottom

The defaults are intentionally minimal so they render legibly with no brand kit applied. They are starting points — assume the user will fork and restyle.

## Sample CSVs

Shipped at `assets/samples/`:

- `speakers.csv`
- `sponsors.csv`

Use these to demo the flow on a first run, or as a reference for the columns the user's CSV should contain.

## What this skill does NOT do

- **Write the LinkedIn caption / post copy.** Images only.
- **Schedule or publish to LinkedIn.** The marketer posts manually or via their scheduler (Sprout, Hootsuite, Buffer).
- **Design the template from scratch.** It substitutes tokens into a template you (or a designer) authored. If the user has no template and the defaults won't do, point them at the Pencil MCP or a designer.
- **Animated assets / video / carousels.** Static single-image cards only.
- **Headshot retouching / background removal.** Use the source image as-is. If a headshot looks bad in the rendered card, that is a source-image problem, not a rendering problem.
