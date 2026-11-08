#!/usr/bin/env python3
"""Juvantage OS — MVP Product Plan deck (visual diagrams + mocks)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Juvantage_OS_MVP_Product_Plan.pptx"
DIAG = ROOT / "docs" / "pitch-diagrams"
ASSETS = Path.home() / ".cursor/projects/Users-johnuja-JuvantageOs/assets"

INK = RGBColor(0x0B, 0x12, 0x20)
SLATE = RGBColor(0x3D, 0x5A, 0x80)
MUTED = RGBColor(0x5C, 0x6B, 0x7A)
PAPER = RGBColor(0xF7, 0xF4, 0xEF)
CARD = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0x1C, 0x2D, 0x45)
LINE = RGBColor(0xE5, 0xE0, 0xD8)
ALT = RGBColor(0xEE, 0xEA, 0xE3)
SOFT = RGBColor(0x9E, 0xC0, 0xE6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
OK = RGBColor(0x2F, 0x6B, 0x4F)
NO = RGBColor(0x8B, 0x3A, 0x3A)

# Pillow palette
P = {
    "paper": (247, 244, 239),
    "ink": (11, 18, 32),
    "slate": (61, 90, 128),
    "muted": (92, 107, 122),
    "card": (255, 255, 255),
    "accent": (28, 45, 69),
    "line": (229, 224, 216),
    "soft": (158, 192, 230),
    "ok": (47, 107, 79),
    "ok_bg": (220, 236, 228),
    "no": (139, 58, 58),
    "no_bg": (244, 228, 228),
    "warm": (138, 90, 58),
    "box": (238, 234, 227),
}


def font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(draw, xy, fill, r=18, outline=None, width=2):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def center_text(draw, box, text, fnt, fill):
    x0, y0, x1, y1 = box
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((x0 + (x1 - x0 - tw) / 2, y0 + (y1 - y0 - th) / 2), text, font=fnt, fill=fill)


def wrap_text(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def arrow_h(draw, x0, y, x1, fill=P["slate"], w=3):
    draw.line((x0, y, x1 - 10, y), fill=fill, width=w)
    draw.polygon([(x1, y), (x1 - 12, y - 7), (x1 - 12, y + 7)], fill=fill)


def arrow_v(draw, x, y0, y1, fill=P["slate"], w=3):
    draw.line((x, y0, x, y1 - 10), fill=fill, width=w)
    draw.polygon([(x, y1), (x - 7, y1 - 12), (x + 7, y1 - 12)], fill=fill)


# ── Diagram generators ──────────────────────────────────────────────


def diag_pipeline():
    W, H = 1600, 720
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    title = font(36, True)
    body = font(22)
    small = font(18)
    d.text((48, 28), "Core pipeline — same engine for Personal & Teams", font=title, fill=P["ink"])
    stages = [
        ("Connectors", "APIs / webhooks\nfiles · mail · chat"),
        ("Normalize", "Threads · docs\nevents · fields"),
        ("Loop graph", "One object\nlinks all sources"),
        ("Score", "Critical → Quiet\nignore history"),
        ("Surface", "Digest / float\nguided fill"),
        ("Propose", "Draft action\nNOT sent yet"),
        ("APPROVE", "Human / RBAC\ngate"),
        ("Execute", "Connector\nadapters"),
        ("Verify", "Confirm done\nclose loop"),
    ]
    box_w, box_h, gap = 148, 150, 18
    total = len(stages) * box_w + (len(stages) - 1) * gap
    x0 = (W - total) // 2
    y = 140
    for i, (h, sub) in enumerate(stages):
        x = x0 + i * (box_w + gap)
        fill = P["accent"] if h == "APPROVE" else P["card"]
        tc = P["card"] if h == "APPROVE" else P["ink"]
        sc = P["soft"] if h == "APPROVE" else P["muted"]
        rounded(d, (x, y, x + box_w, y + box_h), fill, r=16, outline=P["line"])
        d.text((x + 12, y + 16), h, font=font(20, True), fill=tc)
        for li, line in enumerate(sub.split("\n")):
            d.text((x + 12, y + 56 + li * 26), line, font=small, fill=sc)
        if i < len(stages) - 1:
            arrow_h(d, x + box_w + 2, y + box_h // 2, x + box_w + gap - 2)
    # legend
    rounded(d, (48, 360, W - 48, H - 40), P["card"], r=20, outline=P["line"])
    d.text((80, 390), "Approve = sign a staged execution plan", font=font(26, True), fill=P["ink"])
    notes = [
        "• Proposal may call gmail.send, calendar.insert, pdf.writeField, portal.submit, slack.post — only after the gate.",
        "• ML extracts & scores. Daemon owns state, timers, verify. UI never invents authority.",
        "• Personal: you approve. Teams: you / lead / role per RBAC policy.",
    ]
    for i, n in enumerate(notes):
        d.text((80, 450 + i * 42), n, font=body, fill=P["muted"])
    path = DIAG / "01-pipeline.png"
    im.save(path, quality=92)
    return path


def diag_loop_graph():
    W, H = 1600, 900
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 28), "Context retrieval — loop graph (not “one model sees all”)", font=font(34, True), fill=P["ink"])

    sources = [
        (80, 160, "Gmail", "Re: Application\nfollow-up"),
        (80, 340, "Portal", "lease.pdf\nuploaded"),
        (80, 520, "PDF", "Riverside\napp.pdf"),
        (80, 700, "Calendar", "Tue 2pm?\nask open"),
    ]
    for x, y, h, sub in sources:
        rounded(d, (x, y, x + 260, y + 130), P["card"], outline=P["line"])
        d.text((x + 20, y + 18), h, font=font(24, True), fill=P["slate"])
        for i, line in enumerate(sub.split("\n")):
            d.text((x + 20, y + 58 + i * 28), line, font=font(20), fill=P["ink"])
        arrow_h(d, x + 270, y + 65, 520)

    rounded(d, (540, 280, 980, 620), P["accent"], r=24)
    d.text((580, 320), "LOOP", font=font(22, True), fill=P["soft"])
    d.text((580, 360), "riverside-apt", font=font(36, True), fill=P["card"])
    for i, line in enumerate(
        [
            "People · dates · fields",
            "Reply owed · visit unconfirmed",
            "Packet progress 2/6",
            "Pointers → sources (min raw)",
        ]
    ):
        d.text((580, 430 + i * 36), "•  " + line, font=font(22), fill=P["soft"])

    arrow_h(d, 990, 450, 1120)
    outs = [
        (1140, 200, "Score", "Important"),
        (1140, 380, "Surface", "Digest item"),
        (1140, 560, "Suggest", "Emergency contact\nAlex · 415-…"),
    ]
    for x, y, h, sub in outs:
        rounded(d, (x, y, x + 380, y + 140), P["card"], outline=P["line"])
        d.text((x + 24, y + 22), h, font=font(24, True), fill=P["slate"])
        for i, line in enumerate(sub.split("\n")):
            d.text((x + 24, y + 62 + i * 30), line, font=font(20), fill=P["ink"])
        arrow_h(d, 990, 450, x) if False else None
    # arrows to outs
    arrow_h(d, 990, 280, 1130)
    d.line((1050, 280, 1050, 630), fill=P["slate"], width=3)
    arrow_h(d, 1050, 450, 1130)
    arrow_h(d, 1050, 630, 1130)

    path = DIAG / "02-loop-graph.png"
    im.save(path, quality=92)
    return path


def diag_approve_sequence():
    W, H = 1600, 820
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 24), "What “Approve” does under the hood", font=font(34, True), fill=P["ink"])

    actors = ["UI", "Daemon", "Loop store", "Gmail API", "Calendar API"]
    xs = [180, 480, 780, 1080, 1380]
    for x, a in zip(xs, actors):
        rounded(d, (x - 90, 90, x + 90, 150), P["accent"], r=14)
        center_text(d, (x - 90, 90, x + 90, 150), a, font(20, True), P["card"])
        d.line((x, 150, x, 760), fill=P["line"], width=2)

    steps = [
        (200, 0, 1, "Tap Approve on proposal"),
        (260, 1, 2, "Load plan + check RBAC / policy"),
        (320, 1, 2, "Mark proposal ACCEPTED"),
        (400, 1, 3, "gmail.reply (if in plan)"),
        (480, 1, 4, "calendar.insert (if in plan)"),
        (560, 3, 1, "messageId / eventId"),
        (620, 4, 1, "event confirmation"),
        (700, 1, 2, "Verify + close / advance loop"),
        (760, 1, 0, "UI: Done · next field / next loop"),
    ]
    for y, a, b, label in steps:
        x0, x1 = xs[a], xs[b]
        if x1 < x0:
            x0, x1 = x1, x0
            d.line((xs[b], y, xs[a], y), fill=P["slate"], width=2)
            arrow_h(d, xs[b] + 20, y, xs[a] - 5)
        else:
            d.line((xs[a], y, xs[b], y), fill=P["slate"], width=2)
            arrow_h(d, xs[a] + 20, y, xs[b] - 5)
        d.text((min(xs[a], xs[b]) + 20, y - 28), label, font=font(18), fill=P["ink"])

    path = DIAG / "03-approve-sequence.png"
    im.save(path, quality=92)
    return path


def diag_personal_journey():
    W, H = 1600, 780
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 28), "Personal (customer) — morning loop", font=font(34, True), fill=P["ink"])
    steps = [
        ("Wake", "Daemon scanned\nnightly + live"),
        ("Digest", "3 replies owed\n1 unconfirmed\n2 aging todos"),
        ("Triage", "Open · Quiet\nSnooze · Later"),
        ("Act", "Guided fill\nor draft reply"),
        ("Approve", "You sign\nthe plan"),
        ("Done", "Verify closes\nloop"),
    ]
    for i, (h, sub) in enumerate(steps):
        x = 60 + i * 255
        y = 160
        rounded(d, (x, y, x + 230, y + 280), P["card"], r=20, outline=P["line"])
        rounded(d, (x, y, x + 230, y + 64), P["accent"], r=20)
        # fix bottom of header look
        d.rectangle((x, y + 40, x + 230, y + 64), fill=P["accent"])
        center_text(d, (x, y, x + 230, y + 64), f"{i+1}. {h}", font(22, True), P["card"])
        for li, line in enumerate(sub.split("\n")):
            d.text((x + 20, y + 100 + li * 36), line, font=font(22), fill=P["ink"])
        if i < len(steps) - 1:
            arrow_h(d, x + 235, y + 140, x + 250)
    rounded(d, (60, 500, W - 60, H - 40), P["box"], r=18)
    d.text((90, 540), "Surfaces", font=font(24, True), fill=P["ink"])
    d.text(
        (90, 590),
        "Mac floating assist  ·  Morning digest window  ·  Split-session guided fill  ·  Quiet list (learned skips)",
        font=font(22),
        fill=P["muted"],
    )
    d.text(
        (90, 650),
        "MVP channels: Gmail + Calendar first. iMessage / PDF packets next. Slack DMs optional personal connector.",
        font=font(22),
        fill=P["muted"],
    )
    path = DIAG / "04-personal-journey.png"
    im.save(path, quality=92)
    return path


def diag_teams_journey():
    W, H = 1600, 820
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 28), "Teams (B2B) — shared workstream, not everyone’s Slack", font=font(32, True), fill=P["ink"])

    # left: org
    rounded(d, (48, 120, 520, 760), P["card"], outline=P["line"], r=20)
    d.text((80, 150), "Org tenant", font=font(26, True), fill=P["ink"])
    for i, t in enumerate(
        [
            "Shared inbox / Twilio line",
            "Client Teams or Slack workspace*",
            "Packet / portal folders",
            "SLA policies · client tiers",
            "Audit log · retention",
        ]
    ):
        rounded(d, (80, 220 + i * 90, 480, 290 + i * 90), P["box"], r=12)
        d.text((100, 240 + i * 90), t, font=font(20), fill=P["ink"])
    d.text((80, 700), "*Only org-connected channels", font=font(18), fill=P["muted"])

    arrow_h(d, 530, 420, 620)

    # middle roles
    rounded(d, (640, 120, 1040, 760), P["accent"], r=20)
    d.text((680, 150), "RBAC views", font=font(26, True), fill=P["card"])
    roles = [
        ("IC", "Assigned-to-me loops\nApprove own sends"),
        ("Lead", "Team digest\nAssign · escalate"),
        ("Admin", "Connectors · policy\nRetention · billing"),
    ]
    for i, (h, sub) in enumerate(roles):
        y = 220 + i * 160
        rounded(d, (680, y, 1000, y + 130), (40, 60, 90), r=14)
        d.text((710, y + 20), h, font=font(24, True), fill=P["soft"])
        for li, line in enumerate(sub.split("\n")):
            d.text((710, y + 60 + li * 28), line, font=font(20), fill=P["card"])

    arrow_h(d, 1050, 420, 1140)

    # right outcomes
    rounded(d, (1160, 120, 1550, 760), P["card"], outline=P["line"], r=20)
    d.text((1200, 150), "Outcomes", font=font(26, True), fill=P["ink"])
    for i, t in enumerate(
        [
            "Owner on every loop",
            "SLA clock visible",
            "Stalls → lead digest",
            "Approve → execute",
            "Verify → close",
            "Helped, not watched",
        ]
    ):
        d.text((1200, 230 + i * 70), "→  " + t, font=font(22), fill=P["ink"])

    path = DIAG / "05-teams-journey.png"
    im.save(path, quality=92)
    return path


def diag_deploy():
    W, H = 1600, 780
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 28), "Deployment ladder", font=font(34, True), fill=P["ink"])
    tiers = [
        ("MVP", "SaaS control plane\n+ Mac / web client\n+ Gmail connector", True),
        ("Growth", "Org tenant\nshared connectors\nRBAC · audit", True),
        ("Trust", "Private tenant\nVPC / BYO cloud", False),
        ("Enterprise", "In-cluster daemon\nair-gapped option", False),
    ]
    for i, (h, sub, mvp) in enumerate(tiers):
        x = 70 + i * 380
        fill = P["ok_bg"] if mvp else P["card"]
        outline = P["ok"] if mvp else P["line"]
        rounded(d, (x, 140, x + 340, 520), fill, r=22, outline=outline, width=3)
        badge = "IN MVP PATH" if mvp else "LATER / UPSELL"
        bf = P["ok"] if mvp else P["muted"]
        d.text((x + 24, 170), badge, font=font(18, True), fill=bf)
        d.text((x + 24, 220), h, font=font(32, True), fill=P["ink"])
        for li, line in enumerate(sub.split("\n")):
            d.text((x + 24, 300 + li * 40), line, font=font(22), fill=P["muted"])
        if i < len(tiers) - 1:
            arrow_h(d, x + 350, 330, x + 375)
    d.text(
        (70, 580),
        "Cluster-wide is not the MVP. Org tenant + optional per-user agent + RBAC is.",
        font=font(24, True),
        fill=P["ink"],
    )
    d.text(
        (70, 640),
        "Each employee can run a scoped personal agent; shared loops live in the org store.",
        font=font(22),
        fill=P["muted"],
    )
    path = DIAG / "06-deploy.png"
    im.save(path, quality=92)
    return path


def diag_in_out():
    W, H = 1600, 900
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 28), "MVP scope — hard In / Out", font=font(34, True), fill=P["ink"])

    # IN
    rounded(d, (48, 110, 760, 860), P["ok_bg"], r=22, outline=P["ok"], width=3)
    d.text((80, 140), "IN — ship this", font=font(30, True), fill=P["ok"])
    ins = [
        "Personal: Gmail + Google Calendar connectors",
        "Loop extract: reply-owed, ask, appointment, todo",
        "Score bands: Critical / Important / Borderline / Quiet",
        "Surfaces: morning digest + floating assist (Mac)",
        "Actions: draft reply, create event, snooze, quiet",
        "Approve gate before any send / write",
        "Verify close on reply sent / event created",
        "Teams lite: shared Gmail inbox OR Twilio SMS line",
        "RBAC: Admin / Lead / Member",
        "Audit log of proposals + executions",
        "Pilot metrics dashboard (8 measurables)",
        "Quiet learning from snooze/ignore history",
    ]
    for i, t in enumerate(ins):
        d.text((80, 210 + i * 48), "✓  " + t, font=font(20), fill=P["ink"])

    # OUT
    rounded(d, (840, 110, 1550, 860), P["no_bg"], r=22, outline=P["no"], width=3)
    d.text((880, 140), "OUT — not MVP", font=font(30, True), fill=P["no"])
    outs = [
        "Screen OCR / “watch the whole desktop”",
        "Autonomous send without approve",
        "Full Slack org dump as product",
        "iMessage as day-1 requirement*",
        "PDF guided-fill packet studio (demo only)",
        "K8s / in-cluster daemon requirement",
        "Custom fine-tuned model as launch gate",
        "Multi-workspace enterprise SSO suite",
        "Mobile-first iOS daemon v1",
        "Micromanage “overdue commitments” wall",
        "CRM deep writeback (Salesforce sync)",
        "Voice fill as sole input path",
    ]
    for i, t in enumerate(outs):
        d.text((880, 210 + i * 48), "✗  " + t, font=font(20), fill=P["ink"])
    path = DIAG / "07-in-out.png"
    im.save(path, quality=92)
    return path


def diag_settings():
    W, H = 1600, 880
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 28), "Settings map", font=font(34, True), fill=P["ink"])

    cols = [
        (
            "Personal",
            [
                "Connected accounts",
                "Channels on/off",
                "Digest time & quiet hours",
                "Default: draft vs open editor",
                "Score sensitivity",
                "Always-quiet senders",
                "Always-important people",
                "Retention window",
                "Export / delete my data",
            ],
        ),
        (
            "Teams org",
            [
                "Org connectors",
                "Which channels are shared",
                "SLA rules by client tier",
                "Escalation paths",
                "RBAC roles & seats",
                "Send-as shared inbox",
                "Retention / legal hold",
                "Audit export",
                "Billing / plan",
            ],
        ),
        (
            "Daemon / runtime",
            [
                "Polling vs webhook",
                "Local vs cloud agent",
                "Offline queue",
                "Model / extract provider",
                "PII redaction level",
                "Verify retries",
                "Crash / health status",
                "Update channel",
                "Diagnostics opt-in",
            ],
        ),
    ]
    for i, (h, items) in enumerate(cols):
        x = 48 + i * 520
        rounded(d, (x, 110, x + 490, 840), P["card"], r=20, outline=P["line"])
        rounded(d, (x, 110, x + 490, 180), P["accent"], r=20)
        d.rectangle((x, 150, x + 490, 180), fill=P["accent"])
        center_text(d, (x, 110, x + 490, 180), h, font(26, True), P["card"])
        for j, item in enumerate(items):
            d.text((x + 36, 220 + j * 60), "•  " + item, font=font(22), fill=P["ink"])
    path = DIAG / "08-settings.png"
    im.save(path, quality=92)
    return path


def diag_architecture():
    W, H = 1600, 900
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 24), "Reference architecture (MVP)", font=font(34, True), fill=P["ink"])

    # clients
    for i, (h, sub) in enumerate([("Mac app", "digest · float · approve"), ("Web app", "Teams desk · admin")]):
        x = 80 + i * 320
        rounded(d, (x, 100, x + 280, 220), P["card"], outline=P["line"])
        d.text((x + 24, 120), h, font=font(24, True), fill=P["ink"])
        d.text((x + 24, 165), sub, font=font(18), fill=P["muted"])

    arrow_v(d, 360, 230, 280)

    # api
    rounded(d, (80, 290, 700, 400), P["accent"], r=16)
    center_text(d, (80, 290, 700, 400), "API / Control plane  ·  auth · proposals · RBAC · audit", font(22, True), P["card"])

    arrow_v(d, 360, 410, 460)

    # services row
    services = [
        ("Ingest", "webhooks\npollers"),
        ("Extract", "LLM + rules\nschema"),
        ("Loop engine", "state machine\ntimers"),
        ("Score", "priority\nquiet model"),
        ("Execute", "adapters\nverify"),
    ]
    for i, (h, sub) in enumerate(services):
        x = 60 + i * 300
        rounded(d, (x, 470, x + 270, 640), P["card"], outline=P["line"])
        d.text((x + 20, 490), h, font=font(22, True), fill=P["slate"])
        for li, line in enumerate(sub.split("\n")):
            d.text((x + 20, 540 + li * 30), line, font=font(20), fill=P["ink"])

    # data + connectors bottom
    rounded(d, (60, 700, 760, 860), P["box"], r=16)
    d.text((90, 730), "Data", font=font(22, True), fill=P["ink"])
    d.text((90, 780), "Loop store · proposal log · embeddings optional · secrets vault", font=font(20), fill=P["muted"])

    rounded(d, (800, 700, 1540, 860), P["box"], r=16)
    d.text((830, 730), "Connectors (MVP)", font=font(22, True), fill=P["ink"])
    d.text((830, 780), "Gmail · Google Calendar · (Teams lite: shared inbox / Twilio)", font=font(20), fill=P["muted"])

    path = DIAG / "09-architecture.png"
    im.save(path, quality=92)
    return path


def diag_score_bands():
    W, H = 1600, 700
    im = Image.new("RGB", (W, H), P["paper"])
    d = ImageDraw.Draw(im)
    d.text((48, 28), "Importance bands + personalization", font=font(34, True), fill=P["ink"])
    bands = [
        ((139, 58, 58), "Critical", "SLA · money · safety\nblocked deal"),
        ((138, 90, 58), "Important", "Reply owed\ntime-bound ask"),
        ((61, 90, 128), "Borderline", "Soft ask\nlow stake"),
        ((92, 107, 122), "Quiet", "Noise · learned skip\nnewsletters"),
    ]
    for i, (color, h, sub) in enumerate(bands):
        x = 60 + i * 385
        rounded(d, (x, 140, x + 360, 420), P["card"], outline=color, width=4, r=20)
        rounded(d, (x + 24, 170, x + 80, 226), color, r=12)
        d.text((x + 100, 180), h, font=font(28, True), fill=P["ink"])
        for li, line in enumerate(sub.split("\n")):
            d.text((x + 40, 270 + li * 40), line, font=font(22), fill=P["muted"])
    rounded(d, (60, 480, W - 60, 660), P["accent"], r=18)
    d.text((100, 520), "Signals that move a loop between bands", font=font(24, True), fill=P["card"])
    d.text(
        (100, 580),
        "Sender affinity  ·  ignore/snooze history  ·  org SLA  ·  $ / booking value  ·  age hours  ·  explicit @you",
        font=font(22),
        fill=P["soft"],
    )
    path = DIAG / "10-score-bands.png"
    im.save(path, quality=92)
    return path


# ── PPTX helpers ────────────────────────────────────────────────────


def set_run(run, size=18, bold=False, color=INK):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Calibri"


def add_text(shape, lines, default_size=16):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if isinstance(line, str):
            text, size, bold, color = line, default_size, False, INK
        else:
            text, size, bold, color = line.get("t", ""), line.get("s", default_size), line.get("b", False), line.get(
                "c", INK
            )
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(4)
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


def title_bar(slide, eyebrow, title, subtitle=None):
    rect(slide, 0, 0, Inches(13.333), Inches(7.5), PAPER)
    rect(slide, 0, 0, Inches(0.12), Inches(7.5), ACCENT)
    box = slide.shapes.add_textbox(Inches(0.5), Inches(0.28), Inches(12.2), Inches(0.3))
    add_text(box, [{"t": eyebrow.upper(), "s": 11, "b": True, "c": SLATE}])
    box = slide.shapes.add_textbox(Inches(0.5), Inches(0.55), Inches(12.2), Inches(0.55))
    add_text(box, [{"t": title, "s": 28, "b": True, "c": INK}])
    if subtitle:
        box = slide.shapes.add_textbox(Inches(0.5), Inches(1.1), Inches(12.2), Inches(0.4))
        add_text(box, [{"t": subtitle, "s": 14, "c": MUTED}])


def full_image_slide(prs, blank, path, eyebrow, title):
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, Inches(13.333), Inches(7.5), PAPER)
    rect(s, 0, 0, Inches(0.12), Inches(7.5), ACCENT)
    box = s.shapes.add_textbox(Inches(0.45), Inches(0.2), Inches(12), Inches(0.25))
    add_text(box, [{"t": eyebrow.upper(), "s": 10, "b": True, "c": SLATE}])
    box = s.shapes.add_textbox(Inches(0.45), Inches(0.42), Inches(12), Inches(0.4))
    add_text(box, [{"t": title, "s": 20, "b": True, "c": INK}])
    s.shapes.add_picture(str(path), Inches(0.35), Inches(0.95), width=Inches(12.6))
    return s


def try_pic(slide, path, left, top, width, height=None):
    p = Path(path)
    if not p.exists():
        return None
    if height:
        return slide.shapes.add_picture(str(p), left, top, width=width, height=height)
    return slide.shapes.add_picture(str(p), left, top, width=width)


def build():
    DIAG.mkdir(parents=True, exist_ok=True)
    paths = {
        "pipeline": diag_pipeline(),
        "loop": diag_loop_graph(),
        "approve": diag_approve_sequence(),
        "personal": diag_personal_journey(),
        "teams": diag_teams_journey(),
        "deploy": diag_deploy(),
        "inout": diag_in_out(),
        "settings": diag_settings(),
        "arch": diag_architecture(),
        "score": diag_score_bands(),
    }

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    # 1 Title
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, Inches(13.333), Inches(7.5), ACCENT)
    rect(s, 0, Inches(5.4), Inches(13.333), Inches(2.1), INK)
    box = s.shapes.add_textbox(Inches(0.7), Inches(1.8), Inches(12), Inches(0.5))
    add_text(box, [{"t": "PRODUCT PLAN  ·  MVP", "s": 14, "b": True, "c": SOFT}])
    box = s.shapes.add_textbox(Inches(0.7), Inches(2.3), Inches(12), Inches(1))
    add_text(box, [{"t": "Juvantage OS", "s": 44, "b": True, "c": WHITE}])
    box = s.shapes.add_textbox(Inches(0.7), Inches(3.4), Inches(11), Inches(1.2))
    add_text(
        box,
        [
            {
                "t": "Open-loop command layer: observe → propose → approve → execute → verify",
                "s": 20,
                "c": SOFT,
            }
        ],
    )
    box = s.shapes.add_textbox(Inches(0.7), Inches(5.7), Inches(12), Inches(1.2))
    add_text(
        box,
        [
            {"t": "Personal daemon  ·  Teams org tenant  ·  Hard In/Out  ·  Settings  ·  Deploy ladder", "s": 15, "c": WHITE},
            {"t": "Visual MVP brief — diagrams over walls of text", "s": 13, "c": MUTED},
        ],
    )

    # 2 Product definition
    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "Definition",
        "What the product is (and isn’t)",
        "One engine. Two presentations. Approval is the product.",
    )
    cards = [
        ("Is", "A daemon + control plane that finds unfinished obligations, ranks them, proposes closures, and executes only after approve."),
        ("Isn’t", "A chatbot bolted on Slack. Not screen OCR. Not a surveillance wall of “overdue commitments.”"),
        ("Personal", "Your life channels → digest / float → triage → act → approve → verify."),
        ("Teams", "Org-connected shared streams → owners + SLAs → lead digest → RBAC approve → audit."),
    ]
    for i, (h, body) in enumerate(cards):
        x = Inches(0.5 + (i % 2) * 6.3)
        y = Inches(1.8 + (i // 2) * 2.5)
        c = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(6.0), Inches(2.25))
        fill(c, CARD)
        c.line.color.rgb = LINE
        box = s.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), Inches(5.4), Inches(1.7))
        add_text(box, [{"t": h, "s": 18, "b": True, "c": SLATE}, {"t": body, "s": 14, "c": INK}])

    # 3 Pipeline full bleed diagram
    full_image_slide(prs, blank, paths["pipeline"], "Under the hood", "The pipeline")

    # 4 Loop graph
    full_image_slide(prs, blank, paths["loop"], "Context", "How Gmail + portal + PDF become one loop")

    # 5 Approve sequence
    full_image_slide(prs, blank, paths["approve"], "Approve", "Gate → adapters → verify")

    # 6 Personal journey + mock
    s = prs.slides.add_slide(blank)
    title_bar(s, "Personal presentation", "Customer surface — digest, float, guided fill")
    try_pic(s, ASSETS / "juvantage-os-mock-C-floating-daemon.jpg", Inches(0.4), Inches(1.7), Inches(6.2), Inches(4.0))
    try_pic(s, ASSETS / "juvantage-os-mock-A-paper-ops.jpg", Inches(6.8), Inches(1.7), Inches(6.1), Inches(4.0))
    box = s.shapes.add_textbox(Inches(0.5), Inches(5.9), Inches(12.3), Inches(1.2))
    add_text(
        box,
        [
            {
                "t": "Floating assist for “3 need you”  ·  Paper ops desk for deep loops  ·  Split session for field-by-field packets (demo asset; packet studio OUT of MVP code path)",
                "s": 13,
                "c": MUTED,
            }
        ],
    )

    full_image_slide(prs, blank, paths["personal"], "Personal", "End-to-end morning loop")

    # 7 Act moment mock
    s = prs.slides.add_slide(blank)
    title_bar(s, "Personal — act moment", "Guided fill still ends in Approve")
    try_pic(s, ASSETS / "juvantage-os-mock-D-split-session.jpg", Inches(0.5), Inches(1.65), Inches(8.0), Inches(5.3))
    box = s.shapes.add_textbox(Inches(8.8), Inches(1.9), Inches(4.0), Inches(4.8))
    add_text(
        box,
        [
            {"t": "MVP truth", "s": 16, "b": True, "c": SLATE},
            {"t": "Split-session PDF is the north-star UI.", "s": 13, "c": INK},
            {"t": "", "s": 8},
            {"t": "Day-1 code path uses the same approve pattern on:", "s": 13, "c": INK},
            {"t": "• draft email reply", "s": 13, "c": INK},
            {"t": "• calendar invite", "s": 13, "c": INK},
            {"t": "• snooze / quiet", "s": 13, "c": INK},
            {"t": "", "s": 8},
            {"t": "Suggested values come from the loop graph + profile — still locked until Approve.", "s": 13, "c": MUTED},
        ],
    )

    # 8 Score
    full_image_slide(prs, blank, paths["score"], "Intelligence", "Not every loop deserves you")

    # 9 Teams
    full_image_slide(prs, blank, paths["teams"], "Teams (B2B)", "Org tenant · RBAC · shared streams")

    s = prs.slides.add_slide(blank)
    title_bar(
        s,
        "Teams presentation",
        "What buyers see",
        "Sell the stalled-client problem — not “AI for Slack.”",
    )
    rows = [
        ("Agency", "Shared inbox + client Slack*", "Double ownership → SLA breach", "VP Client Services"),
        ("Clinic", "Twilio SMS + email", "Reschedule languishes → no-show", "Practice manager"),
        ("RevOps", "Shared sales inbox", "Follow-ups die → leakage", "Head of RevOps"),
    ]
    y = Inches(1.9)
    headers = ["Vertical", "MVP connectors", "Pain", "Buyer"]
    widths = [Inches(2.4), Inches(3.4), Inches(4.2), Inches(2.6)]
    x0 = Inches(0.5)
    for i, h in enumerate(headers):
        x = x0 + sum(widths[:i], Inches(0))
        rect(s, x, y, widths[i], Inches(0.4), ACCENT)
        box = s.shapes.add_textbox(x + Inches(0.1), y + Inches(0.06), widths[i] - Inches(0.1), Inches(0.3))
        add_text(box, [{"t": h, "s": 12, "b": True, "c": WHITE}])
    for r, row in enumerate(rows):
        yy = y + Inches(0.4) + Inches(r * 0.85)
        bg = CARD if r % 2 == 0 else ALT
        for i, val in enumerate(row):
            x = x0 + sum(widths[:i], Inches(0))
            rect(s, x, yy, widths[i], Inches(0.85), bg)
            box = s.shapes.add_textbox(x + Inches(0.12), yy + Inches(0.25), widths[i] - Inches(0.2), Inches(0.5))
            add_text(box, [{"t": val, "s": 13, "c": INK}])
    box = s.shapes.add_textbox(Inches(0.5), Inches(5.6), Inches(12.3), Inches(1.4))
    add_text(
        box,
        [
            {
                "t": "*Slack/Teams only when the workspace is org-connected. Personal Slack stays on the personal daemon. Hierarchy = ownership + SLA, not chat app logo.",
                "s": 13,
                "c": MUTED,
            },
            {
                "t": "Each employee: scoped personal agent (RBAC). Shared client loops: org store. Cluster deploy: later upsell.",
                "s": 13,
                "c": MUTED,
            },
        ],
    )

    # 10 In/Out
    full_image_slide(prs, blank, paths["inout"], "Scope", "MVP In / Out")

    # 11 Settings
    full_image_slide(prs, blank, paths["settings"], "Settings", "Personal · Org · Runtime")

    # 12 Architecture
    full_image_slide(prs, blank, paths["arch"], "Engineering", "Reference architecture")

    # 13 Deploy
    full_image_slide(prs, blank, paths["deploy"], "Deployments", "Ladder — cluster is not MVP")

    # 14 Measurables
    s = prs.slides.add_slide(blank)
    title_bar(s, "Pilot success", "What we measure in a 2–4 week MVP pilot")
    metrics = [
        ("Loop latency", "Hours from detect → close"),
        ("Clear rate", "% reply-owed closed 24/72h"),
        ("Appt convert", "% asks → calendar events"),
        ("Quiet accuracy", "% quiet that stay quiet"),
        ("Assist accept", "Approve / edit / dismiss"),
        ("Owner coverage", "% loops with owner (Teams)"),
        ("SLA near-miss", "Caught before breach"),
        ("Time saved", "Self-report + action count"),
    ]
    for i, (h, body) in enumerate(metrics):
        x = Inches(0.45 + (i % 4) * 3.2)
        y = Inches(1.85 + (i // 4) * 2.4)
        c = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.0), Inches(2.15))
        fill(c, CARD)
        c.line.color.rgb = LINE
        box = s.shapes.add_textbox(x + Inches(0.2), y + Inches(0.4), Inches(2.6), Inches(1.4))
        add_text(box, [{"t": h, "s": 15, "b": True, "c": SLATE}, {"t": body, "s": 13, "c": INK}])

    # 15 90-day plan
    s = prs.slides.add_slide(blank)
    title_bar(s, "Build plan", "90 days to a dogfoodable MVP")
    phases = [
        ("Days 1–30", "Gmail + Calendar connectors\nLoop schema + extract\nDigest UI (Mac or web)\nApprove → send/event\nPersonal dogfood"),
        ("Days 31–60", "Score bands + quiet history\nFloating assist\nVerify + reopen\nAudit log\n1 design-partner inbox"),
        ("Days 61–90", "Teams lite RBAC\nShared inbox or Twilio\nPilot metrics board\nSecurity basics\nPricing narrative $6k–$25k"),
    ]
    for i, (h, body) in enumerate(phases):
        x = Inches(0.5 + i * 4.2)
        c = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.9), Inches(4.0), Inches(4.8))
        fill(c, CARD)
        c.line.color.rgb = LINE
        box = s.shapes.add_textbox(x + Inches(0.25), Inches(2.15), Inches(3.5), Inches(0.5))
        add_text(box, [{"t": h, "s": 18, "b": True, "c": ACCENT}])
        box = s.shapes.add_textbox(x + Inches(0.25), Inches(2.8), Inches(3.5), Inches(3.5))
        lines = [{"t": ln, "s": 14, "c": INK} for ln in body.split("\n")]
        add_text(box, lines)

    # 16 Close
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, Inches(13.333), Inches(7.5), PAPER)
    rect(s, 0, 0, Inches(0.12), Inches(7.5), ACCENT)
    box = s.shapes.add_textbox(Inches(0.7), Inches(2.0), Inches(12), Inches(1))
    add_text(box, [{"t": "MVP contract", "s": 32, "b": True, "c": INK}])
    box = s.shapes.add_textbox(Inches(0.7), Inches(3.0), Inches(11.5), Inches(3))
    add_text(
        box,
        [
            {"t": "Ship: Personal Gmail/Calendar loops with digest + approve + verify.", "s": 18, "c": INK},
            {"t": "Prove: Quiet scoring + assist acceptance on your own life.", "s": 18, "c": INK},
            {"t": "Sell next: Teams lite on one shared stream with RBAC + audit.", "s": 18, "c": INK},
            {"t": "Defer: OCR, cluster daemon, packet studio, autonomous send.", "s": 18, "c": MUTED},
            {"t": "", "s": 10},
            {"t": "Juvantage OS — nothing important executes without approve.", "s": 16, "b": True, "c": SLATE},
        ],
    )

    prs.save(OUT)
    print(f"Wrote {OUT}")
    for k, p in paths.items():
        print(f"  diagram {k}: {p}")


if __name__ == "__main__":
    build()
