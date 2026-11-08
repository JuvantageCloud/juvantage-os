# Secrets, environments & deploy (Dev → Prod)

**Locked cloud plan:** [`ORG_INFRA.md`](./ORG_INFRA.md) + `infrastructure/`  
**Local product build:** [`OS_BUILD_ROADMAP.md`](./OS_BUILD_ROADMAP.md)

This is **not** “localhost forever.” We build the Brain so it can run in **two places**:

| Mode | Where | Who uses it | When |
|------|--------|-------------|------|
| **Local dogfood** | Your Mac — `localhost:3001` + Electron | You | Phases 0–6 product work (fast iterate) |
| **Hosted Brain (`os-brain`)** | AWS EC2 (us-east-1), systemd Node — same pattern as Line | Desktop (pointed at URL), later phone/site | Infra phase 3 — always-on + go-live |

GitHub is in the picture for **both**: app CI (tests/build) **and** infra as code (Terraform). Local is a *development runtime*, not the production architecture.

```text
  DEV LAPTOP                         AWS (dev → prod)
  ─────────                          ────────────────
  Electron Solo  ──┐                 ┌─ EC2
  npm run dev:os   ├── Brain API ────┤    systemd: line-plaid-api
  SQLite/.env      │  (same routes)  │    systemd: os-brain   ← go-live Brain
                   │                 └─ Secrets Manager (JWT, Google, LLM, …)
  GitHub Actions CI (unit/typecheck)
  infrastructure/ Terraform (EC2, SG, secrets IAM)
```

---

## Do we need a real hosted API to go live?

**Yes — to go live / always-on / anything beyond your laptop.**  
**No — to finish Phase 3–4 product loops on your machine this week.**

| Goal | Need hosted `os-brain`? |
|------|-------------------------|
| Extract loops, approve UX, dogfood daily | Not yet — `localhost:3001` |
| Brain stays up when Mac sleeps | **Yes** |
| Private beta / waitlist users | **Yes** (at least AWS **dev**) |
| Production customers | **Yes** (AWS **prod**) |

**Go-live target (already locked in org infra):**

1. Terraform applies EC2 (+ Secrets Manager) — Line first, then **`os-brain`** on same host (option B) or its own box (option A).  
2. Desktop `VITE_API_BASE_URL` / runtime config points at `https://os-brain…` instead of `127.0.0.1:3001`.  
3. Google OAuth redirect URIs include the **prod** callback, not only localhost.  
4. CI: app tests on PR; deploy pipeline (or scripted SSH/systemd) on merge to main for the env.

Scaffold already exists: `infrastructure/services/os_brain/` (empty until apply). Do **not** invent Fly as a second cloud — EC2 is the locked path.

---

## Environments

| Env | App Brain | DB | Secrets | Clients |
|-----|-----------|-----|---------|---------|
| **local** | `tsx` on Mac `:3001` | SQLite `file:./dev.db` | `apps/api/.env` | Electron → localhost |
| **aws-dev** | `os-brain` systemd on EC2 | Postgres (compose or RDS later) | AWS Secrets Manager | Electron → dev URL |
| **aws-prod** | same pattern, prod TF env | Postgres | Secrets Manager (prod) | Electron / future remotes → prod URL |

Code stays one Brain API (`/os/...`, `/health`, later `/approve`). Only **config + data store + bind address** change per env.

---

## Secrets & variables

### Local (now)

| Secret / var | Where | In git? |
|--------------|--------|---------|
| `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY` | `apps/api/.env` | **No** |
| `GOOGLE_CLIENT_*`, `ANTHROPIC_API_KEY` | `apps/api/.env` | **No** |
| `DATABASE_URL` | SQLite path locally | **No** |
| Names only | `.env.example` | **Yes** |

OAuth tokens in DB: **AES-256-GCM**. Desktop JWT: `localStorage` (Keychain later).

### Hosted (go-live)

| Secret | Where |
|--------|--------|
| Same keys as above | **AWS Secrets Manager** (dev/prod), IAM on the EC2 role |
| Deploy credentials | GitHub Actions OIDC or deploy key — **never** commit |
| CI unit tests | Dummy env only (already in `.github/workflows/ci.yml`) |

Terraform modules under `infrastructure/modules/secrets/` are the source of truth for cloud secret stubs.

---

## Containerize?

| Now (product phases 2–4) | Go-live / Teams |
|--------------------------|-----------------|
| **Optional.** systemd + Node on EC2 matches Line and `ORG_INFRA` | Docker Compose Brain image when you want portable/Teams (`OS_ARCHITECTURE` Part B) |

Do **not** block Phase 4 on Docker. Do **wire** Desktop for a configurable API base URL so flipping local → `os-brain` is one env var.

---

## What “done for production path” means (checklist)

- [x] App CI on GitHub (build + unit tests + Docker build on PR/main)  
- [x] Release workflow on semver tags — see repo root `RELEASE.md`  
- [x] Incident capture → investigate workflow (draft PR for review) — `OS_INCIDENT_RESPONSE.md`  

- [x] Infra repo layout + `os_brain` Terraform stub  
- [x] Local Brain feature-complete enough to dogfood close loop  
- [ ] Apply AWS **dev** (Line first per org plan, then `os-brain` unit)  
- [ ] Secrets Manager populated for OS (JWT, token encryption, Google, LLM)  
- [ ] Desktop points at hosted Brain in a **dev** build  
- [ ] Prod TF env + HTTPS + Google prod redirect URIs  
- [ ] Deploy on merge (scripted or Actions)  

**Bottom line:** GitHub + Terraform = production system. Localhost = developer cockpit on the same codebase. We ship product on local until Phase 4 dogfoods; we **map and stage** `os-brain` so go-live is an env cutover, not a rewrite.
