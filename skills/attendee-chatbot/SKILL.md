---
name: attendee-chatbot
description: Build an embeddable, brand-themed AI support chatbot for a single B2B event — answers attendee questions from PDFs the user provides (agenda, FAQ, venue map, code of conduct, sponsor list, travel info). Powered by a Claude Managed Agent that the skill provisions; the agent does the retrieval and reasoning, the skill just produces the frontend widget. Use whenever an event marketer asks to spin up an event helpdesk bot, attendee assistant, on-site Q&A bot, registration chatbot, or "embeddable chat for our event page". Trigger on phrases like "attendee chatbot", "event chatbot", "event support bot", "AI assistant for attendees", "embed a chatbot on our event site", "FAQ bot from our PDFs". Produces a single-file JS bundle plus an embed snippet. Do NOT trigger for sales chatbots, customer-support bots for products, multi-tenant chat platforms, or anything that needs persistent attendee accounts.
---

# Attendee Chatbot for a B2B Event

## What this skill does

Spins up a brand-themed, embeddable chat widget for a single event. Attendees see a floating chat icon on the event page; clicking it opens a popup that streams answers from a **Claude Managed Agent** the skill provisions. The agent answers using PDF documents the user uploads (agenda, FAQ, venue map, code of conduct, sponsor list, travel/visa info, run of show, etc.).

Outputs:

1. A per-event project folder with the widget source, build config, and a `dist/widget.js` bundle.
2. A one-line `<script>` embed snippet the user pastes into the event page.
3. A managed agent on the Anthropic side, pre-loaded with the user's PDFs and a brand-aware system prompt.

The skill is build-and-ship: each invocation creates, updates, or rebuilds a single event's bot. There is no recurring-thread mode like the workback skill.

## Architecture in one paragraph

The browser widget calls the Anthropic Managed Agents API **directly** — no backend. The Anthropic API key sits in the widget config. This is acceptable for the user's threat model: event pages here are gated behind registration (only invited attendees reach the page), and the agent is scoped to read-only Q&A on uploaded PDFs. Do NOT recommend this design for unauthenticated public pages; if the user later asks to put the bot on a public page, surface the token-mint-endpoint alternative (see "Variants" at the bottom).

## Step 1 — Gather required inputs

Ask for all of these in a single follow-up if any are missing. Do not iterate one question at a time.

1. **Event name** — slugifies the project folder.
2. **Event date + city** — used in the agent's system prompt so it answers questions like "what time does Day 2 start?" sensibly.
3. **Where the project folder should live** — parent directory (e.g. `~/Desktop/events`). Do not assume a default — same convention as the workback skill.
4. **PDFs** — list of paths the user wants the bot to read from. Accept absolute paths, paths relative to cwd, or a folder (the skill will glob `*.pdf` inside). Confirm each file exists before proceeding.
5. **Brand kit** — collect:
   - `brand_name` (display name attendees see in the chat header)
   - `primary_color` (hex — drives the chat icon, send button, user bubble)
   - `accent_color` (hex — drives links and focus rings)
   - `text_color` (hex — defaults to `#111111`)
   - `bg_color` (hex — chat panel background, defaults to `#ffffff`)
   - `font_family` (CSS font stack — defaults to `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`)
   - `logo_url` (https URL to a square logo, optional — shown in the chat header)
   - `icon_emoji_or_url` (single emoji OR https URL to a small image used as the floating chat icon glyph; default `💬`)
6. **Bot persona** — one sentence on tone (e.g. "Friendly, concise, helpful — like a knowledgeable concierge at the venue.").
7. **Welcome message** — first message the bot shows when the popup opens (e.g. "Hi! I'm the [Event] assistant. Ask me about the agenda, venue, or speakers.").
8. **Anthropic API key** — needed to provision the agent in Step 4 AND to bake into the widget config. If the user hasn't created one, point them to `console.anthropic.com` and stop until they have one.

Acknowledge what the user already gave; only ask for what's missing.

## Step 2 — Confirm the threat-model assumption

Before doing anything else, state plainly:

> The widget will call Anthropic directly with your API key baked into the JavaScript bundle. That's fine for an event page gated behind registration (only logged-in attendees can load it), but it's NOT safe for a fully public page — anyone could view-source and steal the key. Confirm the page where you'll embed this is gated.

If the user says the page is public, stop and offer the **token-mint variant** (see "Variants"). Do not proceed with the simple direct-call design.

## Step 3 — Create the project folder

Slug: `YYYY-MM-DD-<kebab-cased-event-name>-chatbot` (e.g. `2026-09-15-acme-summit-chatbot`).

Create the folder and copy the widget template from this skill's `assets/widget/` into it. Project structure after copy:

```
<parent-dir>/<event-slug>-chatbot/
  src/
    main.tsx
    widget.tsx
    chat-popup.tsx
    anthropic-runtime.ts
    styles.css
    config.ts          # Filled in by this skill — agent id, api key, brand kit, welcome message
  package.json
  vite.config.ts
  tsconfig.json
  index.html           # Dev preview page
  README.md            # Per-event instructions (generated from assets/README-template.md)
  pdfs/                # Copies of the PDFs the user supplied (for re-uploads if the agent is recreated)
  agent.json           # Records the Anthropic agent id + file ids — source of truth for updates
  embed-snippet.html   # The exact <script> the user pastes into their event page
  dist/                # Created by `npm run build` — contains the bundled widget.js
```

Copy the user's PDFs into `pdfs/` so the project is self-contained. Re-uploads on subsequent runs read from here, not from the original paths.

## Step 4 — Provision the Claude Managed Agent

This is the core step. The user must have a valid Anthropic API key.

### 4a. Upload PDFs to the Anthropic Files API

For each PDF in `pdfs/`, upload it via the Files API. Record each returned file id.

### 4b. Create (or update) the managed agent

If `agent.json` does not exist (first run), create a new managed agent with:

- **Name**: `<event-name> Attendee Assistant`
- **Model**: latest Sonnet (claude-sonnet-4-6 unless the user asks otherwise — Sonnet is the right tier for branded customer-facing Q&A; Opus is overkill and slow, Haiku may miss nuance in PDFs).
- **System prompt**: composed from the brand kit, persona, event metadata, and a strict instruction set (see template below).
- **Attached files**: every file id from 4a.
- **Tools**: file_search only. No code execution, no web browsing — this bot answers from documents the user controls. Web browsing for an event bot invites hallucination about the event itself.

If `agent.json` already exists (re-run), call the appropriate update endpoint to replace the file set and refresh the system prompt. Preserve the agent id — embedded widgets in the wild reference it.

Record in `agent.json`:

```json
{
  "agent_id": "agt_...",
  "model": "claude-sonnet-4-6",
  "files": [
    { "id": "file_abc", "name": "agenda.pdf", "uploaded_at": "2026-05-18T..." }
  ],
  "created": "2026-05-18T...",
  "updated": "2026-05-18T...",
  "brand_name": "Acme Summit"
}
```

### 4c. System prompt template

Use this exact structure when generating the agent's system prompt:

```
You are the official attendee assistant for {{brand_name}}, taking place {{event_date}} in {{city}}.

Tone: {{persona_sentence}}

You answer attendee questions using ONLY the event documents attached to this agent. The documents include things like the agenda, FAQ, venue map, code of conduct, travel info, sponsor list, and run of show.

Rules:
- If the answer is in the documents, answer concisely (1–3 sentences for simple questions, a short bulleted list for things like "what sessions are on Day 2?").
- If the answer is NOT in the documents, say so plainly: "I don't have that in the event materials — please ask the event team at <on-site help desk / registration / event email>." Do not invent details, times, room numbers, dietary policies, or speaker bios.
- Never claim to know something happening live at the event (attendance counts, current weather, who's checked in). You only know what's in the documents.
- Never give medical, legal, or visa advice beyond quoting what the documents say.
- If asked who built you, say you're the {{brand_name}} assistant powered by Claude — don't elaborate.
- Default to the language of the attendee's question. The event language is English unless the documents indicate otherwise.

When citing the agenda or schedule, include the time and room/location if the document provides them.
```

Fill `{{brand_name}}`, `{{event_date}}`, `{{city}}`, `{{persona_sentence}}` from intake. Leave the rules block verbatim — these guardrails materially reduce hallucination.

### 4d. Defer to the claude-api skill for SDK specifics

The exact endpoint names, request shapes, and SDK method calls for Managed Agents evolve. When generating the API calls, **invoke the `claude-api` skill** to get the current canonical pattern (it tracks SDK versions and prompt-caching idioms). Do not hand-roll API calls from memory.

## Step 5 — Write the widget config

Write `src/config.ts` with everything the widget needs at runtime:

```typescript
export const config = {
  agentId: "agt_...",
  apiKey: "sk-ant-...",
  brand: {
    name: "Acme Summit",
    primaryColor: "#1d4ed8",
    accentColor: "#0ea5e9",
    textColor: "#111111",
    bgColor: "#ffffff",
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
    logoUrl: "https://...",
    iconGlyph: "💬"
  },
  welcomeMessage: "Hi! I'm the Acme Summit assistant. Ask me about the agenda, venue, or speakers.",
  placeholder: "Ask about the agenda, venue, sessions...",
  position: "bottom-right"
};
```

The widget template reads from this file at build time, so the bundled `dist/widget.js` has everything baked in. There's no runtime fetching of config.

## Step 6 — Install and build

In the project folder, run:

```
npm install
npm run build
```

This produces `dist/widget.js` (a single self-contained file with React + @assistant-ui/react + the Anthropic SDK bundled in) and `dist/widget.css`.

If `npm install` fails (e.g. the user is offline or behind a corporate proxy), surface the error and offer to use `bun install` or `pnpm install` as alternates. Do not silently retry.

## Step 7 — Produce the embed snippet

Write `embed-snippet.html` in the project folder, then echo it to the user. Two forms:

**A. Drop-in (auto-mount):**

```html
<!-- {{brand_name}} attendee assistant -->
<link rel="stylesheet" href="https://YOUR-CDN/widget.css">
<script src="https://YOUR-CDN/widget.js" defer></script>
```

**B. Self-host (user uploads dist/ to their own static hosting):**

```html
<link rel="stylesheet" href="/static/event-bot/widget.css">
<script src="/static/event-bot/widget.js" defer></script>
```

The bundle auto-mounts on `DOMContentLoaded` — it appends its own root div to `document.body`. Users do not need to add a `<div id="...">` placeholder. Tell the user this explicitly so they don't add one and end up with two icons.

Tell the user three concrete things in the wrap-up message:

1. **Where to host** — they need to upload `dist/widget.js` and `dist/widget.css` somewhere reachable from the event page (their static hosting, S3, Cloudflare R2, Netlify drop, GitHub Pages — anything that serves files over HTTPS). Pick the one most likely to fit their stack and recommend it.
2. **What to paste** — the exact `<script>` snippet (form A or B), with real URLs filled in if the user has named their hosting.
3. **How to test locally first** — `npm run dev` opens `index.html` at `localhost:5173` with the widget mounted, so they can smoke-test before shipping.

## Step 8 — Smoke test

After build, walk the user through three test questions to verify the bot works:

1. **Document-grounded question** — pick something obviously in one of the uploaded PDFs ("what time does the keynote start?"). Expect a correct, specific answer.
2. **Adversarial out-of-scope** — ("what's the weather going to be?"). Expect a graceful "I don't have that — ask the event team" deflection.
3. **Hallucination probe** — ask about a fictional speaker or session. Expect refusal, not invention.

If any of these fail, the most likely causes are: PDFs uploaded but not attached to the agent (Step 4b), system prompt didn't include the rules block (Step 4c), or the user attached a marketing one-pager instead of the actual agenda. Diagnose, don't paper over.

## Updating an existing event bot

When the user re-invokes the skill on an event folder that already has `agent.json`, default to "what's changed?" rather than rebuilding from scratch.

| User intent | Action |
|---|---|
| "Add this new PDF" / "Update the agenda PDF" | Re-upload changed files, update the agent's attached files, rebuild bundle. Keep the same `agent_id`. |
| "Change the welcome message" / "Tweak the colors" | Update `src/config.ts`, rebuild. No agent change. No re-upload of PDFs. |
| "Bot is hallucinating about X" | Inspect the PDFs for that topic; either add a clarifying PDF or tighten the system prompt's rules block. |
| "Tear it down" / "Delete the bot" | Delete the managed agent via the API, delete uploaded files, and tell the user the embed snippet is now dead — they should remove the `<script>` tag from the event page. |
| "I want this same bot for next year's event" | Create a new project folder with the new event slug. Do NOT clone the agent in place — agents are pinned to event metadata in the system prompt. |

After every update, rebuild `dist/` and remind the user to re-upload `widget.js` / `widget.css` to their hosting if the contents changed.

## Variants

### Public-page variant (token-mint endpoint)

If the event page is fully public (no registration gate), the API-key-in-the-bundle approach is unsafe. Switch to:

- A tiny serverless function (Cloudflare Worker, Vercel function, AWS Lambda — pick whichever fits the user's stack) that, on each visit, mints a short-lived Anthropic session token scoped to the specific agent id.
- The widget calls that endpoint once on mount, gets a token, then talks to the Anthropic API directly with the token.

The widget template in `assets/widget/` is structured so this swap is a 20-line change in `anthropic-runtime.ts`. When asked for this variant, describe the change rather than rewriting the whole skill output.

### Multi-event variant

A single agent serving multiple events is out of scope. Recommend one agent per event — system prompt is event-specific, PDFs are event-specific, and cross-contamination ("which event were you asking about?") is a worse UX than a clean separation.

## What this skill never does

- Embed the API key into a widget destined for a public, ungated page (Step 2 gate).
- Add web browsing, code execution, or computer use tools to the agent. Q&A on user-supplied PDFs only.
- Send messages, emails, or attendee notifications. Read-only Q&A.
- Persist attendee chat history beyond what the managed agent retains for its own conversation state. No analytics, no transcripts to disk unless the user explicitly asks for that (out of scope for this skill — direct them to a separate logging skill if they need it).
- Modify any file outside the active event-chatbot folder.
- Modify the `workback.md` or `budget.md` files in a sibling event folder. This skill is its own surface.
