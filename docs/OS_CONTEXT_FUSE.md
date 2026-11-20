# Context fuse (ingest → session → bundle → loop)

**Status:** v1 in Brain (`apps/api`)  
**Architecture:** `OS_ARCHITECTURE.md` Layer B → Layer C

```text
Host signals  →  ContextEvent  →  ContextSession (idle gap)
                    ↓
              ContextBundle (fuse ≤10m, ≤40 events)
                    ↓
              one episodic loop (sourceRef: context-bundle) + proposal
```

| Piece | Meaning |
|-------|---------|
| `POST /os/capture/events` | Batch ingest (arch contract) |
| `POST /os/loops/episodic` | Single window read (same fuse path) |
| `GET /os/loops/:id/context` | RP-01 evidence pack — session events + tags for the float drawer |
| Session break | `idleSeconds` ≥ 90 or gap between events ≥ 90s |
| Retention | Sessions/events purged ≤24h (like ambient) |
| `sensitivityTags` | Route/redact hints (`pii_email`, `secret_credential_like`) — not a de-ID product |
| Hero UX | Unchanged — one loop; evidence holds `sessionId`, `eventCount` |

**Next:** scene graph (multi-tab), mail thread id in bundle, ranker on Approve/Quiet labels.