# Juvantage OS — macOS shell (Swift)

**Native Mac host** for Solo: menu bar, floating agent, Quick sheet, Desktop window.  
**Brain** stays in `apps/api` (TypeScript). **Wide Desktop UI** is the existing React app loaded in **WebKit** from Vite during dev (same routes as Electron, without Chromium).

```text
┌─ SwiftUI / AppKit (this app) ─────────────────────────┐
│  Menu bar · NSPanel agent · Quick sheet · WKWebView   │
│  TCC / Keychain / updates (future)                    │
└───────────────────────────┬───────────────────────────┘
                            │ http://127.0.0.1:3001
                            ▼
                    apps/api (Brain)
                            ▲
                            │ http://127.0.0.1:5173/?route=desktop|sheet
                    apps/desktop (Vite UI — Desktop + Quick sheet)
```

Electron in `apps/desktop` is **legacy dev** — use `npm run dev:os` (API + Vite + this app).

## Prerequisites

- Xcode 16+ (or 15 with macOS 14 SDK)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`
- Node 20+ for Brain + UI

## Generate & run

```bash
# Terminal 1 — Brain + Vite UI (no Electron)
npm run dev:os

# Terminal 2 — regenerate Xcode project after any new .swift file, then open
npm run macos:generate
open /Users/johnuja/JuvantageOs/apps/macos/JuvantageOSMac.xcodeproj
```

Run **JuvantageOSMac** scheme. Sign in from Quick sheet or Desktop web UI (`john@juvantage.com` / `demo1234` after seed).

### Scheme environment (optional)

| Variable | Default |
|----------|---------|
| `BRAIN_BASE_URL` | `http://127.0.0.1:3001` |
| `DESKTOP_WEB_URL` | `http://127.0.0.1:5173/#/desktop` |

## What moves here over time

| Now | Next |
|-----|------|
| Agent float (teal bob + pulse; Lottie pending SPM) | `lottie-ios` + `mascot-idle-loop.json` |
| Quick sheet (loops list) | Full approve gate in SwiftUI |
| Desktop = WKWebView → Vite | Native Loops desktop in SwiftUI; web fallback |
| Token in UserDefaults | Keychain + device JWT |

See `docs/OS_ARCHITECTURE.md` §B1 and `docs/OS_BUILD_ROADMAP.md` shell row.
