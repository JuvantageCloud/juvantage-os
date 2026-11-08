# Release tags (GitHub)

## Plain English — what “GHCR publish” means

When you push a version tag like `v0.2.0`, three things can happen:

| Step | What it is | What you get |
|------|------------|--------------|
| **1. Tests** | CI runs on GitHub’s servers | Confidence this commit isn’t broken |
| **2. GitHub Release page** | A version page with notes | Humans see “what changed” |
| **3. GHCR publish** | **GitHub Container Registry** stores the **Brain Docker image** | Any machine can **pull that exact build** and run it — like an App Store build number, but for the API |

**Without GHCR:** a release is mostly **documentation** (notes + `docker-compose.yml`). You still have to build the image yourself somewhere.

**With GHCR:** tag `v0.2.0` → image  
`ghcr.io/<your-org>/<your-repo>/os-brain:v0.2.0`  
Your future EC2 / `docker compose` can say “run **this** image,” not “run whatever someone built on a laptop.”

That’s what we mean by releases being **valid as artifacts**: the version tag points at a **stored, runnable Brain**, not only text.

**Privacy:** Images on GHCR follow repo visibility (private repo → private package). IAM on AWS pulls with a GitHub token or deploy secret later.

---

**Image contract:** `ghcr.io/<owner>/<repo>/os-brain:<tag>`  
**Local build (dev):** `juvantage/os-brain` via `npm run docker:brain`  
**Shared contracts:** `@juvantage/shared` in `packages/shared/package.json`

## Cut a release

1. Bump `packages/shared/package.json` if the contract changed.
2. Commit on `main`.
3. Tag and push:

```bash
git tag -a v0.2.0 -m "v0.2.0 — ModalityHost, macOS bridge, Brain Docker"
git push origin main
git push origin v0.2.0
```

4. Actions workflow **Release** runs:
   - tests + typecheck
   - builds and **pushes** `os-brain` to **GHCR**
   - opens the **GitHub Release** page with pull instructions

**Every push to `main` / PRs:** `.github/workflows/ci.yml` (no tag, no publish).

## Local smoke (before tag)

```bash
npm run typecheck
npm test -w @juvantage/api
npm run docker:brain
```

## Run the published image (after tag exists on GHCR)

```bash
docker pull ghcr.io/YOUR_ORG/YOUR_REPO/os-brain:v0.2.0
docker run --rm -p 3001:3001 \
  -e JWT_SECRET=... \
  -e TOKEN_ENCRYPTION_KEY=... \
  -e DATABASE_URL=file:/data/brain.db \
  -v brain-data:/data \
  ghcr.io/YOUR_ORG/YOUR_REPO/os-brain:v0.2.0
```

Replace `YOUR_ORG/YOUR_REPO` with your GitHub path (e.g. `juvantagecloud/juvantage-os`).
