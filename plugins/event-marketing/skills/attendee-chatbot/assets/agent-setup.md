# Claude Managed Agent provisioning — reference

This is the canonical sequence the `attendee-chatbot` skill follows when creating or updating the managed agent for an event. Steps that say "via claude-api skill" mean the implementing model should invoke the `claude-api` skill to fetch the current SDK pattern instead of generating API calls from memory.

The skill writes `agent.json` in the event-chatbot project folder as the source of truth for everything provisioned on the Anthropic side. Re-running the skill reads `agent.json` first to decide create-vs-update.

## 1. Validate the Anthropic API key

Sanity-check the key with a single low-cost call (e.g. list models or a 1-token Messages request). If it fails, stop and tell the user — do not proceed to upload files or create an agent against a broken key.

## 2. Upload PDFs to the Files API

For each file in `<project>/pdfs/`:

1. POST the file to the Anthropic Files API.
2. Record the returned file id, original filename, and SHA-256 of the local file (used in re-run diffing).
3. On re-run: skip files whose SHA matches a previously uploaded file. Delete file ids from `agent.json` whose corresponding local file is gone.

Don't upload files larger than the Files API limit. If a PDF is too large, tell the user and ask whether they want to split it or strip non-text content.

## 3. Create or update the agent

**First run (no `agent_id` in `agent.json`):** create a new managed agent with:

- name: `<event-name> Attendee Assistant`
- model: `claude-sonnet-4-6` (default — Sonnet is the right tier here; override only if the user asks)
- system prompt: built from the template in `SKILL.md` Step 4c, filled with intake values
- attached_files: every file id from step 2
- tools: `file_search` only

**Re-run (`agent_id` present):** update the existing agent. Replace the attached file set, refresh the system prompt if any intake values changed (branding, persona, welcome message metadata that bleeds into the prompt), keep the agent id.

## 4. Persist `agent.json`

After create-or-update, write `agent.json`:

```json
{
  "agent_id": "agt_...",
  "model": "claude-sonnet-4-6",
  "system_prompt_hash": "sha256-of-system-prompt",
  "files": [
    { "id": "file_abc", "name": "agenda.pdf", "sha256": "...", "uploaded_at": "2026-05-18T..." },
    { "id": "file_def", "name": "venue-map.pdf", "sha256": "...", "uploaded_at": "2026-05-18T..." }
  ],
  "created": "2026-05-18T...",
  "updated": "2026-05-18T...",
  "brand_name": "Acme Summit"
}
```

`system_prompt_hash` lets the next run detect whether the system prompt drifted (brand or persona change) without storing the whole prompt twice.

## 5. Echo the result to the user

A short summary, not a wall of text:

```
Agent provisioned: agt_abc123
  - Model: claude-sonnet-4-6
  - Files attached: 5 (agenda.pdf, venue-map.pdf, faq.pdf, coc.pdf, travel.pdf)
  - System prompt: branded for Acme Summit, includes anti-hallucination rules

Next: src/config.ts has been updated with the agent id. Run `npm run build` to produce dist/widget.js.
```

## Failure modes

| Failure | Recovery |
|---|---|
| File upload 4xx (size / format) | Stop, surface which file, suggest split-or-strip |
| File upload 5xx | Back off, retry once; if still failing, persist partial state and tell the user to re-run |
| Agent create 4xx (bad model id, bad tool config) | Stop, fix the request, do not silently swap models |
| Agent create 5xx | Retry once; on second failure, surface to user and offer to retry manually |
| Agent update finds the agent id missing on Anthropic side | Treat as first-run: create a new agent, warn the user the old `agent_id` is gone (any deployed widget still pointing at the old id will 404) |

## What this never does

- Upload anything outside `<project>/pdfs/`.
- Create a second agent for the same event (re-run updates the existing one).
- Add tools beyond `file_search`. The skill is explicit: this bot answers from documents only.
- Touch the user's other agents on the Anthropic account.
