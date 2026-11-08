# Motion — Lottie + UI / character animations

Shared motion library for JUST apps (Line, Keep, Just Scan, Haven) and Juvantage OS.

This is **separate from** `assets/app-demos/` (screenshots/videos).  
Put playback-ready files here; keep After Effects / Figma / Rive sources in `_source/`.

---

## Folder map

```text
assets/motion/
  shared/lottie/     Cross-app Lottie (.json / .lottie) — loaders, success, empty
  shared/ui/         Tiny motion specs (JSON notes) or SVG for micro-UI
  characters/        Mascot / character loops (idle, wave, celebrate, think)
  apps/<app>/        App-specific clips (e.g. line/budget-pulse.json)
  _source/           Editable masters (AE, Rive, Figma) — not shipped in apps
```

| Put here | Don’t put here |
|----------|----------------|
| `.json` / `.lottie` ready for runtime | Screen recordings (`*.mp4`) → `app-demos/` |
| Short loops (1–4s), transparent bg | Full marketing walkthroughs |
| Named by intent: `success-check.json` | Random downloads with stock names |

---

## Naming

```text
{intent}-{variant}.{ext}

Examples:
  success-check.json
  empty-inbox.json
  loader-dots.json
  mascot-idle-loop.json
  line-budget-pulse.json
```

Kebab-case. Prefer one animation = one job (success, empty, loading, celebrate).

---

## What you need to set up

### 1. Make the animations (pick one path)

| Path | Best for | Cost | Notes |
|------|----------|------|--------|
| **[LottieFiles](https://lottiefiles.com)** | Fast start, stock + editor | Free tier OK | Export `.json` or `.lottie` |
| **After Effects + Bodymovin / LottieFiles plugin** | Custom brand motion | AE license | Highest control |
| **Rive** | Interactive state machines | Free tier | Different runtime than Lottie — use only if you want interactivity |
| **SwiftUI / CSS only** | Micro-UI (fade, spring, progress) | Free | No Lottie file needed — code motion |

**Recommendation for your apps:** start with **LottieFiles** for empty/success/loader, plus **SwiftUI** springs for buttons and sheets. Add a character later in `characters/`.

### 2. iOS runtime (Line / Keep / Scan / Haven / OS)

In each Xcode project (or shared SPM package later):

1. Add package: **[lottie-ios](https://github.com/airbnb/lottie-ios)**  
   - SPM URL: `https://github.com/airbnb/lottie-ios`
2. Drop `.json` / `.lottie` into the app target (or copy from this folder into `Resources/Motion/`).
3. Play with `LottieView` / `LottieAnimationView`.

Example (SwiftUI):

```swift
import Lottie
import SwiftUI

struct MotionView: View {
  var body: some View {
    LottieView(animation: .named("success-check"))
      .playing(loopMode: .playOnce)
      .frame(width: 120, height: 120)
  }
}
```

**DotLottie (optional):** smaller files — use `.lottie` from LottieFiles and the same `lottie-ios` package (recent versions support it).

### 3. Web / marketing site (if needed)

```bash
npm i lottie-react
# or: npm i lottie-web
```

Ship the same JSON from `shared/lottie/` so iOS and web stay in sync.

### 4. Keep this repo as source of truth

Workflow:

1. Design / download → save into `assets/motion/...`
2. Log it in `MANIFEST.md`
3. Copy (or script-sync) into each app’s `Resources/Motion/`
4. Reference by filename only — no CDN dependency for core UX

---

## Starters (already made)

| File | Where | Used for |
|------|-------|----------|
| `loader-dots.json` | `shared/lottie/` | Loading states |
| `success-check.json` | `shared/lottie/` | Save / scan / pay done |
| `empty-state.json` | `shared/lottie/` | First-run / empty lists |
| `mascot-idle-loop.json` | `characters/` | **LOCKED OS agent symbol** — do not overwrite |

Open `live-lab.html` for the locked agent. Symbol policy: `docs/OS_PRODUCT.md` §2. Regenerate UI starters: `node _source/generate-starters.mjs`.

---

## Character vs UI motion

| Type | Folder | Guidance |
|------|--------|----------|
| **UI motion** | `shared/lottie/`, `shared/ui/` | Abstract, brand colors, no face. Safe everywhere. |
| **Character** | `characters/` | One mascot style. Idle loop + 2–3 reactions max to start. |
| **App story** | `apps/<name>/` | Only when a feature needs a unique beat. |

Don’t put a character on every screen — one empty state + one success is enough for v1.

---

## Not needed yet

- Unity
- Custom game engine
- Frame-by-frame sprite sheets (unless you deliberately want pixel art)

Those are heavier. Lottie + SwiftUI covers app polish.
