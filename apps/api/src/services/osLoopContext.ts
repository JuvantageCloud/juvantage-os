/**
 * Evidence pack API (Assignment 1 / RP-01: context fused into the work unit, not a separate tab).
 * See docs/OS_CONTEXT_FUSE.md · docs/research/doctoral/FEEDBACK_ADDENDUM.md
 */
import { prisma } from "../db/client.js";

export type ContextEventView = {
  kind: string;
  app: string | null;
  title: string | null;
  textPreview: string | null;
  recordedAt: string;
};

export type LoopContextPack = {
  loopId: string;
  source: string | null;
  objectType: string | null;
  fingerprint: string | null;
  sensitivityTags: string[];
  sessionId: string | null;
  eventCount: number;
  events: ContextEventView[];
  /** Parsed loop.evidenceJson minus bulky fields */
  evidence: Record<string, unknown>;
};

export async function getLoopContextPack(
  userId: string,
  loopId: string,
): Promise<LoopContextPack | null> {
  const loop = await prisma.loop.findFirst({ where: { id: loopId, userId } });
  if (!loop) return null;

  let evidence: Record<string, unknown> = {};
  try {
    evidence = JSON.parse(loop.evidenceJson ?? "{}") as Record<string, unknown>;
  } catch {
    evidence = {};
  }

  const sessionId = typeof evidence.sessionId === "string" ? evidence.sessionId : null;
  const sensitivityTags = Array.isArray(evidence.sensitivityTags)
    ? (evidence.sensitivityTags as string[])
    : [];
  const fingerprint =
    typeof evidence.fingerprint === "string" ? evidence.fingerprint : null;

  let events: ContextEventView[] = [];
  if (sessionId) {
    const rows = await prisma.contextEvent.findMany({
      where: { userId, sessionId },
      orderBy: { recordedAt: "asc" },
      take: 24,
    });
    events = rows.map((e) => ({
      kind: e.kind,
      app: e.app,
      title: e.title,
      textPreview: e.text?.slice(0, 160) ?? null,
      recordedAt: e.recordedAt.toISOString(),
    }));
  }

  return {
    loopId: loop.id,
    source: loop.source,
    objectType: loop.objectType,
    fingerprint,
    sensitivityTags,
    sessionId,
    eventCount: typeof evidence.eventCount === "number" ? evidence.eventCount : events.length,
    events,
    evidence,
  };
}