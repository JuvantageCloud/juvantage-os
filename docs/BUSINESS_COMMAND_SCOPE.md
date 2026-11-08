# Business Command — Product Scope

> **PARKED (2026-10-14):** Not a marketed product. Flagship software is **Juvantage OS** — see [JUVANTAGE_OS_SCOPE.md](./JUVANTAGE_OS_SCOPE.md). Keep this doc as archive / pattern reference only.

**Working product name:** **Juvantage Command** (rename required — see §1)  
**Codebase today:** `apps/ios/JuvantageOS` + `apps/api` (still labeled “Business OS”)  
**Date:** 2026-10-14  
**Status:** **Parked** — mock-aligned, partially built, not in GTM  

**One-line job:**

> Multi-business live command center — see what needs attention across your shops, ask agents, approve actions.

This is **not** the unfinished-work / open-loop **Juvantage OS** daemon. Same company, different product.

---

## 0 · How people usually scope a product (method)

Use this sequence every time you expand features:

| Step | Question | Output |
|------|----------|--------|
| **1. Job** | What painful job does the buyer hire this for? | One sentence |
| **2. Buyer** | Who feels the pain enough to pay? | ICP + anti-ICP |
| **3. Workflow** | What toolchain do they already live in? | Connectors list |
| **4. Outcomes** | What measurable change proves value? | 3–5 metrics |
| **5. In / Out** | What ships in MVP vs later vs never? | Hard lists |
| **6. Differentiation** | Why not Instagram Insights + a spreadsheet? | Wedge |
| **7. Economics** | Price × volume × cost to serve | Margin model |
| **8. Go-to-market** | How do first 10–50 customers find you? | Marketing plan |
| **9. Build phases** | What order reduces risk? | 30/60/90 |
| **10. Kill criteria** | When do we stop or pivot? | Numbers |

This document is steps 1–9 for **Command**.

---

## 1 · Rename (Juvantage OS is taken)

| Name | Role |
|------|------|
| **Juvantage OS** | Flagship unfinished-work daemon (Personal + Teams) — *catch unfinished work → finish it* |
| **Juvantage Command** *(recommended)* | This app — multi-business live ops phone |
| ~~Juvantage Business OS~~ / ~~JuvantageOS~~ app label | Retire for public naming |

**Why Command:** Matches the Home mock (“Command · Good evening”), reads as a *cockpit*, doesn’t collide with the OS daemon story.

**Rename work (later, not blocking scope):**

- App Store / Xcode display name → `Juvantage Command`
- Bundle / folder rename can wait until App Store path is real
- Marketing site: Command under **For Business**; OS stays the waitlist flagship

---

## 2 · Product definition

### What it is

A **native iOS command center** for people who run **one or more small/mid businesses** and need:

1. **Portfolio view** — all businesses healthy vs attention  
2. **Channel live state** — Instagram / TikTok / Calendar (later Stripe / QuickBooks)  
3. **Attention queue** — inventory lag, bookings, social spikes, agent posts  
4. **Agents** — Ops / Growth / Finance chat with **propose → you confirm**  
5. **Optional Cursor Bridge** — route engineering asks to coding agents (stub → V2)

### What it is not

| Not this | Why |
|----------|-----|
| Reyn / screen OCR OS | Different product (context stream + unfinished work) |
| Full social scheduler (Buffer/Later) | We *monitor + alert + recommend*, not replace posting suite day-1 |
| Accounting system | Stripe / QuickBooks = connectors later |
| Viktor replacement | Viktor stays external; never “Ask Viktor” in-product |

### Core loop (prove this)

```text
CONNECT sources → OBSERVE live state → FLAG attention
  → AGENT investigates / recommends → YOU APPROVE → ACT / NOTIFY → VERIFY
```

Mock proof points already designed:

- Harbor Retail **Attention** → inventory sync lag → $1.2k at risk → Resolve with Agent  
- Ops Agent chat → structured cards + Open inventory / Notify / Escalate  
- Cursor Bridge → propose on, **actions require confirmation**

---

## 3 · Who we sell to (ICP)

### Primary ICP (year 1)

**Multi-location or multi-venture operators** who already use Instagram/TikTok + calendar/bookings and feel blind across properties.

| Attribute | Target |
|-----------|--------|
| **Who** | Owner / GM / ops lead (not enterprise IT) |
| **Businesses** | 1–10 locations or brands (studio, retail, café, consulting, clinic) |
| **Stack** | Instagram + TikTok + Google Calendar (bookings); maybe Square/Stripe later |
| **Pain** | “I find out late — inventory lag, missed shoot, dead Reel, unanswered mention” |
| **Budget** | $49–$199 / mo feels normal; $2–6k / yr team seat later |
| **Trigger** | Second business, or first business + social + bookings overload |

**Persona sketch:** *Jordan runs Northside Studio + advises Harbor Retail. Phone is full of apps. They open Command at 9pm: one business Healthy, one Attention, agent already drafted the diagnosis.*

### Secondary ICP

| Segment | Fit | When |
|---------|-----|------|
| Solo creator / single shop | Weaker — Meta Insights may be enough | Only if Attention + Agent clearly better |
| Agencies managing 5–20 client brands | Strong Teams upsell | After solo multi-biz works |
| Mid-market / finance / healthcare | Need audit + VPC | Not Command MVP |

### Anti-ICP (do not chase)

- Enterprises needing SSO / SOC2 day-1  
- Pure e-comm with no social/booking ops  
- Users who want autonomous posting without approval  
- “Replace QuickBooks” buyers  

---

## 4 · Feature scope (from mocks → MVP)

### Screen map (mocks you shared)

| Area | Mock signal | MVP? |
|------|-------------|------|
| Onboarding — Connect Instagram / TikTok / Calendar | Connect services | **Yes** |
| Add business (name, category, TZ, currency) | New business | **Yes** |
| Command home — revenue / open tasks / mentions + business list | Command | **Yes** |
| Business detail — Overview / Channels / Ops + live activity | Northside Studio | **Yes** |
| Social hub — IG/TikTok cards + insight banner | Social | **Yes (read)** |
| Reel insights + “Ask Growth Agent” | Reel insights | **Stretch** |
| Calendar synced to Google | Calendar | **Yes** |
| Alerts feed (Critical / Social / Agents) | Alerts | **Yes** |
| Attention detail + recommended actions | Inventory sync lag | **Yes** |
| Agents list + New chat | Agents | **Yes** |
| Ops Agent structured reply + actions | Ops Agent chat | **Yes** |
| Analytics / Performance charts | Juvantage Analytics | **Thin** |
| Settings — businesses, connections, team, agents, privacy | Settings | **Yes (team = stub)** |
| Connections toggles + Stripe/QB coming soon | Connections | **Yes** |
| Cursor Bridge permissions + propose toggle | Cursor Bridge | **Stub** |
| Capture tab (camera) | Businesses nav | **Out of MVP** |

### IN — MVP

1. Multi-business portfolio (create / list / status Healthy|Attention)  
2. Connectors: **Instagram, TikTok, Google Calendar** (OAuth or honest demo mode)  
3. Command home aggregates: revenue today*, open tasks, mentions*  
4. Alerts + Attention detail with impact + recommended actions  
5. Agents: Ops (+ Growth/Finance as thin personas) chat → structured cards  
6. **Approve gate** before any write/resync/notify that leaves the device  
7. Calendar day view synced  
8. Settings: profile, connections, agent permissions, privacy, sign out  
9. Seeded dogfood path for *your* businesses (not forever Northside demo)

\*Revenue/mentions may be **estimated / connector-limited** in MVP — label honesty in UI.

### OUT — not MVP

- Stripe / QuickBooks live accounting  
- Full social composer / auto-post  
- Team RBAC beyond Owner (invite stub OK)  
- Real Cursor Bridge execution (schema + UI only)  
- Desktop / web Command  
- Screen OCR / unfinished-mail daemon (that’s **Juvantage OS**)  
- Capture/receipt scanning (JUST Scan owns capture)  

### Already built (codebase)

| Piece | Status |
|-------|--------|
| SwiftUI tabs: Home, Social, Calendar, Agents, More | Built |
| Business Core API (Hono + Prisma) | Built |
| Multi-business seed + auth | Built |
| Ops Agent orchestrator (+ optional Anthropic) | Built |
| Alerts / Connections / Cursor Bridge stub UI | Built |
| Instagram / Calendar OAuth paths + demo fallback | Partial |
| TikTok live connector | Likely thin / stub |
| Real approve → execute → verify on inventory | Incomplete |
| App rename to Command | Not done |

---

## 5 · Differentiation & positioning

| vs | They do | Command does |
|----|---------|--------------|
| Instagram / TikTok Insights | One channel deep | **Cross-business + cross-channel Attention** |
| Later / Buffer | Schedule posts | **Monitor + flag + agent recommend** (not scheduler-first) |
| Notion / spreadsheets | Manual ops board | **Live connector state + agent diagnosis** |
| Juvantage OS (daemon) | Catch unfinished *work loops* | Catch unfinished *business ops signals* |
| JUST apps | Single-purpose consumer tools | Portfolio ops for owners |

**Homepage / App Store line:**

> Command — see every business you run. When something slips, an agent explains why and waits for your OK.

---

## 6 · Economics & potential margins

### Pricing hypotheses (validate with 5 interviews)

| Plan | Price | Includes | Who |
|------|-------|----------|-----|
| **Solo** | $29–49 / mo | 1 business, 3 connectors, Ops Agent | Single shop test |
| **Operator** | $79–99 / mo | Up to 5 businesses, alerts, Growth+Ops agents | Primary ICP |
| **Studio** | $149–199 / mo | Up to 15 businesses, team invites, priority | Agencies / multi-brand |

Annual = 2 months free (~17% discount).

### Unit economics (illustrative Operator @ $99/mo)

| Line | Assumption | Notes |
|------|------------|-------|
| Gross revenue | $99 / seat / mo | |
| Payment fees | ~3% | Stripe |
| LLM / infra COGS | $8–25 / active user / mo | Cap tokens; cache; demo mode |
| Support | Low if self-serve | Founder-led early |
| **Contribution margin** | **~65–85%** at scale | Typical B2B SaaS if COGS controlled |
| Year-1 reality | Lower — heavy founder time | Treat as R&D + dogfood |

### Path to meaningful ARR

| Motion | Math |
|--------|------|
| 50 × Operator @ $99 | ~$59k ARR |
| 100 × Operator | ~$119k ARR |
| 20 × Studio @ $179 + 40 Operator | ~$90k+ ARR |

**Do not** model Command as the $500k ARR mid-market unfinished-work OS. Command is the **For Business phone product**; OS daemon is the bigger ACV bet.

### Margin risks

- Unbounded agent chat → LLM COGS explode → need quotas  
- Instagram/TikTok API limits / ToS → don’t promise what Meta won’t allow  
- Fake “live revenue” without Stripe → trust damage — label estimates  

---

## 7 · Marketing / go-to-market plan

### Narrative

1. **Problem:** Running more than one brand = tab chaos and late surprises.  
2. **Promise:** One Command home — Healthy vs Attention — agent ready with next step.  
3. **Proof:** Harbor-style Attention story (lag → $ at risk → resolve with approve).  
4. **Trust:** Agents propose; **you confirm**.  

### Channels (first 90 days)

| Channel | Action |
|---------|--------|
| **You as design partner** | Dogfood JUST + Care + any side businesses in Command |
| **Warm network** | 10 owner interviews; 3 TestFlight seats |
| **Content** | Short screen recordings (Attention → Agent → Approve) on IG/TikTok/LinkedIn |
| **JUST cross-sell** | In-app / site: “Run multiple businesses? Command waitlist” |
| **Care clients** | Soft upsell when a site isn’t enough ops visibility |
| **Paid** | Hold until conversion story exists |

### Messaging do / don’t

| Do | Don’t |
|----|-------|
| Multi-business Attention | “AI employee replaces your team” |
| Approve before act | Promise full Meta analytics parity |
| Live monitoring of *connected* sources | Claim screen-wide OS (that’s the other product) |

### Sales motion

- **Self-serve** waitlist → TestFlight → Stripe  
- Founder demos for Studio tier  
- No outbound enterprise until audit trail + team roles exist  

---

## 8 · Build plan (90 days)

### Days 1–30 — Rename story + dogfood loop

- Lock public name **Juvantage Command** (display name)  
- Replace demo portfolio with **your** real/near-real businesses where possible  
- One Attention → Agent → Approve → stub Execute → Verify path that works end-to-end  
- Honest connector states (Connected / Demo / Coming soon)

### Days 31–60 — Connectors that matter

- Harden Google Calendar  
- Instagram read path that feeds Alerts (or documented demo)  
- TikTok: ship only if API path is real; else keep Coming soon  
- Alerts filters + Attention detail polish from mocks  

### Days 61–90 — Monetization readiness

- Waitlist / TestFlight cohort of 10  
- Pricing page copy under For Business  
- Agent usage caps  
- Kill/continue review: weekly active Attention resolves ≥ X  

### Success bar

Open phone → *your* businesses → one Attention with $ impact → ask Ops Agent why → approve an action → verification visible.

---

## 9 · Relationship to other Juvantage products

```text
JUST™ (Scan / KEEP / Line / Haven)     → consumer tools
Juvantage Command (this app)           → multi-biz live ops phone  ← For Business software
Juvantage OS (daemon)                  → unfinished-work Personal + Teams
Launch + Care                          → website service entry
```

**Shared DNA:** observe → propose → approve → execute → verify.  
**Different fuel:** Command = business *signals* (inventory, social, bookings). OS = *obligations* (reply owed, half-done forms, context interrupts).

---

## 10 · Kill / pivot criteria (6 months)

| Signal | Action |
|--------|--------|
| Can’t get real Instagram/TikTok data without ToS risk | Narrow to Calendar + manual Attention + agent |
| Users only want analytics charts | Kill agents focus; or kill product |
| Users ask only for unfinished email | Point them to OS waitlist; don’t mash products |
| LLM COGS > 40% of revenue | Quotas + smaller models + fewer free chats |
| 0 paying after 3 paid pilots | Reassess ICP (agency vs owner) |

---

## 11 · Open decisions (for next working session)

1. Confirm display name: **Juvantage Command** vs alternative (Live / Ops).  
2. Primary wedge vertical: **creator/studio**, **retail**, or **hospitality** (pick one for marketing screenshots).  
3. First real connector to bet on: Calendar vs Instagram.  
4. Whether Command ships on App Store under JUST umbrella or separate For Business listing.

---

## Appendix — Mock → requirement checklist

- [x] Connect Instagram / TikTok / Calendar onboarding  
- [x] Multi-business Command home + Attention status  
- [x] Business Overview live activity  
- [x] Social cards + insight  
- [x] Alerts taxonomy (Critical / Social / Agents)  
- [x] Attention impact + recommended actions + Resolve with Agent  
- [x] Agents list + Ops Agent structured chat  
- [x] Cursor Bridge propose + confirm  
- [x] Connections + Stripe/QB coming soon  
- [x] Settings workspace / agents / privacy  
- [ ] Capture camera tab  
- [ ] Full Analytics suite parity  
- [ ] Team management beyond Owner  
