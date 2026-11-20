# Testable MVP — 15 minutes

**What you’re proving:** Brain fuses context → surfaces open loops → **Proposed next step** → **Approve** closes (demo or live mail).

**Prereq:** Node 20+, `npm run setup` once (if DB empty).

---

## 1 · Start (pick one shell)

| Shell | Command | You get |
|-------|---------|---------|
| **A · Mac app (recommended)** | `npm run dev:os:restart` then **Run** `JuvantageOSMac` in Xcode | Float + sheet + Desktop → `127.0.0.1:5173` |
| **B · Electron only** | `npm run dev:os-electron` | Same UI without Swift sensors |

Check Brain + UI:

```bash
npm run dev:os:status
```

Expect: `Brain 200` · `UI 200`.

Automated gate (optional):

```bash
npm run mvp:smoke
```

---

## 2 · Sign in

| Field | Value |
|-------|--------|
| Email | `john@juvantage.com` |
| Password | `demo1234` |

Xcode dev builds often auto-login; if sheet says “not signed in”, open **Desktop** and sign in once.

---

## 3 · Path A — Demo mail (no Google)

1. Desktop → **Google** → **Demo connect** → **Sync**.
2. **Work** — you should see **Open loops** + **Close surface** (waitlist layout).
3. Select a mail loop → **Draft close step** (if no draft) → **Approve now**.
4. Success: loop leaves the list; toast mentions demo (no real send).

---

## 4 · Path B — Screen context (no Gmail)

1. With Mac app + Accessibility (for window read) or **⌘C** copy a line of text.
2. Teal agent → quick sheet should show one hero after episodic fuse.
3. **Draft close step** → **Edit draft** if needed → **Approve now** → loop closes.

Or Desktop → **Work** — episodic loop appears in **Open loops** (not hidden).

---

## 5 · Path C — Live Gmail (once)

1. **Google** → real **Sign in** (needs Cloud OAuth env on API).
2. Sync → **Work** → mail loop → **Approve now** (sends after approve).

---

## Pass criteria

- [x] `mvp:smoke` green (or unit + integration manually). — 2026-11-20 agent + CI
- [x] Live API: demo mail propose → approve-send → `done` + episodic capture (agent)
- [ ] At least one loop visible under **Work** after demo connect **or** episodic capture (**you**, Mac UI).
- [ ] **Approve now** removes loop or shows success (**you**, Mac UI).
- [ ] Footer: *Nothing submits until you approve.* (**you**, visual)

---

## When it fails

| Symptom | Fix |
|---------|-----|
| Port in use | `npm run dev:os:restart` |
| Empty Work, demo connected | Google → Sync → **Find unfinished** (filters drawer) |
| Sheet empty, “older build” | Run from Xcode, not browser-only |
| Brain down | `npm run dev:api` logs; check `apps/api/.env` + `npm run db:push` |

**Map:** [`YOU_ARE_HERE.md`](./YOU_ARE_HERE.md) · **Chrome:** [`OS_CONTEXT_FIRST_PLAN.md`](./OS_CONTEXT_FIRST_PLAN.md)