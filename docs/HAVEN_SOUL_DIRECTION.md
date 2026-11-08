# Haven — Soul Direction (working)

**Status:** capture from product conversation 2026-10-16  
**Not OS.** Juvantage OS gets a small floating **agent blob**. Haven gets **fox companion + customizer + mood jars + alive UX**.

---

## The real problem (your words, locked)

Haven has function but no soul. Pages feel dead, fonts thin, themes out of sync, onboarding → home → goals → calendar don’t feel like one world. Adding a task is too heavy (popup → name → time → color → …) and demotivating. Mood jars are a spark — but need to feel physical and rewarding. Character should make you want to come back without becoming a chat pet.

---

## Three character lanes (don’t mix)

| Lane | App | What |
|------|-----|------|
| **OS agent blob** | Juvantage OS | Tiny floating Lottie/Rive companion. Tap → blink → agent sheet. |
| **Haven fox** | Haven | Warm fox mascot through onboarding + quiet presence in-app. Ride-or-die toy energy — not a chatbot. |
| **Haven avatar dresser** | Haven profile | Customizable YOU (skin/hair/clothes). Inspired by Duo *system*, **not** Duo look. Distinct art so we stay clear of copyright. |

---

## Product bets to make Haven feel alive

1. **One visual system** — one font family, one color language, theme tokens shared across home / goals / calendar / profile / jars.
2. **One-tap capture** — add task = type + enter (smart defaults for time/color). Details optional, not a wall.
3. **Fox as glue** — appears in onboarding, empty states, gentle nudges (“jar almost full”), never spammy chat.
4. **Mood jars as the loop** — daily mood → marble in jar → fill → cash for theme / coin / diamond. Jars are the reason to return.
5. **Physics jars (later)** — marbles with real motion; tilt/shake on jars page. Prefer **Rive** (or SpriteKit) over Lottie for physics. Stick to **one** runtime once we pick.
6. **Avatar dresser in profile** — unlock cosmetics from jar rewards so character + economy connect.

---

## Tech convention (decide once)

| Need | Tool |
|------|------|
| Simple UI loops (loader, success, blink) | **Lottie** |
| Interactive / physics / state machines (jars, fox reactions) | **Rive** (or native SpriteKit for jars) |
| Don’t mix three engines in one screen | Pick Rive for Haven “alive” moments if jars need physics |

Recommendation: **Lottie for OS agent**, **Rive for Haven fox + jars** when we build physics.

---

## Next build order (when you say go)

1. Lock OS agent concept (01–07) → ship idle Lottie in OS  
2. Lock Haven fox look → onboarding + empty states  
3. Simplify add-task flow  
4. Theme token pass (kill “dead flat”)  
5. Mood jar visual + reward loop  
6. Avatar dresser v1 (original style, not Duo clone)
