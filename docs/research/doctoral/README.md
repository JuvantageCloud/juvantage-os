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
- Pass 3 (hard leftovers → Rocq): [`DISTINCTION_PASS3.md`](./DISTINCTION_PASS3.md)  
  - Poisson discrete integral + occupation crossover (`PoissonDarkRoom.v`)  
  - SDO terminal property (`SdoTerminal.v`)  
  - Ideal-MAC SENI / symbolic EUF (`SeniIdealMac.v`)  
- **Machine-checked models (Rocq 9.3.0, no axioms):** [`artifacts/coq/`](./artifacts/coq/) — prior seven plus Pass 3 three. Log and scores: [`artifacts/coq/MACHINE_CHECK.md`](./artifacts/coq/MACHINE_CHECK.md). This does **not** verify Chromium, HMAC-SHA256, or macOS. Isabelle was not run.

**Unified product paper:** [`../JV-OS-RP-01_PAPER.md`](../JV-OS-RP-01_PAPER.md)  
**Sparks:** [`../SPARKS.md`](../SPARKS.md)  
**Machine-checkable artifacts:** [`artifacts/`](./artifacts/)

### Pass / Distinction claim

The three assignment dossiers are written. The machine-checked portion is the Rocq models in `artifacts/coq/`, scored in `MACHINE_CHECK.md` (56 closed theorems after Pass 3). Chromium, HMAC-SHA256 (PPT), and real-analysis Poisson remain outside that portion. Application L4 hardware benches remain engineering validation.
