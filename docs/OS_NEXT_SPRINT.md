# Next sprint — quartet in the running Brain

**Goal:** Make the four OS laws true in `apps/api`, then keep dogfooding host 1 (Mac). The float is a shell. The Brain is the product.

Research tie-in: fused context lives on the **loop evidence pack** (Assignment 1 / RP-01, `docs/OS_CONTEXT_FUSE.md`) — not a separate Context tab in IA.

## Laws (already founded — now enforce them)

| Law | In the running system |
|-----|------------------------|
| Browser / WebView is not a vault | Mint key + OAuth stay in Brain. Shell cannot forge a grant. |
| No effect without a one-shot grant | Real MAC on `ApprovalGrant`. Second execute fails. Wrong key fails. |
| Ears on, eyes off when idle | Idle is a scheduler: no frame retain; obligation extract still runs. |
| Close is semantic | Float and Desktop both refuse weak clips and block Approve on non-closable types. |

## Do not start (yet)

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