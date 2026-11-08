#!/usr/bin/env bash
# Push JUST app raw marketing stills into JohnUja/juvantage-cloud for Viktor.
set -euo pipefail

CLOUD="${HOME}/Desktop/JUVANTAGECLOUD/juvantage-cloud"
MEDIA="${CLOUD}/public/media"
SRC_M="${HOME}/Desktop/JUVANTAGECLOUD/marketing-screenshots"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -d "$CLOUD/.git" ]] || die "juvantage-cloud repo not found at $CLOUD"
[[ -f "$SRC_M/line/01-home.png" ]] || die "marketing-screenshots pack missing at $SRC_M"

mkdir -p "$MEDIA/line/raw" "$MEDIA/just-vault/raw" "$MEDIA/just-scan/raw" "$MEDIA/haven/raw" "$MEDIA/os/raw"

# Line — current decluttered home
cp "$SRC_M/line/01-home.png" "$MEDIA/line/homescreen.png"
cp "$SRC_M/line/01-home.png" "$MEDIA/line/raw/01-home.png"
cp "$SRC_M/line/01b-home-cta-row.png" "$MEDIA/line/raw/01b-home-cta-row.png"
cp "$SRC_M/line/02-home-line-status.png" "$MEDIA/line/raw/02-home-line-status.png"
cp "$SRC_M/line/03-scoring-bands.png" "$MEDIA/line/raw/03-scoring-bands.png"
cp "$SRC_M/line/04-add-expense.png" "$MEDIA/line/raw/04-add-expense.png"
cp "$SRC_M/line/05-add-expense-filled.png" "$MEDIA/line/raw/05-add-expense-filled.png"
cp "$SRC_M/line/06-home-after-expense.png" "$MEDIA/line/raw/06-home-after-expense.png"
cp "$SRC_M/line/07-overview.png" "$MEDIA/line/raw/07-overview.png"
cp "$SRC_M/line/08-settings.png" "$MEDIA/line/raw/08-settings.png"

# Keep
cp "$SRC_M/keep/01-home.png" "$MEDIA/just-vault/raw/01-home.png"
cp "$SRC_M/keep/01b-home-ready.png" "$MEDIA/just-vault/raw/01b-home-ready.png"
cp "$SRC_M/keep/03-space-photos.png" "$MEDIA/just-vault/raw/03-space-photos.png"
cp "$SRC_M/keep/04-space-documents.png" "$MEDIA/just-vault/raw/04-space-documents.png"
cp "$SRC_M/keep/05-space-ids.png" "$MEDIA/just-vault/raw/05-space-ids.png"
cp "$SRC_M/keep/06-space-receipts.png" "$MEDIA/just-vault/raw/06-space-receipts.png"
cp "$SRC_M/keep/07-add-file.png" "$MEDIA/just-vault/raw/07-add-file.png"
cp "$SRC_M/keep/08-launch.png" "$MEDIA/just-vault/raw/08-launch.png"
cp "$SRC_M/keep/01-home.png" "$MEDIA/just-vault/sim-01.png"

# Just Scan
cp "$SRC_M/just-scan/01-home.png" "$MEDIA/just-scan/raw/01-home.png"
cp "$SRC_M/just-scan/02-scanner.png" "$MEDIA/just-scan/raw/02-scanner.png"
cp "$SRC_M/just-scan/03-scan-entry.png" "$MEDIA/just-scan/raw/03-scan-entry.png"
cp "$SRC_M/just-scan/04-paywall.png" "$MEDIA/just-scan/raw/04-paywall.png"
cp "$SRC_M/just-scan/05-launch.png" "$MEDIA/just-scan/raw/05-launch.png"

# Haven
cp "$SRC_M/haven/01-home.png" "$MEDIA/haven/raw/01-home.png"
cp "$SRC_M/haven/02-timeline.png" "$MEDIA/haven/raw/02-timeline.png"
cp "$SRC_M/haven/03-goals.png" "$MEDIA/haven/raw/03-goals.png"
cp "$SRC_M/haven/04-profile.png" "$MEDIA/haven/raw/04-profile.png"
cp "$SRC_M/haven/05-add-sheet.png" "$MEDIA/haven/raw/05-add-sheet.png"

# OS
cp "$SRC_M/os/"*.png "$MEDIA/os/raw/" 2>/dev/null || true

cat > "$MEDIA/VIKTOR_RAW_ASSETS.md" << 'EOF'
# Raw assets for Viktor (creative director)

Repo: `JohnUja/juvantage-cloud`  
Path: `public/media/`

These are **raw product captures**. Build original high-converting creative (carousels, hooks, annotated frames, CTAs). Do **not** post raw screenshots.

## Cadence
- `@juvantagex`: 3 posts/day
- `@juvantagecloud`: 4 posts/day

## Where to look
| Product | Folder |
|---------|--------|
| Budget Line | `line/raw/` + `line/homescreen.png` (current decluttered home) |
| KEEP™ | `just-vault/raw/` |
| Just Scan | `just-scan/raw/` |
| Haven | `haven/raw/` |
| OS | `os/raw/` |
| Icons | `icons/` |
| Brand | `brand/` |

Prefer `*/raw/01-home.png` as the hero still. Do not invent UI not present in these frames.
EOF

echo "Files staged under public/media. Next: commit + push."
find "$MEDIA" -path '*/raw/*' -type f | wc -l
du -sh "$MEDIA/line/raw" "$MEDIA/just-vault/raw" "$MEDIA/just-scan/raw" "$MEDIA/haven/raw" "$MEDIA/os/raw"
