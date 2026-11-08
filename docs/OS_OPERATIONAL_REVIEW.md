# Juvantage OS — Operational functionality review

**Purpose:** Single matrix of *what the product actually does* vs *what the roadmap claims*, with review cadence and gate metrics. Pair with [`OS_BUILD_ROADMAP.md`](./OS_BUILD_ROADMAP.md) Phase 6 and [`FLAGSHIP_STAGED_PLAN.md`](./FLAGSHIP_STAGED_PLAN.md) §5.

**Trust map:** [`OS_TCB.md`](./OS_TCB.md)  
**Research → shipped:** [`research/doctoral/FEEDBACK_ADDENDUM.md`](./research/doctoral/FEEDBACK_ADDENDUM.md)

---

## How to use this doc

1. **Before 14-day dogfood:** complete P0 rows (live close path + UI parity).
2. **Weekly during dogfood:** refresh metrics row; log demo vs live in journal below.
3. **Before V2 gate:** all Phase 6 “Done when” items green; no red P0/P1 without written deferral.

**Review cadence**

| When | Action | Owner |
|------|--------|-------|
| Start of dogfood | Walk P0 checklist; restart API + Electron | Founder |
| Weekly | `GET /os/metrics?days=7`; note quiet / wrong_object | Founder |
| End of day 14 | Gate decision in FLAGSHIP §5 Enter V2 | Founder |
| Before invite #2 | Git init + CI green; update TCB if deploy changes | Founder |

---

## Functionality matrix

Legend: **Live** = works on real OAuth path · **Demo** = demo fixtures/simulated send · **Stub** = UI or API placeholder · **Missing** = not built

| Capability | Spec / invariant | Code / route | Status | Proof / doc tie-in |
|------------|------------------|--------------|--------|---------------------|
| Loop extract (mail) | Reply-owed rules | `osLoops` + sync | Live/Demo | Tier 2 ears-on |
| Loop extract (calendar) | Appt/hold | sync + extract | Live/Demo | Tier 2 |
| Clip ⌘⇧L | Strong vs weak | `POST /os/loops/clip` | Live (weak refused) | Thm III / objectType |
| `objectType` + router | Modality routing | `osModality.ts` | Live | V1.5 |
| Propose draft | Context pack → proposal | `POST …/propose` | Live/Demo | Phase 4 |
| Approve gate | 403 without approve | `osClose.ts` | Live | SENI |
| ApprovalGrant consume-once | No replay execute | `osGrants.ts` | Live | `SeniMachine.v` |
| Execute send (Gmail) | Verified message id | `osClose.ts` + `osGmailSend.ts` | **Live** when OAuth includes `gmail.send` | SENI + P0.1 |
| Execute (demo) | Simulated send | demo flag | Demo | Phase 4 exit only |
| Verify → done | Loop closed | verify path | Live/Demo | Close loop |
| Quiet / dismiss reasons | Audit + metrics | `osMetrics`, dismiss | Live | Phase 6 |
| `wrong_object` metric | Router mistakes | metrics | Live | V1.5 |
| Presence eyes-off | Idle ≥90s pause ambient | electron + API | Live | Dark Room policy |
| Purge ambient ≤24h | Retention | ambient job | Live | Assignment 2 |
| Desktop Approve disable | Closable types only | `Desktop.tsx` | Live | SENI UX |
| Quick sheet Approve disable | Same as Desktop | `QuickSheet.tsx` | **Live** | SENI UX |
| NCD episodic trigger | Before OCR burst | `episodic_trigger.py` artifact | **Missing** in desktop | Tier 2 hypothesis |
| SDO field fill | Typed AST close | — | **Missing** (V2) | Thm III.1 |
| TLA+ ring / SENI specs | Model-check optional | `artifacts/*.tla` | **Not TLC-run** | Label spec-only |
| CI / GitHub Actions | On push | `.github/workflows/` | **Missing** remote repo | Before beta |

---

## P0 — Before counting dogfood days

| # | Task | Done when |
|---|------|-----------|
| P0.1 | Gmail **send** scope + live `users.messages.send` | ✅ 2026-11-08 — test mail + reply confirmed in Gmail Sent |
| P0.2 | Quick sheet: same `objectType` gate as Desktop | ✅ `isClosableObjectType` on Approve |
| P0.3 | Dogfood journal | ✅ [`DOGFOOD_JOURNAL.md`](./DOGFOOD_JOURNAL.md) — fill Day 1 when starting clock |
| P0.4 | Restart note | See journal + README dev:os |

---

## P1 — During 14-day dogfood (no V2 start)

| # | Task | Done when |
|---|------|-----------|
| P1.1 | Metrics baseline | 7-day snapshot: clear rate, accept/edit/dismiss, `wrong_object` count |
| P1.2 | Privacy one-pager (internal OK) | FLAGSHIP §5 checkbox; links TCB + retention |
| P1.3 | Label TLA artifacts | README in `doctoral/artifacts/`: “spec only unless TLC run” |
| P1.4 | Align dossier voice | Point readers to `MACHINE_CHECK.md` scores, not A+++ alone |

---

## P2 — After dogfood gate (Enter V2)

| # | Task | Done when |
|---|------|-----------|
| P2.1 | NCD stub on accessibility tree delta | CPU budget doc; trigger only on context switch |
| P2.2 | Episodic OCR burst (clip / change) | V2a in FLAGSHIP |
| P2.3 | SDO sketch → one real form/PDF path | Riverside-style Act Moment prototype |
| P2.4 | Git remote + CI | Before second contributor or ~25 invites |

---

## Dogfood journal (copy per day)

```text
Date:
Demo vs live mail: 
Loops surfaced:
Closed (verified send id? Y/N):
Quiet / dismiss (reason):
Clip attempts (refused?):
Would miss Jos if gone? (Y/N):
Friction note (1 line):
```

---

## Gate metrics (Phase 6 “Done when”)

| Metric | Source | Pass heuristic (solo) |
|--------|--------|------------------------|
| Daily use | Journal | ≥10/14 days |
| Quiet not hated | Subjective + dismiss rate | No rage-quit; quiet reasons stable |
| Clear rate | `GET /os/metrics` | Trend up on **live** sends after P0.1 |
| Approve bypass | Audit + manual test | Zero paths skip grant |
| wrong_object | metrics | Down after clip/router fixes |

---

*Last updated: 2026-11-04 — refresh matrix when shipping P0 items.*
