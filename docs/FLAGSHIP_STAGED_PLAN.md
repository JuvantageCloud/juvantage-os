# Juvantage OS — Flagship staged plan (V1 → V3)

**Status:** Working approval brief + timeline + cost  
**Updated:** 2026-11-14  
**Locked sensing thesis:** Screen-first episodic + presence modes + connectors as ears/hands (`OS_ARCHITECTURE.md` §A6–A8)  
**Parent docs:** `JUVANTAGE_OS_SCOPE.md` · `OS_PRODUCT.md` · `OS_ARCHITECTURE.md` · `OS_BUILD_ROADMAP.md`

```text
FLAGSHIP BET:  Watch work → rank what costs you if it waits → draft → approve → verify
NOT THE BET:   Searchable life journal / always-on recorder
```

**Where we are now:** Phases 0–5 and the V1.5 Brain slice are shipped (close gate, object types, consume-once grant, float sheet, live Gmail once). Rocq models exist; they do **not** verify the OS.  
**Next:** Quartet gate in the running Brain (real MAC grant, shell cannot forge, idle scheduler, same close rule on every shell). Dogfood journal runs beside that. Episodic OCR and Teams stay behind the gate.  
**Research models:** [`research/doctoral/artifacts/coq/MACHINE_CHECK.md`](./research/doctoral/artifacts/coq/MACHINE_CHECK.md) · [`research/JV-OS-RP-01_PAPER.md`](./research/JV-OS-RP-01_PAPER.md)

---

## 0a · Plain English — what each idea actually is

No soft language. Exact pictures.

### 1. “Full always-on screen / searchable journal” — **CUT. Reyn’s product.**

**What it is:** The Mac records your screen all day (or every few seconds). An AI turns pixels into a searchable diary: “What did I say to Sarah at 2pm?” “Show me that spreadsheet from Tuesday.” You *ask the past*.

**Do you need an AI agent?** Yes — heavily:
- Continuous (or near-continuous) capture pipeline  
- OCR / vision model on huge volumes of frames  
- Embedding + search index so “ask anything” works  
- Cloud LLM calls (or a big local model) every time you query  
- Storage for transcripts/summaries (even if raw frames are local)

**Why we cut it:** That’s a memory company. Cost (CPU, battery, API $), privacy tax, and we lose the wedge. We are not funding a Reyn clone.

**What we do instead:** Eyes on only while you’re *working* (presence). Capture a burst when something changes or you clip — extract a *candidate obligation* — throw the raw frame away. Keep the Loop, not the movie.

---

### 2. “Scene graph / chaos cleanup” — **V3 idea. Not V1.**

**Scene graph =** Jos notices *which windows/tabs were open together*, not just “Chrome was frontmost.”

**Vivid example:** For 40 minutes you had Gmail (pilot email), Linear (ticket), and Figma (deck) side by side. Jos’s proposal isn’t “you used 3 apps.” It’s:

> Loop: Send the pilot pack — attach this Linear ticket + this Figma link. Draft ready. Approve?

**Chaos cleanup =** Jos notices *mess that blocks finishing*, then proposes a cleanup that creates closable steps.

**Vivid example:** Nine Google Docs tabs open for days; one Notion page reopened six times and never edited. Jos proposes:

> Park 8 stale Docs. Split “Website rewrite” into: (1) outline tonight, (2) draft Thursday. Approve?

**Not in V1.** Needs reliable co-window tracking + a smart ranker. Building it before reply-owed close works is how you stall.

---

### 3. “Meeting audio → loops” — **Later (V2+ / V3). Optional ear.**

**What it is:** During a Zoom/Meet call, Jos hears (or gets a transcript): *“I’ll send you the invoice Friday.”* That becomes an open Loop with a due hint — draft ready when Friday hits.

**Needs:** Mic permission *or* meeting-bot/transcript API; speech→text; commitment extraction LLM; false-positive control (“I’ll think about it” ≠ owed).

**Why later:** Powerful, creepy if wrong, and we don’t need it to prove Personal V1. Reply-owed from mail + clip + titles is enough to dogfood.

---

### 4. What we *are* building (the only story)

```text
ANY HOST (Mac now; phone / car / Teams later — shells only)
        │
        ▼
   BRAIN  (the OS: loops + linear approve + verify)
        │
        ├─ Eyes (light): app, title, URL — while present on that host
        ├─ Eyes (deep): OCR only on clip / change — V2, after quartet gate
        ├─ Ears: connectors when linked; obligation signals stay on when idle
        │
        ▼
   ONE OPEN LOOP  (typed object, not a screen box)
        │
        ▼
   HOST SURFACE (float on Mac)  →  preview  →  YOU APPROVE
        │
        ▼
   BRAIN CONSUMES GRANT ONCE  →  send / book / note  →  VERIFY CLOSED
```

If Google isn’t connected: ambient + clip still open loops; close may be copy-paste until a matching hand exists. The Brain does not move into the shell.

---

## 0b · Scope card — IN / LATER / NEVER

| | Item | When | One-line picture |
|--|------|------|------------------|
| **IN V1** | Floating agent + quick sheet | Now | Teal Jos; click → act |
| **IN V1** | Ambient app / title / URL ledger | Now | “Last 3–4 hours” trust view |
| **IN V1** | Clip hotkey | Now | You mark “this is owed” |
| **IN V1** | Optional Gmail/Calendar (read → send at approve) | Now | Hands, not the gate |
| **IN V1** | Reply-owed → draft → **approve** → send → verify | **Next (Phase 4)** | The product |
| **IN V1** | Presence: eyes off when idle | Now | Not a 24h camera |
| **IN V1.5** | Weak-clip refuse + `objectType` router stub | After dogfood start | No more Norton HIGH todos |
| **IN V1.5** | Consumable ApprovalGrant (no replay execute) | With router | Linear approve at Brain |
| **IN V2** | Episodic OCR on change/clip (deeper) | After dogfood | Pixel proof on the sheet |
| **IN V2** | NCD/AX surprisal trigger before OCR | With episodic | Cheap change gate |
| **IN V2** | Smart Document Object (semantic fields) | After router | Lease/form Act Moment |
| **IN V2** | Attention ranker (“costs you if it waits”) | After dogfood | One thing, not a pile |
| **IN V2** | Away digest via connectors | After dogfood | “While you were out” |
| **IN V2** | Watched pages (price/field packs) | After ranker | Track a page without journaling life |
| **IN V2** | Fill by voice into SDO/FormSession | Pitch/waitlist | Same approve gate |
| **IN V3** | Scene graph + chaos cleanup | After ranker works | Co-tabs → closable pack |
| **IN V3** | Skills + standing approvals | After trust | “Always snooze newsletters” earned |
| **IN V3** | Lineage merge (`loop://…`) + CRDT fields | After SDO | One Riverside object |
| **IN V3** | Teams lite (shared inbox / Twilio) | After Personal love | Owner + SLA; eyes off |
| **LATER** | Voice → day plan (waitlist CONCEPT) | After V2 objects | Door, not second Brain |
| **LATER** | Meeting audio → commitment loops | After V2 | Spoken “I’ll send Friday” |
| **LATER** | Phone / Siri / Mac·iPhone sync | After Brain API stable | Same loops both devices |
| **LATER** | Website / Line embed | After always-on Brain | Same memory, skinned door |
| **LATER** | JUST Scan/KEEP → PdfPacket bridge | Suite | Capture feeds OS |
| **NEVER (flagship)** | Always-on searchable screen journal | — | That’s Reyn |
| **NEVER** | Send without approve (until earned L3) | — | Trust death |
| **NEVER** | Raw screenshots as cloud memory | — | Privacy death |
| **NEVER** | Dump every employee’s screen for Teams | — | Wrong SKU |

---

## 0 · Do we need a full approval plan before building?

**No perfect freeze. Yes lock the bet.**

| Approach | Verdict |
|----------|---------|
| Plan everything for 12 months before code | **No** — you’ll invent fiction; Phase 0–1 already proved chrome |
| Build with zero locks | **No** — you’ll rebuild the eye three times and burn privacy trust |
| **Lock invariants + stage gates; ship inside them** | **Yes** |

**Build now** against locked invariants below. **Re-approve** only when crossing a stage gate (V1→V2, V2→V3) or a kill signal fires.

### Invariants (do not break without a written revisit)

1. Approve before any send/write/restart-class action  
2. Raw screen stays on-device; no searchable frame archive  
3. Eyes off when idle/away; connectors may stay on  
4. Hero = close / ranker, not “ask your journal”  
5. Personal dogfood before Teams container  

---

## 1 · Nine domain questions — locked answers (Chief Product / Architecture)

*Filled for the flagship bet as of 2026-10-25. Revisit only at stage gates.*

### 1. Product / category
**Q:** What are we front-running?  
**A:** Supervised work autonomy — Jos watches work you’re already doing and surfaces the one thing that needs you next (draft + evidence). Not task chat. Not Reyn memory.

### 2. Sensing architecture
**Q:** Eye vs connectors?  
**A:** **Screen-first episodic** while present; **connectors** while away + for execute/verify. Presence + change gate. Idle = eyes off, ears on.

### 3. Privacy / trust
**Q:** How do we soothe “max creep”?  
**A:** Raw frames ephemeral (≤24h hard max, usually seconds). Keep Loops/proposals/approve history. Honest copy: screen local; cloud = draft packs + OAuth hands. Pause + blocklist + “what left device” UI. See §A8.

### 4. Retention
**Q:** Days of searchable frames?  
**A:** **Deleted as a product idea.** After session/context generation: purge raw ambient; **keep suggestions (Loops)**. Reyn keeps journal forever by default; we keep obligations.

### 5. V1 wedge use case
**Q:** What must nail first?  
**A:** **Reply-owed** (Gmail) with approve → send → verify. Ambient titles + clip attach context. Ranker can be dumb (aging + critical) in V1; smart cost-of-wait in V2.

### 6. Engineering / cost logistics
**Q:** What do we afford to build first?  
**A:** Do **not** fund always-on OCR. Sequence: connectors + loop engine + approve (weeks) → ambient + presence (weeks) → episodic OCR/clip → watched pages → Skills. LLM: Anthropic adapter; cap tokens; context packs only. Infra: localhost Brain; Docker only at Teams.

### 7. Autonomy ladder
**Q:** When does Jos act alone?  
**A:** V1 = L1–L2 (notice + draft, you approve). V2 = standing approvals for quiet/snooze and narrow tools. V3 = Skills + shareable team skills. Never skip the ladder.

### 8. Teams / revenue path
**Q:** How does Personal become ARR?  
**A:** Same close engine; eyes **off** for Teams; shared inbox + owner + SLA. Personal is dogfood + PLG; agencies remain year-1 paid wedge (`JUVANTAGE_OS_SCOPE.md`).

### 9. Blind spots we must track
**Q:** Where are we most likely wrong?  
**A:** (a) OCR noise → false loops; (b) entity linking creepy-wrong; (c) nagging kills dogfood; (d) OAuth/Google policy friction; (e) Electron + Screen Recording battery; (f) over-building Skills before ranker works; (g) claiming “never leaves device” and getting caught. Mitigations: evidence on every sheet, Quiet band, kill criteria, honest privacy FAQ.

---

## 2 · Version map (logic vs expectation)

| | **V1 — Close the mail** | **V2 — Eye + ranker** | **V3 — Flagship autonomy** |
|--|-------------------------|------------------------|----------------------------|
| **Promise** | Unfinished replies/asks get drafted; nothing sends without you | “One thing that costs you if it waits” from screen+inbox | Skills from repetition; L3 standing approvals; Teams lite |
| **Sense** | Gmail + Calendar + app/title ambient + clip; presence eyes-off | + change-gated OCR/AX; watched pages; away digest | + scene graph; skill detection; optional local model path |
| **Decide** | Rules + LLM extract; aging triggers | Cost-of-wait attention ranker | Ranker + skill proposals |
| **Act** | Propose / approve / send / event / verify | Same + richer evidence packs | Standing approvals; share skill |
| **Keep** | Loops, proposals, quiet history | + session goals, observations (e.g. price) | + Skill defs, team share |
| **Purge** | Raw ambient ≤24h | Same | Same |
| **Not yet** | Full OCR always-on, Skills, Teams RBAC, phone | Always-on journal, autonomous send | Driverless work |

---

## 3 · Timeline (incremental — adjust dates, keep gates)

Assume **solo founder + Cursor**, ~15–25 focused hrs/week. Calendar is a forecast; **gates are law**.

| Window | Stage | Deliver | Gate to continue | Status |
|--------|-------|---------|------------------|--------|
| Done | V1a | Phase 2: Auth + Gmail/Calendar OAuth (or demo), encrypted tokens, sync | Sync pulls threads/events | ✅ |
| Done | V1b-sense | Phase 3: Loops, extract, ambient, presence, clip, nudge | Nudge on real/demo mail | ✅ |
| Done | V1b-close | Phase 4: propose → approve → execute → verify | Close gate live (demo send + audit) | ✅ |
| Done | V1c-chrome | Phase 5: Desktop Loops home + undock + sheet hierarchy | Frames 07–08 live | ✅ |
| Beside | V1c-dogfood | 14-day journal on host 1 | Would miss the Brain if gone | running, not the gate |
| **Now** | **Quartet** | HMAC grant; shell key fails; idle scheduler; one close rule; try/backpressure | `osGrants.test.ts` green | ◀ in code |
| After quartet | V2a | Deeper episodic OCR; session goals; away digest | Top-1 useful ≥50% of nudges | |
| +9 → +13 wk | V2b | Attention ranker; watched pages; privacy FAQ + what-left-device | Demo holds; 5 interviews OK privacy | |
| +13 → +19 wk | V3a | Skills + standing approvals; private beta ~25 | ≥3 Skills; no trust incident | |
| +19 → +27 wk | V3b | Teams lite; eyes-off; owner/SLA | 1 design partner metrics | |

**Rule:** If a gate fails, **fix the stage** — do not start the next eye/Skills/Teams layer.  
**Explicitly not on this calendar until gated:** scene graph, chaos cleanup, meeting audio, always-on journal, website embed.

---

## 4 · Costing — time, cash, model spend (vivid)

Figures are **order-of-magnitude for solo dogfood → small beta**, not a board budget. Revisit at each gate.

### 4.1 What burns money

| Cost center | What you’re paying for | V1 (now→dogfood) | V2 | V3 |
|-------------|------------------------|------------------|----|----|
| **LLM API** (Anthropic/etc.) | Extract reply-owed; write drafts; later OCR→text packs | **~$20–80/mo** dogfood (you); spikes if you over-OCR | **~$50–200/mo** if episodic OCR + ranker packs | **~$100–400/mo** until caps / local path |
| **Always-on journal (CUT)** | Continuous vision + index + ask | Would be **$hundreds+/mo** API *or* a heavy local GPU life — **we refuse this bill** | — | — |
| **Infra** | Brain host | **$0** localhost | **$0–20** tiny box if needed | **~$15–60/mo** EC2/Docker for Teams partner |
| **Google Cloud** | OAuth app | Free tier; verification = **time**, not $ | Same | Workspace admin friction = time |
| **Apple TCC** | Accessibility / Screen Recording prompts | Free; UX work = time | Same | — |
| **Twilio** (Teams SMS path only) | Shared line | $0 until Teams | $0 | **~$20–100/mo** + usage |
| **Founder time** | The real cost | **15–25 hrs/wk** | Same | Same + partner calls |

### 4.2 What each “AI” actually is (no mystery)

| Job | Model need? | Agentic? | When |
|-----|-------------|----------|------|
| Ambient app/title log | **No** | No — OS APIs | V1 |
| Rules extract (“Re:”, unanswered) | **Optional** | No | V1 (rules first; LLM helps) |
| Draft a reply | **Yes** — one LLM call with a **context pack** (thread + snippet) | **Not** a free-roaming agent | V1 Phase 4 |
| Rank “what costs you” | Small model or scored rules → later LLM | Ranker, not autopilot | V2 |
| Episodic OCR | Vision/OCR then LLM extract | Burst, not always-on agent | V2 |
| Scene / chaos proposals | LLM over co-window graph | Proposal-only; still approve | V3 |
| Meeting → “I’ll send Friday” | Speech-to-text + LLM | Ear, not agent swarm | Later |
| Reyn-style “ask my day” | Continuous embed + retrieval agent | **Yes, heavy** — **CUT** | Never |

**Bottom line:** V1 is **supervised drafts**, not an agentic coworker that wanders your machine. One shot: pack in → draft out → you approve.

### 4.3 Spend priority (law)

```text
1. Quartet in the running Brain      ← real grant MAC, TCB test, idle scheduler
2. Close-loop quality on host 1      ← small LLM $; one hero suggestion
3. Privacy UX (pause, blocklist, what left device)
4. Eye depth (episodic OCR)          ← only after quartet + dogfood
5. Ranker / watched pages
6. Second host / Skills / Teams      ← same Brain, new shell
```

**Biggest save we already chose:** not building always-on searchable capture. The OS is the Brain. A Mac companion without the quartet in code is still a shell.

---

## 5 · Stage-gate checklist (approval moments)

### Enter V1 build (now)
- [x] Category: close, not journal  
- [x] Sensing: B episodic + presence (A8)  
- [x] Retention: purge raw; keep Loops  
- [x] Google OAuth app + scopes plan written (read-only; OS redirect URI documented)  
- [ ] Privacy one-pager draft (even internal)
- [x] Phase 2 shipped (auth + connectors + encrypted tokens + sync / demo)

### Enter V2 (after quartet gate — dogfood alone does not open this)
- [ ] Quartet checklist in [`OS_BUILD_ROADMAP.md`](./OS_BUILD_ROADMAP.md) (real MAC, forge test, idle scheduler, same close rule)
- [ ] 14-day dogfood passed on that Brain  
- [ ] Approve gate never bypassed in prod paths  
- [ ] Metrics: clear rate, accept/dismiss baseline  
- [ ] Explicit decision: deepen OCR now vs more connectors

### Enter V3 (after V2b gate)
- [ ] Ranker top-1 credible in dogfood  
- [ ] No privacy incident; FAQ published  
- [ ] Skill detection prototype on *your* data only first  
- [ ] Teams vertical still agencies?

---

## 6 · Deliverables by stage

| Stage | Ship artifacts |
|-------|----------------|
| V1 | Mac Solo + Desktop; Gmail/Calendar; reply-owed close; ambient titles; clip; privacy prefs (pause, blocklist stub) |
| V2 | Episodic eye; session goals; away digest; ranker; watched pages; “what left device”; waitlist demo video |
| V3 | Skills; standing approvals; Teams lite pilot; security FAQ; pricing path |

---

## 7 · One-page “are we clear?”

| Question | Answer |
|----------|--------|
| Are we building Reyn? | **No.** No always-on searchable journal. |
| Do we need a roaming AI agent in V1? | **No.** Context pack → one draft → approve. |
| What is scene graph / chaos cleanup? | Co-tabs + mess → closable proposals. **V3.** |
| Meeting audio → loops? | Spoken commitments become owed work. **Later**, after V2. |
| Must users connect Google? | **No.** Optional. Unlocks send/verify. |
| What do we build next? | **Quartet gate on the running Brain.** Not another proof file. Not OCR. Not Teams. |
| Where is the plan of record? | **This file** + `OS_BUILD_ROADMAP.md` for checkboxes. |

---

## Related

- Mechanism detail: `OS_ARCHITECTURE.md` §A6–A8  
- Day-to-day checkboxes: `OS_BUILD_ROADMAP.md`  
- Business/ARR: `JUVANTAGE_OS_SCOPE.md`  
