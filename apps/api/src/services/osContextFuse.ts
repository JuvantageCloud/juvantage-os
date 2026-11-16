/**
 * Ingest → session → bundle → episodic loop.
 * De-ID *shape*: classify snippets, fuse in-session, one hero loop.
 */
import { createHash } from "node:crypto";
import { prisma } from "../db/client.js";
import { EYES_OFF_AFTER_IDLE_S } from "./osPresence.js";
import { EPISODIC_SOURCE, episodicSignal, type EpisodicInput } from "./osEpisodic.js";
import { serializeLoop } from "./osLoops.js";

export const BUNDLE_SOURCE_REF = "context-bundle";
export const PURGE_CONTEXT_HOURS = 24;

export type CaptureEvent = {
  kind: "window_read" | "clipboard" | "window_focus";
  app?: string | null;
  title?: string | null;
  text?: string | null;
  recordedAt?: string;
};

export type ContextBundle = {
  sessionId: string;
  app: string;
  windowTitle: string;
  quote: string;
  fingerprint: string;
  sensitivityTags: string[];
  eventCount: number;
};

export function sensitivityTags(text: string): string[] {
  const tags = new Set<string>();
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) tags.add("pii_email");
  if (/\b(?:\d[ -]*?){13,16}\b/.test(text)) tags.add("pii_payment_like");
  if (/\b(sk_|ghp_|gho_|AKIA[0-9A-Z]{16})/.test(text)) tags.add("secret_credential_like");
  if (/\b(password|passwd|api[_-]?key)\s*[:=]/i.test(text)) tags.add("secret_credential_like");
  return [...tags];
}

function hashText(text: string) {
  return createHash("sha256").update(text).digest("hex").slice(0, 24);
}

export async function ensureContextSession(userId: string, idleSeconds?: number): Promise<string> {
  const now = Date.now();
  const open = await prisma.contextSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  const idleBreak = idleSeconds != null && idleSeconds >= EYES_OFF_AFTER_IDLE_S;
  if (open) {
    const lastEv = await prisma.contextEvent.findFirst({
      where: { sessionId: open.id },
      orderBy: { recordedAt: "desc" },
    });
    const gapMs = lastEv ? now - lastEv.recordedAt.getTime() : 0;
    if (!idleBreak && gapMs < EYES_OFF_AFTER_IDLE_S * 1000) return open.id;
    await prisma.contextSession.update({
      where: { id: open.id },
      data: { endedAt: new Date() },
    });
  }
  const session = await prisma.contextSession.create({ data: { userId } });
  return session.id;
}

const DEDUPE_EVENT_MS = 120_000;

export function captureEventFingerprint(e: CaptureEvent): string {
  const text = (e.text ?? "").trim().slice(0, 600);
  if (text.length >= 8) return `${e.kind}|${hashText(text)}`;
  const app = (e.app ?? "").slice(0, 80);
  const title = (e.title ?? "").slice(0, 200);
  return `${e.kind}|${app}|${title}`;
}

async function isDuplicateCapture(
  sessionId: string,
  e: CaptureEvent,
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUPE_EVENT_MS);
  const text = (e.text ?? "").trim().slice(0, 600) || null;
  const textHash = text ? hashText(text) : null;
  const recent = await prisma.contextEvent.findMany({
    where: { sessionId, kind: e.kind, recordedAt: { gte: since } },
    orderBy: { recordedAt: "desc" },
    take: 3,
  });
  for (const last of recent) {
    if (textHash && last.textHash === textHash) return true;
    if (
      e.kind === "window_read" &&
      !text &&
      last.app === (e.app?.slice(0, 80) ?? null) &&
      last.title === (e.title?.slice(0, 200) ?? null)
    ) {
      return true;
    }
  }
  return false;
}

export async function appendContextEvents(
  userId: string,
  sessionId: string,
  events: CaptureEvent[],
) {
  let inserted = 0;
  for (const e of events) {
    if (await isDuplicateCapture(sessionId, e)) continue;
    const text = (e.text ?? "").trim().slice(0, 600) || null;
    await prisma.contextEvent.create({
      data: {
        userId,
        sessionId,
        kind: e.kind,
        app: e.app?.slice(0, 80) ?? null,
        title: e.title?.slice(0, 200) ?? null,
        text,
        textHash: text ? hashText(text) : null,
        recordedAt: e.recordedAt ? new Date(e.recordedAt) : new Date(),
      },
    });
    inserted += 1;
  }
  return inserted;
}

export type FuseEventRow = {
  app: string | null;
  title: string | null;
  text: string | null;
};

/** Pure fuse — unit-tested; DB layer loads rows then calls this. */
export function bundleFromEvents(
  sessionId: string,
  events: FuseEventRow[],
): ContextBundle | null {
  if (events.length === 0) return null;
  let app = "";
  let windowTitle = "";
  let quote = "";
  for (const e of events) {
    if (e.app) app = e.app;
    if (e.title) windowTitle = e.title;
    if (e.text && e.text.length >= 8) quote = e.text;
  }
  if (!quote && windowTitle.length < 4) return null;

  const usable = quote.length >= 8 ? quote : windowTitle;
  const fingerprint = `${app}|${windowTitle}|${usable.slice(0, 180)}`;
  const tags = new Set<string>();
  for (const e of events) {
    if (e.text) for (const t of sensitivityTags(e.text)) tags.add(t);
  }

  return {
    sessionId,
    app: app || "Front window",
    windowTitle,
    quote: quote.length >= 8 ? quote : windowTitle,
    fingerprint,
    sensitivityTags: [...tags],
    eventCount: events.length,
  };
}

export async function fuseSessionBundle(sessionId: string): Promise<ContextBundle | null> {
  const since = new Date(Date.now() - 10 * 60_000);
  const events = await prisma.contextEvent.findMany({
    where: { sessionId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
    take: 40,
  });
  return bundleFromEvents(
    sessionId,
    events.map((e) => ({ app: e.app, title: e.title, text: e.text })),
  );
}

function draftFromBundle(bundle: ContextBundle, signal: NonNullable<ReturnType<typeof episodicSignal>>) {
  const tagLine =
    bundle.sensitivityTags.length > 0
      ? `Sensitive patterns: ${bundle.sensitivityTags.join(", ")}. Nothing sends without Approve.`
      : "Nothing is sent to Google from this read.";
  const narrative =
    bundle.eventCount > 1
      ? `Jos fused ${bundle.eventCount} signals in this session (window + clipboard).`
      : "Jos read one signal from the front of your Mac.";
  return {
    title: signal.headline,
    body: [
      narrative,
      "",
      `Where: ${bundle.app}${bundle.windowTitle ? ` — ${bundle.windowTitle}` : ""}`,
      "",
      signal.quote,
      "",
      tagLine,
      "",
      "Edit, then Approve to close this locally.",
    ].join("\n"),
  };
}

async function surfaceBundleLoop(userId: string, sessionId: string) {
  const bundle = await fuseSessionBundle(sessionId);
  if (!bundle) return { surfaced: false as const, reason: "thin" as const };

  const signal = episodicSignal({
    app: bundle.app,
    title: bundle.windowTitle,
    text: bundle.quote,
  });
  if (!signal) return { surfaced: false as const, reason: "thin" as const };

  const evidence = {
    fixture: false,
    episodic: true,
    bundle: true,
    sessionId,
    eventCount: bundle.eventCount,
    fingerprint: bundle.fingerprint,
    sensitivityTags: bundle.sensitivityTags,
    app: bundle.app,
    windowTitle: bundle.windowTitle,
  };
  const draft = draftFromBundle(bundle, signal);

  const existing = await prisma.loop.findFirst({
    where: { userId, source: EPISODIC_SOURCE, sourceRef: BUNDLE_SOURCE_REF },
  });

  const loopData = {
    kind: "todo" as const,
    band: bundle.sensitivityTags.length > 0 ? ("high" as const) : ("high" as const),
    status: "proposed" as const,
    title: signal.headline,
    summary: signal.summary,
    objectType: bundle.sensitivityTags.includes("secret_credential_like") ? "hint" : "clip",
    routerConf: bundle.sensitivityTags.length > 0 ? 0.65 : 0.85,
    evidenceJson: JSON.stringify(evidence),
    snoozedUntil: null,
  };

  if (existing) {
    const prior = (() => {
      try {
        return JSON.parse(existing.evidenceJson ?? "{}") as { fingerprint?: string };
      } catch {
        return {};
      }
    })();
    if (
      prior.fingerprint === bundle.fingerprint &&
      ["done", "dismissed"].includes(existing.status)
    ) {
      return { surfaced: false as const, reason: "already-closed" as const };
    }
    if (prior.fingerprint === bundle.fingerprint) {
      return { surfaced: true as const, loop: serializeLoop(existing), fresh: false as const };
    }
    const loop = await prisma.loop.update({ where: { id: existing.id }, data: loopData });
    await writeDraft(userId, loop.id, draft);
    return { surfaced: true as const, loop: serializeLoop(loop), fresh: true as const };
  }

  const loop = await prisma.loop.create({
    data: {
      userId,
      ...loopData,
      source: EPISODIC_SOURCE,
      sourceRef: BUNDLE_SOURCE_REF,
    },
  });
  await writeDraft(userId, loop.id, draft);
  return { surfaced: true as const, loop: serializeLoop(loop), fresh: true as const };
}

export async function captureAndFuseLoop(
  userId: string,
  input: EpisodicInput & { idleSeconds?: number },
) {
  const sessionId = await ensureContextSession(userId, input.idleSeconds);
  await appendContextEvents(userId, sessionId, [
    {
      kind: "window_read",
      app: input.app,
      title: input.title,
      text: input.text,
    },
  ]);
  await purgeContextOlderThan(userId, PURGE_CONTEXT_HOURS);
  return surfaceBundleLoop(userId, sessionId);
}

export async function ingestCaptureEvents(
  userId: string,
  events: CaptureEvent[],
  idleSeconds?: number,
) {
  if (events.length === 0) return { inserted: 0, surfaced: false as const, reason: "empty" as const };
  const sessionId = await ensureContextSession(userId, idleSeconds);
  const inserted = await appendContextEvents(userId, sessionId, events);
  await purgeContextOlderThan(userId, PURGE_CONTEXT_HOURS);
  const surfaced = await surfaceBundleLoop(userId, sessionId);
  return { inserted, sessionId, ...surfaced };
}

async function writeDraft(userId: string, loopId: string, draft: { title: string; body: string }) {
  const pending = await prisma.proposal.findFirst({
    where: { userId, loopId, status: { in: ["draft", "pending_approval"] } },
    orderBy: { createdAt: "desc" },
  });
  if (pending) {
    await prisma.proposal.update({
      where: { id: pending.id },
      data: { title: draft.title, body: draft.body, kind: "note", status: "pending_approval" },
    });
    return;
  }
  await prisma.proposal.create({
    data: {
      loopId,
      userId,
      kind: "note",
      status: "pending_approval",
      title: draft.title,
      body: draft.body,
      rationale: "Context bundle fused from host signals. Approve closes locally.",
    },
  });
}

export async function purgeContextOlderThan(userId: string, hours: number) {
  const cutoff = new Date(Date.now() - hours * 3600_000);
  const oldSessions = await prisma.contextSession.findMany({
    where: { userId, startedAt: { lt: cutoff } },
    select: { id: true },
  });
  if (oldSessions.length === 0) return 0;
  const ids = oldSessions.map((s) => s.id);
  await prisma.contextEvent.deleteMany({ where: { sessionId: { in: ids } } });
  const result = await prisma.contextSession.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}