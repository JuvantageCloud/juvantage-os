# You are here (read this when scattered)

**Product we're building:** Jos watches mail/calendar when linked → shows **one** thing you owe → you edit → **Approve** → it sends or books (demo fakes send).

**Screen read is extra.** It's a sticky note about what was on your Mac. Approve = throw the note away. It is **not** step one of the product.

## Sequential order (from `OS_BUILD_ROADMAP.md`)

| Step | Status | What it means for you |
|------|--------|------------------------|
| Phases 0–5 | Done | Float + Desktop + demo Google + close loop works |
| Quartet gate | Done | Brain laws enforced in code/tests |
| **Now** | **Phase 6** | Use it on **mail** daily; automated tests replace a handwritten journal |
| Next | V2 eyes | OCR only after Phase 6 feels solid — not now |
| Later | Phase 7 | Teams/docker — do not open |

## What to do today (one path)

1. `npm run dev:os:restart` — Brain + UI up.
2. Desktop → **Google** → Demo connect (or real) → **Sync**.
3. **Close** (Desktop) or teal sheet — **one** mail hero; queue/filters are opt-in.
4. **Draft** → **Approve** on one mail loop — that's the product.
5. Teal circle = same hero as mail-first rule.

Screen notes live under **Show screen notes** on Work if you care.

## If something looks wrong

Run: `npm test -w @juvantage/api` and `npm run test:integration -w @juvantage/api` — green means the close path still works.