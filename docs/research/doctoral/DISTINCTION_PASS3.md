# Distinction Pass 3 — Three hard gaps closed in Rocq

**Mandate:** Solve hard unfinished claims — not product UI.  
**Date:** 2026-11-13  
**Checker:** Rocq 9.3.0, `coqc` + `rocqchk`, `Print Assumptions` → **Closed under the global context** (no `Axiom`, no `Admitted`).  
**Log:** [`artifacts/coq/MACHINE_CHECK.md`](./artifacts/coq/MACHINE_CHECK.md)

---

## Where this sits in the three assignments

The doctoral brief is **three assignments**. Passes 1–2 wrote the dossiers and first Rocq slice. Pass 3 closes **one leftover hard claim inside each assignment** — not a fourth assignment.

| Assignment | File | Topic | Pass 3 closes |
|------------|------|-------|----------------|
| **1 — Kernel & Runtime** | [`ASSIGNMENT_1_KERNEL_RUNTIME.md`](./ASSIGNMENT_1_KERNEL_RUNTIME.md) | WASM/host boundary, CapToken, SENI, ring | **Ideal MAC SENI** (`SeniIdealMac.v`) — Gap I leftover |
| **2 — Perception Physics** | [`ASSIGNMENT_2_PERCEPTION_PHYSICS.md`](./ASSIGNMENT_2_PERCEPTION_PHYSICS.md) | Landauer, FEP, Dark Room, NCD | **Poisson Dark Room B.1** (`PoissonDarkRoom.v`) — Gap II leftover |
| **3 — Semantic Objects** | [`ASSIGNMENT_3_SEMANTIC_OBJECTS.md`](./ASSIGNMENT_3_SEMANTIC_OBJECTS.md) | Functor, SDO, lineage, CRDT | **SDO terminal (C.2)** (`SdoTerminal.v`) — Gap III leftover |

```text
Assignment 1 ── Gap I (execute / memory NI) ──► Pass 1 SENI + Pass 2 A.1/A.4
                                            └──► Pass 3 ideal-MAC SENI   ← this pass

Assignment 2 ── Gap II (Dark Room / EFE) ─────► Pass 1–2 DarkRoom.v lists
                                            └──► Pass 3 Poisson integral ← this pass

Assignment 3 ── Gap III (close-adequate SDO) ► Pass 1–2 OpenDoc III.1 / C.1
                                            └──► Pass 3 SDO terminal    ← this pass
```

---

## What was still hard (before this pass)

| Assignment | Claim | Prior score | Why it was stuck |
|------------|-------|------------:|------------------|
| **2** | Poisson integral (Dark Room B.1 continuous form) | **40** | Only in `DarkRoomEFE.md`; mixed oneshot with occupation; not in Rocq |
| **3** | Categorical “SDO is terminal” (Thm C.2) | **30** | Prose sketch only; OpenDoc.v stopped at III.1 / field sets |
| **1** | SENI + MAC unforgeability | **48** | `mac = key + gid + nonce` — arithmetic collisions, not ideal MAC |

---

## Solution 1 — Assignment 2 · Poisson Dark Room (`PoissonDarkRoom.v`)

**Model.** Bernoulli hazard \(p=1/2\) (discrete Poisson). Expectations scaled by \(2^T\) so proofs stay in `nat`.

**Theorems.**
- `poisson_integral_discrete` — geometric first-arrival sum equals oneshot \(L(2^T-1)\) (scaled \(L(1-2^{-T})\)).
- `oneshot_remainder_is_L` — missing mass identity.
- `poisson_occupation_crossover` — occupation dormancy beats rate-bounded ears + any constant \(C\).
- `eyes_off_extrinsic_invariant` — B.2 link under fixed ears.

**Honest non-claim.** Not real analysis on \(\mathbb{R}\); not Friston brain minimization; \(\lambda\neq 1/2\) not parameterized.

---

## Solution 2 — Assignment 3 · SDO terminal (`SdoTerminal.v`)

**Model.** Category of close systems: objects \((\mathrm{Sem},\mathrm{Lay},\mathrm{close}:\mathrm{Sem}\to\mathrm{bool})\); morphisms = Sem-maps preserving `close`. Layout objects vary only `Lay` for fixed Sem/close. SDO = `Lay := unit`.

**Theorems.**
- `sdo_terminal_exists` — forgetful morphism \(A \to \mathrm{SDO}\) exists.
- `sdo_terminal_unique` — id-on-Sem morphisms into SDO are unique.
- `factors_through_sdo` — maps into SDO factor through forget.
- `layout_product_close_ignores_lay` — geometry cannot change close once Sem is fixed.

**Honest non-claim.** Not a bicategory of PDF/OpenDoc; not LayoutLM; not CRDT merge.

---

## Solution 3 — Assignment 1 · Ideal MAC SENI (`SeniIdealMac.v`)

**Model.** Tag \(= (key, gid, nonce)\) compared componentwise. Signing is the only verifying constructor. No `key+gid+nonce` collisions.

**Theorems.**
- `verify_implies_sign`, `sign_injective`, `different_keys_different_tags`, `wrong_key_rejected` — symbolic EUF / ideal MAC.
- `ideal_no_mint_no_effect`, `ideal_at_most_one_effect`, `ideal_commit_second_adds_nothing` — SENI machine under ideal MAC.
- `ideal_forge_wrong_key_rejected` — wrong-key tag cannot commit.
- `ideal_stolen_once_concrete` — stolen honest token: exactly one effect.

**Honest non-claim.** Not HMAC-SHA256; not asymptotic PPT EUF-CMA; not `apps/api` SQLite concurrency.

---

## Product binding (OS, not Mac chrome)

These three close the research gaps that gate the **OS brain** claim:

1. **Ears-on / eyes-off** is not a vibes policy — occupation + Poisson oneshot are ordered.
2. **SDO** is the universal close object among layout-enhanced models (Mac shell is one host).
3. **Approve grants** are unforgeable in the ideal-MAC model the Brain must implement (host oracle holds the key; renderer cannot mint).

Mac Desktop remains the **first shell**, not the identity of Juvantage OS.
