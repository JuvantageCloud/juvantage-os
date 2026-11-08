# Three-Tier Doctoral Research Dossier — COMPLETE

**Source rubric:** *Three-Tier Doctoral Research Specification & Rubrics* (CS-9901 / PHYS-9820)  
**Product binding:** Juvantage OS (`JV-OS-RP-01` + plan docs)  
**Completed:** 2026-11-03

| # | Assignment | File | Ontario self-score (K/T/C/A) |
|---|------------|------|------------------------------|
| **1** | Kernel & Runtime (SASOS/WASM, MPSC, ABI, shims, TLA+/Coq) | [`ASSIGNMENT_1_KERNEL_RUNTIME.md`](./ASSIGNMENT_1_KERNEL_RUNTIME.md) | 4 / **4 A+++** / 4 / 3–4 |
| **2** | Perception Physics (Landauer, FEP, NCD, purge, CoW, Dark Room) | [`ASSIGNMENT_2_PERCEPTION_PHYSICS.md`](./ASSIGNMENT_2_PERCEPTION_PHYSICS.md) | 4 / **4 A+++** / 4 / 3 |
| **3** | Semantic Objects (functor, SDO, lineage, linear ⊸, trap, CRDT) | [`ASSIGNMENT_3_SEMANTIC_OBJECTS.md`](./ASSIGNMENT_3_SEMANTIC_OBJECTS.md) | 4 / **4 A+++** / 4 / 3–4 |

The 1–100 scores that match the checker live in [`artifacts/coq/MACHINE_CHECK.md`](./artifacts/coq/MACHINE_CHECK.md). Those override the A+++ shorthand above. Evaluator addendum + research→roadmap: [`FEEDBACK_ADDENDUM.md`](./FEEDBACK_ADDENDUM.md).

**Open-gap solutions:**  
- Pass 1: [`DISTINCTION_OPEN_GAPS_PROOFS.md`](./DISTINCTION_OPEN_GAPS_PROOFS.md) — SENI · Dark Room · SDO  
- Pass 2 (theories→proofs continued): [`DISTINCTION_MEMORY_NI_AND_STRENGTHENED_PROOFS.md`](./DISTINCTION_MEMORY_NI_AND_STRENGTHENED_PROOFS.md)  
  - Gap I memory: **Thm A.1 impossibility (browser WASM)** + **Thm A.4 process-isolation NI**  
  - Gap II: **Thm B.1–B.2 quantitative EFE**  
  - Gap III: **Thm C.1–C.2 universal SDO**  
  - Artifacts: `MemoryNI.tla`, `DarkRoomEFE.md`  
- **Machine-checked models (Rocq 9.3.0, no axioms):** [`artifacts/coq/`](./artifacts/coq/) — `MemoryNI.v`, `WasmJS.v`, `ProcIso.v`, `SeniMachine.v`, `DarkRoom.v`, `OpenDoc.v`, `MpscRing.v`. Log and scores: [`artifacts/coq/MACHINE_CHECK.md`](./artifacts/coq/MACHINE_CHECK.md). This does **not** verify Chromium, HMAC, or macOS. Isabelle was not run.

**Unified product paper:** [`../JV-OS-RP-01_PAPER.md`](../JV-OS-RP-01_PAPER.md)  
**Sparks:** [`../SPARKS.md`](../SPARKS.md)  
**Machine-checkable artifacts:** [`artifacts/`](./artifacts/)

### Pass / Distinction claim

The three assignment dossiers are written. The machine-checked portion is the Rocq models in `artifacts/coq/`, scored in `MACHINE_CHECK.md`. Chromium, HMAC, and the Poisson integral are not in that portion. Application L4 hardware benches remain engineering validation.
