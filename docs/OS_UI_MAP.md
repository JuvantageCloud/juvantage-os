# Juvantage OS — UI map (Solo ↔ Desktop)

**Status:** Locked IA for Personal V1 chrome  
**Mockups:** [`assets/mockups/os-ui/index.html`](../assets/mockups/os-ui/index.html)  
**Updated:** 2026-11-01

```text
ONE PRODUCT, TWO ZOOM LEVELS

  Solo  =  fast act (narrow)
  Desktop  =  same work, full width + secondary pages

Open Desktop MUST land on the same loop you were looking at —
not a random connectors dashboard.
```

---

## 1 · The rule (stop guessing)

| Surface | Size | Job | What the user sees |
|---------|------|-----|-------------------|
| **Agent float** | ~112×128 | Presence / nudge | Locked teal Lottie only |
| **Quick sheet** | ~340×560 | Act in &lt;10s | Top **1–3** loops + draft + Approve / Quiet / Snooze |
| **Desktop** | ~980×680+ (resizable) | Browse + settings | **Widened** loops workspace + nav to Context / Connectors / Settings |

**Continuity:** Quick sheet “Open Desktop” → Desktop **Loops** page, **same loop selected**, draft pane open if one exists.  
**Undock:** Desktop “Undock agent” → hide/minimize Desktop → Solo float resumes.

What you have today (connectors-first Desktop) **violates** this map. Phase 5 rebuilds Desktop to match.

---

## 2 · Navigation (Desktop)

```text
┌─────────────────────────────────────────────────────────────┐
│  Juvantage OS                              [Undock] [—] [□] │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  Loops   │   MAIN CANVAS (page)                             │
│  Context │                                                  │
│  Inbox   │                                                  │
│  ─────── │                                                  │
│  Connect │                                                  │
│  Settings│                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

| Nav item | Route | Purpose |
|----------|-------|---------|
| **Loops** | `/desktop/loops` | **Home.** Full open-loop list + detail/draft. Elongated quick sheet. |
| **Context** | `/desktop/context` | Last 3–4h apps/titles/URLs + See more |
| **Inbox** | `/desktop/inbox` | Synced mail + calendar preview (raw store) |
| **Connect** | `/desktop/connectors` | Gmail/Calendar status, Demo/OAuth, sync |
| **Settings** | `/desktop/settings` | Check-ins, quiet, privacy, blocklist, account |

Tray / menu bar: Show Agent · Quick Sheet · Open Desktop · Quit.

---

## 3 · Page inventory (build these; mockups numbered)

### A · Solo

| # | Screen | Contents |
|---|--------|----------|
| 01 | Agent idle | Float only, no badge |
| 02 | Agent nudge | Pulse + count badge |
| 03 | Quick sheet — empty | All clear + Extract CTA |
| 04 | Quick sheet — loops | Up to 3 cards, top focused |
| 05 | Quick sheet — draft | Editable body + Approve & send |
| 06 | Quick sheet — sent/closed | Toast + loop removed |

### B · Desktop — Loops (the widen)

| # | Screen | Contents |
|---|--------|----------|
| 07 | Bridge: sheet → Desktop | Same loop ID highlighted (motion note) |
| 08 | Loops home | List (all bands) + selected detail + draft |
| 09 | Loops — filter Critical | Band chips |
| 10 | Loops — empty | Same empty state language as sheet |
| 11 | Loop preview / evidence | Side panel: mail snippet, ambient, source |

### C · Context / Inbox

| # | Screen | Contents |
|---|--------|----------|
| 12 | Context — last 4h | App timeline, durations |
| 13 | Context — See more | Longer window / search |
| 14 | Inbox — mail list | Synced threads |
| 15 | Inbox — calendar | Upcoming events |

### D · Connect / Settings / System

| # | Screen | Contents |
|---|--------|----------|
| 16 | Connectors | Gmail + Calendar cards + actions |
| 17 | Settings — General | Launch at login, check-in times |
| 18 | Settings — Quiet | Quiet band, snooze defaults |
| 19 | Settings — Privacy | Pause eyes, blocklist, retention copy |
| 20 | Settings — Account | Signed-in user, sign out |
| 21 | Audit | Propose / approve / execute / verify log |
| 22 | What left the device | Per-draft disclosure (V2-ready stub OK) |

### E · Chrome extras

| # | Screen | Contents |
|---|--------|----------|
| 23 | Tray menu | macOS menu bar popup |
| 24 | Undocked | Desktop closed; agent Solo again |
| 25 | Sign-in gate | Before any OS data (Desktop first-run) |

**Parked (label only in mockups, do not build now):** phone remote, website embed, Teams RBAC.

---

## 4 · What lives where (content ownership)

| Content | Quick sheet | Desktop Loops | Elsewhere |
|---------|-------------|---------------|-----------|
| Top 1–3 loops | ✅ | ✅ (subset highlighted) | — |
| All loops + filters | — | ✅ | — |
| Draft + Approve | ✅ | ✅ (same API) | — |
| Last 4h apps | — | — | Context |
| Raw mail/cal | — | — | Inbox |
| OAuth / Demo connect | — | — | Connect |
| Check-in / quiet / privacy | — | — | Settings |
| Audit trail | — | link | Audit / Settings |

---

## 5 · Primary user flows

### Flow A — Close from Solo (happy path)
1. Agent nudges → click  
2. Quick sheet shows reply-owed  
3. Draft → edit → Approve & send  
4. Done — sheet empties or next loop  

### Flow B — Need the full list
1. On sheet, tap **Open Desktop**  
2. Desktop opens **Loops**, same loop selected, draft visible  
3. Browse other loops / Context / Settings  
4. **Undock** → back to Solo  

### Flow C — First run
1. Open Desktop (or tray → Open Desktop)  
2. Sign in  
3. Connect (Demo or Google)  
4. Extract → Loops fills  
5. Optional: leave Desktop, use Solo for day-to-day  

---

## 6 · Implementation notes (Phase 5)

1. Reorder Desktop default route → **Loops**, not connectors.  
2. Pass `?loopId=` (or IPC) when opening from sheet.  
3. Shared draft component between sheet + Desktop detail pane.  
4. Left nav; Connectors become a page, not the home.  
5. Keep cream / teal / serif brand from current chrome.

---

## Related

- Product UX: `OS_PRODUCT.md` §4  
- Build phases: `OS_BUILD_ROADMAP.md` Phase 5  
- Visual board: `assets/mockups/os-ui/index.html`  
