# Juvantage OS — Build roadmap

**Follow this.** Adjust checkboxes / dates as we learn.  
**Strategy:** `JUVANTAGE_OS_SCOPE.md` · `OS_PRODUCT.md` · `OS_ARCHITECTURE.md`  
**Staged flagship (V1→V3 gates):** [`FLAGSHIP_STAGED_PLAN.md`](./FLAGSHIP_STAGED_PLAN.md)  
**Wireframes:** `assets/motion/desktop-ux-wireframes.html`  
**Agent:** `assets/motion/characters/mascot-idle-loop.json` (locked)

```text
Ship order:  Mac Desktop Personal  →  dogfood  →  eye/ranker  →  Skills  →  Teams container
```

---

## Working defaults (change only if blocked)

| Decision | Default now | Revisit when |
|----------|-------------|--------------|
| Shell | **Swift macOS app** `apps/macos` (menu bar + agent + WebKit Desktop) | Native Loops UI in SwiftUI; retire Electron |
| Legacy shell | Electron in `apps/desktop` — `npm run dev:os-electron` only if needed | Remove after Swift parity |
| Brain | **Extend `apps/api`** with Brain API routes (`/loops`, `/approve`, …) | Teams needs Docker → extract image |
| Screen fork | **B · Screen-first episodic** — connectors as hands/away-ears; presence eyes-off when idle; OCR deepens in V2 (`OS_ARCHITECTURE.md` §A6–A8) | Dogfood weak on specificity → pull episodic OCR earlier |
| Retention | Purge raw ambient/frames ≤24h; **keep Loops + proposals** | User asks longer evidence window |
| Quick sheet | **Up to 3** loops (V2 ranker → bias to **1**) | Too noisy → 1 |
| LLM | Adapter behind brain (start Anthropic if key exists); **context packs only** | Cost/privacy → Bedrock/local |

---

## Phase 0 — Repo scaffold *(start here)*

**Done when:** `npm run dev:desktop` shows empty window + API health.

- [x] Add `apps/desktop` (Electron + Vite + React + TS)
- [x] Workspace wire-up in root `package.json`
- [x] Desktop talks to `apps/api` on `localhost`
- [x] Shared types stub in `packages/shared` (`Loop`, `Proposal`, statuses)
- [x] README: how to run API + desktop together

**Exit:** green local run. No Gmail yet. ✅

---

## Phase 1 — Solo chrome + locked agent

**Done when:** teal agent floats; click opens empty quick sheet; menu bar present.

- [x] Menu bar / tray
- [x] Floating agent window (always-on-top, click-through optional later)
- [x] Play locked Lottie (`mascot-idle-loop.json`)
- [x] Quick sheet UI shell (Approve / Edit / Snooze / Open Desktop — wired to stubs)
- [x] “Open Desktop” opens main window placeholder

**Exit:** matches wireframe steps 1 + 3 (empty). Dogfood look/feel. ✅

---

## Phase 2 — Auth + connectors

**Done when:** you can connect Gmail + Google Calendar; tokens in secure store.

- [x] Auth account (reuse API `/auth/login` + Desktop session token)
- [x] Gmail OAuth (official `gmail.readonly`; Personal OS routes under `/os`)
- [x] Calendar OAuth (bundled consent with Gmail; `calendar.readonly`)
- [x] Connector status in Desktop prefs (Connect Google / Demo / Sync)
- [x] Encrypt tokens at rest (AES-256-GCM via `TOKEN_ENCRYPTION_KEY`)
- [x] Sync cache: `OsMailThread` + `OsCalendarItem` (+ demo fixtures)
- [x] Smoke tests: `npm test -w @juvantage/api` (crypto + OAuth URL)

**Exit:** sync job can pull recent threads/events (raw store OK). ✅  
**Note:** Without `GOOGLE_CLIENT_ID`/`SECRET`, use **Demo connect + sync**. Real OAuth needs those env vars + `GOOGLE_OS_REDIRECT_URI` in Google Cloud Console.

---

## Phase 3 — Loops + triggers

**Done when:** real open loops appear in quick sheet on a check-in / aging rule.

- [x] Loop schema + DB tables (`Loop`, `AmbientEvent`)
- [x] Extract job: reply-owed / ask / appt / todo (**rules first**; LLM optional later)
- [x] Score bands: Critical → Quiet
- [x] Triggers: aging ≥18h boosts band; extract-on-demand (+ after demo connect)
- [x] Agent nudge state (badge / pulse) when something surfaces
- [x] Ambient: frontmost app via osascript; **purge raw ≤24h**
- [x] Presence stub: eyes/ambient pause when idle ≥90s
- [x] Clip hotkey ⌘⇧L → create loop stub from current context

**Exit:** you get nudged on something real from your mailbox. ✅ (demo mail qualifies)

---

## Phase 4 — Propose → approve → verify

**Done when:** nothing sends without approve; verify marks loop done.

- [x] `POST /os/loops/:id/propose` → draft reply or event (`Proposal` + optional LLM polish)
- [x] `POST /os/proposals/:id/approve` required before execute (**403** otherwise)
- [x] Execute: demo simulates send; OAuth records local execute until send scope
- [x] Verify: confirms execute → loop `done`
- [x] Dismiss / snooze / quiet (Phase 3) + approve-send one-shot for Solo sheet
- [x] Audit log rows (`OsAuditEvent`)

**Exit:** full close loop on one obligation (demo path qualifies). ✅

---

## Phase 5 — Desktop mode + undock

**Done when:** Desktop is the **widened quick sheet** (Loops home) + nav; undock returns to Solo.  
**Map:** [`OS_UI_MAP.md`](./OS_UI_MAP.md) · mockups [`assets/mockups/os-ui/`](../assets/mockups/os-ui/)

- [x] Desktop default route = **Loops** (not Connectors)
- [x] Open Desktop from sheet passes `loopId` — same loop + draft selected
- [x] Left nav: Work · Inbox (debug) · Connect · Settings — context inline on loop
- [x] Loops: full list, band filters, detail/draft pane (+ engine chips)
- [x] Context stub + Inbox / Connect / Settings pages
- [x] Undock agent → Solo float
- [x] Sheet polish: tighter radii, draft engine chips, contrast hierarchy

**Exit:** mockup frames 07–08 live in product. ✅

---

## Phase 6 — Dogfood harden

**Done when:** 14 days daily use; metrics you trust.

- [x] Quiet accuracy pass (dismiss feedback) — reason chips → audit
- [x] Metrics: clear rate, accept/edit/dismiss — `GET /os/metrics` + Settings
- [x] Crash/relaunch agent reliably — watchdog + render-gone relaunch
- [ ] **Use daily 14 days** (human gate — not a code checkbox)
- [ ] Private beta invite list (target ~25) — optional; **init GitHub/CI before invites**

**Gate to Teams:** you would miss it if it were gone.

**Operational review (capture + gates):** [`OS_OPERATIONAL_REVIEW.md`](./OS_OPERATIONAL_REVIEW.md) · trust boundary [`OS_TCB.md`](./OS_TCB.md) · research addendum [`research/doctoral/FEEDBACK_ADDENDUM.md`](./research/doctoral/FEEDBACK_ADDENDUM.md)

**Phase 6 prerequisites (before day 1 of 14-day dogfood counts):**
- [x] P0.1 Live Gmail send tested once (reconnect Google if connected before send scope) — [`DOGFOOD_JOURNAL.md`](./DOGFOOD_JOURNAL.md) — verified 2026-11-08 (test mail + reply in Gmail Sent)
- [x] P0.2 Quick sheet Approve gated like Desktop (`objectType`)
- [x] P0.3 Dogfood journal file — fill Day 1 when starting clock

**Active sprint plan:** [`OS_NEXT_SPRINT.md`](./OS_NEXT_SPRINT.md) (Connect vs Loops UX + P0.1 proof + macOS Lottie)

**Research complete:** [`research/JV-OS-RP-01_PAPER.md`](./research/JV-OS-RP-01_PAPER.md) — modality objects, episodic sensing, approve capability.  
**V1.5 slice (shipping from research — SENI + Thm III):**
1. [x] Refuse weak clips (app-name-only → no HIGH todo / AmbientHint)
2. [x] `objectType` + routerConf on Loop + `osModality` router
3. [x] ApprovalGrant one-shot on approve→execute (SENI Thm I.1)
4. [x] Approve blocked for hint/unknown object types
5. [x] Quiet reason `wrong_object` + metrics
6. [x] Desktop: disable Approve when objectType not closable + show object chip

**GitHub/CI timing:** not required for solo dogfood. Do it when (a) a second person touches the repo, (b) private beta invites, or (c) hosted Brain deploy — whichever comes first.

---

## Phase 7 — Teams / container *(later — do not start early)*

- [ ] Extract brain → Docker Compose (`juvantage-os-brain`)
- [ ] Swift/Electron wrapper starts container
- [ ] Shared inbox *or* Twilio line + owner + SLA
- [ ] RBAC + audit UI
- [ ] Phone: Shortcuts / “Hey Siri, ask Jos…” → Brain API (optional)

---

## How we adjust

| Signal | Move |
|--------|------|
| Electron fights Mac UX | Switch shell; keep Brain API |
| Loops too noisy | Tighten extract; default Quiet higher |
| Still lose to Reyn on specificity | Pull V2 episodic OCR / watched pages forward (not always-on) |
| Approve scary / bugs | Freeze connectors; fix gate + verify only |
| Dogfood &lt; 3 days/week | Fix surface before Phase 7 |

**Rule:** finish the current phase’s **Done when** before starting the next. Exceptions only if blocked &gt; 2 days — then spike or change a default in the table above.

---

## This week

- [x] Phase 0 + 1 complete (`npm run dev:os`)
- [x] Phase 2 complete — Auth + Gmail/Calendar (OAuth or demo) + encrypted tokens + sync
- [x] Phase 3 complete — Loops + extract + ambient/presence + clip + nudge
- [x] Phase 4 complete — Propose → approve → execute → verify (+ audit)
- [x] Phase 5 complete — Desktop Loops home + undock + sheet hierarchy
- [x] Phase 6 tooling — quiet feedback + metrics + agent relaunch
- [ ] **Now:** complete Phase 6 P0 (operational review), then dogfood daily 14 days (Settings → Refresh metrics)
- [x] JV-OS-RP-01 research paper + sparks → architecture/flagship
- [x] Doctoral Three-Tier dossier COMPLETE — Assignments 1·2·3 + artifacts (`docs/research/doctoral/`)
- [x] CI: `.github/workflows/ci.yml` + `docs/SECRETS_AND_DEPLOY.md`
- [x] Incident capability: capture failures → CI investigate → **draft PR for review** (`OS_INCIDENT_RESPONSE.md`)
- [x] Scope/cost clarity in [`FLAGSHIP_STAGED_PLAN.md`](./FLAGSHIP_STAGED_PLAN.md) §0a–0b, §4 (2026-11-01)
