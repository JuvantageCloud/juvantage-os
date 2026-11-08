# Juvantage Avatar System

## Two products, two characters

| Surface | What | Why |
|---------|------|-----|
| **Juvantage OS** | One **agent mascot** (fixed look, teal) | Tap → blink → agent sheet. Personality, not a dresser. |
| **Haven** | **Customizable avatar** (Duo-style) | Skin, hair, eyes, clothes, suits. Profile identity. |

The photoreal / full-body 2D hero poses are optional marketing / story art — not the customizer base.

## Why modular beats “one PNG character”

Duolingo works because parts are **layers**:
head → skin → eyes → pupils → brows → mouth → hair → glasses → hat → body/suit

Then you animate **pupils / brows / blink**, not a flat photo.

## Catalog layout

```text
avatars/
  iterations/     # pick art direction (01–07)
  catalog/
    skin/ hair/ eyes/ brows/ mouth/ body/ accessories/
```

## Preview

Open `assets/motion/avatar-lab.html` (live modular demo + iterations grid).

## Lottie / Rive — realistic uses (not a game studio)

- Empty / success / streak moments
- Agent blink + tip popup
- Onboarding celebrate
- Suit unlock reactions
- **Not** an open-world game — interactive moments inside apps
