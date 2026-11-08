# Haven demo capture — 2026-09-11

## Status
Product calm pass is in the outer repo `/Users/johnuja/Desktop/Projects/Haven` (nested duplicate deleted; backup at `~/Desktop/haven-nested-backup-20260911.tgz`).

Latest automated capture reaches **calm cream Home** (not purple game HUD / not Welcome onboarding) when `-UITestDemo` is set. Full tab-perfect recapture may need one local Xcode run if CI shell is unavailable.

## Recapture (local)

```bash
cd /Users/johnuja/Desktop/Projects/Haven
xcodebuild test \
  -project Haven2.0.xcodeproj \
  -scheme Haven2.0 \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:Haven2.0UITests/HavenDemoCaptureUITests/testCaptureProductScreens
```

`-UITestDemo` (set in the UITest) will:
- Mark onboarding complete
- Skip mood auto-prompt
- Seed today’s demo tasks (DEBUG)

## Expected screens
| File | Screen |
|------|--------|
| screens/02-auth | Sign-in (Game Center only in DEBUG) |
| screens/03-home | Home · Focus (seeded day) |
| screens/04-timeline | Timeline |
| screens/05-goals | Goals |
| screens/06-profile | Profile (Settings before Progress) |
| screens/07-add-sheet | Add Task sheet |
| screens/08-appearance | Appearance |

## Product tone (landed in code)
- Default theme: cream/ink + soft Haven purple (no cosmic purple→pink wash)
- Home: no crystal/flame chrome; level-up spectacle silenced
- Profile: identity + Settings first; Progress secondary; Appearance (not Theme Shop)
- Add Task: solid sheet; Starts/Ends stacked (no label clip)
- Auth Release: no Game Center / Test Account / Debug clear
