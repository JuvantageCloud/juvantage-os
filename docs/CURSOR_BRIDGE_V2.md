# Cursor Bridge — Engineering Worker gateway (V2)

V1 ships **UI only**: Workers list, Cursor Bridge settings, and chat footer copy. No code is executed in Cursor from the phone.

**Not Viktor.** Viktor is an external founder tool. Cursor Bridge is (or will be) our **Engineering Worker** behind the OS approve→execute loop.

## Goal

Route *approved* engineering jobs from Juvantage OS to coding agents (Cursor / GitHub) without giving the phone direct control of a developer machine.

```text
iOS  →  Business Core  →  Agent Gateway  →  Cursor / GitHub / CI
                 ↑
         human confirmation
```

## Contract (planned)

1. Ops/Growth/Finance agent proposes an action with `requiresConfirmation: true`.
2. Owner taps **Approve** in-app.
3. Gateway creates an `AgentJob` with scoped repo access, prompt, and allowlisted tools.
4. Worker runs inspect → tests → optional PR draft.
5. Result returns to the conversation as a structured card (diff summary, PR URL).
6. Destructive steps (merge, deploy) always need a second confirmation.

## Permissions model

| Agent | V1 UI | V2 default |
|-------|-------|------------|
| Ops | Read+Act | Read + propose ops scripts |
| Growth | Read only | Read + propose content (no auto-post) |
| Finance | Read+Suggest | Read + suggest reports |
| Cursor Bridge | Connected stub | Scoped repo tools after approval |

## Security

- Never embed Cursor/API keys in the iOS app.
- Short-lived job tokens; tenant + repo allowlists.
- Audit log every tool call.
- Kill switch in Settings → Cursor Bridge.

## Non-goals for V2

- Silent auto-deploy
- Unbounded shell on developer laptops
- BYOK LLM keys for end customers (optional enterprise later)
