# Motion manifest

| File | Path | Type | Loop | Apps | Status | Notes |
|------|------|------|------|------|--------|-------|
| `loader-dots.json` | `shared/lottie/` | UI | yes | all | ready | Teal pulsing dots |
| `success-check.json` | `shared/lottie/` | UI | once | all | ready | Circle pop + check draw |
| `empty-state.json` | `shared/lottie/` | UI | soft | all | ready | Floating card + spark |
| `mascot-idle-loop.json` | `characters/` | character | yes | optional | ready | Geometric mascot bob + blink |
| `ref-hero.png` | `characters/source/` | ref | — | — | source | Original 3D-style hero |
| `hero-2d-idle.jpg` | `characters/poses/` | character | — | apps | ready | 2D idle base |
| `hero-2d-celebrate.jpg` | `characters/poses/` | character | — | apps | ready | Victory / success moment |
| `hero-2d-wave.jpg` | `characters/poses/` | character | — | apps | ready | Friendly wave / welcome |

Preview: open `assets/motion/preview.html` in a browser.

Regenerate Lottie starters: `node assets/motion/_source/generate-starters.mjs`
