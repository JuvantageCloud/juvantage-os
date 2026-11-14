# Next sprint — float-first close context

**Goal:** The floating agent + quick sheet *is* the product. Desktop is secondary.

## Mental model (locked)

| Surface | What it is | What you do |
|---------|------------|-------------|
| **Float** | Nudge that something needs closing | Click → suggestion sheet |
| **Suggestion sheet** | Preview + OS tool for this context | Refine → **Approve** closes context |
| **Desktop → Work** | Wider list of open contexts | Same close engine |
| **Desktop → Google** | Link accounts once | Sign in / refresh |
| **Desktop → Synced** | Raw mail/calendar feed | Glance only |

**Approve** = close this context (send / book / note) — not “always Gmail.”  
Jos picks the **internal tool** (ModalityHost) from object type.

---

## Build order

### A · Float-first (this PR)

1. [x] Quick sheet as “Suggestion” — one hero context + tool surface
2. [x] Plain-English Approve closes context
3. [x] JOS-3: clip/ambient owned by sheet only (not Desktop too)

### B · Next

1. [ ] Bias sheet to **1** suggestion (ranker)
2. [ ] Success pulse on float after Approve
3. [ ] JOS-8/9/10 security before wider dogfood
4. [ ] Episodic OCR (V2) — after float path feels right

### C · Dogfood

1. [x] Live Gmail Approve once
2. [ ] Days 2–14 journal

---

## Done when

You say: *“Float nudges me → I preview → Jos opens the right tool → Approve closes the context.”*
