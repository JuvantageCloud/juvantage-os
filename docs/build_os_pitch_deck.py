#!/usr/bin/env python3
"""Generate Juvantage OS pitch deck (pptx)."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Juvantage_OS_Pitch.pptx"
ASSETS = Path.home() / ".cursor/projects/Users-johnuja-JuvantageOs/assets"
ICONS = Path.home() / "Desktop/JUVANTAGECLOUD/juvantage-cloud/public/media/icons"

# Brand — ink / paper / slate (not green-forward)
INK = RGBColor(0x0B, 0x12, 0x20)
SLATE = RGBColor(0x3D, 0x5A, 0x80)
MUTED = RGBColor(0x5C, 0x6B, 0x7A)
PAPER = RGBColor(0xF7, 0xF4, 0xEF)
CARD = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0x1C, 0x2D, 0x45)
WARM = RGBColor(0x8A, 0x5A, 0x3A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ALT = RGBColor(0xEE, 0xEA, 0xE3)
LINE = RGBColor(0xE5, 0xE0, 0xD8)
SOFT = RGBColor(0x9E, 0xC0, 0xE6)
SOFT2 = RGBColor(0xC8, 0xD0, 0xDC)
SOFT3 = RGBColor(0xA8, 0xB0, 0xBC)


def set_run(run, size=18, bold=False, color=INK, font="Calibri"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_text(shape, lines, default_size=16):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if isinstance(line, str):
            text, size, bold, color = line, default_size, False, INK
        else:
            text = line.get("t", "")
            size = line.get("s", default_size)
            bold = line.get("b", False)
            color = line.get("c", INK)
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(6)
        run = p.add_run()
        run.text = text
        set_run(run, size=size, bold=bold, color=color)


def fill(shape, color):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def rect(slide, left, top, width, height, color):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    fill(s, color)
    return s


def round_rect(slide, left, top, width, height, color):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    fill(s, color)
    return s


def title_bar(slide, eyebrow, title, subtitle=None):
    rect(slide, 0, 0, Inches(13.333), Inches(7.5), PAPER)
    rect(slide, 0, 0, Inches(0.12), Inches(7.5), ACCENT)
    box = slide.shapes.add_textbox(Inches(0.55), Inches(0.35), Inches(12), Inches(0.35))
    add_text(box, [{"t": eyebrow.upper(), "s": 11, "b": True, "c": SLATE}])
    box = slide.shapes.add_textbox(Inches(0.55), Inches(0.65), Inches(12), Inches(0.7))
    add_text(box, [{"t": title, "s": 32, "b": True, "c": INK}])
    if subtitle:
        box = slide.shapes.add_textbox(Inches(0.55), Inches(1.3), Inches(12), Inches(0.5))
        add_text(box, [{"t": subtitle, "s": 15, "c": MUTED}])


def bullet_block(slide, left, top, width, height, items, size=15):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.clear()
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = 0
        p.space_after = Pt(10)
        run = p.add_run()
        run.text = f"•  {item}"
        set_run(run, size=size, color=INK)


def try_image(slide, path, left, top, width, height=None):
    p = Path(path)
    if not p.exists():
        return None
    if height:
        return slide.shapes.add_picture(str(p), left, top, width=width, height=height)
    return slide.shapes.add_picture(str(p), left, top, width=width)


def build():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    # 1 — Title
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, Inches(13.333), Inches(7.5), ACCENT)
    rect(s, 0, Inches(5.6), Inches(13.333), Inches(1.9), INK)
    box = s.shapes.add_textbox(Inches(0.8), Inches(2.0), Inches(11.5), Inches(1))
    add_text(box, [{"t": "JUVANTAGE OS", "s": 44, "b": True, "c": WHITE}])
    box = s.shapes.add_textbox(Inches(0.8), Inches(3.0), Inches(11), Inches(1.2))
    add_text(
        box,
        [
            {
                "t": "What stalls gets closed — only after you approve.",
                "s": 22,
                "c": SOFT,
            }
        ],
    )
    box = s.shapes.add_textbox(Inches(0.8), Inches(5.9), Inches(11), Inches(1.2))
    add_text(
        box,
        [
            {"t": "Open-loop command layer for people & teams", "s": 16, "c": WHITE},
            {
                "t": "Personal daemon  ·  Teams control plane  ·  JUST™ suite ships today",
                "s": 14,
                "c": SOFT3,
            },
        ],
    )

    # 2 — Problem
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "The problem",
        "Inboxes aren’t work. They’re unfinished obligations.",
        "Messages pile up. Commitments hide inside threads. Priority is guesswork.",
    )
    cards = [
        ("Lost replies", "Someone assumed a teammate answered. SLA breached. Client gone cold."),
        ("Buried asks", "“Does Tuesday work?” never becomes a calendar event. No-show."),
        ("False urgency", "Noise looks like priority. Real loops age quietly for days."),
        ("Micromanage tax", "Dashboards that shame teams fail. People need help, not surveillance."),
    ]
    for i, (h, body) in enumerate(cards):
        x = Inches(0.55 + (i % 2) * 6.2)
        y = Inches(2.1 + (i // 2) * 2.3)
        c = round_rect(s, x, y, Inches(5.9), Inches(2.05), CARD)
        c.line.color.rgb = LINE
        box = s.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), Inches(5.3), Inches(1.5))
        add_text(
            box,
            [
                {"t": h, "s": 18, "b": True, "c": INK},
                {"t": body, "s": 14, "c": MUTED},
            ],
        )

    # 3 — What it is
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "Product",
        "Gemini helps you answer a thread you already found.",
        "Juvantage OS finds the threads that still owe a human — then closes them with approval.",
    )
    steps = [
        ("1 · Sense", "Ingest mail, chat, SMS, forms via APIs — not screen OCR."),
        ("2 · Extract", "Commitments, asks, appointments, todos, reply-owed signals."),
        ("3 · Score", "Priority, quiet/noise, ignore history, SLA age."),
        ("4 · Surface", "Digest / floating assist — helped, not monitored."),
        ("5 · Act", "Propose reply, calendar, assign — you approve first."),
        ("6 · Verify", "Loop closes when the action lands. Audit trail."),
    ]
    for i, (h, body) in enumerate(steps):
        x = Inches(0.45 + (i % 3) * 4.2)
        y = Inches(2.15 + (i // 3) * 2.4)
        c = round_rect(s, x, y, Inches(4.0), Inches(2.15), CARD)
        c.line.color.rgb = LINE
        box = s.shapes.add_textbox(x + Inches(0.25), y + Inches(0.3), Inches(3.5), Inches(1.6))
        add_text(box, [{"t": h, "s": 16, "b": True, "c": SLATE}, {"t": body, "s": 13, "c": INK}])

    # 4 — Priority & quiet (user's insight)
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "Intelligence layer",
        "Not every open loop deserves your attention.",
        "Importance scoring is product — before we fine-tune models.",
    )
    left = round_rect(s, Inches(0.55), Inches(2.1), Inches(6.0), Inches(4.8), CARD)
    left.line.color.rgb = LINE
    box = s.shapes.add_textbox(Inches(0.8), Inches(2.3), Inches(5.5), Inches(4.4))
    add_text(
        box,
        [
            {"t": "Score each loop", "s": 18, "b": True, "c": INK},
            {"t": "", "s": 8},
            {"t": "• Critical — SLA / money / safety / blocked deal", "s": 14, "c": INK},
            {"t": "• Important — reply owed, time-bound ask", "s": 14, "c": INK},
            {"t": "• Borderline — FYI, soft ask, low stake", "s": 14, "c": INK},
            {"t": "• Quiet / noise — newsletters, bots, skippable", "s": 14, "c": INK},
            {"t": "", "s": 8},
            {"t": "Personalization signals", "s": 16, "b": True, "c": SLATE},
            {"t": "• Your ignore / snooze / archive history by sender & type", "s": 14, "c": INK},
            {"t": "• Who you always answer vs never", "s": 14, "c": INK},
            {"t": "• Org policy (Teams): role, client tier, SLA rules", "s": 14, "c": INK},
        ],
    )
    right = round_rect(s, Inches(6.85), Inches(2.1), Inches(5.9), Inches(4.8), ACCENT)
    box = s.shapes.add_textbox(Inches(7.15), Inches(2.4), Inches(5.3), Inches(4.2))
    add_text(
        box,
        [
            {"t": "UX rule", "s": 18, "b": True, "c": WHITE},
            {"t": "", "s": 8},
            {
                "t": "Never lead with “3 commitments overdue.”",
                "s": 15,
                "b": True,
                "c": SOFT,
            },
            {
                "t": "That feels like surveillance. It fails.",
                "s": 14,
                "c": SOFT2,
            },
            {"t": "", "s": 8},
            {
                "t": "Lead with help: floating assist / morning digest — “Here’s what still needs you. Snooze, quiet, or finish.”",
                "s": 15,
                "c": WHITE,
            },
            {"t": "", "s": 8},
            {
                "t": "Quiet list is a feature. Users teach the system what doesn’t matter.",
                "s": 14,
                "c": SOFT2,
            },
        ],
    )

    # 5 — Personal vs Teams + media
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "Two skins · one product",
        "Personal daemon  ·  Teams open-loop ops",
    )
    try_image(
        s,
        ASSETS / "juvantage-os-mock-A-paper-ops.jpg",
        Inches(0.45),
        Inches(2.0),
        Inches(6.1),
        Inches(3.5),
    )
    try_image(
        s,
        ASSETS / "juvantage-os-mock-C-floating-daemon.jpg",
        Inches(6.75),
        Inches(2.0),
        Inches(6.1),
        Inches(3.5),
    )
    box = s.shapes.add_textbox(Inches(0.55), Inches(5.7), Inches(5.8), Inches(1.4))
    add_text(
        box,
        [
            {"t": "Personal", "s": 16, "b": True, "c": INK},
            {
                "t": "iMessage / Gmail → “3 replies owed · 1 unconfirmed · 2 aging todos” → approve → reply / calendar / snooze / quiet.",
                "s": 13,
                "c": MUTED,
            },
        ],
    )
    box = s.shapes.add_textbox(Inches(6.85), Inches(5.7), Inches(5.8), Inches(1.4))
    add_text(
        box,
        [
            {"t": "Teams", "s": 16, "b": True, "c": INK},
            {
                "t": "Shared inboxes · Slack/Teams · SMS → manager digest of stalled client loops — assign, approve, audit. Helped, not watched.",
                "s": 13,
                "c": MUTED,
            },
        ],
    )

    # 6 — Split session media
    s = prs.slides.add_slide(blank)
    title_bar(s, "The act moment", "Surface → guided fill → approve → done")
    try_image(
        s,
        ASSETS / "juvantage-os-mock-D-split-session.jpg",
        Inches(0.55),
        Inches(2.0),
        Inches(7.4),
        Inches(4.8),
    )
    box = s.shapes.add_textbox(Inches(8.2), Inches(2.2), Inches(4.6), Inches(4.5))
    add_text(
        box,
        [
            {"t": "Same loop for apps & packets", "s": 18, "b": True, "c": INK},
            {"t": "", "s": 8},
            {"t": "• Open editor or fill by voice", "s": 15, "c": INK},
            {"t": "• Field-by-field with you in control", "s": 15, "c": INK},
            {"t": "• Nothing submits until approve", "s": 15, "c": INK},
            {"t": "", "s": 8},
            {"t": "Business OS app", "s": 16, "b": True, "c": SLATE},
            {
                "t": "Same engine inside Juvantage OS for your businesses — alerts → investigate → recommend → approve → execute → verify (already in product positioning).",
                "s": 13,
                "c": MUTED,
            },
        ],
    )

    # 7 — Verticals
    s = prs.slides.add_slide(blank)
    title_bar(s, "Where money already leaks", "Active B2B problems — not hypotheticals")
    rows = [
        ("Agencies", "Shared inbox · Slack · SMS", "Double ownership / silence → SLA breach", "VP Client Services"),
        ("Clinics / services", "SMS · Email · WhatsApp", "Reschedule languishes → no-show / lost booking", "Practice manager"),
        ("Sales / RevOps", "Email · Teams · CRM notes", "Follow-ups die → pipeline leakage", "Head of RevOps"),
        ("Ops / multi-site", "Vendor mail · DocuSign", "Packets stall → can’t open / can’t pay", "COO / Ops"),
    ]
    headers = ["Vertical", "Channels", "Active pain", "Buyer"]
    # header row
    y0 = Inches(2.15)
    widths = [Inches(2.4), Inches(3.2), Inches(4.4), Inches(2.4)]
    x0 = Inches(0.55)
    for i, h in enumerate(headers):
        x = x0 + sum(widths[:i], Inches(0))
        cell = rect(s, x, y0, widths[i], Inches(0.45), ACCENT)
        box = s.shapes.add_textbox(x + Inches(0.1), y0 + Inches(0.08), widths[i] - Inches(0.15), Inches(0.35))
        add_text(box, [{"t": h, "s": 12, "b": True, "c": WHITE}])
    for r, row in enumerate(rows):
        y = y0 + Inches(0.45) + Inches(r * 0.95)
        bg = CARD if r % 2 == 0 else ALT
        for i, val in enumerate(row):
            x = x0 + sum(widths[:i], Inches(0))
            rect(s, x, y, widths[i], Inches(0.95), bg)
            box = s.shapes.add_textbox(x + Inches(0.12), y + Inches(0.2), widths[i] - Inches(0.2), Inches(0.7))
            add_text(box, [{"t": val, "s": 12, "c": INK}])

    # 8 — Measurables
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "Measurables",
        "If we can’t measure it, we don’t sell it.",
        "Product metrics = customer ROI story = pricing power.",
    )
    metrics = [
        ("Loop latency", "Time from commitment → resolution (hours)"),
        ("Reply-owed clear rate", "% of owed replies closed in 24h / 72h"),
        ("Appointment conversion", "% of “does X work?” → calendar event"),
        ("Quiet accuracy", "% of auto-quieted items user never un-quiets"),
        ("Assist acceptance", "% of proposals approved vs edited vs dismissed"),
        ("SLA breach avoided", "Count / $ impact of near-breaches caught"),
        ("No-show reduction", "Bookings recovered vs baseline (clinics)"),
        ("Owner clarity", "% loops with explicit owner (Teams)"),
    ]
    for i, (h, body) in enumerate(metrics):
        x = Inches(0.5 + (i % 4) * 3.15)
        y = Inches(2.15 + (i // 4) * 2.4)
        c = round_rect(s, x, y, Inches(3.0), Inches(2.15), CARD)
        c.line.color.rgb = LINE
        box = s.shapes.add_textbox(x + Inches(0.2), y + Inches(0.35), Inches(2.6), Inches(1.6))
        add_text(box, [{"t": h, "s": 14, "b": True, "c": SLATE}, {"t": body, "s": 12, "c": INK}])

    # 9 — Deploy + privacy + ML
    s = prs.slides.add_slide(blank)
    title_bar(s, "How it runs", "Deploy ladder · privacy · models")
    cols = [
        (
            "Deploy",
            [
                "1. SaaS control plane + connectors",
                "2. Mac / iPhone personal agents",
                "3. Private tenant / VPC",
                "4. In-cluster daemon (enterprise)",
                "Lead with 1–2. Cluster is an upsell.",
            ],
        ),
        (
            "Privacy",
            [
                "Official APIs / webhooks only",
                "Minimize retention of raw chat",
                "Store loop state + extracts",
                "Approve gate before any send",
                "Tenant isolation · audit log",
                "VPC when lawyers require it",
            ],
        ),
        (
            "Models (honest)",
            [
                "Start: LLM structured extract + rules",
                "Add: small classifiers (priority, quiet)",
                "Fine-tune later on labeled loops",
                "Eval harness > “train a model” lore",
                "You oversee labels & go/no-go",
            ],
        ),
    ]
    for i, (h, items) in enumerate(cols):
        x = Inches(0.45 + i * 4.25)
        c = round_rect(s, x, Inches(2.1), Inches(4.05), Inches(4.9), CARD)
        c.line.color.rgb = LINE
        box = s.shapes.add_textbox(x + Inches(0.25), Inches(2.3), Inches(3.55), Inches(0.4))
        add_text(box, [{"t": h, "s": 18, "b": True, "c": INK}])
        bullet_block(s, x + Inches(0.2), Inches(2.85), Inches(3.6), Inches(3.9), items, size=13)

    # 10 — ARR / $4M
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "Economics",
        "$500k ARR is a portfolio — rarely one logo.",
        "Path toward ~$4M enterprise value is B2B software ARR, not app tip jars.",
    )
    rows = [
        ("Prosumer seats", "~$360 / user / yr", "~1,390 users", "Hard — low WTP"),
        ("Team desks", "~$6k / team / yr", "~83 teams", "Viable PLG → sales"),
        ("Mid-market", "~$25k ACV", "~20 companies", "Founder-led pilots"),
        ("Enterprise+", "$50–150k ACV", "4–10 logos", "Needs proof + deploy"),
    ]
    y0 = Inches(2.2)
    widths = [Inches(2.8), Inches(2.8), Inches(2.8), Inches(3.6)]
    headers = ["Motion", "Price shape", "To hit $500k", "Notes"]
    x0 = Inches(0.55)
    for i, h in enumerate(headers):
        x = x0 + sum(widths[:i], Inches(0))
        rect(s, x, y0, widths[i], Inches(0.4), ACCENT)
        box = s.shapes.add_textbox(x + Inches(0.1), y0 + Inches(0.06), widths[i] - Inches(0.15), Inches(0.3))
        add_text(box, [{"t": h, "s": 12, "b": True, "c": WHITE}])
    for r, row in enumerate(rows):
        y = y0 + Inches(0.4) + Inches(r * 0.7)
        bg = CARD if r % 2 == 0 else ALT
        for i, val in enumerate(row):
            x = x0 + sum(widths[:i], Inches(0))
            rect(s, x, y, widths[i], Inches(0.7), bg)
            box = s.shapes.add_textbox(x + Inches(0.1), y + Inches(0.18), widths[i] - Inches(0.15), Inches(0.4))
            add_text(box, [{"t": val, "s": 13, "c": INK}])
    box = s.shapes.add_textbox(Inches(0.55), Inches(5.6), Inches(12), Inches(1.4))
    add_text(
        box,
        [
            {
                "t": "Typical SaaS multiples (illustrative): $500k ARR → ~$3–5M valuation range. $4M cash revenue in a year ≠ $500k ARR — cash needs larger ACVs or many logos. JUST apps (~$200) prove shipping; OS B2B is the leverage.",
                "s": 13,
                "c": MUTED,
            }
        ],
    )

    # 11 — Business OS app connection
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "One company stack",
        "JUST apps · Personal OS · Business OS · For Business",
    )
    layers = [
        ("JUST™", "Scan · KEEP · Line · Haven — live consumer suite"),
        ("OS Personal", "Daemon: open loops across life channels"),
        ("OS Business", "Same loop on business state: alerts → approve → act → verify"),
        ("OS Teams", "Org messaging / packets / SLAs — $ARR motion"),
        ("Care / sites", "Cash entry under For Business — not the identity"),
    ]
    for i, (h, body) in enumerate(layers):
        y = Inches(2.05 + i * 0.95)
        c = round_rect(s, Inches(0.55), y, Inches(12.2), Inches(0.85), CARD if i % 2 == 0 else ALT)
        box = s.shapes.add_textbox(Inches(0.85), y + Inches(0.18), Inches(11.5), Inches(0.55))
        add_text(box, [{"t": f"{h}  —  {body}", "s": 16, "c": INK}])

    # 12 — Ask / next
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, Inches(13.333), Inches(7.5), PAPER)
    rect(s, 0, 0, Inches(0.12), Inches(7.5), ACCENT)
    box = s.shapes.add_textbox(Inches(0.7), Inches(1.5), Inches(11.5), Inches(1))
    add_text(box, [{"t": "Next decisions (scope, not code yet)", "s": 28, "b": True, "c": INK}])
    bullets = [
        "Surface: Mac floating assist + digest  vs  browser extension — pick one for dogfood",
        "First channel: Gmail/Calendar (personal)  and/or  one Teams channel for a design partner",
        "Vertical pick: agencies OR clinics for first B2B narrative",
        "Labeling plan: 200–500 loops scored (critical → quiet) under your oversight",
        "Measurable pilot: 2–4 weeks, track loop latency + assist acceptance",
    ]
    bullet_block(s, Inches(0.7), Inches(2.7), Inches(11.5), Inches(3.5), bullets, size=16)
    box = s.shapes.add_textbox(Inches(0.7), Inches(6.4), Inches(11.5), Inches(0.6))
    add_text(
        box,
        [
            {
                "t": "Juvantage OS — observe → propose → approve → execute → verify",
                "s": 14,
                "b": True,
                "c": SLATE,
            }
        ],
    )

    # icons strip on title if present
    for i, name in enumerate(["just-scan.png", "keep.png", "line.png"]):
        try_image(prs.slides[0], ICONS / name, Inches(10.2 + i * 0.85), Inches(6.35), Inches(0.7), Inches(0.7))

    prs.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
