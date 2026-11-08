# Assignment — Research Paper & Architecture Dossier

**Assignment code:** `JV-OS-RP-01` (+ doctoral extension `CS-9901` matrix)  
**Title:** *Context objects, modality-aware close, and a staged systems architecture for Juvantage OS*  
**Product north star (locked):** catch unfinished work and help finish it — Personal now, Teams later.  
**Public concept (waitlist):** [juvantagecloud.com/#os-waitlist](https://juvantagecloud.com/#os-waitlist) — *Voice → plan · Approve → run · Mac + iPhone*  
**Length of this brief:** ~2 pages core + addenda  
**Status:** **COMPLETED** 2026-11-03 — product paper + **all 3 doctoral assignments** + sparks.  
**Deliverables:**  
- [`research/JV-OS-RP-01_PAPER.md`](./research/JV-OS-RP-01_PAPER.md)  
- [`research/doctoral/`](./research/doctoral/) — Assignment 1 Kernel · 2 Perception · 3 Semantic Objects  
- [`research/SPARKS.md`](./research/SPARKS.md)

---

## Sources the researcher MUST use

| Layer | Use as |
|-------|--------|
| `docs/JUVANTAGE_OS_SCOPE.md` | Job, ICP, in/out, GTM |
| `docs/OS_ARCHITECTURE.md` | Eyes vs Reyn, episodic capture, Brain, privacy |
| `docs/FLAGSHIP_STAGED_PLAN.md` | V1/V2/V3 gates, cost, kill criteria |
| `docs/OS_BUILD_ROADMAP.md` | What already shipped (Phases 0–6 tooling) |
| `docs/OS_PRODUCT.md` / `OS_UI_MAP.md` | Solo sheet ↔ Desktop Act Moment |
| Keynote Pitch + Product Plan | Paper Ops, guided fill, approve navy gate |
| [OS waitlist](https://juvantagecloud.com/#os-waitlist) | Voice→plan, human gate, cross-device daemon (concept / later) |
| Attached PDF: *Three-Tier Doctoral Research Specification & Rubrics* | Formal bar for kernel · perception · semantic objects |
| Dogfood evidence | “Clipped while in Norton” = current dumb fallback |

**Rule:** Plan/MD docs + waitlist vision set *what we are building*. The doctoral PDF sets *how rigorous the architecture thinking must be*. Do not replace the product with a pure research OS — **translate** doctoral ideas into staged, shippable Juvantage specs.

---

## 0 · The product gap (why this exists)

Today **⌘⇧L** often yields **“Clipped while in Norton”** + a **template todo draft**. That is ambient app-name fallback — not intelligence.

| Surface | Should become | Propose path |
|---------|---------------|--------------|
| Gmail / mail connector | Reply-owed object | Draft → approve → send → verify |
| Messages / chat | Chat obligation object | Chat-shaped draft / adapter |
| PDF / form / lease / portal | **Smart document / packet object** | Guided fill → approve → write |
| Strong clip (selection + OCR/AX) | Typed mark with evidence | Modality-routed draft |
| Weak clip (app name only) | Hint or refuse | Do **not** mint HIGH fake todos |

Waitlist concept adds a later skin: **speak the day → structured plan → approve → keep loops moving on Mac + iPhone** — same Brain, same approve gate, different doors.

---

## 1 · Primary research question

> How should Juvantage OS detect **modality**, bind work to durable **typed context objects**, and run **propose → approve → execute → verify** — using ambient, connectors, AX/OCR, voice, and optional LLM — while staying episodic, privacy-honest, and staged (V1 dogfood → V2 perception → V3 objects/Skills/cross-device)?

---

## 2 · Three-tier doctoral matrix (MUST map into the paper)

From the attached *Three-Tier Doctoral Research Specification* — treat as **architecture pressure**, not a mandate to rewrite Electron tomorrow.

| Tier | Doctoral theme | Juvantage translation the paper MUST produce |
|------|----------------|-----------------------------------------------|
| **A · Kernel & runtime** | Guest micro-core, SASOS/WASM, SFI, lock-free rings, host shims, capability syscalls | Where Brain vs Desktop boundary should harden; approve as **capability trap**; what stays Electron vs future isolate; staging (now / later / never) |
| **B · Perception physics** | Landauer cost, active inference / free energy, episodic trigger, zero-retention purge, cost-of-wait ranking | Formalize **eyes off / episodic burst**; NCD or AX-diff triggers; purge raw frames; link to Phase 6 quiet + `/os/metrics`; solve “dark room” via **external obligations** (reply-owed / SLA) |
| **C · Semantic objects** | Typed ASTs, functors, linear approval tokens, Smart Document Object, CRDT, lineage URIs | Mail/chat/PDF **object taxonomy**; bipartite PDF layout+semantics; **linear approve** (no replay send); canonical `loop://…` lineage; kill generic “draft blob” |

**Paper must explicitly map:** doctoral deliverable → Juvantage artifact → V1 / V2 / V3 / NEVER.

Ontario-style bar (Knowledge · Thinking · Communication · Application) applies inside each tier. **Product pass** still requires shippable staging; **distinction** requires formal clarity + diagrams + non-bypassable approve story.

---

## 3 · Required paper contents

1. Problem + Norton failure + waitlist concept (what is CONCEPT vs WAITLIST vs shipping now).  
2. Technology survey (≥8 sources across OCR/AX, document AI, mail classifiers, CRDT/capability, optional FEP/active inference). Steal / reject / why.  
3. Context-object taxonomy + Smart Document Object sketch (lease/form).  
4. Modality router (confidence, no-loop rules).  
5. Close paths per modality + **hardware/UX approval trap** (approve token consumed once).  
6. Episodic perception design (triggers, purge, energy/privacy).  
7. Runtime boundary sketch (Desktop host · Brain · future isolate) — honest about today’s Electron.  
8. Cross-device (Mac + iPhone) + voice→plan as **same objects, later doors**.  
9. Staged roadmap + kill criteria + Phase 6 metrics.  
10. **Spark log appendix** — every bright idea filed (see §8).  
11. References.

---

## 4 · Constraints (non-negotiable)

- No Reyn-class always-on searchable screen journal.  
- No send/write without approve (linear token story).  
- Episodic deep capture > continuous OCR.  
- Connectors = hands/ears; eyes = ambient + episodic.  
- Solutions must start from **current** stack (`apps/desktop` + `apps/api`); doctoral kernel is a **target architecture**, not a big-bang rewrite.  
- Waitlist voice / iPhone = **later doors**, not Phase 6 blockers.

---

## 5 · Outline

```text
1. Abstract
2. Introduction (Norton + waitlist pillars)
3. Related work / tech survey
4. Design principles (OS invariants + thermodynamics of sensing)
5. Tier A — Runtime & capability boundary (staged)
6. Tier B — Episodic perception & ranking
7. Tier C — Semantic objects & Smart Document Object
8. Modality router + close paths
9. Voice → plan · Approve → run · Mac+iPhone (same Brain)
10. Privacy, retention, purge
11. Roadmap V1→V3 + eval (Phase 6 metrics)
12. Risks, open problems (OpenDoc gap, WASM capability, dark room)
13. Recommendations (next 2-week slice)
14. Spark → spec filings (appendix)
15. References
```

---

## 6 · Rubric

### Product / engineering pass

| Criterion | Pass |
|-----------|------|
| RQ answered with modality → object → close path | Required |
| Taxonomy ≥5 types + retention | Required |
| Router + no-loop rules | Required |
| Staging aligned to FLAGSHIP; invariants intact | Required |
| Explains Norton vs target | Required |
| ≥5 actionable tickets | Required |

### High achieving

| Criterion | Bar |
|-----------|-----|
| Three tiers mapped with diagrams | Required for distinction |
| Smart Document Object credible (not vapor) | Required |
| Approve as linear / non-replayable capability | Required |
| Episodic trigger + purge story with numbers | Required |
| Waitlist voice/cross-device without derailing V1 | Required |
| Eval tied to quiet reasons + clear/accept/edit rates | Required |
| Spark filings landed in plan docs | Required |

### Doctoral distinction (from PDF, applied)

Level 4 thinking on **at least one** tier (formal trigger, linear approve proof sketch, or SDO/lineage design) **and** Level 3+ application staging that a builder can execute. Pure theory with no Juvantage path = fail. Wrapper-feature list with no types/approve physics = fail.

### Fail

- GPT-Vision-always / always-on OCR  
- Generic task manager  
- Bypassable approve  
- Ignoring plan docs or waitlist as “same Brain, later doors”

---

## 7 · Definition of done (eventual paper)

A reader of only the Norton screenshot + waitlist card can state: (a) why that title exists today, (b) what typed object it should have been, (c) how mail vs PDF differ on purpose, (d) how Voice→plan / iPhone fit later without breaking approve, (e) which spark filings changed scope/architecture.

---

## 8 · Spark protocol (mandatory during research)

When a bright idea appears (“ahh — OS could…” / “this theory solves…”):

1. Write it **immediately** into the running paper’s Spark appendix (title + 3–8 sentences + tier A/B/C).  
2. File a durable note into the right product doc the **same session**:  
   - Architecture / sensing / objects → `docs/OS_ARCHITECTURE.md` (short § or bullet under existing heading)  
   - Scope / skin / later door → `docs/JUVANTAGE_OS_SCOPE.md` or `FLAGSHIP_STAGED_PLAN.md` IN/LATER  
   - Build order → `docs/OS_BUILD_ROADMAP.md` or new `docs/research/SPARKS.md` index  
3. Tag each spark: `SPARK-YYYYMMDD-##` · stage (V1/V2/V3/LATER/NEVER) · confidence.  
4. Do **not** wait until the paper is “done” — sparks are proportionate and ongoing.

Create `docs/research/SPARKS.md` as the index when the paper task starts.

---

## 9 · How this gets executed

1. Founder accepts this expanded brief.  
2. Founder feeds **this document** (+ PDF if needed) back as the task.  
3. Agent writes `docs/research/JV-OS-RP-01_PAPER.md` and files sparks into plan docs as they arise.  
4. After accept: fold stable recommendations into architecture/roadmap.

---

## 10 · Starter clue (orientation only)

**Today:** app name (+ clipboard) → `createClipLoop` → template todo.  
**Target:** evidence pack → modality → **typed object** → skill draft **or** refuse/deepen.  
**Waitlist:** voice and phone are **inputs/doors** into the same object+approve engine — not a second product.

---

*End of assignment. Paper writing starts only when this brief is re-issued as the work order.*
