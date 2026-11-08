# OS capability — Incident → Investigate → Suggest (review)

**Status:** V1 foundation shipped  
**Approve gate applies:** CI may **draft** a PR; humans merge. Never auto-deploy.

```text
Server/Desktop call fails
        │
        ▼
  OpsIncident recorded (Brain DB) + fingerprint dedupe
        │
        ▼
  Rules investigator (local script / GitHub Action)
        │
        ▼
  Draft PR with .ci/incident-proposal.md  ← YOU REVIEW
        │
        ▼
  Fix + tests → merge → mark incident resolved
```

This is the same philosophy as Jos closing work: **propose → approve → execute**. Here the “work” is repairing the OS itself (and later: customer-facing stacks via Cursor Bridge).

---

## What exists now

| Piece | Role |
|-------|------|
| `OpsIncident` table | Stores failures (api + desktop) |
| `POST /os/incidents/report` | Client / monitor ingest |
| `GET /os/incidents` | List open incidents + suggestions |
| `POST /os/incidents/:id/investigate` | Mark investigating + payload for CI dispatch |
| `app.onError` | Auto-captures API 500s |
| Desktop `apiFetch` | Reports 5xx / network failures to Brain |
| `tools/investigate-incident.mjs` | Builds review markdown from a JSON payload |
| `.github/workflows/investigate-incident.yml` | ASAP CI: draft PR for human review |
| `.github/workflows/ci.yml` | Prevents regressions on every PR |

---

## How to trigger CI investigation

### A · Manual (workflow_dispatch)

GitHub → Actions → **Investigate OS incident** → Run workflow → paste JSON:

```json
{
  "source": "api",
  "method": "GET",
  "path": "/os/connectors",
  "statusCode": 500,
  "message": "PrismaClientKnownRequestError: ...",
  "stack": "..."
}
```

### B · From Brain (repository_dispatch)

After `POST /os/incidents/:id/investigate`, send the returned `dispatchHint.client_payload` to GitHub:

```bash
gh api repos/OWNER/REPO/dispatches \
  -f event_type=os-incident \
  -f client_payload="$(jq -c . dispatch-payload.json)"
```

(Wire this to a small “Dispatch to GitHub” button in Desktop Phase 5+, or a cron on `os-brain`.)

### C · Local

`incident.json` is **not** in the repo by default (failures are live data). Use the sample, or export one from the Brain:

```bash
# correct npm syntax: flags go AFTER --
npm run investigate -- --input .ci/sample-incident.json --out .ci/incident-proposal.md

# or call node directly
node tools/investigate-incident.mjs --input .ci/sample-incident.json --out .ci/incident-proposal.md
```

---

## Product roadmap for this capability

| Stage | Capability |
|-------|------------|
| **Now (V1)** | Capture + rules suggest + CI draft PR |
| **Next** | Desktop “Incidents” panel; one-click `gh dispatch` |
| **V2** | LLM deepens investigation with repo context (still draft-only) |
| **Cursor Bridge** | Approved jobs can open real code PRs for allowlisted repos |

---

## Non-goals

- Auto-merge  
- Silent production hotfix without review  
- Shipping stack traces to end customers in UI  
