# Juvantage OS — Architecture, context & future branches

**Status:** Mechanism + deploy architecture (integrates prior scattered notes)  
**Ship UI / features:** [`OS_PRODUCT.md`](./OS_PRODUCT.md)  
**Business / ARR:** [`JUVANTAGE_OS_SCOPE.md`](./JUVANTAGE_OS_SCOPE.md)  
**Reyn check:** [usereyn.com](https://usereyn.com) (2026-10-16)

```text
One brain, many shells:

         OS BRAIN (loops + context + propose/approve/close)
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 Desktop   Teams     Phone / Siri
 (now)   container   (remote client)
```

---

# Part A — How we get context (vs Reyn)

## A1 · What Reyn is

- Always-on **screen watch** (raw on-device; AI on journal text in cloud)  
- Journal & recall, live screen context, workflow/SOP capture, morning brief  

They are **memory / context infrastructure**. Specificity comes from **pixels**.  
**Mail + calendar alone loses to them on personal Mac** — that framing was too cheap.

## A2 · Jobs, not vibes

| | **Reyn** | **Juvantage OS (must be)** |
|--|----------|----------------------------|
| Primary job | **Remember** what happened | **Close** what is still owed |
| Hero output | Journal, ask, brief | Loop → propose → **approve** → execute → **verify** |
| Superpower | “I saw Sarah at 2pm on screen” | “Obligation open → draft → nothing sends until you say yes → we prove closed” |
| Teams | Hard (screen every worker) | Shared streams + audit; eyes optional/off |

Memory without close = Reyn.  
Close without enough detection = nagging inbox toy.  
**Close + enough detection** = us.

## A3 · Traps

| Trap | Why |
|------|-----|
| Compete as “better Reyn journal” | Crowded; they have head start |
| Ship “smart Gmail” and claim we beat Reyn | We don’t |
| Pretend connectors alone = screen specificity | They don’t |
| “Never touch the screen” forever | Overstated — hybrid/episodic/on-device is valid |

**Real risks of full screen:** same category as Reyn, trust tax, noise, cost.

## A4 · Three detection layers

```text
LAYER B — Ambient / eyes (Personal — universal sensor)
  App + URL + title; episodic OCR on presence/change; clip hotkey
  Scene graph: co-visible tabs/windows → smart org proposals
  → Works whether or not you use Gmail. Sees work on whatever apps you already use.

LAYER A — Systems of record (optional adapters — not a gate)
  Only if the user connects them: Gmail and/or Calendar and/or Slack / Linear / Notion / GitHub…
  → Stable IDs + execute/verify (“hands”) + away-mode ears
  → Not required to open the app or get value from eyes + clip + ranker

LAYER C — Close engine (identity — always)
  Loop state machine + timed agent + APPROVE + execute + verify + Teams audit
```

**Important:** Layer A is **not** “everyone must use Gmail.” It’s a **plugin shelf**. Dogfood and early demos lean on Gmail because *you* use it and verify is easy there — that is a build order choice, not the ICP gate. Someone who lives in Outlook, iMessage, or a browser-only workflow still gets Layer B + clip → loops; they just can’t “send via API” until a matching adapter exists (or they copy a draft manually).

**Ambient/eyes detect candidates for anyone with a Mac.** We store **loop objects + snippets**, not a forever life-scrapbook (unless we explicitly productize journal later = head-on Reyn).

### Layer B signals

| Signal | Get | vs Reyn |
|--------|-----|---------|
| App + URL + title (local) | Where you were | No full framebuffer |
| Episodic / focused capture | Deep context on trigger/hotkey/aging | Not 8h movie |
| Meeting audio → commitments | “I’ll send Friday” → loop | We close, not only note |
| Clip hotkey | User marks owed | Highest precision |
| **Scene graph** | Tabs co-open while workflow ran | Smart restructure proposals |

### “OCR but better” = different *use* of pixels

```text
Reyn:  screen → journal → ask / brief
Us:    screen → CANDIDATE OBLIGATIONS + SCENE → propose move/close → APPROVE → verify
```

| Mode | Idea |
|------|------|
| Full always-on | Max recall, max creep |
| Structured ambient | App/URL/title — cheaper |
| Scene graph | Co-visible windows/tabs — your “two tabs” idea |
| Episodic deep capture | Burst / hotkey / aging |
| Obligation-biased OCR | Prefer mail/chat/forms/Send/drafts |

**Examples of proposals Reyn-as-journal won’t own as product:**

| Observed | Proposal |
|----------|----------|
| Gmail + Linear + Figma co-open 40m | Loop: send pilot pack with those links |
| Notion reopened 6×, never edited | Break into 2 closable steps |
| Downloads + tax PDF + “need W2” mail | File packet + draft reply |
| Stale Docs tabs | Park 9, keep 3 for today’s loops |

**Metrics:** loop clear rate; proposal accept rate; false-obligation rate; optional chaos/cleanup if we productize it.

## A5 · Personal vs Teams detection

| Skin | Emphasis | Why pick us over Reyn |
|------|----------|------------------------|
| Personal | A + **B** + C | Finish with approve; catch outside inbox too |
| Teams | A + C (eyes off) | No employee screen farm; owner + SLA |

## A6 · Screen forks — **LOCKED: B · Screen-first episodic**

| Fork | What | Status |
|------|------|--------|
| **1 · Always-on eyes** | Continuous capture like Reyn; journal-grade memory | **Rejected** for flagship — recorder cost + creep; wrong category |
| **2 / B · Screen-first episodic** ★ | Presence + change-gated OCR/AX; APIs as hands; attention ranker closes | **LOCKED** (2026-10-25) |
| **3 · Connectors only** | No personal screen | Deferred — too weak for Personal vs Reyn |

**Thesis:** Reyn watches to *remember*. Jos watches to *decide what needs you next* and *close* it. Screen is the primary eye while you work; connectors are ears when you’re away and hands for execute/verify.

**Still open (product, not fork):** watched-pages pack timing; Skills from repetition = V2+; cleanup-as-pillar vs side proposal.

## A6b · Context objects & modality (from JV-OS-RP-01)

Research paper: [`research/JV-OS-RP-01_PAPER.md`](./research/JV-OS-RP-01_PAPER.md) · sparks index: [`research/SPARKS.md`](./research/SPARKS.md)

**Problem:** Weak ⌘⇧L (app name only) must not mint HIGH todo + template “Approve & send.” That is an `AmbientHint`, not a closable object.

| objectType | When | Close path |
|------------|------|------------|
| `MailThread` | Connector / mail surface | Reply draft → approve → send → verify |
| `ChatThread` | Messages/Slack-class | Chat draft → approve → adapter/copy |
| `PdfPacket` / SDO | PDF/form/lease | Guided fill → approve → write/export |
| `FormSession` | Portal wizard | Act Moment stepper |
| `CalendarHold` | Event propose | Approve → calendar.insert |
| `ClipMark` | Strong selection + evidence | Router re-types |
| `AmbientHint` | Weak clip / low conf | **Refuse or ask — no fake draft** |

**Episodic trigger (V2):** prefer AX/title **NCD** change detection before OCR; raw frames purge target &lt;250ms after extract (thermodynamic + privacy argument in paper).  
**Approve (V1.5):** consumable `ApprovalGrant` — execute cannot replay without a new human approve (linear-capability story at Brain boundary; WASM guest = later, not dogfood).  
**Dark room (proved):** eyes may sleep; connector/SLA obligations still wake ranking — Theorem II.1 preferred \(o_{\mathrm{obl}}\) ([`research/doctoral/DISTINCTION_OPEN_GAPS_PROOFS.md`](./research/doctoral/DISTINCTION_OPEN_GAPS_PROOFS.md)).  
**SENI:** renderer must not hold execute grants — Theorem I.1 same doc.

## A7 · Credible Personal V1 mechanism (minimum)

1. Gmail + Calendar as **hands + away-mode ears** (read first; send scope at approve)  
2. Ambient app/URL/title ledger (on-device) + presence mode switch  
3. Clip hotkey → loop **only with evidence**; weak clip → hint/refuse (post-RP-01)  
4. Loop engine + Solo agent + attention rank (top 1–3) + approve + verify  
5. Episodic OCR burst on change / clip — **not** always-on (V1.5 deepens this)  

## A8 · Capture & Privacy Policy (flagship)

### Presence modes

```text
WORKING  = unlocked + input in last ~90s + content changed (or clip / watched page)
  → eyes ON  +  connectors ON

IDLE / AWAY = no input, locked, sleep, or identical frame
  → eyes OFF +  connectors STAY ON  (“while you were out”)

BLOCKLIST = password managers, banking, private/incognito, user deny-list
  → never capture
```

### Retention — keep closes, not a scrapbook

| Data | Keep | Purge |
|------|------|-------|
| Raw frames / screenshots | **Never as product memory** — process on-device, discard after extract | Immediately after structured extract (seconds–minutes), hard max **24h** if buffered |
| Ambient events (app, title, URL) | Only until session summarized / attached to a Loop | Rolling **≤24h** raw; then drop |
| Session goal summary | Yes — fuels ranker + “contextualized goal” | User wipe / quiet |
| **Loops + Proposals + evidence snippets** | **Yes — this is the product** | Until done/quiet/user delete |
| Approve / dismiss / quiet history | Yes — trains ranker + future Skills | User wipe |
| Connector tokens | Encrypted at rest; revocable | On disconnect |

**User policy in one line:** *We generate today’s context and suggestions; we throw away the raw day. We keep what you still owe and what you approved.*

### Local vs cloud — honest claims

| Claim | OK? |
|-------|-----|
| “Raw screen never leaves your Mac” | **Yes** (under this policy) |
| “None of your information ever touches a cloud server” | **No** — Gmail/Calendar APIs and LLM draft packs leave the device |
| “Cloud only sees loop context packs you trigger (draft/ask) + connector scopes you grant” | **Yes** — say this |

UI must show **what left the device** for each draft (snippet, not screen dump).

### vs Reyn ([usereyn.com/privacy](https://www.usereyn.com/privacy), 2026)

| | **Reyn** | **Jos (us)** |
|--|----------|--------------|
| Job | Searchable day / journal / ask | Rank → draft → approve → close |
| Capture | Always-on screen; filters | Presence + change-gated; idle eyes off |
| Raw screen | Local; sent to model when Ask/Agent; not persisted after that request | Local extract; **no** searchable frame archive; purge ≤24h |
| What persists | Journal/summaries/chats/transcripts in account until you delete | **Loops + proposals + approve history** — not a life journal |
| Away | Still a screen product | Connectors listen; eyes off |
| Autonomy | Agent actions with audit | L1 notice → L2 approve → L3 standing approvals (earned) |

**How we win on privacy *and* product:** we refuse “days of frames searchable.” That retention line was Reyn’s category tax. Ours is **obligation memory**, not activity memory.

---

# Part B — Brain container architecture

**Target:** Teams + long-term Personal.  
**Desktop V1:** local Brain (`apps/api`) + **Swift shell** (`apps/macos`) hosting React wide UI in WebKit; Electron optional (`dev:os-electron`).

## B1 · Picture on a Mac

```text
┌──────────────────────────── macOS ─────────────────────────────┐
│  Swift wrapper (thin OS shell)                                 │
│   • Menu bar + locked teal agent                               │
│   • TCC permissions, Keychain, launch at login                 │
│   • Starts/stops container; Solo sheet + Desktop UI            │
│                         │ localhost HTTPS / unix socket         │
│                         ▼                                        │
│  Docker: juvantage-os-brain                                    │
│   • API + workers + connectors + loop engine                   │
│   • Model adapter; optional capture ingest                     │
│   • Volume: db, snippets, config / tenant policy               │
│  Optional: Tailscale / VPN → phone remote                      │
└────────────────────────────────────────────────────────────────┘
```

## B2 · Split decisions

| In container | In Swift / host shell |
|--------------|----------------------|
| Loop engine, LLM/OCR deps, connectors, audit, policy | Windows, agent float, TCC, Keychain, updates |
| Same image → laptop, Mac mini, VPC | Mac citizen UX |

Capture privilege **stays on host**; Swift POSTs to `/capture/events`. One image: Personal eyes-on / Teams eyes-off.

## B3 · Services & domain

```text
api · worker · optional capture-sidecar · model-proxy · data volume
```

| Object | Meaning |
|--------|---------|
| Loop | open → proposed → approved → done / quiet |
| Proposal | Draft + rationale |
| Execution / Verification | Side effect + proof |
| AuditEvent | Teams gold |
| ConnectorAccount | Encrypted OAuth |

## B4 · Brain API (contract)

| Method | Purpose |
|--------|---------|
| `GET /health` | Wrapper liveness |
| `GET /loops` | Desktop + Solo |
| `POST /ask` | Freeform / “last 2 hours” |
| `POST .../propose` | Refresh proposal |
| `POST .../approve` | **Gate** |
| `POST .../dismiss` | Quiet / teach |
| `POST .../execute` | Side effects — **403 without approve** |
| `GET /audit` | Teams |
| `POST /capture/events` | Host → brain ambient/screen |

## B5 · Network & auth

| Stage | Access |
|-------|--------|
| Desktop V1 | Localhost only |
| Phone same LAN | Pair + mTLS (careful) |
| Teams remote | Tailscale / org VPN / controlled relay |
| Enterprise | VPC; phone → org gateway |

Device JWT/mTLS from Keychain; tenant policy: Personal | Team | eyes on/off.  
Teams: often one container per **desk / Mac mini appliance**, not per employee day one.

## B6 · Migration path

| Phase | Reality |
|-------|---------|
| Now | Brain as local service/module with same routes |
| Next | `docker compose up`; UI → localhost |
| Teams | Compose + Swift installer |
| Enterprise | Same image in K8s/ECS |

**Don’t** put full UI in Docker; don’t expose brain to internet unbound; don’t require K8s for first Teams pilot.

## B7 · Teams day-in-life

Mac mini + wrapper + brain image → shared Gmail/SMS → leads on phone Shortcuts → approve → send-as-shared → audit.

---

# Part C — Product branches (parked futures)

**Ship order locked:** Mac Desktop Personal → Teams container → phone as remote.

| Branch | When | What |
|--------|------|------|
| **A Desktop** | **Now** | Solo + Desktop; connectors + screen fork; approve/close |
| **B Brain API** | During A | Stable `/ask` `/loops` `/approve` |
| **C Teams container** | After dogfood | Docker + Swift; shared inbox/SLA |
| **D Phone remote** | After/parallel light | Shortcuts + Siri App Intents |
| **E True “Hey Jos” wake** | Fantasy on iPhone | Apple does **not** expose third-party system wake words |

### Voice / Siri (honest)

| Path | User says | Reality |
|------|-----------|---------|
| App Intents | “Hey Siri, ask Jos what’s open” | **Shippable** |
| Vocal Shortcuts | Custom phrase → still Siri | Chain to Shortcut |
| In-app wake word | Only while app foreground | Not system-wide |

**“Hey Jos” marketing → “Hey Siri, ask Jos …” engineering.**  
Thin Jos app can exist only for intents.  
“What did I do last 2 hours?” needs Layer B/eyes — else answer is weak.

### Suggest

1. Branch freely here; don’t block Desktop dogfood on Docker/Siri.  
2. Design Desktop as if remotes will exist (Brain API).  
3. Pitch Teams: container in your env; phone remote; no forced employee screen farm.

| Audience | Line |
|----------|------|
| Builder | Desktop first; container = Teams deploy; phone talks to brain |
| Personal | Floating Jos on Mac; later ask via Siri |
| Agency | Container + shared loops + approve |
| Apple | App Intents — we don’t clone Hey Siri |

---

# Part D — Decision summary

| Decision | Choice |
|----------|--------|
| UI vs brain split | Yes |
| Brain packaging | Docker Compose when Teams needs it; API-shaped from day one |
| Approve | Encoded in API (execute without approve → 403) |
| Capture | Host-side; presence + change-gated; policy per SKU (§A8) |
| Default bind | Localhost |
| Models | Adapter behind brain; context packs only (not raw screen) |
| Screen fork | **LOCKED B** — screen-first episodic; always-on rejected (§A6) |
| Retention | Purge raw ≤24h; keep Loops / proposals / approve history |
| Wake word | Siri + App Intents, not independent “Hey Jos” |
| Staged plan | `FLAGSHIP_STAGED_PLAN.md` — V1→V3 gates + domain locks |

---

## Related

- `OS_PRODUCT.md` — features, UX, agent lock, build order  
- `JUVANTAGE_OS_SCOPE.md` — ICP, ARR, GTM  
- `FLAGSHIP_STAGED_PLAN.md` — V1→V3 timeline, retention vs Reyn, approval gates  
- Wireframes: `assets/motion/desktop-ux-wireframes.html`
