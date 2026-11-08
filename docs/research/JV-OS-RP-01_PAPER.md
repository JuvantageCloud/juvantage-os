# JV-OS-RP-01 — Context Objects, Modality-Aware Close & Staged Systems Architecture for Juvantage OS

**Assignment:** [`../RESEARCH_ASSIGNMENT_CONTEXT_OBJECTS.md`](../RESEARCH_ASSIGNMENT_CONTEXT_OBJECTS.md)  
**Doctoral matrix:** Three-Tier Doctoral Research Specification (CS-9901 / PHYS-9820 style)  
**Product truth:** Scope · Architecture · Flagship · Roadmap · [OS waitlist](https://juvantagecloud.com/#os-waitlist)  
**Author:** Auto (Composer) · **Date:** 2026-11-03  
**Status:** Complete research deliverable — sparks filed same session

---

## 1 · Abstract

Juvantage OS’s product job is to catch unfinished work and help finish it under a hard approve gate. Dogfood currently fails that promise on weak clips: ⌘⇧L often creates loops titled “Clipped while in Norton” and attaches a generic todo template draft. That is ambient app-name fallback, not modality awareness. This paper answers how the OS should detect modality (mail, chat, PDF/form, calendar, strong clip, weak hint), bind work to typed **context objects**, and choose the correct propose → approve → execute → verify path.

We survey scholarly and systems literature across three doctoral tiers: (A) capability-isolated runtime boundaries (seL4-style capabilities; linear authorization), (B) episodic perception grounded in Landauer cost and active-inference surprisal rather than continuous OCR, and (C) strongly typed semantic objects including a bipartite Smart Document Object (SDO) informed by document AI (LayoutLMv3) and CRDTs. We translate each tier into staged Juvantage artifacts on the existing Electron + Brain stack, preserving locked invariants (no Reyn-class journal; eyes off when idle; no send without approve). Waitlist concepts—Voice → plan, Mac · iPhone—are treated as later doors into the same object engine. We conclude with a two-week post-dogfood slice: refuse weak clips, introduce `objectType` + modality router stubs, and instrument wrong-object quiet reasons.

---

## 2 · Introduction — Norton failure & waitlist pillars

### 2.1 What the founder saw

Desktop Loops showed five **HIGH** cards: “Clipped while in Norton,” draft pane filled with:

> Next step for me: (1) Clipped while in Norton (2) Reply once done.

**Causal chain today**

```text
⌘⇧L → osascript frontmost app ("Norton")
    → createClipLoop({ title: "Clipped while in Norton" })
    → kind=todo, band=high, source=clip
    → proposeForLoop → TEMPLATE draft (todo checklist)
```

No Gmail thread, no PDF fields, no chat utterance—yet the UI implies a closable obligation with a send-shaped Approve button. That trains distrust.

### 2.2 What the product already promised

| Source | Promise |
|--------|---------|
| Scope | Unfinished work → surface → approve → close |
| Architecture | Screen-first **episodic** eyes; connectors as hands/ears |
| Pitch / waitlist | Forms & signatures stalled; guided fill; **nothing submits until approve**; Mac · iPhone same loop |
| Waitlist CONCEPT | Voice → plan; Approve → run (later doors) |

### 2.3 Research question (restated)

How should Juvantage detect modality, bind durable typed objects, and close them—using ambient, connectors, AX/OCR, voice, and optional LLM—while remaining episodic, privacy-honest, and staged V1→V3?

---

## 3 · Related work / technology survey

| Source | Steal | Reject / caution |
|--------|-------|------------------|
| **Friston (2010)** Free-energy principle ([Nature Reviews Neuroscience](https://www.nature.com/articles/nrn2787)) | Sense when surprisal high; dormant otherwise | Do not import full neuroscience machinery into V1 |
| **Friston et al.** Active Inference process theory | Perception + action minimize free energy; policies as expected trajectories | Keep CoW ranker heuristic first; FEP as justification |
| **Landauer (1961)** Irreversibility & heat in computing ([IBM J. Res. Dev.](https://doi.org/10.1147/rd.53.0183)) | Retaining raw frames postpones erasure cost & privacy debt | Not a literal µJ budget—use as anti-continuous-OCR argument |
| **Cilibrasi & Vitányi (2005)** Clustering by compression / NCD ([IEEE TIT](https://doi.org/10.1109/tit.2005.844059)) | Cheap change detection on AX/title tokens without pixels | Compressor choice affects γ; calibrate on dogfood |
| **Huang et al. (2022)** LayoutLMv3 ([ACM MM](https://dl.acm.org/doi/10.1145/3503161.3548112); [arXiv](https://arxiv.org/abs/2204.08387)) | Form/field understanding for SDO semantics | Cloud/heavy model = episodic only; prefer PDF text layer first |
| **Girard (1987)** Linear logic ([TCS](https://doi.org/10.1016/0304-3975(87)90045-4)) | Approvals as consumable resources (⊸) | Full proof theory not required in product code |
| **Garg et al.** Linear logic of authorization ([ESORICS-style](http://www.cs.cmu.edu/~fp/papers/esorics06.pdf)) | Use-once authorizations map to approve tokens | Keep UX simple; formalize in Brain gate |
| **Klein et al. (2009)** seL4 ([SOSP](https://dl.acm.org/doi/10.1145/1629575.1629596)) | Capability confinement inspiration for execute trap | Do **not** rewrite Electron as seL4 guest in V1 |
| **Kleppmann / CRDT surveys** ([ACM CSUR](https://dl.acm.org/doi/full/10.1145/3695249); Peritext / Fugue) | Field-level concurrent fill (voice + keyboard + OCR) | Full CRDT engine = V3; start with last-write + audit |
| **Apple Accessibility / AX** (platform) | Structured UI tree cheaper than OCR | Permission friction; incomplete for PDF canvas |
| **Rule-based reply-owed extract** (our Phase 3) | Cheap, explainable mail loops | Misses PDF/chat; must not be only path forever |

**Anti-patterns rejected:** always-on screenshot journal (Reyn category); GPT-Vision on every frame; generic todo for every clip; approve bypassible via raw connector call.

---

## 4 · Design principles (invariants + sensing thermodynamics)

From product locks + survey:

1. **Approve before side effects** — linear token; no replay.  
2. **Raw pixels ephemeral** — extract structure; purge frames fast.  
3. **Eyes off when idle** — connectors may stay on (“while you were out”).  
4. **Hero = close / rank**, not ask-your-journal.  
5. **Typed objects beat blobs** — mail ≠ PDF ≠ chat.  
6. **Thermodynamic honesty** — continuous OCR maximizes irreversible work on near-zero-information frames (Landauer intuition + Friston surprisal).  
7. **Stage ruthlessly** — Electron/Brain now; capability isolate later.

---

## 5 · Tier A — Runtime & capability boundary (staged)

### 5.1 Doctoral pressure vs product reality

Doctoral Assignment 1 demands a WASM/SASOS guest, lock-free MPSC rings, and host shims. **Translation for Juvantage:** treat today’s Desktop as an *untrusted host shim* and Brain as the *policy kernel for side effects*—without claiming seL4 equivalence.

```text
┌─────────────────────────────────────────────────────────┐
│ HOST (macOS) — Electron Solo / Desktop / tray           │
│  ambient AX · clip · UI · future Metal float            │
└───────────────┬───────────────────────────▲─────────────┘
                │ evidence packs / intents  │ draw / nudge
                ▼                           │
┌─────────────────────────────────────────────────────────┐
│ BRAIN (apps/api) — loop engine · objects · approve gate │
│  sys_stage_intent ≈ Proposal(pending)                   │
│  sys_request_capability ≈ user Approve                  │
│  connector adapters ONLY after token consume            │
└─────────────────────────────────────────────────────────┘
        │
        ▼ later (V3 / Teams)
┌─────────────────────────────────────────────────────────┐
│ OPTIONAL isolate (WASM worker / separate os-brain host) │
│  tighter memory boundary; same syscall story            │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Staging map

| Doctoral deliverable | Juvantage artifact | Stage |
|----------------------|--------------------|-------|
| Guest syscall ABI | Brain routes: propose / approve / execute / verify | **V1 (exists)** harden |
| Capability token | One-time `ApprovalGrant` row (nonce, proposalId, expires) | **V1.5** |
| Kernel panic on bare execute | 403 without grant; connectors refuse unsigned calls | **V1** strengthen |
| MPSC ring / WASM core | Not required for dogfood | **LATER / NEVER** as big-bang |
| Darwin Metal 60 FPS float | Keep Electron; profile battery | **LATER** if needed |
| Formal TLA+ of ring | Optional academic track | **NEVER** for ship gate |

### 5.3 Linear approve (sketch)

Inspired by Girard: side effect \(a\) requires consuming approval token:

\[
(a \otimes \mathsf{Tok}_{appr}) \multimap \mathsf{Executed}(a)
\]

**Product rule:** `executeProposal` deletes/marks grant used; second execute → 409. UI Approve mints grant; Send consumes it. This closes the “agent replayed send” failure mode at the Brain boundary (application-layer today; isolate later).

**Spark:** `SPARK-20261103-01` — ApprovalGrant table.

---

## 6 · Tier B — Episodic perception & ranking

### 6.1 Why continuous OCR fails

Most desktop frames have near-zero novel information. Always-on capture is an open thermodynamic cycle: energy, heat, privacy surface, and Landauer erasure postponed by storing gigabytes that should never have been kept ([Landauer 1961](https://doi.org/10.1147/rd.53.0183); overview in [Nature Reviews Physics](https://www.nature.com/articles/s42254-021-00400-8)).

### 6.2 Active inference translation

Friston’s free-energy view: agents minimize surprise / free energy by updating beliefs or acting ([nrn2787](https://www.nature.com/articles/nrn2787)). For Jos:

| State | Sensor policy |
|-------|----------------|
| Idle ≥90s | Eyes **OFF** (already stubbed) |
| Working, low surprisal | Ambient only (app/title/URL) |
| Surprisal > Θ | Episodic burst (AX deep / OCR) |
| User clip / “explain” | Forced burst |

**Practical surprisal proxy (V2):** Normalized Compression Distance on accessibility/title token strings ([Cilibrasi & Vitányi 2005](https://doi.org/10.1109/tit.2005.844059)):

\[
\mathrm{NCD}(x,y)=\frac{C(xy)-\min\{C(x),C(y)\}}{\max\{C(x),C(y)\}}
\]

Trigger deep capture iff \(\mathrm{NCD}(s_t,s_{t-1}) > \gamma\) (start \(\gamma \approx 0.15\)–0.25; calibrate).

### 6.3 Zero-retention purge

Target: raw framebuffer / screenshot buffers zeroized with \(t_{purge} < 250\mathrm{ms}\) after structure extract; persist only typed evidence JSON on Loop/SDO. Ambient titles already purge ≤24h—keep that; never build searchable frame archive.

### 6.4 Cost-of-Wait (CoW) ranking

\[
\Pi_{\mathrm{surface}}(L)=\Big[\alpha\!\int\lambda_{\mathrm{SLA}}+\beta\,\mathrm{Risk}\Big]\cdot e^{-\kappa\,\mathcal{H}_{\mathrm{interrupt}}}
\]

**V1:** aging ≥18h boost + band rules (exists). **V2:** fold quiet reasons (`wrong_band`) into \(\alpha\) penalties; interrupt heuristic from idle + window-switch rate.

### 6.5 Dark Room paradox (systems answer)

An entropy-minimizing agent might stay dormant forever. **Jos cannot:** external socio-economic obligations (unanswered mail, SLA, unsigned lease) impose survival cost independent of perceptual quiet. Connectors + aging timers are the “open windows” that break the dark room—eyes may sleep; **obligations do not**.

**Spark:** `SPARK-20261103-02` — NCD AX trigger before OCR.

---

## 7 · Tier C — Semantic objects & Smart Document Object

### 7.1 Taxonomy (required ≥5)

| Object type | Evidence | Propose | Execute | Verify | Retain |
|-------------|----------|---------|---------|--------|--------|
| `MailThread` | Gmail/IMAP ids, subject, snippet | Reply draft | send | thread advanced / sent id | Loop + proposal + audit |
| `ChatThread` | Messages/Slack surface or connector | Chat-shaped draft | send adapter / copy | delivered or manual confirm | same |
| `PdfPacket` / **SDO** | PDF path/hash, fields, layout | Guided fill plan | write fields / export | checksum / portal state | packet + field CRDT-lite |
| `FormSession` | Portal URL + field map | Stepper Act Moment | browser fill skill | DOM/portal confirm | session ≤14d or until done |
| `CalendarHold` | Event id / propose slot | Create/confirm event | calendar.insert | event exists | until done |
| `ClipMark` | Strong selection + app + OCR/AX | Typed by router | as inferred | as inferred | if promoted |
| `AmbientHint` | Weak app-only clip | **No draft** / deepen | — | — | ephemeral ≤24h or drop |

**Norton case:** today’s clip is an `AmbientHint` mis-promoted to HIGH `todo`. Correct behavior: refuse loop **or** store hint and ask “What should I catch?”—never mint template Approve&send.

### 7.2 Smart Document Object (bipartite)

LayoutLMv3 shows text+layout+vision unlock form understanding ([Huang et al. 2022](https://arxiv.org/abs/2204.08387)). OpenDoc failed on rendering politics; we store **semantics first**:

```text
SmartDocumentObject
  canonicalUri: loop://user/…/riverside-apt
  spatial:      boxes / page / reading order   (ephemeral or derived)
  semanticAst:  fields[{id, type, value, required, status}]
  evidence:     pdfHash, sourceApp, ocrConf
  sync:         fieldLWW or CRDT map (V3)
  gate:         ApprovalGrant required for writeField/submit
```

**V2 path:** PDF text layer → field candidates → Act Moment stepper (matches waitlist Riverside mock).  
**V2.5:** Apple Vision / LayoutLM-class model on episodic page images only.  
**V3:** CRDT field map for voice + keyboard + phone ([Kleppmann CRDT line](https://dl.acm.org/doi/full/10.1145/3695249)).

### 7.3 Canonical lineage

Deterministic handle from `(originUri, actor, schemaType, sha256(lineage))` → `loop://…` to merge Gmail stall + portal form + lease.pdf into one workspace object (waitlist “Riverside apt”). Collision target cryptographic; practical V2 uses stable `sourceRef` + merge UI.

**Spark:** `SPARK-20261103-03` — objectType on Loop + AmbientHint refuse.

---

## 8 · Modality router & close paths

### 8.1 Router (decision order)

```text
1. Connector hit (gmail thread / calendar event)? → MailThread / CalendarHold
2. Frontmost is PDF viewer OR url ends .pdf OR bundle is Preview/Acrobat?
     → extract text/fields → PdfPacket (conf ≥ θ) else deepen OCR once
3. Messages / Slack / ChatGPT-looking title patterns + selection?
     → ChatThread
4. Clip with clipboard/selection length ≥ L or AX focused value?
     → ClipMark → re-enter 1–3 with richer evidence
5. Clip with only app name OR conf < θ
     → AmbientHint: NO loop OR soft ask — NEVER high todo template
6. Else AmbientHint
```

**Confidence:** start rule-based scores; log `routerConf`; Quiet `wrong_band` / new `wrong_object` decreases prior for that (app → type) pair.

### 8.2 Close paths (summary)

| Object | Propose UX | Approve | Execute | Verify |
|--------|------------|---------|---------|--------|
| Mail | Reply editor | Token | Gmail send | sent/verify |
| Chat | Short reply | Token | adapter/copy | user confirm |
| PDF/Form | Guided fill / voice fill | Token per submit or per field-batch | write/export | field complete |
| Calendar | Event card | Token | insert | event id |
| Hint | Deepen / dismiss | — | — | — |

Approve & send button **must not appear** on AmbientHint or incomplete PdfPacket without fields.

---

## 9 · Voice → plan · Approve → run · Mac + iPhone

Public waitlist ([juvantagecloud.com/#os-waitlist](https://juvantagecloud.com/#os-waitlist)): *what stalls gets closed; you approve first; Mac · iPhone same loop.* CONCEPT cards (Voice → plan) are **doors**, not a second Brain.

| Door | Maps to | Stage |
|------|---------|-------|
| Desktop Solo/Desktop | Primary Personal V1 | **Now** |
| Fill by voice | Propose channel into FormSession/SDO fields | **V2** (UX exists in pitch) |
| Voice → day plan | Speech → structured Loop set → approve batch | **LATER** |
| iPhone agent | Same objects; push propose; approve on device | **LATER** after Brain hosted |
| JUST Scan → KEEP → Act | Capture/vault feed PdfPacket into OS | **LATER** suite bridge |

Cross-device implies CRDT-lite or server-authoritative field state on Brain—not peer Electron sync first.

---

## 10 · Privacy, retention, purge

| Data | Retain | Purge |
|------|--------|-------|
| Raw frames / OCR bitmaps | Volatile only | <250ms target after extract |
| Ambient app/title/URL | ≤24h | existing job |
| Loops + proposals + audit | Until done/dismissed + policy | user wipe |
| ApprovalGrant | Until consume/expiry | delete on use |
| SDO semantic fields | With loop | user wipe |
| Searchable life journal | **NEVER** | — |

Cloud sees **context packs** you trigger + connector scopes—not a frame DVR. Say that honestly in privacy FAQ.

---

## 11 · Roadmap V1→V3 + evaluation

### 11.1 Stage table

| Stage | Ship | Gate |
|-------|------|------|
| **V1c dogfood** | Phase 6 metrics + quiet reasons (done tooling) | 14-day use |
| **V1.5** | Weak-clip refuse; `objectType`; ApprovalGrant; hide Approve on hints | Wrong-object rate ↓ |
| **V2** | NCD/AX episodic OCR; Mail/PDF router; Act Moment SDO v0; CoW uses quiet | Top-1 useful draft |
| **V3** | Lineage merge; CRDT fields; Skills; Teams eyes-off; phone door | Partner metrics |
| **NEVER** | Always-on journal; send without approve; employee screen farm | — |

### 11.2 Eval (Phase 6 aligned)

| Metric | Definition | Source |
|--------|------------|--------|
| Clear rate | done / (done+dismissed) | `GET /os/metrics` |
| Accept rate | verify / (verify+dismiss) | metrics |
| Edit rate | edit / propose | metrics |
| Quiet wrong_band | shouldn’t have surfaced | quietReasons |
| **Wrong object** *(add)* | dismiss reason `wrong_object` | extend Phase 6 |
| Time-to-useful-draft | propose→edit-complete | audit timestamps |
| Weak-clip mint rate | AmbientHint promoted | router logs |

**Kill:** if after V1.5 users still see Norton-class HIGH todos weekly → freeze features; fix router only.

---

## 12 · Risks & open problems

| Risk | Mitigation |
|------|------------|
| AX permissions denied | Connector+clip strong path; graceful degrade |
| LayoutLM cost/privacy | On-device Vision first; cloud pack opt-in |
| OpenDoc trap (layout wars) | Semantics-first SDO; render is host’s job |
| WASM capability gap (doctoral unsolved) | Don’t block ship; harden Brain gate first |
| Dark room / over-quiet | Obligation timers + connector ears |
| Fake smartness | Prefer refuse over wrong draft |

---

## 13 · Recommendations — next 2-week slice (after dogfood days)

1. **Refuse weak clips** — if no selection/clipboard and only app name → toast “Nothing specific to catch” + optional AmbientHint; no HIGH loop.  
2. **Add `objectType` + `routerConf`** on Loop (default `unknown` / `mail` from extract).  
3. **ApprovalGrant** one-time token on approve-send path.  
4. **UI:** Approve & send only if objectType ∈ {mail, chat, calendar, pdf_ready}.  
5. **Quiet reason `wrong_object`** + metrics field.  
6. **Ticket backlog (implied):** PDF text-layer probe; Messages bundle map; NCD ambient diff prototype; SDO schema migration; hosted Brain for iPhone later.

---

## 14 · Spark appendix (filed same session)

| ID | Tier | Stage | Idea | Filed |
|----|------|-------|------|-------|
| SPARK-20261103-01 | A | V1.5 | ApprovalGrant consumable token | Architecture + SPARKS |
| SPARK-20261103-02 | B | V2 | NCD on AX/title before OCR | Architecture + SPARKS |
| SPARK-20261103-03 | C | V1.5 | AmbientHint vs typed objects; refuse Norton-class | Flagship + SPARKS |
| SPARK-20261103-04 | C | V2 | SDO bipartite semantic-first (OpenDoc lesson) | Architecture |
| SPARK-20261103-05 | B/C | V2 | Quiet wrong_object trains router | Roadmap metrics |
| SPARK-20261103-06 | — | LATER | Voice/iPhone as doors not second Brain | Flagship IN/LATER |

---

## 15 · References

1. Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*, 11, 127–138. https://www.nature.com/articles/nrn2787  
2. Friston, K., et al. Active Inference: A Process Theory. https://www.fil.ion.ucl.ac.uk/~karl/Active%20Inference%20A%20Process%20Theory.pdf  
3. Landauer, R. (1961). Irreversibility and heat generation in the computing process. *IBM Journal of Research and Development*, 5(3), 183–191. https://doi.org/10.1147/rd.53.0183  
4. Bernardo, et al. (2021). 60 years of Landauer’s principle. *Nature Reviews Physics*. https://www.nature.com/articles/s42254-021-00400-8  
5. Cilibrasi, R., & Vitányi, P. (2005). Clustering by compression. *IEEE Transactions on Information Theory*, 51(4). https://doi.org/10.1109/tit.2005.844059  
6. Huang, Y., Lv, T., Cui, L., Lu, Y., & Wei, F. (2022). LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking. *ACM Multimedia*. https://arxiv.org/abs/2204.08387  
7. Girard, J.-Y. (1987). Linear logic. *Theoretical Computer Science*, 50, 1–102. https://doi.org/10.1016/0304-3975(87)90045-4  
8. Garg, D., Bauer, L., Bowers, K., Pfenning, F., & Reiter, M. A linear logic of authorization and knowledge. http://www.cs.cmu.edu/~fp/papers/esorics06.pdf  
9. Klein, G., et al. (2009). seL4: Formal verification of an OS kernel. *SOSP*. https://dl.acm.org/doi/10.1145/1629575.1629596  
10. Almeida, et al. Approaches to Conflict-free Replicated Data Types. *ACM Computing Surveys*. https://dl.acm.org/doi/full/10.1145/3695249  
11. Kleppmann, M., et al. Peritext / Fugue CRDT line — collaborative editing intent. https://martin.kleppmann.com/  
12. Juvantage OS internal: `JUVANTAGE_OS_SCOPE.md`, `OS_ARCHITECTURE.md`, `FLAGSHIP_STAGED_PLAN.md`, `OS_BUILD_ROADMAP.md`; waitlist https://juvantagecloud.com/#os-waitlist  

---

## Appendix A — Doctoral → Juvantage quick map

| Tier | Level-4 ambition | Level-3 ship path |
|------|------------------|-------------------|
| A | Formal non-bypassable capability across WASM host | Brain ApprovalGrant + 403 execute |
| B | Coupled Markov blankets OS↔human | NCD trigger + idle eyes off + CoW |
| C | Resolve OpenDoc semantic gap | SDO fields + lineage + guided fill |

**Pass claim:** product RQ answered with taxonomy, router, staging, tickets, Norton honesty.  
**Distinction claim (applied):** Tier B dark-room answer + Tier C SDO/OpenDoc analysis + Tier A linear approve sketch with executable V1.5 path.

---

*End of JV-OS-RP-01 paper.*
