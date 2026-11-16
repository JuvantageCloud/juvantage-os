# Layout alternatives (not color packs)

You said you don’t like the **layout**. The 7 folders under `ui-exploration/` only re-skinned the *same* structure:

- Left nav → big Work page → list + detail split → chips everywhere.

These four files are **different information architecture** for the same MVP (mail → draft → approve). One neutral visual style so you’re only judging structure.

| File | Idea | Good if you want… |
|------|------|-------------------|
| [A-inbox-command.html](./A-inbox-command.html) | Mail list is the home; draft is always right | Gmail power-user, obligations obvious |
| [B-one-hero.html](./B-one-hero.html) | One card, no list on first screen | Less clutter, float + sheet mentality |
| [C-sheet-primary.html](./C-sheet-primary.html) | Desktop = settings/sync only; work on sheet | Jos lives in the teal card |
| [D-vertical-flow.html](./D-vertical-flow.html) | Single scrolling column, steps 1→2→3 | Onboarding brain, no parallel panes |

Open in browser at **980×680** artboards. Pick **one letter (A–D)** or mix: “A’s mail list + C’s no desktop work.”

After you pick, we **change the real React app** — not another style folder.