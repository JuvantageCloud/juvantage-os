# Juvantage OS — Desktop UI + legacy Electron

React **wide Desktop** UI (Loops, Connect, Inbox) — bundled by Vite.

| Layer | Location |
|-------|----------|
| **Mac shell (default)** | `apps/macos` — Swift menu bar, agent, Quick sheet, WebKit hosts this UI |
| **Brain** | `apps/api` — OAuth, loops, approve/send |
| **Legacy all-in-one** | Electron — `npm run dev:os-electron` |

## Run (native shell — default)

```bash
npm run setup          # first time
npm run dev:os         # Brain :3001 + Vite :5173 (no Electron)

cd apps/macos && xcodegen generate && open JuvantageOSMac.xcodeproj
# Run JuvantageOSMac in Xcode
```

See `apps/macos/README.md`.

## Run (legacy Electron)

```bash
npm run dev:os-electron
```

## Windows (web routes)

| Hash | Surface |
|------|---------|
| `#/agent` | Floating agent (Electron only today) |
| `#/sheet` | Quick sheet |
| `#/desktop` | Desktop — **loaded by Swift WebKit** or Electron |

API smoke tests: `npm test -w @juvantage/api`
