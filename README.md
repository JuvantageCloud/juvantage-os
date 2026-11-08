# Juvantage OS *(repo)*

**Flagship product:** catch unfinished work → help finish it (Personal → Teams).  
**V1 surface:** Mac desktop + locked floating agent.  
**Build:** [docs/OS_BUILD_ROADMAP.md](docs/OS_BUILD_ROADMAP.md)  
**Docs:** [docs/README.md](docs/README.md) → scope · product · architecture.

> **Code in this repo:** also contains a **parked** iOS “Command / Business OS” shell (multi-biz phone). That is **not** the marketed OS. Archive scope: [docs/BUSINESS_COMMAND_SCOPE.md](docs/BUSINESS_COMMAND_SCOPE.md).

## What’s in V1

- SwiftUI iOS app matching the mockups in `mockups/iphone16/`
- TypeScript **Business Core** API (Hono + Prisma + SQLite locally)
- Multi-business Command home, Connections, Alerts, Agents chat
- **Platform-managed Ops Agent** (no user ChatGPT/Gemini API keys)
- Google Calendar + Instagram OAuth paths with **demo connectors** when keys aren’t set
- **Cursor Bridge** UI stub (real gateway in V2)

## Quick start

### Desktop OS (Phase 0–1) — primary

```bash
npm install
npm run setup          # first time: Prisma + seed
npm run dev:os         # Brain :3001 + Vite UI :5173 (no Electron)

cd apps/macos && xcodegen generate && open JuvantageOSMac.xcodeproj
# Run JuvantageOSMac in Xcode — menu bar agent + WebKit Desktop
```

Legacy Electron: `npm run dev:os-electron`.

Or split: `npm run dev:api` + `npm run dev:ui`.

After pulling OS changes, restart **`npm run dev:os`**. For live Gmail send, reconnect Google in Desktop → Connect (OAuth now includes `gmail.send`). See [docs/DOGFOOD_JOURNAL.md](docs/DOGFOOD_JOURNAL.md).

You should see the **Swift menu-bar app**: floating agent (bottom-right), Quick sheet, **Open Desktop** (React UI in WebKit). Legacy Electron: `npm run dev:os-electron`.

Details: [apps/macos/README.md](apps/macos/README.md) · [apps/desktop/README.md](apps/desktop/README.md) · [docs/OS_BUILD_ROADMAP.md](docs/OS_BUILD_ROADMAP.md)

### API only

```bash
npm run setup
npm run dev:api
```

API: `http://localhost:3001`  
Demo login: `john@juvantage.com` / `demo1234`

Optional: set `ANTHROPIC_API_KEY` in `apps/api/.env` for live LLM replies.

### iOS (parked Command shell)

1. Open `apps/ios/JuvantageOS.xcodeproj` in Xcode
2. Select an iPhone simulator
3. Run (⌘R)

The app talks to `http://127.0.0.1:3001` by default (simulator).

## Architecture

```
iOS (SwiftUI)  →  API / WebSocket-ready REST  →  Business Core
                                              →  Agent orchestrator → Claude (optional)
                                              →  Instagram / Google Calendar connectors
```

Users never paste LLM keys. The phone calls `/agents/chat`; the server loads tenant data, runs tools, and returns structured cards + actions.

## Positioning

OS = command center (**see → understand → propose → approve → execute → verify**).  
**Workers** = future executors inside our architecture (e.g. Engineering / Cursor Bridge).  
**Viktor** = external tool you use personally — **not** integrated into OS.  

See [docs/POSITIONING.md](docs/POSITIONING.md) and [docs/ROADMAP_30_DAYS.md](docs/ROADMAP_30_DAYS.md).

## Cursor Bridge (V2)

V1 ships Settings + Agents UI as **connected stub**. See [docs/CURSOR_BRIDGE_V2.md](docs/CURSOR_BRIDGE_V2.md).

Local DB is SQLite for zero-friction setup; Postgres notes are in [docs/DATABASE.md](docs/DATABASE.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install, generate Prisma client, push schema, seed |
| `npm run dev:os` | API + Electron desktop together |
| `npm run dev:desktop` | Electron Solo agent only (API separate) |
| `npm run dev:api` | Start API with hot reload |
| `npm run db:seed` | Reset demo data |

## Design tokens

- Background cream: `#FCFBF7`
- Ink: `#0B1220` / `#1A1A1A`
- Teal accent: `#0D7A6F` / `#2D5A56`
- Attention: muted orange
