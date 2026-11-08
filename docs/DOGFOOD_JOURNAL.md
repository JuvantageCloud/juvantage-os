# Phase 6 — 14-day dogfood journal

**Start:** **2026-11-08** (CEO approve — P0.1 live send verified; Day 1 clock running).

**Easiest P0.1 path:** Desktop → **Connect** → Connect Google (not Demo) → **4 · P0.1 test → my inbox** → **Work → Mail** → Draft → Approve & send → Gmail Sent.

**Metrics:** Desktop → Settings → Refresh metrics, or `GET /os/metrics?days=7`.

Copy one block per day. Keep the file in repo or a private note—update `Status` column in [`OS_OPERATIONAL_REVIEW.md`](./OS_OPERATIONAL_REVIEW.md) weekly.

---

## Day 1

| Field | Value |
|-------|--------|
| **Date** | 2026-11-08 |
| **Demo vs live mail** | live |
| **Loops surfaced** | P0.1 test thread (`[Juvantage P0.1]`) |
| **Closed (verified send)?** | Y — reply confirmed in Gmail Sent (human sign-off) |
| **Quiet / dismiss** | not exercised Day 1 (approve to start clock) |
| **Clip ⌘⇧L** | not exercised Day 1 (approve to start clock) |
| **Would miss Jos if gone?** | TBD — reassess Day 7 |
| **Friction (1 line)** | P0.1 path worked; full daily habit not proven yet |

---

## Day 2

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 3

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 4

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 5

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 6

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 7

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |
| **Week 1 metrics snapshot** | paste clear rate / wrong_object from Settings |

---

## Day 8

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 9

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 10

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 11

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 12

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 13

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |

---

## Day 14 — gate decision

| Field | Value |
|-------|--------|
| **Date** | |
| **Demo vs live mail** | |
| **Loops surfaced** | |
| **Closed (verified send)?** | Y/N |
| **Quiet / dismiss** | |
| **Clip ⌘⇧L** | |
| **Would miss Jos if gone?** | Y/N |
| **Friction (1 line)** | |
| **Days used / 14** | |
| **Enter V2?** | Y/N — see [`FLAGSHIP_STAGED_PLAN.md`](./FLAGSHIP_STAGED_PLAN.md) §5 |

---

## One-time: enable live Gmail send

1. Google Cloud Console → OAuth consent → add **`https://www.googleapis.com/auth/gmail.send`** to scopes (app already requests it in code).
2. Desktop → **Connect** → sign in to Google again (**prompt=consent** refreshes scopes).
3. Sync → Extract → Draft → **Approve & send** on a real reply-owed thread; confirm toast shows `Sent · id … → closed` and thread received the mail.

Restart after pulling code: `npm run dev:os` (API + Electron).
