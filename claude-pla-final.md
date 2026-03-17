I can see all your data clearly — both sheets, the rulebook, and the ChatGPT plan. Let me build you a **tight, no-fluff implementation plan** tailored exactly to your setup.

⚠️ **First — remove that service account JSON from this chat immediately.** Even with the private key truncated, the `client_email`, `project_id`, and `private_key_id` are exposed. Revoke this key in Google Cloud Console right now and generate a new one. Never paste credentials in chat.

---

Now, the plan:Here's the full implementation plan:---

## Phase 1 — Sheet setup (15 min)

**`players_list` sheet** — add these columns to the right of your existing data:

| Column | Value | Notes |
|---|---|---|
| `id` | 1, 2, 3... | Manual serial number = chit number |
| `base_price` | 50 or 200 | 200 for premium players |
| `sold_team` | blank | filled by scorekeeper |
| `sold_price` | blank | in lakhs |
| `round` | 1 | 2 or 3 after unsold rounds |
| `status` | PENDING | → SOLD or UNSOLD |

**`teams` sheet** — already exists. Add formula columns:
- `purse_remaining` → `=125 - SUMIF(players_list!sold_team, A2, players_list!sold_price)/100` (converts lakhs to crore)
- `domestic_players_count` → `=COUNTIFS(players_list!sold_team,A2,players_list!player_type,"Domestic*")`
- `foreign_players_count` → `=COUNTIFS(players_list!sold_team,A2,players_list!player_type,"Foreign*")`

**`LIVE_AUCTION` sheet** — create new, single row:

| `current_player_id` | `status` |
|---|---|
| (blank) | IDLE |

---

## Phase 2 — Apps Script webhook (20 min)

One `doPost()` function that does three things atomically when the scorekeeper confirms a sale: marks the player row (sold_team, sold_price, status=SOLD), and the sheet formulas handle purse + counts automatically. Also needs a `doGet()` that returns LIVE_AUCTION row as JSON for the public screen.

Deploy as **Web App → Anyone can access** (no auth needed for this internal event).

---

## Phase 3 — Next.js app, 3 routes (1–1.5 hrs)

```
/display     → Public screen (projector)
/scorekeeper → Control panel (password: "kpl2026" or similar)
```

**Player image fix** — your Drive links need converting:
```
https://drive.google.com/file/d/FILE_ID/view
→ https://drive.google.com/uc?export=view&id=FILE_ID
```
Extract `FILE_ID` in JS with: `url.match(/\/d\/([^/]+)/)?.[1]`

**Data fetch pattern:**
```js
// Read (public)
const players = await fetch("https://opensheet.elk.sh/PLAYER_SHEET_ID/players_list").then(r=>r.json())
const teams   = await fetch("https://opensheet.elk.sh/TEAM_SHEET_ID/teams").then(r=>r.json())

// Write (scorekeeper)
await fetch(APPS_SCRIPT_URL, {
  method: "POST",
  body: JSON.stringify({ player_id, sold_team, sold_price, status, round })
})
```

---

## Phase 4 — Auction day flow

1. Chit drawn → scorekeeper enters serial number → player appears on projector
2. Teams bid (raise hands), scorekeeper mentally tracks the highest bid
3. Bidding ends → scorekeeper selects team + enters price → CONFIRM
4. Public screen auto-updates within 2s — purse and counts update via sheet formula
5. If no one bids → MARK UNSOLD → round field stays 1
6. After all round-1 players done → switch to Round 2 view (filtered: `status=UNSOLD, round=1`)

---

## Constraint checklist to enforce in UI

- Block CONFIRM if team's `foreign_players_count >= 5` and player is foreign
- Block CONFIRM if team's `total_players_count >= 16`
- Warn (but don't block) if `purse_remaining < sold_price/100`
- Show remaining purse in real-time on scorekeeper panel as price is typed

---

**Next step:** Set up the `LIVE_AUCTION` sheet and deploy the Apps Script webhook first — everything else depends on that write path working. Want me to write the full Apps Script code and the Next.js page skeletons?