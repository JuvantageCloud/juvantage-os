import { prisma } from "../db/client.js";

const MAIL_ACTION_RE =
  /(please (reply|confirm|respond)|need your (reply|response)|can you|could you|let me know|does .+ work|are you free|eod|by friday|by thursday|waiting for|following up)/i;

const RESOLVED_SNIPPET_RE =
  /^(thanks|thank you|thx|sounds good|all set|got it|perfect|no worries|will do|confirmed)/i;

function mailThreadLooksResolved(
  thread: {
    snippet?: string | null;
    subject?: string | null;
    payloadJson?: string | null;
  },
  userEmail: string,
): boolean {
  const snippet = (thread.snippet ?? "").trim();
  if (!snippet) return false;

  let lastFrom = "";
  try {
    const payload = JSON.parse(thread.payloadJson ?? "{}") as { lastFrom?: string };
    lastFrom = (payload.lastFrom ?? "").toLowerCase();
  } catch {
    lastFrom = "";
  }
  const me = userEmail.toLowerCase();
  if (me && lastFrom && (lastFrom.includes(me) || lastFrom.includes(me.split("@")[0] ?? ""))) {
    return true;
  }

  if (RESOLVED_SNIPPET_RE.test(snippet) && !MAIL_ACTION_RE.test(snippet)) {
    return true;
  }

  const subj = thread.subject ?? "";
  if (/^re:\s*/i.test(subj) && !MAIL_ACTION_RE.test(snippet) && snippet.length < 140) {
    return true;
  }

  return false;
}

/** Hours without new fused signals before episodic loop is treated as abandoned. */
const EPISODIC_STALE_HOURS = 6;

async function autoDismissLoop(
  userId: string,
  loopId: string,
  reason: string,
  detail: Record<string, unknown>,
) {
  await prisma.loop.update({
    where: { id: loopId },
    data: { status: "dismissed", band: "quiet" },
  });
  await prisma.osAuditEvent.create({
    data: {
      userId,
      loopId,
      action: "liveness",
      detailJson: JSON.stringify({ reason, ...detail }),
    },
  });
}

/**
 * Drop or quiet loops whose world anchor no longer supports an open obligation.
 * Called before surfacing so we don't draft work the user already closed.
 */
export async function reconcileOpenLoops(userId: string): Promise<{ closed: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const userEmail = user?.email ?? "";

  const open = await prisma.loop.findMany({
    where: {
      userId,
      status: { in: ["open", "proposed"] },
    },
  });

  let closed = 0;

  for (const loop of open) {
    if (loop.source === "gmail" && loop.sourceRef) {
      const thread = await prisma.osMailThread.findFirst({
        where: { userId, externalId: loop.sourceRef },
      });
      if (!thread) {
        await autoDismissLoop(userId, loop.id, "stale_source", {
          source: "gmail",
          note: "thread no longer in connector cache",
        });
        closed += 1;
        continue;
      }
      const text = `${thread.subject ?? ""} ${thread.snippet ?? ""}`;
      if (mailThreadLooksResolved(thread, userEmail)) {
        await autoDismissLoop(userId, loop.id, "already_done", {
          source: "gmail",
          note: "thread appears replied or resolved externally",
        });
        closed += 1;
        continue;
      }
      if (!MAIL_ACTION_RE.test(text)) {
        await autoDismissLoop(userId, loop.id, "already_done", {
          source: "gmail",
          note: "thread no longer matches actionable reply pattern",
        });
        closed += 1;
      }
      continue;
    }

    if (loop.source === "google_calendar" && loop.sourceRef) {
      const ev = await prisma.osCalendarItem.findFirst({
        where: { userId, externalId: loop.sourceRef },
      });
      if (!ev || ev.startsAt.getTime() < Date.now() - 3_600_000) {
        await autoDismissLoop(userId, loop.id, "already_done", {
          source: "google_calendar",
          note: "event missing or already started",
        });
        closed += 1;
      }
      continue;
    }

    if (loop.source === "episodic") {
      let sessionId: string | undefined;
      try {
        const ev = JSON.parse(loop.evidenceJson ?? "{}") as { sessionId?: string };
        sessionId = ev.sessionId;
      } catch {
        sessionId = undefined;
      }
      if (sessionId) {
        const last = await prisma.contextEvent.findFirst({
          where: { userId, sessionId },
          orderBy: { recordedAt: "desc" },
        });
        const ageMs = last
          ? Date.now() - last.recordedAt.getTime()
          : Date.now() - loop.updatedAt.getTime();
        if (ageMs > EPISODIC_STALE_HOURS * 3_600_000) {
          await autoDismissLoop(userId, loop.id, "stale_context", {
            source: "episodic",
            sessionId,
            staleHours: EPISODIC_STALE_HOURS,
          });
          closed += 1;
        }
      }
    }
  }

  return { closed };
}