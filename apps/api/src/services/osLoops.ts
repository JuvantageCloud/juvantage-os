import { prisma } from "../db/client.js";

const AGING_HOURS = 18;
const SURFACE_LIMIT = 3;

type Band = "critical" | "high" | "normal" | "quiet";
type Kind = "reply_owed" | "ask" | "appointment" | "todo" | "other";

/** Actionable mail — not headline rhetorical "?" from digests (Quora, etc.). */
const ACTION_RE =
  /(please (reply|confirm|respond)|need your (reply|response)|can you|could you|let me know|does .+ work|are you free|eod|by friday|by thursday|waiting for|following up)/i;

const BULK_OR_DIGEST_FROM =
  /quora|noreply|no-reply|notifications@|mailer-daemon|newsletter|digest|promo|marketing|@mail\.|facebookmail|linkedin/i;

export async function extractLoopsFromSync(userId: string) {
  const created: string[] = [];
  const threads = await prisma.osMailThread.findMany({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    take: 40,
  });

  for (const t of threads) {
    const text = `${t.subject ?? ""} ${t.snippet ?? ""}`;
    if (BULK_OR_DIGEST_FROM.test(`${t.fromAddr ?? ""} ${text}`)) continue;
    if (!ACTION_RE.test(text)) continue;

    const ageHours = t.lastMessageAt
      ? (Date.now() - t.lastMessageAt.getTime()) / 3600_000
      : 0;
    const kind: Kind = /need your (reply|response)|please (reply|respond)/i.test(text)
      ? "reply_owed"
      : /does .+ work|are you free/i.test(text)
        ? "ask"
        : "reply_owed";
    const band = scoreMailBand(text, ageHours);
    const sourceRef = t.externalId;
    const title =
      t.subject?.trim() ||
      (kind === "ask" ? "Unanswered ask in mail" : "Reply owed");
    const summary = [t.fromAddr, t.snippet].filter(Boolean).join(" — ") || null;

    const existing = await prisma.loop.findFirst({
      where: { userId, source: "gmail", sourceRef },
    });
    if (existing && ["done", "dismissed"].includes(existing.status)) continue;

    if (existing) {
      await prisma.loop.update({
        where: { id: existing.id },
        data: {
          kind,
          band,
          title,
          summary,
          objectType: "mail",
          routerConf: 0.85,
          evidenceJson: JSON.stringify({
            threadId: t.threadId,
            fromAddr: t.fromAddr,
            ageHours: Math.round(ageHours * 10) / 10,
          }),
          status: existing.status === "snoozed" && existing.snoozedUntil && existing.snoozedUntil > new Date()
            ? "snoozed"
            : "open",
        },
      });
    } else {
      const loop = await prisma.loop.create({
        data: {
          userId,
          kind,
          band,
          status: "open",
          title,
          summary,
          source: "gmail",
          sourceRef,
          objectType: "mail",
          routerConf: 0.85,
          evidenceJson: JSON.stringify({
            threadId: t.threadId,
            fromAddr: t.fromAddr,
            ageHours: Math.round(ageHours * 10) / 10,
          }),
          dueAt: ageHours >= AGING_HOURS ? new Date() : null,
        },
      });
      created.push(loop.id);
    }
  }

  const events = await prisma.osCalendarItem.findMany({
    where: {
      userId,
      startsAt: { gte: new Date() },
      title: { contains: "tentative" },
    },
    take: 10,
  });

  for (const ev of events) {
    const sourceRef = ev.externalId;
    const existing = await prisma.loop.findFirst({
      where: { userId, source: "google_calendar", sourceRef },
    });
    if (existing) continue;
    const loop = await prisma.loop.create({
      data: {
        userId,
        kind: "appointment",
        band: "high",
        status: "open",
        title: `Confirm: ${ev.title}`,
        summary: `Starts ${ev.startsAt.toISOString()}`,
        source: "google_calendar",
        sourceRef,
        evidenceJson: JSON.stringify({ startsAt: ev.startsAt.toISOString() }),
        dueAt: ev.startsAt,
      },
    });
    created.push(loop.id);
  }

  await purgeAmbientOlderThan(userId, 24);
  return { createdCount: created.length, created };
}

function scoreMailBand(text: string, ageHours: number): Band {
  if (ageHours >= 36 || /eod|urgent|asap|need your reply/i.test(text)) {
    return "critical";
  }
  if (ageHours >= AGING_HOURS || /\?/.test(text)) return "high";
  if (/fyi|no rush/i.test(text)) return "quiet";
  return "normal";
}

const BAND_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  quiet: 3,
};

export async function listOpenLoops(userId: string, limit = SURFACE_LIMIT) {
  const now = new Date();
  await prisma.loop.updateMany({
    where: {
      userId,
      status: "snoozed",
      snoozedUntil: { lte: now },
    },
    data: { status: "open", snoozedUntil: null },
  });

  const loops = await prisma.loop.findMany({
    where: {
      userId,
      status: { in: ["open", "proposed", "approved", "executing"] },
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
    },
  });

  loops.sort((a, b) => {
    const band = (BAND_ORDER[a.band] ?? 9) - (BAND_ORDER[b.band] ?? 9);
    if (band !== 0) return band;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return loops.slice(0, limit).map(serializeLoop);
}

export async function nudgeState(userId: string) {
  const loops = await listOpenLoops(userId, SURFACE_LIMIT);
  const top = loops[0] ?? null;
  return {
    hasNudge: loops.length > 0,
    count: loops.length,
    topBand: top?.band ?? null,
    topTitle: top?.title ?? null,
  };
}

export async function snoozeLoop(userId: string, loopId: string, hours = 4) {
  const loop = await prisma.loop.findFirst({ where: { id: loopId, userId } });
  if (!loop) return null;
  const updated = await prisma.loop.update({
    where: { id: loop.id },
    data: {
      status: "snoozed",
      snoozedUntil: new Date(Date.now() + hours * 3600_000),
    },
  });
  await prisma.osAuditEvent.create({
    data: {
      userId,
      loopId: loop.id,
      action: "snooze",
      detailJson: JSON.stringify({ hours }),
    },
  });
  return updated;
}

export async function dismissLoop(
  userId: string,
  loopId: string,
  reason: string = "other",
) {
  const loop = await prisma.loop.findFirst({ where: { id: loopId, userId } });
  if (!loop) return null;
  const updated = await prisma.loop.update({
    where: { id: loop.id },
    data: { status: "dismissed", band: "quiet" },
  });
  await prisma.osAuditEvent.create({
    data: {
      userId,
      loopId: loop.id,
      action: "dismiss",
      detailJson: JSON.stringify({
        reason,
        priorBand: loop.band,
        priorStatus: loop.status,
        title: loop.title,
      }),
    },
  });
  return updated;
}

/**
 * Clip hotkey. Strong evidence → ClipMark/todo. Weak (app name only) → refuse HIGH loop
 * (Thm III / AmbientHint) — returns { refused: true } without minting a closable loop.
 */
export async function createClipLoop(
  userId: string,
  input: { title?: string; summary?: string; app?: string; url?: string },
): Promise<
  | { refused: false; loop: ReturnType<typeof serializeLoop> }
  | { refused: true; reason: string; hint: { app: string | null; at: string } }
> {
  const latestAmbient = await prisma.ambientEvent.findFirst({
    where: { userId },
    orderBy: { recordedAt: "desc" },
  });
  const app = input.app ?? latestAmbient?.app ?? null;
  const rawSummary = (input.summary ?? "").trim();
  const stubSummary =
    /^Clip hotkey/i.test(rawSummary) ||
    /^Marked with clip/i.test(rawSummary) ||
    /^Clipped while in\b/i.test(rawSummary);
  const clipText = stubSummary
    ? ""
    : rawSummary.replace(/^Clipboard:\s*/i, "").trim();
  const ambientTitle = (latestAmbient?.title ?? "").trim();
  const explicitTitle = (input.title ?? "").trim();
  const looksLikeFallbackTitle =
    !explicitTitle ||
    /^Clipped (while in|from)\b/i.test(explicitTitle) ||
    explicitTitle === ambientTitle;

  const hasStrongEvidence =
    clipText.length >= 8 ||
    (Boolean(input.url ?? latestAmbient?.url) && ambientTitle.length >= 3) ||
    (explicitTitle.length >= 8 && !looksLikeFallbackTitle);

  if (!hasStrongEvidence) {
    await prisma.osAuditEvent.create({
      data: {
        userId,
        action: "clip_refused",
        detailJson: JSON.stringify({
          reason: "weak_clip_ambient_hint",
          app,
          thm: "III.1",
        }),
      },
    });
    return {
      refused: true,
      reason: "Nothing specific to catch — select text or copy first (AmbientHint)",
      hint: { app, at: new Date().toISOString() },
    };
  }

  const title = (
    explicitTitle && !looksLikeFallbackTitle
      ? explicitTitle
      : clipText.slice(0, 120) ||
        ambientTitle ||
        `Clipped from ${app || "screen"}`
  ).slice(0, 160);

  const recentDup = await prisma.loop.findFirst({
    where: {
      userId,
      source: "clip",
      status: "open",
      title,
      createdAt: { gte: new Date(Date.now() - 5 * 60_000) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentDup) {
    return { refused: false, loop: serializeLoop(recentDup) };
  }

  const sourceRef = `clip-${Date.now()}`;
  // Clips stay in the queue but never outrank mail — cap at normal (sprint: quiet clip noise).
  const loop = await prisma.loop.create({
    data: {
      userId,
      kind: "todo",
      band: "normal",
      status: "open",
      title,
      summary: input.summary ?? "Marked with clip hotkey",
      source: "clip",
      sourceRef,
      objectType: "clip",
      routerConf: 0.55,
      ambientJson: JSON.stringify({
        app,
        title: latestAmbient?.title ?? null,
        url: input.url ?? latestAmbient?.url ?? null,
      }),
      evidenceJson: JSON.stringify({
        clippedAt: new Date().toISOString(),
        strong: true,
        clipLen: clipText.length,
      }),
    },
  });
  return { refused: false, loop: serializeLoop(loop) };
}

export async function recordAmbient(
  userId: string,
  events: Array<{ app: string; title?: string | null; url?: string | null; recordedAt?: string }>,
) {
  let inserted = 0;
  for (const e of events) {
    if (!e.app?.trim()) continue;
    await prisma.ambientEvent.create({
      data: {
        userId,
        app: e.app.slice(0, 120),
        title: e.title?.slice(0, 240) ?? null,
        url: sanitizeUrl(e.url),
        recordedAt: e.recordedAt ? new Date(e.recordedAt) : new Date(),
      },
    });
    inserted += 1;
  }
  await purgeAmbientOlderThan(userId, 24);
  return { inserted };
}

export async function purgeAmbientOlderThan(userId: string, hours: number) {
  const cutoff = new Date(Date.now() - hours * 3600_000);
  const result = await prisma.ambientEvent.deleteMany({
    where: { userId, recordedAt: { lt: cutoff } },
  });
  return result.count;
}

function sanitizeUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString().slice(0, 500);
  } catch {
    return url.slice(0, 500);
  }
}

export function serializeLoop(loop: {
  id: string;
  kind: string;
  band: string;
  status: string;
  title: string;
  summary: string | null;
  source: string | null;
  sourceRef?: string | null;
  evidenceJson?: string | null;
  ambientJson?: string | null;
  objectType?: string | null;
  routerConf?: number | null;
  canonicalUri?: string | null;
  dueAt: Date | null;
  snoozedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: loop.id,
    kind: loop.kind,
    band: loop.band,
    status: loop.status,
    title: loop.title,
    summary: loop.summary,
    source: loop.source,
    sourceRef: loop.sourceRef ?? null,
    objectType: loop.objectType ?? "unknown",
    routerConf: loop.routerConf ?? null,
    canonicalUri: loop.canonicalUri ?? null,
    evidence: safeJson(loop.evidenceJson),
    ambient: safeJson(loop.ambientJson),
    dueAt: loop.dueAt?.toISOString() ?? null,
    snoozedUntil: loop.snoozedUntil?.toISOString() ?? null,
    createdAt: loop.createdAt.toISOString(),
    updatedAt: loop.updatedAt.toISOString(),
  };
}

function safeJson(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Pure helper for unit tests. */
export function classifyMailCandidate(subject: string, snippet: string) {
  const text = `${subject} ${snippet}`;
  if (!ACTION_RE.test(text)) return null;
  const ageHours = 20;
  const kind: Kind = /need your (reply|response)|please (reply|respond)/i.test(text)
    ? "reply_owed"
    : /does .+ work|are you free/i.test(text)
      ? "ask"
      : "reply_owed";
  return {
    kind,
    band: scoreMailBand(text, ageHours),
  };
}
