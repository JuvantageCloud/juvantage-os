# Juvantage OS — docs

**Last consolidated:** 2026-11-01  

**Build from:** [`OS_BUILD_ROADMAP.md`](./OS_BUILD_ROADMAP.md) ← checkboxes, phases, adjust rules  
**Flagship plan (scope + cost + vivid defs):** [`FLAGSHIP_STAGED_PLAN.md`](./FLAGSHIP_STAGED_PLAN.md) ← what IN/LATER/NEVER means, $ estimates, V1→V3 gates  
**Secrets / localhost vs cloud:** [`SECRETS_AND_DEPLOY.md`](./SECRETS_AND_DEPLOY.md)  
**Incident → CI draft PR:** [`OS_INCIDENT_RESPONSE.md`](./OS_INCIDENT_RESPONSE.md)  


**Run desktop:** `npm run dev:os` (API + Electron) · details in [`apps/desktop/README.md`](../apps/desktop/README.md)  

Strategy docs:

| Doc | What’s in it |
|-----|----------------|
| **[`JUVANTAGE_OS_SCOPE.md`](./JUVANTAGE_OS_SCOPE.md)** | Business: job, ICP, ARR, GTM, kill criteria |
| **[`OS_PRODUCT.md`](./OS_PRODUCT.md)** | Ship: Desktop MVP features, Solo vs Desktop UX, **locked agent symbol** |
| **[`OS_ARCHITECTURE.md`](./OS_ARCHITECTURE.md)** | Mechanism vs Reyn, **locked screen-first episodic**, capture/privacy §A8, Brain container |
| **[`FLAGSHIP_STAGED_PLAN.md`](./FLAGSHIP_STAGED_PLAN.md)** | V1→V3 timeline, 9 domain locks, spend priority, stage gates |

**UI map (Solo↔Desktop, no guessing):** [`OS_UI_MAP.md`](./OS_UI_MAP.md)  
**Mockup board:** [`assets/mockups/os-ui/index.html`](../assets/mockups/os-ui/index.html) · PNGs in `assets/mockups/os-ui/pngs/`  
**Legacy wireframes:** `assets/motion/desktop-ux-wireframes.html`  
**Agent asset:** `assets/motion/characters/mascot-idle-loop.json`  
**Decks:** `Juvantage_OS_MVP_Product_Plan.pptx`, `Juvantage_OS_Pitch.pptx`

### Also useful (not OS-core)

| Doc | Role |
|-----|------|
| [`POSITIONING.md`](./POSITIONING.md) | Company: JUST vs OS vs Care; Viktor ≠ OS |
| [`HAVEN_SOUL_DIRECTION.md`](./HAVEN_SOUL_DIRECTION.md) | Haven (separate consumer app) |

### Parked / utility (ignore for OS V1)

| Doc | Role |
|-----|------|
| `BUSINESS_COMMAND_SCOPE.md` | Parked multi-biz phone Command |
| `ROADMAP_30_DAYS.md` | Superseded iOS roadmap |
| `CURSOR_BRIDGE_V2.md` | Future coding-agent gateway |
| `DATABASE.md` | Postgres notes for this repo’s API |
| `SUITE_UMBRELLA.md` | Pointer to JUVANTAGECLOUD folder |

**Problem we solve:** unfinished obligations die across context switches → catch → finish with approve.  
**vs Reyn:** they remember the screen; we **close** the loop (detection may still use ambient/eyes — see architecture).
