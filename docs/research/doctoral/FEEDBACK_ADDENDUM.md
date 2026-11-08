# Doctoral deliverable — evaluator feedback addendum

**Date:** 2026-11-04  
**Context:** External-style evaluation (~92.5% comprehensive pass) on dossiers + Rocq models. This file records **gaps the grade did not emphasize** and **how research maps to the product roadmap**.

**Authoritative proof scores:** [`artifacts/coq/MACHINE_CHECK.md`](./artifacts/coq/MACHINE_CHECK.md) (not Ontario % alone).

---

## What the evaluation got right

- Proof work should **stop**; remaining value is **code + daily use**.
- **Application** capped by **live Gmail send** and **14-day dogfood** not yet run.
- Core contributions are **reductions + impossibility** (A.1, SENI, Dark Room occupation, III.1), not Chromium verification.

---

## What to keep in mind (not fully in the grade)

### Two score systems

| System | Use |
|--------|-----|
| Ontario-style % (e.g. 92.5) | Narrative / rubric |
| 1–100 per claim in `MACHINE_CHECK.md` | Honest mechanical scope |

Assignment markdown still contains **Thinking 4 (A+++)** in places; [`README.md`](./README.md) says checker scores override. Avoid quoting dossier self-scores to investors or committees without the addendum.

### TLA+ is not checked

`JuvMpscRing.tla`, `SENI.tla`, `MemoryNI.tla` are **spec sketches**. Only `.v` files were `coqc`’d. Label **spec-only** until TLC runs on a bounded model.

### The product edge is the **quartet**, not one theorem

1. **A.1** — no execution secrets in renderer WASM embedding.  
2. **SENI** — no connector effect without consumed grant.  
3. **Dark Room (B.1/B.2)** — ears on, eyes off when idle.  
4. **III.1** — close from typed semantics, not layout alone.

Public positioning: *obligation closer with linear approve*, not *screen memory* or *autonomous agent*.

### Negative results = shippable claims

- WasmJS conf-NI impossible → Brain holds mint/execute.  
- Full ring + blocking retry not wait-free → try + backpressure in ring design.  
- Layout insufficiency → refuse weak clips; SDO authority on fields (V2).

### UI parity

Desktop disables Approve for non-closable `objectType`; **Quick sheet did not** at time of addendum—see [`../../OS_OPERATIONAL_REVIEW.md`](../../OS_OPERATIONAL_REVIEW.md) P0.2.

### Metrics during dogfood

Until **live send**, metrics measure **draft acceptance**, not **verified close**. Redefine success after P0.1 (message id verify).

### Tier 2 not in Rocq

Landauer, NCD threshold, purge SLA—strong in Assignment 2 prose and `episodic_trigger.py`, only **discrete Dark Room** in `DarkRoom.v`. NCD remains **hypothesis** until logged on founder desktop.

### Tier 3 partial in Rocq

`OpenDoc.v`: III.1 + required-field set. **Not** mechanized: functor F, CRDT uniqueness, lineage URI, “terminal SDO” category sentence.

---

## Research → roadmap (living table)

| Research output | Shipped (V1.5) | Next (roadmap) |
|-----------------|----------------|----------------|
| SENI / ApprovalGrant | ✅ Brain consume-once | Quick sheet UI parity |
| Thm III.1 / weak clip | ✅ refuse + wrong_object | — |
| objectType router | ✅ `osModality` | PDF/form paths (V2) |
| A.1 / TCB | ✅ doc [`OS_TCB.md`](../../OS_TCB.md) | No secrets in renderer |
| Dark Room policy | ✅ presence idle | NCD stub (V2a) |
| B.1 discrete crossover | ✅ Coq only | Empirical dogfood |
| SDO bipartite | Prose + paper | V2 Smart Document Object |
| SPARKS | Index in [`../SPARKS.md`](../SPARKS.md) | File winners into FLAGSHIP rows |

---

## Recommended stop / start

| Stop | Start |
|------|-------|
| New Rocq / Isabelle unless a release gate requires it | P0 operational review ([`OS_OPERATIONAL_REVIEW.md`](../../OS_OPERATIONAL_REVIEW.md)) |
| Expanding A+++ language in dossiers | 14-day journal + live send |
| Claiming “machine verified OS” | “35 theorems, explicit non-claims” + TCB |

---

*Companion: [`../../OS_BUILD_ROADMAP.md`](../../OS_BUILD_ROADMAP.md) Phase 6, [`../../FLAGSHIP_STAGED_PLAN.md`](../../FLAGSHIP_STAGED_PLAN.md) §5 gates.*
