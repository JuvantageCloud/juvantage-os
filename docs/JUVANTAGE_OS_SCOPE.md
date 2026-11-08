# Juvantage OS — Business Scope, ARR & Go-to-Market

**Product:** Juvantage OS  
**Date:** 2026-10-14  
**Status:** Source of truth for the flagship software bet  
**Related decks:** `Juvantage_OS_MVP_Product_Plan.pptx`, `Juvantage_OS_Pitch.pptx`  
**Related research:** canvas `unfinished-work-market-research`  

**Companion docs (only two besides this):**  
- [`OS_PRODUCT.md`](./OS_PRODUCT.md) — Desktop ship, UX, locked agent symbol  
- [`OS_ARCHITECTURE.md`](./OS_ARCHITECTURE.md) — Context vs Reyn, screen forks, Brain container, phone/Siri branches

**One-line job:**

> We catch unfinished work and help you finish it — Personal and org-wide (Teams).

```text
CONTEXT STREAM  →  OPEN LOOPS  →  RIGHT-MOMENT SURFACE  →  PROPOSE → APPROVE → EXECUTE → VERIFY
```

---

## 0 · How people usually scope a product

| Step | Question | This doc section |
|------|----------|------------------|
| **1. Job** | What painful job is the buyer hiring? | §1 |
| **2. Buyer** | Who pays / who blocks? | §2 ICP |
| **3. Toolchain** | What systems already hold the work? | §3 |
| **4. Outcomes** | How do we know it worked? | §4 Measurables |
| **5. In / Out** | What ships vs deferred? | §5 |
| **6. Wedge** | Why not Reyn / Gmail / Asana / Zendesk? | §6 |
| **7. ARR** | Price × logos × path | §7 |
| **8. Deliver** | Build order / deploy shape | §8 |
| **9. Marketing** | How first customers arrive | §9 |
| **10. Kill** | When to stop or pivot | §10 |

Do not invent features until 1–4 are clear. Do not invent ARR until price × ICP × motion are written.

---

## 1 · Product job (locked)

### Job to be done

**When** I context-switch across mail, chat, calendars, and forms,  
**I want** unfinished obligations that still matter to be caught and closable,  
**so I** don’t lose replies, bookings, SLAs, or follow-through.

### Skins (one brain)

| Skin | Who | Unit of work |
|------|-----|----------------|
| **Personal** | Overloaded individual / founder | Reply owed, half-read, unconfirmed appt, aging todo, incomplete form/PDF |
| **Teams** | Org with shared streams | Client loop with **owner + SLA**; assign / escalate / audit |

### Explicitly not the product

| Not | Why |
|-----|-----|
| Reyn-class **journal/ask** as our identity | They own memory; we own **close** — screen/ambient may fuel loops (see `OS_ARCHITECTURE.md`), but homepage ≠ “ask your journal” |
| Generic “3 commitments overdue” wall | Feels like surveillance; fails adoption |
| Multi-biz Instagram command phone | **Parked** (old Business OS / “Command”) — not sold now |
| JUST apps replacement | JUST stays consumer suite; OS sits above |

**vs Reyn (one line):** They journal the screen. We **complete the obligation** — with enough working context to surface the *right* loop at the *right* moment.

---

## 2 · Who we sell to (ICP)

### Near-term: dual wedge

You don’t need “big tech” as year-1 buyer. You need **operators whose unfinished work has a dollar or reputation attached**.

#### A · Personal (dogfood → prosumer)

| | |
|--|--|
| **Who** | Busy operator with two lives (job + venture, multi-side-project founder) — start with **you** |
| **Pain** | Half-read boss mail / open applications / unconfirmed plans die after Amazon→email→project switches |
| **Buyer** | Self (card) |
| **Anti** | People who want autonomous send with no approve |

#### B · Teams — pick **one** vertical for first paid pilots

| Vertical | Buyer | Unfinished unit | $ leak |
|----------|-------|-----------------|--------|
| **Agencies / client services** *(recommended first)* | VP Client Services / COO | Client reply / deliverable ownership | SLA breach, churn, double-work |
| **Clinics / local services** | Practice manager | Reschedule / booking confirm | No-shows, lost bookings |
| Sales / RevOps | Head of RevOps | Follow-up owed | Pipeline leakage |
| Finance / healthcare ops | Ops / compliance | Packets, KYC, intake | Latency + audit risk — **later** (trust-heavy) |

**Recommended year-1 Teams wedge:** **Agencies** — shared inbox + Slack/email, clear SLA language, $6k–$25k ACV plausible without hospital procurement.

### Anti-ICP (do not chase yet)

- Enterprises requiring SOC2 / VPC / SSO before any demo  
- “AI that sends for me” without human gate  
- Buyers who only want screen recording / meeting notes  
- Big Tech platform teams (they build internal tools)

### Buying committee (Teams)

| Role | Care about |
|------|------------|
| Champion (ops / client services lead) | Stalled loops, owner clarity |
| Economic buyer (COO / VP) | SLA, retention, margin on delivery |
| Blocker (IT / security) | No raw screen dump; approve audit; retention |

---

## 3 · Toolchains (think systems, not features)

### Personal MVP toolchain

```text
Gmail + Calendar (+ ambient / eyes per OS_ARCHITECTURE forks)
  →  open loops  →  timed / aging nudge (Solo agent)  →  approve  →  send / event / snooze / quiet
```

Next: extra connectors, PDF/forms, meeting commitments.  
Screen/OCR: open fork — fuel for **close**, not Reyn-clone journal (`OS_ARCHITECTURE.md` Part A).

### Teams MVP toolchain

```text
Shared Gmail inbox  OR  Twilio SMS line  →  org loop store + owner + SLA
  →  lead digest  →  RBAC approve  →  send-as-shared / assign  →  audit
```

Org-connected Slack/Teams only when workspace is explicitly shared — **not** “dump everyone’s Slack.”

### Deploy shape

| Phase | Shape |
|-------|--------|
| MVP | SaaS control plane + Mac (or web) client + connectors |
| Growth | Org tenant, RBAC, audit |
| Trust | Private tenant / VPC |
| Enterprise | In-cluster daemon — **upsell, not MVP** |

---

## 4 · Measurables (what we sell)

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **Loop latency** | Detect → close (hours) | Core productivity |
| **Reply-owed clear rate** | % closed in 24h / 72h | Personal + Teams |
| **Appt conversion** | “Does X work?” → calendar event | Clinics / personal |
| **Quiet accuracy** | % auto-quiet that stay quiet | Anti-nag trust |
| **Assist accept rate** | Approve / edit / dismiss | Product quality |
| **Owner coverage** | % loops with explicit owner | Teams |
| **SLA near-miss caught** | Count before breach | Agency $ story |
| **No-shows recovered** | vs baseline | Clinic $ story |

Pilot length: **2–4 weeks** with baseline week 0.

---

## 5 · Features — hard In / Out

### IN — MVP (Personal first, then Teams lite)

1. Gmail + Google Calendar connectors (official APIs)  
2. Loop extract: reply-owed, ask, appointment, todo  
3. Score bands: Critical / Important / Borderline / Quiet (+ ignore/snooze history)  
4. Surfaces: timed / right-moment Solo agent + Desktop mode (Mac first); morning inbox digest optional later  
5. Actions: draft reply, create event, snooze, quiet  
6. **Approve gate** before any send/write  
7. Verify close (reply sent / event created)  
8. Teams lite: one shared inbox **or** Twilio line + Admin / Lead / Member  
9. Audit log of proposals + executions  
10. Pilot metrics board (above 8)

### OUT — not MVP

- “Ask your journal” / memory-OS as brand (Reyn’s category) — eyes/ambient for *closing* is a separate open fork  
- Autonomous send  
- Full Slack org dump  
- iMessage as launch requirement  
- PDF packet studio as code path (demo UI OK as north star)  
- K8s / in-cluster requirement  
- Custom fine-tune as launch gate  
- Mobile-first iOS daemon v1  
- “Juvantage Command” App Store launch  
- CRM deep Salesforce sync  

### Intelligence path (honest)

| Stage | Approach |
|-------|----------|
| Now | LLM structured extract + rules |
| Next | Small classifiers for priority / quiet on labeled loops |
| Later | Fine-tune only if eval + volume justify |

You oversee labels; models don’t ship on vibes.

---

## 6 · Differentiation

| Competitor class | Gap we own |
|------------------|------------|
| Reyn / Rewind / Recall | Memory ≠ close; we finish with approve |
| Gmail / Superhuman | Inbox polish ≠ cross-loop + Teams SLA |
| Asana / Linear | Task managers ≠ detect obligations *inside* mail/chat |
| Zendesk / Intercom | Tickets ≠ personal context + cross-toolchain graph |
| ChatGPT / Copilot | Chat ≠ daemon state machine + verify |

**Wedge line (marketing):**

> Nothing important stays unfinished — and nothing sends without you.

---

## 7 · ARR model (think in recurring revenue)

### Definitions

- **ARR** = sum of annualized subscription value across **all** paying accounts (not one logo unless enterprise).  
- **ACV** = annual contract value per account.  
- **NRR** (later) = expansion − churn.

### Price architecture

| Motion | Price shape | To ~$500k ARR | Sales motion |
|--------|-------------|---------------|--------------|
| **Personal / Pro** | $20–40 / mo (~$240–480 ACV) | ~1,000–2,000 users | Product-led; hard alone |
| **Team desk** | $500 / mo (~$6k ACV) | ~83 teams | Inbound + founder demo |
| **Mid-market** | **$15–30k ACV** (anchor **$25k**) | **~20 companies** | Founder-led pilot → annual |
| **Enterprise+** | $50–150k ACV | 4–10 logos | Needs proof + deploy ladder |

**Primary ARR path for the company bet:** Team → Mid-market (agencies first). Personal is dogfood + wedge + PLG top-of-funnel, not the $500k engine alone.

### Year map (illustrative, not a promise)

| Horizon | ARR target | What must be true |
|---------|------------|-------------------|
| **0–6 mo** | $0–20k | Dogfood Personal; 1–2 design partners unpaid/paid pilot |
| **6–12 mo** | $50–150k | 8–25 Team desks **or** 3–6 × $25k mid-market |
| **12–24 mo** | **$400–600k** | Repeatable agency (or clinic) motion; case studies |
| **Valuation intuition** | — | At ~6–10× ARR, $500k ARR ≈ $3–5M enterprise value band (illustrative) |

### Unit economics (Teams @ $25k ACV)

| Line | Notes |
|------|--------|
| Gross | $25,000 / yr |
| COGS (LLM, infra, support) | Target &lt; 20–25% at scale with caps |
| Contribution | High SaaS-like if not white-glove forever |
| CAC | Founder time first; paid later |
| Payback | Aim &lt; 12 months once motion repeats |

### Margin story to tell buyers

Don’t sell “AI.” Sell:

- Hours recovered (loop latency)  
- SLA breaches avoided  
- Clear rate on reply-owed  
- Owner coverage  

---

## 8 · Deliver plan (build + ship)

### Principle

**Personal dogfood → one Teams design partner → price → expand.**  
Cluster/VPC only when a paying logo requires it.

### 90 days

| Window | Deliver |
|--------|---------|
| **Days 1–30** | Gmail + Calendar; loop schema; digest UI; approve → send/event; you use it daily |
| **Days 31–60** | Score + quiet history; floating assist; verify; audit; 1 agency shared-inbox partner |
| **Days 61–90** | Teams lite RBAC; metrics board; security basics; pricing page / waitlist conversion |

### 12-month delivery milestones

| Quarter | Ship |
|---------|------|
| **Q now** | Personal MVP dogfood + OS waitlist narrative on site |
| **+1Q** | Private beta (you + waitlist); Teams lite pilot |
| **+2Q** | First paid Team / mid-market pilots; case study |
| **+3Q** | Repeatable outbound/inbound for agencies; expand connectors carefully |

### Code / repo note

- This monorepo’s iOS “Business OS” shell = **parked pattern library** (Attention → Agent → Approve).  
- OS flagship build should prioritize **Mac daemon + connectors + loop engine**, not Instagram Command App Store.

---

## 9 · Marketing & deliver-to-market

### Positioning stack (public)

1. **JUST™** — what’s live today (trust + cash)  
2. **Juvantage OS waitlist** — flagship unfinished-work story  
3. **Care** — For Business service (not the hero)  
4. **Command** — not marketed

### Messages

| Audience | Message |
|----------|---------|
| Personal waitlist | “Catch what slips when you context-switch — approve before anything sends.” |
| Agency buyer | “Every client loop has an owner and a clock — before SLA breach.” |
| vs Reyn | “Memory isn’t enough. We help you finish.” |

### Channels (first customers)

| Channel | Use |
|---------|-----|
| **Founder dogfood content** | Weekly short demo: digest → approve → done |
| **Warm network** | 10 agency / ops interviews; 2 design partners |
| **JUST / site waitlist** | Cross-link OS; email waitlist with Personal beta |
| **LinkedIn / X** | Operator stories, not feature dumps |
| **Care clients** | Only if they have shared-inbox pain — soft intro |
| **Paid ads** | After paid conversion exists |

### Sales motion by ARR tier

| Tier | Motion |
|------|--------|
| Personal Pro | Self-serve card |
| Team $6k | Demo → 2-week pilot → annual |
| Mid-market $25k | Founder-led; pilot success metrics in contract; security one-pager |

### Collateral to produce (in order)

1. One-pager (Personal + Teams)  
2. 90-second demo video (approve gate visible)  
3. Pilot one-pager (measurables + data handling)  
4. Security/privacy FAQ (no screen dump; approve; retention)  
5. Case study #1 (agency or you-as-operator)

---

## 10 · Kill / pivot criteria

| Signal (6–9 months) | Action |
|---------------------|--------|
| You won’t use Personal daily | Revisit surface (digest vs float) before adding Teams |
| Quiet/accept rates terrible | Fix scoring before new connectors |
| Design partners love “memory” not “finish” | Drift toward Reyn — **reject**; double down on close |
| No path to paid Team after 3 pilots | Change vertical (clinic) or motion |
| Security blocks every agency | Accelerate audit + VPC story earlier |

---

## 11 · Open decisions (lock next session)

1. **Teams vertical #1:** agencies vs clinics  
2. ~~**First surface:**~~ → **LOCKED:** Mac desktop + locked agent (`OS_PRODUCT.md`)  
3. **Personal beta:** invite-only count (e.g. 25)  
4. **Price publish:** Team desk $500/mo vs custom pilot fee  
5. **Mac shell tech:** Electron / Tauri / native Swift  
6. **V1 LLM provider:** adapter-friendly  
7. ~~**Screen fork:**~~ → **LOCKED B:** screen-first episodic + presence; connectors as hands/away-ears (`OS_ARCHITECTURE.md` §A6–A8 · `FLAGSHIP_STAGED_PLAN.md`)

---

## Appendix A — Company map (software focus)

```text
JUVANTAGE
├── JUST™                 → ship / retain
├── Juvantage OS          → FLAGSHIP software (this doc)
├── Care                  → service cash
└── Command (parked)      → do not market; reuse patterns later
```

## Appendix B — Scoping checklist (reuse forever)

- [ ] Job in one sentence  
- [ ] ICP + anti-ICP  
- [ ] Toolchain list  
- [ ] 5 measurables  
- [ ] In / Out list  
- [ ] Wedge vs 3 competitors  
- [ ] ARR table (price × logos)  
- [ ] 90-day deliverables  
- [ ] First 10 customers path  
- [ ] Kill criteria  
