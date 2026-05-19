---
name: budget
description: Build and maintain a line-item budget for a single B2B marketing event — customer dinners, prospect happy hours, field events, executive retreats, ancillary tradeshow events, hackathons, curated VIP experiences. On first run either parses an uploaded budget spreadsheet or interviews the organizer to construct one. As the organizer drops spend evidence into the thread (PDF invoices, image invoices, screenshots of email receipts, or screenshots of bank/credit-card transactions — including bank-list screenshots with multiple transactions at once), the skill extracts vendor and total, auto-categorizes each into the right line item, and updates Projected / Actual / Variance numbers. Generates a read-only HTML view styled like a finance tracker. Use whenever a B2B event marketer is planning event spend, asking about budget, uploading or pasting an invoice/receipt/transaction screenshot, or asking "how much have we spent on X". Trigger on phrases like "budget", "event budget", "line items", "I have an invoice", "here's a receipt", "log this charge", "categorize this", "how much have we spent", "are we over budget", "screenshot of my Amex". Designed to live in a per-event folder alongside the workback-schedule skill so the same thread can run both. Do NOT trigger for personal-finance, company-wide opex, or non-event spend.
---

# Budget for B2B Event Marketing

## What this skill does

Maintains a line-item budget for a single B2B marketing event. The budget lives in a per-event folder picked on first run; the same skill is invoked repeatedly across the planning window in a pinned thread to:

- create the budget from an uploaded sheet OR by interviewing the organizer
- ingest invoices the organizer drops into the thread, extract vendor + amount, and categorize each into the right line item
- recompute Actual + Variance on every change
- regenerate a read-only HTML view (Smartsheet-style finance tracker) of the budget

`budget.md` in the event folder is the source of truth. `budget.html` is a generated view.

This skill is paired with workback-schedule in the same event folder. Each skill owns its own file and never writes to the other's.

## Budget model — three levels

```
Event budget
├── Category (e.g., Venue, F&B, Gifts & Swag)
│   ├── Line item (e.g., Location Rental, AV Equipment)
│   │   ├── Projected (allocated $)
│   │   ├── Actual (sum of invoices)
│   │   ├── Variance (Actual − Projected; negative = under budget)
│   │   ├── Comments (freeform)
│   │   └── Invoices (each with date, vendor, amount, file, confidence, note)
```

Variance convention: **Variance = Actual − Projected**. Negative means under budget (good). Positive means over budget (red).

## Operations

| User intent | Operation |
|---|---|
| "Build a budget for X" / first run | `create` |
| "Where are we on spend?" / "Status" / no other instruction | `status` |
| User uploads or pastes an invoice (PDF / image / pasted text) | `intake-invoice` (auto-trigger) |
| "Move that invoice to <line item>" / "That's not Venue, it's F&B" | `recategorize` |
| "Bump <line item> to $X" / "Move $500 from X to Y" | `reallocate` |
| "Add a line item for <thing> under <category>" | `add-line` |
| "Remove <line item>" | `remove-line` |
| "Add an invoice manually" (no file) | `add-invoice` |
| "Regenerate the HTML" | `view` |
| "Give me a stakeholder summary" / "Report" | `report` |

If invoked without context, default to `status` when there's an active budget, or `create` otherwise.

## Step 1 — Determine the active event

Same model as workback-schedule:

1. If a budget has been created or loaded earlier in this thread, use that folder.
2. If the user names a folder containing `budget.md`, switch to it.
3. If neither, and op is `create`, run the first-run flow (Step 2).
4. If op is anything else and there's no active budget, ask which event folder to load.

If the workback-schedule skill has already established an active event folder in the thread, **use that same folder** — never create a parallel folder.

## Step 2 — First-run flow (`create`)

### 2a. Gather event-level inputs in ONE batched question

Ask all of these in a single follow-up — do not iterate one at a time. The user explicitly asked for this.

1. **Event name** (or confirm if a workback already exists in the thread)
2. **Event date**
3. **Location** (city)
4. **Headcount** (drives per-person sanity checks)
5. **Total budget cap** (overall $)
6. **Currency** (default USD if not specified)
7. **Event type** — one of: `customer-dinner`, `prospect-happy-hour`, `field-event`, `ancillary-tradeshow`, `executive-retreat`, `hackathon`, `curated-experience` (if a workback exists, read it from there)
8. **Known fixed costs already committed** — venue contract, swag order, speaker fee, anything else the user already has a number for
9. **Contingency %** preference (default 10%, common range 8–20%)
10. **Owner** (for stakeholder report; default to the workback owner if known)

Acknowledge anything the user already provided in their original message; ask only for what's missing.

### 2b. Ask where to save (only if no event folder is active)

If no active event folder exists yet in the thread, ask the user for the parent directory and create:

```
<parent-dir>/<event-slug>/
  budget.md
  budget.html
  assets/
    invoices/         # uploaded invoice files land here
  notes.md            # placeholder shared with workback skill
```

Slug format: `YYYY-MM-DD-<kebab-cased-event-name>`, same as workback. If a workback folder already exists in this thread, **reuse it** — write `budget.md` and `budget.html` into the same folder, and create `assets/invoices/` if missing.

### 2c. Pick the source for the budget

Two paths — ask the user which they want, in the same batched question from 2a:

**Path A — User uploads an existing budget** (sheet, CSV, screenshot of Smartsheet/Excel, markdown table, pasted text)
- Parse it into the canonical 3-level structure (Step 4).
- Preserve any custom categories or line items the user had.
- If the upload only has totals and not the breakdown, ask for the breakdown OR fall back to Path B.

**Path B — Interview to build from scratch**
- Load `assets/categories/<event-type>.md` to get the standard category + line-item structure for this event type (Step 11).
- Apply the user's total budget across categories using the percentage suggestions in the template.
- Distribute each category's amount across its line items (evenly by default, or weighted if the template marks specific line items).
- Apply any known fixed costs from 2a's question 8 — fix those line items at the stated amount and rebalance the rest.
- Reserve the contingency % as a `Misc / Contingency` category if not already present.
- Present the draft budget to the user with totals visible and ask: "Does this look right? Anything to bump up or down before we lock it in?"
- Apply user corrections, then write `budget.md` and generate `budget.html`.

### 2d. Show the draft and confirm

Always show the user the draft (compact markdown table) before writing the file. Wait for confirmation OR apply requested edits, THEN write `budget.md` and generate `budget.html`. Report the paths and a one-line summary: "Wrote budget.md with N categories and M line items totaling $X. View it at budget.html."

## Step 3 — Parsing an uploaded budget

Accept: markdown tables, CSV/TSV, plain bullet hierarchies, Excel-like text dumps, screenshots, PDF exports of budget templates.

Extract per row:

- **Category** (top-level group) — required
- **Line item** (sub-row under a category) — required
- **Projected** (allocated $) — required; default 0 if blank
- **Actual** (if the source already had spend logged) — default 0
- **Comments** — preserve verbatim

For screenshots and PDFs, use the Read tool (it handles both). Transcribe rows into the canonical 3-level structure.

If a row is ambiguous (no clear category, or projected is non-numeric like "TBD"), surface it in a single batch and ask the user to resolve.

Numeric parsing: strip currency symbols, commas, and parens. Treat `($X)` (parens) as negative.

## Step 4 — budget.md format

```markdown
---
event: CISO Dinner NYC
date: 2026-09-15
location: New York, NY
attendees: 25
currency: USD
total_budget: 25000
contingency_pct: 16
owner: vedha
created: 2026-05-18
vendor_categories:
  "Le Bernardin": "Venue > Location Rental"
  "Acme Signs": "Décor & Print > Signage"
  "BoxFox": "Gifts & Swag > Branded gifts"
---

## Budget

### Venue
- Location Rental | projected: 8200 | comments: dinner private room
- AV Equipment | projected: 500 | comments:
- AV Staff | projected: 0 | comments:
- Wi-Fi | projected: 0 | comments:

### F&B
- Catering | projected: 6000 | comments:
- Beverages | projected: 2500 | comments: open bar

### Décor & Print
- Signage | projected: 400 | comments:
- Floral / centerpieces | projected: 800 | comments:
- Menus / printed materials | projected: 300 | comments:

### Gifts & Swag
- Branded gifts | projected: 2500 | comments: top 10 attendees

### Photography
- Photographer | projected: 800 | comments:

### Transportation
- Rideshare credits | projected: 600 | comments:

### Staffing
- Onsite event manager | projected: 1200 | comments:

### Misc / Contingency
- Contingency | projected: 1200 | comments: ~5% buffer

## Invoices

| Date | Vendor | Amount | Category | Line item | File | Confidence | Note |
|---|---|---|---|---|---|---|---|
| 2026-06-10 | Le Bernardin | 7500 | Venue | Location Rental | assets/invoices/le-bernardin-deposit.pdf | high | venue deposit (final) |
| 2026-06-15 | Acme Signs | 420 | Décor & Print | Signage | assets/invoices/acme-signs.pdf | high |  |

## Notes

<freeform log>
```

**Line item grammar:**

```
- <line item name> | projected: <number> | comments: <text>
```

- `projected` is in whole units of the budget's currency (no decimals, no $ sign in the file — formatted only in the HTML).
- `comments` may be empty.
- Categories are H3 sections (`###`). Line items are bullets under them.

**Invoices table:**

- One row per invoice.
- `Confidence` is one of `high`, `medium`, `low` — set when the invoice is first categorized.
- `File` is a relative path inside the event folder (typically `assets/invoices/<vendor-date>.pdf`).
- Amounts are in the budget's currency, no symbols, no commas.

Use `Edit` for incremental changes. Use `Write` only when generating fresh or doing a full rewrite.

## Step 5 — Actual + Variance computation

Actual and Variance are **derived** — never stored in the markdown line. Always compute on read:

```
line_item.actual    = sum of invoices.amount where invoice.line_item == this line item
line_item.variance  = line_item.actual − line_item.projected
category.projected  = sum of line_items.projected in this category
category.actual     = sum of line_items.actual in this category
category.variance   = category.actual − category.projected
total.projected     = sum of categories.projected
total.actual        = sum of categories.actual
total.variance      = total.actual − total.projected
```

Negative variance = under budget = good. Positive variance = over budget = surface in red.

## Step 6 — HTML view generation

After every change to `budget.md`, regenerate `budget.html`.

Read the template at `assets/budget-template.html` (relative to this skill's folder). It contains a `<script id="budget-data" type="application/json">{{DATA}}</script>` placeholder.

JSON payload shape:

```json
{
  "event": {
    "name": "CISO Dinner NYC",
    "date": "2026-09-15",
    "location": "New York, NY",
    "attendees": 25,
    "currency": "USD",
    "currency_symbol": "$",
    "owner": "vedha"
  },
  "categories": [
    {
      "name": "Venue",
      "line_items": [
        {
          "name": "Location Rental",
          "projected": 8200,
          "actual": 7500,
          "variance": -700,
          "comments": "dinner private room",
          "invoices": [
            { "date": "2026-06-10", "vendor": "Le Bernardin", "amount": 7500, "file": "assets/invoices/le-bernardin-deposit.pdf", "confidence": "high", "note": "venue deposit (final)" }
          ]
        }
      ],
      "subtotals": { "projected": 8700, "actual": 7500, "variance": -1200 }
    }
  ],
  "totals": { "projected": 25000, "actual": 7920, "variance": -17080 }
}
```

Per-row rendering in the HTML:

- **Category header rows** — bold, teal background, show category subtotals across the Projected / Actual / Variance columns. Always expanded (categories themselves don't collapse).
- **Line item rows** — show name, projected, actual, variance, comments. Click any line item with invoices to **expand** into invoice sub-rows.
- **Invoice sub-rows** — date, vendor, amount, link to file, confidence pill, note. Visible only when their line item is expanded.
- **Top-right summary card** — Projected / Actual / Variance for the event total.
- **Variance coloring** — green/gray when ≤ 0 (under or at budget), red when > 0 (over budget).
- **Currency formatting** — `$X,XXX` (no decimals if amounts are whole), or `$X,XXX.XX` if any non-integer amounts exist.

Write the result to `<event-folder>/budget.html`. Tell the user the path and suggest `open <path>` on macOS to view.

The HTML view is **read-only**. All edits go through the skill via chat.

## Step 7 — Invoice intake (`intake-invoice`)

This is the most common operation after `create`. The organizer drops an invoice (PDF, image, or pasted text) into the thread. Steps:

### 7a. Read and extract

The user may share spend evidence in any of these forms — handle all of them:

| Input shape | What it looks like | Handling notes |
|---|---|---|
| **PDF invoice** | Formal invoice from a vendor with line items, totals, due dates | Most info-rich. Read with the Read tool; for >10 pages request `pages: "1-3"`. |
| **Image of an invoice** | Photo or scan of a paper invoice | Read the file path with the Read tool (it handles images). |
| **Screenshot of an email receipt** | E.g., Stripe/Square/Shopify confirmation, Amazon/FedEx order email, restaurant receipt email | Look for "Receipt", "Order confirmation", "Payment received". Vendor is usually in the from-address or first line. |
| **Screenshot of a bank or credit card transaction** | Single transaction or a list view from a bank app, Mercury, Brex, Ramp, Amex, etc. | See "Transaction-string normalization" below. May contain multiple transactions — treat each as a separate invoice. |
| **Pasted text** | User pastes the text of a receipt or transaction into the chat | Same extraction rules; no file to copy in 7c. |
| **Inline-attached image** in the chat message | User drops an image directly into the conversation without saving it first | The image is visible in conversation context — extract from it directly. Before copying it into the event folder (7c), ask the user to save it OR offer to write it to `assets/invoices/<slug>.png` based on what you can see. |

Extract these fields from whichever shape was provided:

- **Vendor name** — the merchant. For invoices: letterhead / "From:" / "Bill from:" / most prominent business name. For email receipts: sender domain or first-line brand. For bank/CC screenshots: the merchant string after normalization (see below).
- **Total amount** — the final paid amount. For invoices: "Total", "Grand total", "Amount due", "Balance due". For receipts: "Total" or "Amount". For bank screenshots: the transaction amount (sign-flip if the screenshot shows it as negative for "money out").
- **Date** — the transaction date. For invoices: invoice date (fall back to due date with a note). For receipts: order date or payment date. For bank screenshots: prefer the **posted date** if both are shown; otherwise whatever the screenshot lists.
- **Currency** — if different from the budget's currency, flag it and ask the user how to handle (convert at user-supplied rate? log as-is in note, exclude from totals? reject?).

**Transaction-string normalization** (for bank/CC screenshots):

Merchant strings on bank statements often have processor prefixes and noise — strip these before matching:

| Pattern | Means | Strip / convert |
|---|---|---|
| `SQ *<NAME>` or `SQ* <NAME>` | Square | Drop `SQ *` |
| `TST* <NAME>` | Toast | Drop `TST*` |
| `SP <NAME>` or `SP* <NAME>` | Shopify Payments | Drop |
| `PYP* <NAME>` or `PAYPAL *<NAME>` | PayPal | Drop |
| `AMEX*`, `VISA*` | Card brand | Drop |
| `<NAME>             0000-0000` | Trailing reference number | Drop trailing digits / dashes |
| All-caps with weird spacing | Bank formatting | Title-case and clean spacing |
| `<NAME> #1234` | Store / location number | Keep the name, drop the # — note location in `Note` if useful |

Examples: `SQ *LE BERNARDIN NY` → `Le Bernardin`. `TST*ACME CATERING` → `Acme Catering`. `AMZN MKTP US*A1B2C` → `Amazon`.

**Batches**: if a screenshot shows multiple transactions (e.g., a bank's transaction list view), parse each row as a separate invoice and process them as a batch — present all rows with their proposed categorization at once and ask the user to approve all / approve some / reject some, rather than asking one at a time.

If any required field can't be extracted with confidence, ask the user before proceeding. Don't silently guess. For inline-attached images, if visual quality is poor, ask the user to retype the vendor and amount.

### 7b. Categorize

Determine the right `Category > Line item` using this priority order:

1. **Vendor map hit** — if `vendor_categories[<vendor>]` exists in frontmatter, use that. Confidence: **high**.
2. **Strong vendor signal** — vendor name strongly implies a category (e.g., "Acme Catering" → F&B, "FedEx" → Shipping). Confidence: **high** if the signal is unambiguous, **medium** otherwise.
3. **Invoice line-item match** — scan the invoice body for keywords matching budget line item names. Confidence: **medium**.
4. **Fallback** — ask the user which line item this belongs to. Confidence: **low** (don't categorize unilaterally).

For **bank/CC screenshots and email receipts**, downgrade confidence by one notch (high → medium, medium → low) unless the vendor is already in `vendor_categories`. Reason: these formats lack line items, so the merchant string alone is weaker evidence than a full invoice. A bank line that says "AMZN MKTP" could be swag, food, AV cables, or office supplies — ask if the line item isn't obvious from the workback or prior context.

### 7c. Copy the file into the event folder

Save the source file at `<event-folder>/assets/invoices/<slug>.<ext>`. Slug: `<vendor-kebab>-<YYYY-MM-DD>` plus a type suffix when it's not a full invoice — e.g., `le-bernardin-2026-06-10.pdf`, `acme-catering-2026-07-02-receipt.png`, `amex-2026-08-15-statement.png`. The suffix helps the organizer find context later when expanding a line item in the HTML.

- **File on disk** (PDF or image path the user provided) — copy it to the path above.
- **Inline-attached image in chat** (no path) — ask the user to either save the image and re-send the path, OR confirm the metadata so the row can be logged with `File` blank. Don't silently invent a file.
- **Pasted text** — no file to copy. Leave `File` blank.
- **Batch from a bank screenshot** — one source file, many invoice rows. Copy once; reference the same file from each row (`assets/invoices/amex-2026-08-15-statement.png`). The HTML will link all of them to the same screenshot.

### 7d. Append to invoices table

Add a new row to `## Invoices` in `budget.md` with all extracted fields and the chosen Category > Line item.

### 7e. Tell the user the categorization

Always surface the decision so the user can correct:

> Logged invoice from **Le Bernardin** for **$7,500** on **2026-06-10**.
> Categorized as **Venue > Location Rental** (confidence: high).
> If that's wrong, say "move it to <category> > <line item>".

If confidence is **low**, phrase it as a question instead of a statement:

> I see an invoice from **Acme LLC** for **$1,200**. I can't tell from the invoice alone whether this is Venue > AV Equipment or AV & rentals. Which line item should it go under?

### 7f. Regenerate HTML and report variance change

After writing budget.md, regenerate budget.html. In the response, mention if this invoice flipped any line item or category from under-budget to over-budget — that's the kind of thing the organizer needs to know immediately.

## Step 8 — Recategorize (`recategorize`)

When the user corrects a categorization:

1. Find the invoice (by vendor + date + amount, or by user pointing).
2. Update its Category and Line item in the invoices table.
3. **Learn from the correction**: add or update `vendor_categories[<vendor>]` in frontmatter to point to the corrected `Category > Line item`. Next invoice from that vendor will use the corrected category with high confidence.
4. Regenerate HTML.
5. Report what changed and the variance impact on both old and new line items.

## Step 9 — Reallocate, add-line, remove-line

- **`reallocate`** — Change projected on a line item, or move dollars between line items. Confirm before applying if it changes total budget. Show before/after variance for the affected lines.
- **`add-line`** — Add new line item under an existing category, OR add a new category. Ask for projected amount (default 0). Insert in alphabetical-within-category order unless user specifies position.
- **`remove-line`** — Refuse if invoices are attached to that line item — ask user to first recategorize those invoices or confirm deletion of both. Log the removal in `notes.md`.

## Step 10 — Status and Report

### `status`

Default response when invoked with no specific instruction. Show:

- Event header (name, date, days remaining, location)
- Top-level numbers: Projected / Actual / Variance
- Line items currently over budget (red) — name, projected, actual, overage
- Line items at >80% used and at risk (yellow)
- Line items with $0 spent so far and target dates approaching (read from workback if present)
- Recent invoices (last 5)
- Path to `budget.html`

### `report`

Stakeholder-friendly markdown summary, suitable for pasting into a status update:

```
# CISO Dinner NYC — Budget as of 2026-07-20
Event date: 2026-09-15 (57 days out)
Total budget: $25,000
Spent to date: $7,920 (32%)
Remaining: $17,080
Variance: −$17,080 (under)

Over budget (0):
  — none —

At risk (>80% used) (1):
  - Venue > Location Rental: $7,500 of $8,200 (91%)

Largest spends so far:
  1. Le Bernardin (Venue) — $7,500
  2. Acme Signs (Décor) — $420

Full breakdown: <event-folder>/budget.html
```

## Step 11 — Category templates

When no upload is provided, load `assets/categories/<event-type>.md` (relative to this skill's folder) and use the recommended structure.

Template format:

```markdown
# Customer Dinner — budget categories

Default 3-level structure for a customer dinner. Percentages are starting suggestions of total budget.

- Venue (~35%)
  - Location Rental
  - AV Equipment
  - AV Staff
  - Wi-Fi
- F&B (~28%)
  - Catering (~75% of F&B)
  - Beverages (~25% of F&B)
...
```

Available templates:

- `customer-dinner.md`
- `prospect-happy-hour.md`
- `field-event.md`
- `ancillary-tradeshow.md`
- `executive-retreat.md`
- `hackathon.md`
- `curated-experience.md`

When applying a template:
- Allocate each top-level category at its `~%` of the user's total budget.
- Within a category, split evenly across line items unless the template marks specific sub-percentages.
- Apply user-stated fixed costs first; rebalance the remainder.
- Reserve the user's stated contingency % (or template default).

Tell the user which template was used and that they should review for things specific to this event.

## Workback-schedule coupling

The workback-schedule skill lives in the same event folder. The budget skill should:

- **Read** `workback.md` if it exists, to align categories/line items with cost-relevant workback tasks (venue deposit, swag order, etc.).
- **Never write** to `workback.md`.
- When the workback skill marks a cost-relevant task as done ("venue deposit sent"), the user often follows up with an invoice — be ready for the next invoice to land.
- Surface a reminder in `status` if a workback task is overdue and the corresponding budget line still has $0 actual.

## Currency

The budget has a single currency (set in frontmatter). If an invoice comes in a different currency, ask the user:
1. Convert at today's rate? (request the rate from the user — don't fetch it; can be wrong)
2. Log as-is in original currency in the note column, exclude from totals?
3. Reject the invoice?

Default to asking; don't silently convert.

## What this skill never does

- Modify any file outside the active event folder.
- Maintain global state across threads.
- Categorize invoices unilaterally when confidence is low.
- Convert currencies without user confirmation.
- Delete invoice files from `assets/invoices/`.
- Modify `workback.md`.
- Send vendor payments or interact with bank/AP systems.
