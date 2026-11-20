# UI exploration — 7 style packs

**Pick a direction (or mix).** Each folder is a full visual language for the same Juvantage OS MVP flows.

| # | Folder | Vibe | Headline font | Best if you want… |
|---|--------|------|---------------|-------------------|
| 1 | [`01-flagship-cream`](./01-flagship-cream/) | Current flagship | Iowan / serif + system UI | Calm premium, matches existing mockups |
| 2 | [`02-linear-void`](./02-linear-void/) | Dark pro tool | Inter | Focus, dev-tool clarity at night |
| 3 | [`03-notion-warm`](./03-notion-warm/) | Warm workspace | Source Serif + sans | Friendly “thinking space” |
| 4 | [`04-brutalist-mono`](./04-brutalist-mono/) | Raw utilitarian | IBM Plex Mono | No fluff, trust through bluntness |
| 5 | [`05-apple-vibrant`](./05-apple-vibrant/) | macOS native | SF Pro stack | Feels like it shipped with the Mac |
| 6 | [`06-stripe-indigo`](./06-stripe-indigo/) | Fintech clean | system-ui | Crisp enterprise, approve feels safe |
| 7 | [`07-jos-round`](./07-jos-round/) | Mascot-forward | Nunito / rounded | Jos is the product; approachable |

## Open everything

1. Hub (compare covers): [`index.html`](./index.html) — open in Chrome/Safari.
2. Per style: `NN-name/gallery.html` — all artboards + exportable PNGs in `NN-name/images/`.

Open **`gallery.html`** in each folder — artboards are **true Mac sizes** (not shrunk tiles):

| Surface | Size |
|---------|------|
| Desktop | **980×680** |
| Quick sheet | **340×560** |
| Agent on desktop | **1024×640** |

Regenerate + export PNGs:

```bash
npm run ui:exploration
npm install -D playwright && npx playwright install chromium   # once
npm run ui:exploration:png
```

Each screen lands in `NN-style/images/01-sign-in.png`, etc. — native resolution for picking.

## Screens in every pack (same flows, different skin)

Maps to [`docs/OS_UI_MAP.md`](../../docs/OS_UI_MAP.md).

| File | Use case |
|------|----------|
| `01-sign-in` | First launch / Brain sign-in |
| `02-onboarding-connect` | Connect Google or Demo |
| `03-agent-idle` | Menu bar agent, no nudge |
| `04-agent-nudge` | Badge on float |
| `05-quick-sheet-mail` | Hero mail loop + draft + Approve |
| `06-quick-sheet-episodic` | Screen note (local close only) |
| `07-desktop-work` | Work home — mail first, list + draft |
| `08-evidence-drawer` | Context used for proposal |
| `09-connectors` | Gmail + Calendar status |
| `10-settings-privacy` | Eyes, retention, blocklist |
| `11-approve-success` | Loop closed / sent toast |

## How to choose

Note folder numbers for: onboarding, float sheet, desktop work, settings. Reply e.g. *“Onboarding from 03, sheet from 01, desktop from 02.”*