# Juvantage OS — Trust boundary (TCB)

**Purpose:** Map running components to the research models (SENI, A.1, A.4). Use for security FAQ, dogfood review, and roadmap gates—not as a claim that macOS or Chromium were verified in Rocq.

**Formal models:** [`research/doctoral/artifacts/coq/MACHINE_CHECK.md`](./research/doctoral/artifacts/coq/MACHINE_CHECK.md)

---

## Roles (as in Distinction proofs)

| Symbol | In product today | Trusted for |
|--------|------------------|-------------|
| **Host oracle \(H^\*\)** | `apps/api` Brain on localhost (Hono + Prisma + SQLite) | Mint `ApprovalGrant`, verify grant on execute, connector adapters, encrypted OAuth tokens, audit |
| **Adversary UI \(A\)** | Electron **renderer** (React quick sheet + Desktop) | Display only; must not hold mint key or send without Brain accepting consumed grant |
| **Guest (future SASOS)** | Not shipped | WASM micro-core + typed IPC—target architecture in Assignment 1 |
| **Connectors (hands/ears)** | Google Gmail/Calendar sync jobs | Read (and send when scope granted); no close without approve path |

---

## Invariants the codebase must uphold

1. **Execute only after approve + fresh grant** — `approveProposal` mints grant; `executeProposal` consumes it (`updateMany` fresh→consumed). Second execute → 403/409.
2. **No execute for non-closable `objectType`** — Brain rejects approve/execute for unknown/hint types; UI should disable Approve (Desktop yes; Quick sheet—see operational review).
3. **Secrets that need conf-NI do not live in renderer WASM** — Thm A.1: browser linear memory is not a vault. Today: MAC key material is `TOKEN_ENCRYPTION_KEY` on Brain only; renderer has session token, not grant mint key.
4. **Weak ambient clips do not become HIGH todos** — `createClipLoop` refuses stub titles; returns `{ refused: true }`.

---

## Data flows (close loop)

```text
Renderer                    Brain (TCB)                    Google
   │  propose/draft              │                            │
   │ ─────────────────────────► │                            │
   │  approve (human)             │ mint ApprovalGrant         │
   │ ─────────────────────────► │                            │
   │  execute (with grant)      │ consume grant → adapter    │
   │ ─────────────────────────► │ ─────────────────────────► │ send (if scope)
   │ ◄───────────────────────── │ verify → loop done         │
```

---

## Known gaps (operational, not proof)

| Gap | Impact | Roadmap owner |
|-----|--------|----------------|
| Gmail **send scope** not in default OAuth | Reconnect Google after code update | Phase 6 — [`DOGFOOD_JOURNAL.md`](./DOGFOOD_JOURNAL.md) |
| Quick sheet Approve not gated like Desktop | Trust hole on Solo path | Phase 6 polish |
| Demo mail path | Metrics skew vs live obligations | Dogfood log: demo vs live |
| No git remote / CI not running | Incident playbook untested | Before beta invites |

---

## What we do **not** claim

- Chromium/V8 memory confidentiality (disproven for WasmJS embedding—use process isolation or keep secrets off renderer).
- EUF-CMA security of HMAC (assumed in prose SENI; Coq uses equality model in `SeniMachine.v`).
- macOS process isolation as a proved theorem (A.4 is IPC projection model only).

---

*Update this file when OAuth scopes, deploy topology, or Electron process split changes.*
