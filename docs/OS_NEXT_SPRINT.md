# Next sprint — UX clarity + P0.1 proof

**Goal:** You can explain the product in one breath and **send one real Gmail reply** through Approve.

## Mental model (locked copy)

| Tab | What it is | What you do |
|-----|------------|-------------|
| **Connect** | Wires (Gmail, Calendar) + pipeline | OAuth → Sync → Extract |
| **Inbox** | Raw mirror of synced mail/events | Read-only; don’t work here |
| **Loops** | Close queue | Draft → Approve & send → verify |
| **Context** | Ambient ledger (≤24h) | Glance; clip with ⌘⇧L |
| **Settings** | Brain URL + dogfood metrics | Refresh metrics weekly |

**Connectors** = accounts/tokens. **Loops** = obligations built from sync + rules + clips.

---

## Build order (this week)

### A · Proof (human gate — blocks 14-day clock)

1. [x] Loops → filter **Mail** → pick real thread → Draft → **Approve & send**
2. [x] Confirm in Gmail; log Day 1 in [`DOGFOOD_JOURNAL.md`](./DOGFOOD_JOURNAL.md) — clock started 2026-11-08
3. [ ] Quiet junk clips (Norton/Cursor noise) with **wrong band** / **not actionable**

### B · UX (in repo now + next)

- [x] Connect as **tiles** + numbered pipeline (not paragraph text)
- [x] Flow strip Connect ↔ Loops
- [x] Close engine as **modules** in draft cockpit
- [x] Loops **Source** filter (Mail / Clips / Calendar)
- [x] Nav subtitles + short Loops one-liner (no global “how it works” panel)
- [~] macOS float: idle bob + pulse (Lottie JSON wire-up still pending SPM)
- [ ] Quick sheet SwiftUI parity with Desktop approve gate
- [x] Collapse clip loops by default (Source=All) + cap new clip band at **normal**

### C · Harden

- [x] OAuth token refresh before send
- [x] Tighter mail extract (skip Quora/digest)
- [ ] Git remote + CI before beta invites (`OS_BUILD_ROADMAP` P2.4)

### D · After P0.1 (V1.5 polish)

- Ranker bias to **1** loop on quick sheet
- Success Lottie on verify
- Privacy one-pager for OAuth testers

---

## Done when

You say: *“Connect wires my mail; Loops is where I close; nothing sent without Approve”* — and you’ve done it once on live Gmail.
