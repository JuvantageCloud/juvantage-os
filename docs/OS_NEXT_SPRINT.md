# Next sprint — context-first host

**Goal:** Product home = **fused context**, not inbox. Brain still owns close law + liveness. The float is a shell.

**North star:** [`OS_CONTEXT_FIRST_PLAN.md`](./OS_CONTEXT_FIRST_PLAN.md)

Research tie-in: fused context lives on the **loop evidence pack** (Assignment 1 / RP-01, `docs/OS_CONTEXT_FUSE.md`) — not a separate Context tab in IA.

## Laws (already founded — now enforce them)

| Law | In the running system |
|-----|------------------------|
| Browser / WebView is not a vault | Mint key + OAuth stay in Brain. Shell cannot forge a grant. |
| No effect without a one-shot grant | Real MAC on `ApprovalGrant`. Second execute fails. Wrong key fails. |
| Ears on, eyes off when idle | Idle is a scheduler: no frame retain; obligation extract still runs. |
| Close is semantic | Float and Desktop both refuse weak clips and block Approve on non-closable types. |

## Context-first (active)

1. [x] Loop liveness v0 before `listOpenLoops`
2. [x] Hero + list sort: episodic/clip before mail
3. [x] Desktop Work copy + **ContextCanvas** (poll + motion)
4. [x] Remove **Synced** from primary nav (debug under Settings)
5. [x] Presence-aware hero (frontmost app ↔ bundle)
6. [x] Liveness v1 (replied / resolved externally; episodic session stale)
7. [x] Merge v0 (connector loops → episodic `childSources`); [x] checklist proposal body
8. [ ] **Shell IA** — **frozen** until Brain gate ([`OS_BRAIN_FIRST.md`](./OS_BRAIN_FIRST.md))

## Do not start (yet)

- Full inbox / calendar browsers in product chrome
- Another Rocq file
- Phase 7 Docker / Teams
- Scene graph, meeting audio, Skills

## Build order

### A · Quartet (this stage)

1. [x] Grant tag = HMAC-SHA256; tests for wrong key and tampered fields
2. [x] Idle scheduler: eyes off, ears on (`presencePolicy`)
3. [x] Same close rule: Brain `canApproveExecute` uses the shared closable set

### B · Host-1 polish (beside A, not instead)

1. [x] Suggestion sheet: one hero context, Approve closes
2. [x] Clip hotkey owned by the sheet only (JOS-3)
3. [x] Sheet shows **1** suggestion (the rest stay on Desktop → Work)
4. [x] Success pulse on the float after Approve
5. [x] Hero priority: linked mail/calendar beats episodic; `GET /os/loops/:id/context` + drawer
6. [x] Episodic ingest: window + clipboard → `ContextSession` fuse (`POST /os/capture/events`)

### C · Quality gate (replaces handwritten 14-day journal)

1. [x] Live Gmail Approve once
2. [x] HTTP harness: demo close + capture fuse + context pack (`npm run test:integration -w @juvantage/api`)
3. [ ] Optional: widen harness to live OAuth smoke (not required for V2 eyes)

## Done when

A test suite shows: shell cannot forge, grant burns once, idle keeps no frames, both shells refuse a weak clip, hero picks real obligations when connectors are linked, and the evidence drawer loads the fused session ledger. Then V2 eyes are allowed.