# Close surface (ModalityHost) — V1 target

The right column is **not** a generic title/body form. `ModalityHost` picks one surface from loop `objectType`, `source`, and proposal kind.

| Signal | Surface | V1 behavior | V2+ |
|--------|---------|-------------|-----|
| Mail / reply | `MailComposeSurface` | To, subject, body, attachment download when `evidence.attachments[]` | Live Gmail attachment fetch |
| Clip / episodic | `ClipContextSurface` | App + window + close step | Fuse multi-app context |
| PDF | `PdfFormSurface` | Label: value → inputs | In-app PDF render + field OCR |
| Code / diff body | `CodeDiffSurface` | Red/green lines, multi-file later | Pull hunks from repo + Cursor agent |
| Calendar | structured / event | TBD event compose | Google event lock |

**Brain** owns routing (`resolveModalityId` + host overrides). **Desktop** only renders.

**Files on disk (macOS):**

- `~/Downloads/JuvantageOS` — attachment downloads  
- `~/Library/Application Support/JuvantageOS` — app data  
- `~/Library/Application Support/JuvantageOS/packages` — connector packages  

Jira: **JOS-28** (scheduled approve, FN quick answers, visual regression).