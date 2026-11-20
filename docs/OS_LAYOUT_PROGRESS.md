# Layout progress — workstation shape (not branding)

**North star:** Gemini kit `juvantage_os_shippable_ui_kit_v2` (local Desktop copy — interactive prototype + retina PNGs).  
**We are matching structure / IA**, not colors or final brand. Theming stays open (`assets/ui-exploration/`, `assets/ui-layout-exploration/`).

**Product line:** Fuse cross-app context → **liveness** → **main canvas = modality** → sheet preview + Approve. Connectors are ears, not home. See [`OS_CONTEXT_FIRST_PLAN.md`](./OS_CONTEXT_FIRST_PLAN.md).

**Last updated:** 2026-11-16

---

## Layout model (target shape)

```text
DESKTOP ~980×680
┌──────────────────────────────────────────────────────────────┐
│ toolbar: traffic · title · sensor · undock · queue toggle     │
├──────────┬───────────────────────────────┬────────────────────┤
│  Queue   │  Hero banner + ModalityHost   │  Evidence rail     │
│  drawer  │  (mail / doc / code / cal…)   │  (context fuse)    │
│  ~220px  │  flex-1 canvas                │  ~260px optional   │
└──────────┴───────────────────────────────┴────────────────────┘

QUICK SHEET ~340×560     SOLO ~112×128
  same loop, mini           presence / nudge
  ModalityHost + Approve    opens sheet
```

---

## Scorecard (shape & layout only)

| Area | Target (kit) | In product today | % | Notes |
|------|----------------|------------------|---|--------|
| **Brain: one hero** | Ranked pick, mail-first | `pickSheetHero`, sort on API | **90** | Queue logic exists; not always “modality label” in UI |
| **Modality host (center)** | Canvas dominates window | `ModalityHost` in detail pane | **55** | Pane is ~40% width list+detail; not full workstation grid |
| **Queue drawer** | Persistent left rail, cards | Opt-in “Show queue” + list column | **50** | `focus-mode` hides list — right idea, wrong chrome |
| **Evidence rail** | Always-visible right column | `EvidenceDrawer` collapsible | **40** | API `GET /os/loops/:id/context` wired; UI not a rail |
| **Toolbar** | Unified top bar + sensor pill | Custom title bar + side nav | **25** | Nav is **left rail** (Close / Synced / Google / Settings) |
| **Quick sheet = previewer** | Slim mirror of desktop draft | Full `ModalityHost` + hero card | **65** | Works functionally; not “semi-popup beside main” yet |
| **Solo float** | Tiny agent only | Lottie + badge | **80** | Size/behavior OK; polish TBD |
| **Sheet ↔ Desktop** | Same `loopId`, draft continuity | Deep link + selection | **85** | Matches `OS_UI_MAP` continuity rule |
| **Modalities** | mail, doc, **code**, calendar | mail, calendar, structured note | **45** | No `code_task` surface in `ModalityId` |
| **macOS window chrome** | Vibrancy, 980×680 frame | Electron window, cream sheet theme | **30** | Swift host (`apps/macos`) partial |
| **Branding / theme** | Dark/light kit tokens | Mixed (sheet cream vs desktop) | **15** | Intentionally unset |

**Overall layout alignment (weighted): ~52%** — backend + close path ahead of shell geometry.

---

## By surface

### Desktop “Close” (home)

| Item | Status |
|------|--------|
| Default land on hero obligation | ✅ `focus-mode`, `pickSheetHero` |
| Main job = edit in integrated tool | ⚠️ ModalityHost present but shares row with list |
| Queue secondary | ✅ Hidden by default |
| Filters secondary | ✅ Behind “Filters & sync” |
| Hero banner (title, modality badge, actions) | ❌ Detail header is plain, not kit banner |
| Right evidence rail | ❌ Drawer only |
| Top workstation toolbar | ❌ |
| Code / doc-specific layouts | ⚠️ Doc ≈ `structured_note`; code mock only |

### Quick sheet

| Item | Status |
|------|--------|
| One hero | ✅ |
| Draft + Approve | ✅ |
| Open Desktop → same loop | ✅ |
| “Previewer” relationship to full window | ❌ Feels like primary surface, not satellite |
| Quiet / Snooze | ✅ |

### Brain / API (enables layout)

| Item | Status |
|------|--------|
| Context pack / evidence lines | ✅ `osLoopContext`, fuse |
| Modality routing | ✅ `resolveModalityId` |
| Mail-first ordering | ✅ `sortLoopsForWork` |
| Propose → approve → execute | ✅ Phase 4 |

---

## Engineering backlog (layout order)

Do in order — each step unlocks the next visual tier.

1. **L1 — Workstation grid** — Replace `loops-layout` list+detail with `queue-drawer | modality-canvas | evidence-rail` (CSS grid); keep behavior flags (`queueOpen`, `evidenceOpen`).
2. **L2 — Hero banner** — Obligation row above ModalityHost (eyebrow, modality badge, Approve/Quiet in banner).
3. **L3 — Evidence rail** — Default-open on Desktop; drawer on sheet; same `fetchLoopContext` data.
4. **L4 — Top toolbar** — Move undock / queue / sensor into one bar; slim or collapse left **app** nav into icons + settings.
5. **L5 — Sheet as satellite** — Visual + windowing: sheet shows trimmed chrome (“preview mode”); Desktop is canonical editor (optional: side-by-side dev flag).
6. **L6 — Modality depth** — Dedicated `doc_edit` chrome; add `code_task` to `ModalityId` + surface (even stub + monospace editor).
7. **L7 — Swift shell parity** — `apps/macos` WebKit hosts same routes; vibrancy/native titlebar.

**Branding pass (parallel, later):** pick one exploration pack → design tokens in `packages/shared` or CSS variables → sheet + desktop unified.

---

## Product gates (unchanged from roadmap)

| Gate | Status |
|------|--------|
| Phases 0–5 (close loop + desktop home) | ✅ |
| Quartet gate | ✅ |
| Phase 6 — 14-day dogfood | ⏳ Human |
| Layout L1–L3 (this doc) | 🔲 Not started |
| OS_UI_MAP rewrite (Modality home vs “Loops list”) | 🔲 Draft in kit; map still list-centric |

---

## How to use this doc

- After a layout sprint, bump **%** and check **Status** cells.
- Reference kit: open local `index_interactive_prototype.html` (not in repo).
- Implementation anchors: `Desktop.tsx`, `QuickSheet.tsx`, `ModalityHost.tsx`, `desktop.css`, `modality-surfaces.css`.