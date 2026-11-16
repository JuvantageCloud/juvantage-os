# Machine check — Rocq models

**Date:** 2026-11-13 (Pass 3)  
**Tool:** Rocq 9.3.0, OCaml 5.5.2 (`coqc`, `rocqchk`)  
**Assumptions:** `rocq repl -q -batch -l PrintAssumptions.v` printed **Closed under the global context** for every theorem named below (56 theorems). No `Axiom`. No `Admitted`.

```bash
cd docs/research/doctoral/artifacts/coq
coqc WasmJS.v && coqc ProcIso.v && coqc SeniMachine.v
coqc DarkRoom.v && coqc OpenDoc.v && coqc MpscRing.v
coqc MemoryNI.v
coqc PoissonDarkRoom.v && coqc SdoTerminal.v && coqc SeniIdealMac.v
rocqchk WasmJS && rocqchk ProcIso && rocqchk SeniMachine
rocqchk DarkRoom && rocqchk OpenDoc && rocqchk MpscRing && rocqchk MemoryNI
rocqchk PoissonDarkRoom && rocqchk SdoTerminal && rocqchk SeniIdealMac
```

Scores are how far the **claim** is, from 1 to 100, after this check. A finished proof of a small model stays under 85. A real browser, HMAC, Poisson integral on \(\mathbb{R}\), or kernel is a separate line and does not inherit the model score.

| Claim | Was | Now | What the checker actually has |
|---|---:|---:|---|
| **A.1** buffer read breaks conf-NI; a blind host schedule does not | 62 | **78** | `WasmJS.v`: every 1-blind host schedule agrees on all secrets (`blind_schedule_ni`); `[Read 1]` does not (`read1_not_ni`); a low export agrees (`export_low_agrees`). |
| A.1 as a theorem about Chromium / the JS API | 40 | **40** | The identifier `Read` is not `Uint8Array(memory.buffer)`. |
| **A.4** compliant IPC ignores the secret | 44 | **70** | `ProcIso.v`: every program with no `EmitSecret`, including concatenations (`compliant_ni`, `compliant_concat_ni`). `seal_hides_secret` keeps the payload in the guest message and out of the observation. `leak_not_ni` is the negative control. |
| A.4 as macOS or Electron isolation | 28 | **28** | Address spaces are not in the file. |
| **SENI** grant machine | 36 | **71** | `SeniMachine.v`: no mint in the adversary language ⇒ 0 effects; from 0 effects, at most one; second commit adds nothing; wrong mac rejected; past `exp` rejected; concrete stolen token ends at 1 effect and credit 0. |
| SENI including EUF-CMA of HMAC | 36 | **48** | Legacy `mac = key + gid + nonce` equality — collisions exist. Superseded in strength by ideal MAC below. |
| **SENI ideal MAC (symbolic EUF)** | 48 | **74** | `SeniIdealMac.v`: tag = \((key,gid,nonce)\); `verify_implies_sign`; injective; wrong-key rejected; SENI machine under ideal MAC; forge with wrong key cannot commit. |
| HMAC-SHA256 EUF-CMA (PPT) | 36 | **36** | Not a reduction to a standard assumption. |
| **Dark Room** occupation ordering | 40 | **76** | `DarkRoom.v`: per-tick lists, `nth` pinned to “pay L for `gap` ticks, then 0”; one cycle is strict; some finite `n` beats any sampling penalty `C`. |
| **Poisson integral (discrete B.1)** | 40 | **72** | `PoissonDarkRoom.v`: geometric sum = oneshot \(L(2^T-1)\); remainder identity; occupation dormancy beats ears + \(C\); eyes-off extrinsic invariant. |
| Poisson integral on \(\mathbb{R}\) / Friston EFE | 40 | **40** | Not checked. |
| **B.2** eyes-off, same ears | — | **62** | `eyes_off_given_same_ears` / `eyes_off_extrinsic_invariant`. |
| **III.1** no layout-only close | 50 | **84** | `OpenDoc.v`: for every `decide`, `decide (box, ink)` cannot match the obligation. Emergency and Tenant share geometry and differ on the obligation. |
| **C.1** required-field set | 22 | **68** | If two lists accept the same valuations, they contain the same fields (`same_required_set`). Order and duplicates are not unique. |
| Close ignores geometry | — | **64** | `close_ignores_box`, `sdo_separates_layout_twins`. |
| Categorical “SDO is terminal” | 22 | **70** | `SdoTerminal.v`: exists/unique morphisms into SDO (`Lay:=unit`); factors through forget; layout product ignores Lay. |
| Full OpenDoc/PDF category | 22 | **30** | Not formalized. |
| **MPSC safety** | 18 | **78** | `MpscRing.v`: every finite trace from `(0,0)` keeps `head <= tail` and `gap <= N` (`no_overwrite`). |
| MPSC try (returns full or a slot) | 18 | **72** | `try_occupy_decides`, `occupy_enabled`. |
| Blocking enqueue is wait-free | 18 | **8** | `blocking_enqueue_misses_every_bound`: for every bound `n`, `n` retries on a full ring return `None`. The positive claim is false. |
| Positive conf-NI of Chromium or V8 | 0 | **0** | Not attempted. |

## What each file is

| File | Theorems |
|---|---|
| `WasmJS.v` | Operational host schedules over a two-address memory. |
| `ProcIso.v` | Instruction lists. Compliant means no plaintext `EmitSecret`. |
| `SeniMachine.v` | Commands are `Noise`, `Advance`, `Submit`. Mint is outside the adversary. Legacy sum-MAC. |
| `SeniIdealMac.v` | **Pass 3.** Ideal tag MAC + SENI machine (symbolic EUF). |
| `DarkRoom.v` | Renewal cycles as lists of per-tick costs. |
| `PoissonDarkRoom.v` | **Pass 3.** Discrete Poisson oneshot integral + occupation crossover. |
| `OpenDoc.v` | One obligation, layout `(box, ink)`, roles Tenant / Emergency. Field identifiers are `nat`. |
| `SdoTerminal.v` | **Pass 3.** CloseSys category; SDO terminal among layout objects. |
| `MpscRing.v` | Two indices. Not a byte array, not a CAS memory model. |
| `MemoryNI.v` | Earlier, smaller A.1 / A.4 / grant lemmas. Still checked. Superseded in strength by the files above. |

## Still outside the checker

- Chromium, V8, Wasmtime, Electron, macOS address spaces.
- HMAC-SHA256 asymptotic EUF-CMA.
- Real-analysis Poisson / Friston free-energy minimization.
- Full PDF/OpenDoc bicategory; CRDT merge uniqueness; lineage URI.
- Isabelle. No `.thy` was checked.

## Pass 3 write-up

[`../../DISTINCTION_PASS3.md`](../../DISTINCTION_PASS3.md)
