# You are here (read this when scattered)

**Product we're building:** Jos **fuses context** from what you're doing on the Mac (apps, windows, clips; plus connector **ears** for mail/calendar when linked). It only surfaces loops that are **still open**, proposes how to close them, and **nothing acts without Approve**.

Mail and calendar are **not** the main UI — they're background checks so we don't draft replies you already sent.

**Plan detail:** [`OS_CONTEXT_FIRST_PLAN.md`](./OS_CONTEXT_FIRST_PLAN.md)

## Sequential order (from `OS_BUILD_ROADMAP.md`)

| Step | Status | What it means for you |
|------|--------|------------------------|
| Phases 0–5 + quartet | Done | Close path, fuse, float, Desktop shell |
| **Now** | **Brain first** | See [`OS_BRAIN_FIRST.md`](./OS_BRAIN_FIRST.md) — **UI/IA freeze** until merge + liveness + rank work |
| Phase 6 | In parallel | Close one loop/day (any source) |
| Shell IA | **Future** | Left = context groups, center = dynamic box — [`OS_SHELL_IA_FUTURE.md`](./OS_SHELL_IA_FUTURE.md) |
| V2 eyes | Later | Deeper screen read — after context-first feels right |

## Testable MVP

**Full checklist:** [`MVP_TEST.md`](./MVP_TEST.md) · quick gate: `npm run mvp:smoke`

## What to do today (one path)

1. `npm run dev:os:restart`
2. Work in a real task (IDE, browser, terminal) — or **⌘⇧L** clip with text.
3. Desktop → **Work** — watch **What Jos pieced together** (live canvas).
4. **Draft** → **Approve** when the proposal matches what you still owe.
5. Teal sheet = same hero as Work (context-first sort).

Google link is under **Google** — sync is for obligation checks, not browsing mail.

## If something looks wrong

`npm test -w @juvantage/api` and `npm run test:integration -w @juvantage/api` — green = Brain + close path OK.