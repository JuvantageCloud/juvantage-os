import { prisma } from "../db/client.js";

const STOP = new Set([
  "about",
  "after",
  "still",
  "need",
  "your",
  "reply",
  "with",
  "from",
  "this",
  "that",
  "have",
  "will",
]);

export type MergedChildSource = {
  source: string;
  ref: string | null;
  title: string;
};

function tokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.toLowerCase().split(/\W+/)) {
    if (w.length >= 4 && !STOP.has(w)) out.add(w);
  }
  return out;
}

function overlapCount(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  let n = 0;
  for (const t of ta) {
    if (tb.has(t)) n += 1;
  }
  return n;
}

function isRelatedConnectorLoop(
  loop: { title: string; source: string | null },
  hints: { title: string; quote: string; windowTitle?: string },
): boolean {
  if (loop.source !== "gmail" && loop.source !== "google_calendar") return false;
  const haystack = `${hints.title} ${hints.quote} ${hints.windowTitle ?? ""}`;
  const titleHit = overlapCount(loop.title, haystack) >= 1;
  const strongHit = overlapCount(loop.title, hints.quote) >= 2;
  return titleHit || strongHit;
}

/**
 * Merge v0 — while the user fuses a session, fold matching open mail/calendar
 * obligations into one episodic loop via evidence.childSources (Riverside-lite).
 */
export async function mergeRelatedOpenLoops(
  userId: string,
  anchorLoopId: string,
  hints: { title: string; quote: string; windowTitle?: string; sessionId: string },
): Promise<{ merged: number; childSources: MergedChildSource[] }> {
  const anchor = await prisma.loop.findFirst({
    where: { id: anchorLoopId, userId },
  });
  if (!anchor) return { merged: 0, childSources: [] };

  const candidates = await prisma.loop.findMany({
    where: {
      userId,
      id: { not: anchorLoopId },
      source: { in: ["gmail", "google_calendar"] },
      status: { in: ["open", "proposed"] },
    },
  });

  const related = candidates.filter((c) => isRelatedConnectorLoop(c, hints));
  if (!related.length) return { merged: 0, childSources: [] };

  let evidence: Record<string, unknown> = {};
  try {
    evidence = JSON.parse(anchor.evidenceJson ?? "{}") as Record<string, unknown>;
  } catch {
    evidence = {};
  }

  const existing = Array.isArray(evidence.childSources)
    ? (evidence.childSources as MergedChildSource[])
    : [];
  const seen = new Set(existing.map((c) => `${c.source}:${c.ref ?? c.title}`));
  const childSources = [...existing];

  let merged = 0;
  for (const child of related) {
    const key = `${child.source}:${child.sourceRef ?? child.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    childSources.push({
      source: child.source ?? "unknown",
      ref: child.sourceRef ?? null,
      title: child.title,
    });

    await prisma.loop.update({
      where: { id: child.id },
      data: { status: "dismissed", band: "quiet" },
    });
    await prisma.osAuditEvent.create({
      data: {
        userId,
        loopId: child.id,
        action: "merge_v0",
        detailJson: JSON.stringify({
          mergedInto: anchorLoopId,
          sessionId: hints.sessionId,
        }),
      },
    });
    merged += 1;
  }

  if (merged === 0 && childSources.length === existing.length) {
    return { merged: 0, childSources: existing };
  }

  evidence.childSources = childSources;
  evidence.mergedSessionId = hints.sessionId;
  await prisma.loop.update({
    where: { id: anchor.id },
    data: { evidenceJson: JSON.stringify(evidence) },
  });

  return { merged, childSources };
}