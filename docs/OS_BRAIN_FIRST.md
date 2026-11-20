# Brain first — finish this before shell IA

**Updated:** 2026-11-19  
**Rule:** If a change is only Desktop/CSS/nav polish, **defer** unless it unblocks Brain testing (login, Approve, one hero).

Future shell (your words, not built yet): **left = context groups · center = dynamic context box · empty = calm Mac home**. Locked in [`OS_SHELL_IA_FUTURE.md`](./OS_SHELL_IA_FUTURE.md).

---

## Where we are (honest)

| Layer | Status | Notes |
|-------|--------|-------|
| **Close law** | Done | Approve → grant → execute → verify; tests |
| **Ingest v1** | Done | `POST /os/capture/events`, episodic fuse, context pack API |
| **Loop liveness v0** | Done | Stale mail/episodic dropped before list |
| **Connectors** | Done as **ears** | Gmail/calendar for obligation + send hand — not product home |
| **Hero / rank** | Partial | Presence boost on `GET /loops` + shared sort; merge not started |
| **“Still open?”** | Partial | v1 mail (lastFrom + resolved snippet); episodic session stale |
| **Scene / merge** | v0 | Fuse folds matching open mail/calendar into episodic `childSources` |
| **Propose quality** | Thin | Templates; not “fill fields 1–2–3 from fused context” |
| **Shell IA** | Wrong on purpose | Work / Google / Settings = dev scaffolding, not your final Mac app |

You are **not** at “polish the Mac app.” You are at **“make the Brain believable on real stuck work.”**

---

## Brain “finished” for V1 (gate before shell rebuild)

Done when **all** are true in code + `mvp:smoke` + one human close:

1. **Capture reliable** — Mac host → `capture/events` → session ledger (window + clip; not flaky empty sheet).
2. **Fuse → one loop** — Bundle fingerprint; update same loop when signals continue; dedupe when closed.
3. **Liveness v1** — Re-check anchors (thread, session activity, external done) before surface/propose.
4. **Rank** — Hero = what user is **in now** (frontmost ↔ bundle), not static mail-first demo.
5. **Merged obligation v0** — At least one path: **N signals → 1 loop title** (e.g. application packet), checklist proposal body.
6. **Close hands** — Mail send + approve-close for non-mail; no new modalities until 1–5 work.

Until the gate passes: **no** left-rail context grouping, **no** empty-state “flat Mac home” build, **no** theme/layout sprints.

---

## What to build now (order)

1. Presence-aware hero (macOS frontmost → boost matching episodic bundle).
2. Liveness v1 (gmail: last message from user; episodic: session dead).
3. Merge v0 (same user/session fingerprint → one loop; child source tags in evidence).
4. Proposal steps from bundle (numbered checklist in body — powers waitlist UI later).
5. Harness: capture → fuse → liveness → propose → approve in integration test.

---

## Shell during Brain phase (allowed only)

- Quick sheet: one hero, Preview, Approve (keep ugly if needed).
- Desktop: default route **Work**, minimal list, no new nav items.
- Google page: **settings/debug** only (eventually buried in gear).
- **Freeze:** `ui-exploration`, workstation grid, nav renames, spacing passes.

---

## How to test Brain without liking the UI

```bash
npm run mvp:smoke
```

Then human path in [`MVP_TEST.md`](./MVP_TEST.md) — ignore layout; watch **loop list content**, **context pack**, **Approve** result.

If UI discussion comes up: capture requirement in `OS_SHELL_IA_FUTURE.md`; implement after Brain gate.