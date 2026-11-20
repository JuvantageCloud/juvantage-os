# Context-first plan (product north star)

**Updated:** 2026-11-17  
**Supersedes** mail-inbox-as-home dogfood messaging in older `YOU_ARE_HERE` drafts.

**Canonical chrome (marketing = product):** waitlist **Act Moment** — one light theme (`global.css`: cream `--bg`, white cards, navy `--accent`). Layout: `OPEN LOOPS` + **Proposed next step** + *Nothing submits until you approve.*  
Reference: [`assets/mockups/waitlist-act-moment-reference.png`](../assets/mockups/waitlist-act-moment-reference.png) · `WaitlistActLayout.tsx` (Desktop **Work**).

```text
CAPTURE (apps / windows / clips / optional connector ears)
    → FUSE (session → bundle → hypothesis)
    → LIVENESS (still open?)
    → SURFACE (one hero, alive context canvas + modality)
    → PROPOSE → APPROVE → VERIFY → loop dead
```

## What the product is

- **Not** a Gmail or Calendar client. Connectors are **ears** for “is this reply still owed?” — background only.
- **Is** a **context closer**: stitch what you were doing across surfaces, propose what might still be unfinished, let you approve a close action (send mail, note, event, later: terminal/IDE hooks).

## In code now (this sprint)

| Item | Where |
|------|--------|
| Loop liveness before list | `apps/api/src/services/osLoopLiveness.ts` |
| Context-first hero sort | `packages/shared/src/modality.ts` (`pickSheetHero`, `sortLoopsForWork`) |
| Live context canvas + motion | `apps/desktop/src/components/ContextCanvas.tsx` |
| Work home (no Synced nav) | `Desktop.tsx` — inbox = settings debug only |
| Fuse + evidence API | `osContextFuse.ts`, `GET /os/loops/:id/context` |

## Next engineering (ordered)

1. **Presence-aware hero** — boost episodic loop when frontmost app matches bundle fingerprint (macOS bridge → Brain).
2. **Liveness v1** — Gmail thread “you replied” / ticket closed / PR merged (beyond cache miss).
3. **Hypothesis copy** — proposal rationale = “maybe X because Y” from multi-event fuse (LLM optional).
4. **Modality depth** — `code_task` surface + suggested commands (terminal connector stub).
5. **Workstation grid** — queue \| modality \| evidence rail (`OS_LAYOUT_PROGRESS.md` L1–L3).
6. **Scene graph (V3)** — co-window stitching (k8s + repo + terminal) — not V1.

## Human gate

Phase 6 dogfood: close **one** real loop per day (any source). Mail path remains a valid **hand**, not the hero story.