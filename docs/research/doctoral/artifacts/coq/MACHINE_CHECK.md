# Machine check — Rocq models

**Date:** 2026-11-04  
**Tool:** Rocq 9.3.0, OCaml 5.5.2 (`coqc`, `rocqchk`)  
**Assumptions:** `rocq repl -q -batch -l PrintAssumptions.v` printed **Closed under the global context** for every theorem named below (35 theorems). No `Axiom`. No `Admitted`.

```bash
cd docs/research/doctoral/artifacts/coq
coqc WasmJS.v && coqc ProcIso.v && coqc SeniMachine.v
coqc DarkRoom.v && coqc OpenDoc.v && coqc MpscRing.v
coqc MemoryNI.v
rocqchk WasmJS && rocqchk ProcIso && rocqchk SeniMachine
rocqchk DarkRoom && rocqchk OpenDoc && rocqchk MpscRing && rocqchk MemoryNI
```

Scores are how far the **claim** is, from 1 to 100, after this check. A finished proof of a small model stays under 85. A real browser, HMAC, Poisson integral, or kernel is a separate line and does not inherit the model score.

| Claim | Was | Now | What the checker actually has |
|---|---:|---:|---|
| **A.1** buffer read breaks conf-NI; a blind host schedule does not | 62 | **78** | `WasmJS.v`: every 1-blind host schedule agrees on all secrets (`blind_schedule_ni`); `[Read 1]` does not (`read1_not_ni`); a low export agrees (`export_low_agrees`). |
| A.1 as a theorem about Chromium / the JS API | 40 | **40** | The identifier `Read` is not `Uint8Array(memory.buffer)`. |
| **A.4** compliant IPC ignores the secret | 44 | **70** | `ProcIso.v`: every program with no `EmitSecret`, including concatenations (`compliant_ni`, `compliant_concat_ni`). `seal_hides_secret` keeps the payload in the guest message and out of the observation. `leak_not_ni` is the negative control. |
| A.4 as macOS or Electron isolation | 28 | **28** | Address spaces are not in the file. |
| **SENI** grant machine | 36 | **71** | `SeniMachine.v`: no mint in the adversary language ⇒ 0 effects; from 0 effects, at most one; second commit adds nothing; wrong mac rejected; past `exp` rejected; concrete stolen token ends at 1 effect and credit 0. |
| SENI including EUF-CMA of HMAC | 36 | **48** | `mac = key + gid + nonce` is equality, not a reduction. |
| **Dark Room** occupation ordering | 40 | **76** | `DarkRoom.v`: per-tick lists, `nth` pinned to “pay L for `gap` ticks, then 0”; one cycle is strict; some finite `n` beats any sampling penalty `C`. |
| Poisson integral in `DarkRoomEFE.md` | 40 | **40** | Not checked. That note also mixes a one-shot penalty with an occupation bound. |
| **B.2** eyes-off, same ears | — | **62** | `eyes_off_given_same_ears`: pixel activity is not in the obligation cost. |
| **III.1** no layout-only close | 50 | **84** | `OpenDoc.v`: for every `decide`, `decide (box, ink)` cannot match the obligation. Emergency and Tenant share geometry and differ on the obligation. |
| **C.1** required-field set | 22 | **68** | If two lists accept the same valuations, they contain the same fields (`same_required_set`). Order and duplicates are not unique. |
| Close ignores geometry | — | **64** | `close_ignores_box`, `sdo_separates_layout_twins`. |
| Categorical “SDO is terminal” | 22 | **30** | Not formalized. The sentence in the prose is still a sketch. |
| **MPSC safety** | 18 | **78** | `MpscRing.v`: every finite trace from `(0,0)` keeps `head <= tail` and `gap <= N` (`no_overwrite`). |
| MPSC try (returns full or a slot) | 18 | **72** | `try_occupy_decides`, `occupy_enabled`. |
| Blocking enqueue is wait-free | 18 | **8** | `blocking_enqueue_misses_every_bound`: for every bound `n`, `n` retries on a full ring return `None`. The positive claim is false. |
| Positive conf-NI of Chromium or V8 | 0 | **0** | Not attempted. |

## What each new file is

| File | Theorems |
|---|---|
| `WasmJS.v` | Operational host schedules over a two-address memory. |
| `ProcIso.v` | Instruction lists. Compliant means no plaintext `EmitSecret`. |
| `SeniMachine.v` | Commands are `Noise`, `Advance`, `Submit`. Mint is outside the adversary. |
| `DarkRoom.v` | Renewal cycles as lists of per-tick costs. |
| `OpenDoc.v` | One obligation, layout `(box, ink)`, roles Tenant / Emergency. Field identifiers are `nat`. |
| `MpscRing.v` | Two indices. Not a byte array, not a CAS memory model. |
| `MemoryNI.v` | Earlier, smaller A.1 / A.4 / grant lemmas. Still checked. Superseded in strength by the files above. |

## Still outside the checker

- Chromium, V8, Wasmtime, Electron, macOS.
- HMAC-SHA256.
- The Poisson formula.
- A category whose terminal object is the smart document.
- Isabelle. No `.thy` was checked.
