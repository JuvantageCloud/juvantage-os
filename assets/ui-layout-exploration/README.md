# 7 layout packs (full app map)

**Not themes.** One neutral skin. Seven ways to arrange the **same** product (`docs/OS_UI_MAP.md`).

| # | Folder | Structure |
|---|--------|-----------|
| 1 | `01-widened-sheet` | Nav + loop list + draft (spec default) |
| 2 | `02-inbox-command` | Inbox/Calendar/Context tabs + threads \| compose |
| 3 | `03-one-hero` | One obligation, queue on demand |
| 4 | `04-sheet-primary` | Work on quick sheet; Desktop = system only |
| 5 | `05-vertical-flow` | Connect → find → draft → approve spine |
| 6 | `06-command-rail` | Icon rail + editor + context column |
| 7 | `07-hub-home` | Service cards: Mail, Calendar, Screen, Voice, System |

## Every pack includes (18 artboards)

Sign-in · Connect · Agent idle/nudge · Sheet empty/draft/closed/screen/voice · Bridge · **Work home (layout differs)** · Evidence · Context 4h · Synced feed · Settings · Privacy · Audit · Tray.

**Sizes:** Desktop **980×680**, sheet **340×560**, solo **1024×640**.

## Open

[`index.html`](./index.html) → pick a pack → scroll `gallery.html`.

## PNG files (for side-by-side in Finder)

```bash
npm run ui:layout
npm install -D playwright && npx playwright install chromium
npm run ui:layout:png
```

Images land in `NN-name/images/*.png`.

## Pick

Fill [`PICKER.md`](./PICKER.md) with one folder number (or a mix for work vs settings shell).