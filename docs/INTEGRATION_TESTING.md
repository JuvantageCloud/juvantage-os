# Integration testing (Principal Integration Test Engineer)

**When:** MVP / dogfood gate — every close path must be provable end-to-end, not only unit tests.

## Scope (V1)

| Layer | What to prove |
|-------|----------------|
| **Brain API** | Connect demo → sync → extract → propose → PATCH edit → approve-send → loop `done` |
| **SENI** | Execute **403** without approve; grant **consume-once** on second execute |
| **Gmail (live)** | OAuth token refresh; one send returns `messageId` (P0.1 human + automated smoke when `GMAIL_E2E=1`) |
| **Desktop** | ModalityHost mail surface; no edit on `executed` proposals (re-Draft) |
| **macOS shell** | WK bridge posts ambient; clip hotkey creates loop (manual + scripted later) |

## In repo today

- **Unit:** `npm test -w @juvantage/api` (crypto, grants, modality, **proposal state**)
- **Typecheck:** `npm run typecheck`
- **CI:** `.github/workflows/ci.yml` on every PR
- **Release:** tag `v*.*.*` → tests + GHCR image

## Next (this seat owns)

- [x] `npm run test:integration -w @juvantage/api` — HTTP harness demo close loop (`closeDemo.harness.test.ts`, `harness.db`)
- [ ] Optional Playwright against `dev:ui` + seeded auth (Desktop happy path)
- [ ] Contract tests: responses match `@juvantage/shared` zod schemas
- [ ] P0.1 checklist automated where possible (`DOGFOOD_JOURNAL.md` stays human sign-off)

## Pass gate for beta invite

All unit green + one integration close-loop green + P0.1 journal Day 1 signed.
