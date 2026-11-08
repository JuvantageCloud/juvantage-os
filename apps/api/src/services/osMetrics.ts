import { prisma } from "../db/client.js";

const QUIET_REASONS = [
  "wrong_band",
  "wrong_object",
  "not_actionable",
  "already_done",
  "other",
] as const;

export type QuietReason = (typeof QUIET_REASONS)[number];

export function normalizeQuietReason(raw: unknown): QuietReason {
  if (typeof raw === "string" && (QUIET_REASONS as readonly string[]).includes(raw)) {
    return raw as QuietReason;
  }
  return "other";
}

/** Dogfood metrics for Phase 6 — clear / accept / edit / dismiss. */
export async function dogfoodMetrics(userId: string, days = 14) {
  const since = new Date(Date.now() - days * 24 * 3600_000);

  const [loops, audits] = await Promise.all([
    prisma.loop.findMany({
      where: { userId, updatedAt: { gte: since } },
      select: { status: true },
    }),
    prisma.osAuditEvent.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { action: true, detailJson: true },
    }),
  ]);

  let done = 0;
  let dismissed = 0;
  let open = 0;
  for (const l of loops) {
    if (l.status === "done") done += 1;
    else if (l.status === "dismissed") dismissed += 1;
    else if (["open", "proposed", "approved", "executing"].includes(l.status)) open += 1;
  }

  const actions: Record<string, number> = {};
  const quietReasons: Record<QuietReason, number> = {
    wrong_band: 0,
    wrong_object: 0,
    not_actionable: 0,
    already_done: 0,
    other: 0,
  };

  for (const a of audits) {
    actions[a.action] = (actions[a.action] ?? 0) + 1;
    if (a.action === "dismiss") {
      const reason = normalizeQuietReason(parseDetail(a.detailJson)?.reason);
      quietReasons[reason] += 1;
    }
  }

  const closed = done + dismissed;
  const edits = actions.edit_proposal ?? 0;
  const verifies = actions.verify ?? 0;
  const approves = actions.approve ?? 0;
  const proposes = actions.propose ?? 0;

  return {
    windowDays: days,
    since: since.toISOString(),
    loops: { done, dismissed, open, touched: loops.length },
    /** Share of finished loops that closed successfully vs quieted. */
    clearRate: closed === 0 ? null : round(done / closed),
    /** Verifies / (verifies + dismissals) — crude “accepted the close”. */
    acceptRate: verifies + dismissed === 0 ? null : round(verifies / (verifies + dismissed)),
    /** Edits before approve — high is OK (you’re in control). */
    editRate: proposes === 0 ? null : round(edits / proposes),
    actions: {
      propose: proposes,
      edit: edits,
      approve: approves,
      execute: actions.execute ?? 0,
      verify: verifies,
      dismiss: actions.dismiss ?? 0,
      snooze: actions.snooze ?? 0,
    },
    quietReasons,
  };
}

function parseDetail(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
