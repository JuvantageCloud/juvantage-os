import { z } from "zod";
import type { LoopObjectType } from "./os.js";
import type { ProposalKind } from "./os.js";

/** Renderer id for the integrated edit surface (ModalityHost). */
export const ModalityIdSchema = z.enum([
  "mail_compose",
  "event_compose",
  "structured_note",
  "blocked_hint",
]);
export type ModalityId = z.infer<typeof ModalityIdSchema>;

export const MailEvidenceSchema = z.object({
  threadId: z.string().optional(),
  fromAddr: z.string().optional(),
  ageHours: z.number().optional(),
});
export type MailEvidence = z.infer<typeof MailEvidenceSchema>;

export const AmbientEvidenceSchema = z.object({
  app: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
});
export type AmbientEvidence = z.infer<typeof AmbientEvidenceSchema>;

export const EvidenceLineSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
});
export type EvidenceLine = z.infer<typeof EvidenceLineSchema>;

export function resolveModalityId(
  objectType: string | null | undefined,
  proposalKind: ProposalKind | undefined,
): ModalityId {
  if (objectType === "hint" || objectType === "unknown") return "blocked_hint";
  if (objectType === "mail" || proposalKind === "reply") return "mail_compose";
  if (objectType === "calendar" || proposalKind === "event") return "event_compose";
  return "structured_note";
}

export function parseMailEvidence(raw: unknown): MailEvidence | null {
  const r = MailEvidenceSchema.safeParse(raw);
  return r.success ? r.data : null;
}

export function parseAmbientEvidence(raw: unknown): AmbientEvidence | null {
  const r = AmbientEvidenceSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/** Human-readable evidence lines for the inline context drawer (not a separate nav). */
export function evidenceLinesForLoop(input: {
  source: string | null;
  objectType?: LoopObjectType | string | null;
  evidence: unknown;
  ambient: unknown;
  routerConf?: number | null;
}): EvidenceLine[] {
  const lines: EvidenceLine[] = [];

  if (input.source === "gmail") {
    const mail = parseMailEvidence(input.evidence);
    if (mail?.fromAddr) {
      lines.push({ key: "from", label: "From", value: mail.fromAddr });
    }
    if (mail?.threadId) {
      lines.push({ key: "thread", label: "Thread", value: mail.threadId.slice(0, 24) });
    }
    if (mail?.ageHours != null) {
      lines.push({ key: "age", label: "Age", value: `${mail.ageHours}h` });
    }
  } else if (input.source === "google_calendar") {
    const ev = input.evidence as { startsAt?: string } | null;
    if (ev?.startsAt) {
      lines.push({
        key: "starts",
        label: "Starts",
        value: new Date(ev.startsAt).toLocaleString(),
      });
    }
  } else if (input.source === "clip") {
    lines.push({ key: "clip", label: "Source", value: "Clip (⌘⇧L)" });
  } else if (input.source === "voice") {
    lines.push({ key: "voice", label: "Source", value: "Voice (hold fn)" });
    const said = (input.evidence as { transcript?: string } | null)?.transcript;
    if (said) lines.push({ key: "said", label: "You said", value: said.slice(0, 160) });
  } else if (input.source === "episodic") {
    const ev = input.evidence as {
      bundle?: boolean;
      sessionId?: string;
      eventCount?: number;
      app?: string;
      windowTitle?: string;
    } | null;
    lines.push({ key: "eye", label: "Source", value: "Front window + clipboard (episodic)" });
    if (ev?.app) lines.push({ key: "app", label: "App", value: ev.app });
    if (ev?.windowTitle) {
      lines.push({ key: "title", label: "Window", value: ev.windowTitle.slice(0, 120) });
    }
    if (ev?.eventCount != null && ev.eventCount > 0) {
      lines.push({ key: "fused", label: "Signals fused", value: String(ev.eventCount) });
    }
  }

  const amb = parseAmbientEvidence(input.ambient);
  if (amb?.app) {
    lines.push({ key: "app", label: "App", value: amb.app });
  }
  if (amb?.title) {
    lines.push({ key: "title", label: "Window", value: amb.title.slice(0, 120) });
  }

  if (input.objectType) {
    lines.push({ key: "type", label: "Object", value: String(input.objectType) });
  }
  if (input.routerConf != null) {
    lines.push({
      key: "conf",
      label: "Router",
      value: `${Math.round(input.routerConf * 100)}%`,
    });
  }

  return lines;
}

export type LoopContextPackView = {
  sessionId?: string | null;
  eventCount?: number;
  fingerprint?: string | null;
  sensitivityTags?: string[];
  evidence?: Record<string, unknown>;
  events?: Array<{
    kind: string;
    app?: string | null;
    title?: string | null;
    textPreview?: string | null;
  }>;
};

/** Extra lines from GET /loops/:id/context (fused session ledger). */
export function evidenceLinesFromContextPack(
  pack: LoopContextPackView | null | undefined,
): EvidenceLine[] {
  if (!pack) return [];
  const lines: EvidenceLine[] = [];
  if (pack.fingerprint) {
    lines.push({ key: "fp", label: "Fingerprint", value: pack.fingerprint.slice(0, 80) });
  }
  if (pack.sensitivityTags?.length) {
    lines.push({
      key: "tags",
      label: "Sensitivity",
      value: pack.sensitivityTags.join(", "),
    });
  }
  const rawChildren = pack.evidence?.childSources ?? pack.evidence?.mergedSources;
  const children = Array.isArray(rawChildren)
    ? (rawChildren as Array<{ source?: string; title?: string }>)
    : [];
  children.slice(0, 4).forEach((c, i) => {
    const src = c.source ?? "ear";
    const title = c.title?.trim() ?? "";
    lines.push({
      key: `merge-${i}`,
      label: "Merged ear",
      value: title ? `${src}: ${title}` : String(src),
    });
  });
  const seen = new Set<string>();
  let shown = 0;
  for (const ev of pack.events ?? []) {
    if (shown >= 4) break;
    const bit = [ev.app, ev.title, ev.textPreview].filter(Boolean).join(" — ");
    if (!bit) continue;
    const key = bit.slice(0, 100);
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push({
      key: `evt-${shown}`,
      label: ev.kind.replace(/_/g, " "),
      value: bit.slice(0, 140),
    });
    shown += 1;
  }
  return lines;
}

export type PresenceHint = {
  app?: string;
  title?: string;
};

const BAND_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  quiet: 3,
};

function norm(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase();
}

/** Negative = higher priority when sorting hero (user is in this context now). */
export function presenceBoostForLoop(
  loop: {
    source?: string | null;
    evidence?: unknown;
    ambient?: unknown;
  },
  presence: PresenceHint | null | undefined,
): number {
  if (!presence) return 0;
  let ev: { app?: string; windowTitle?: string } = {};
  try {
    ev =
      typeof loop.evidence === "object" && loop.evidence
        ? (loop.evidence as { app?: string; windowTitle?: string })
        : {};
  } catch {
    ev = {};
  }
  const amb =
    typeof loop.ambient === "object" && loop.ambient
      ? (loop.ambient as { app?: string; title?: string })
      : {};
  const loopApp = norm(ev.app ?? amb.app);
  const loopTitle = norm(ev.windowTitle ?? amb.title);
  const hintApp = norm(presence.app);
  const hintTitle = norm(presence.title);

  if (!hintApp && !hintTitle) return 0;

  let boost = 0;
  if (hintApp && loopApp && (loopApp.includes(hintApp) || hintApp.includes(loopApp))) {
    boost -= 12;
  }
  if (hintTitle && loopTitle && (loopTitle.includes(hintTitle) || hintTitle.includes(loopTitle))) {
    boost -= 8;
  }
  if (loop.source === "episodic" && boost < 0) {
    boost -= 4;
  }
  return boost;
}

function contextSourceRank(l: { source?: string | null }): number {
  if (l.source === "dev_fixture") return 90;
  if (l.source === "episodic") return 0;
  if (l.source === "clip" || l.source === "voice") return 5;
  if (l.source === "gmail" || l.source === "google_calendar") return 12;
  return 8;
}

function inContextNow(
  l: { source?: string | null; evidence?: unknown; ambient?: unknown },
  presence?: PresenceHint | null,
): boolean {
  return (
    !!presence && presenceBoostForLoop(l, presence) <= -10
  );
}

function heroScore<
  T extends {
    source?: string | null;
    band?: string;
    updatedAt?: string | Date;
    evidence?: unknown;
    ambient?: unknown;
  },
>(l: T, presence?: PresenceHint | null): number {
  const band = BAND_RANK[l.band ?? "normal"] ?? 9;
  const src = inContextNow(l, presence) ? 0 : contextSourceRank(l);
  const ts =
    l.updatedAt instanceof Date
      ? l.updatedAt.getTime()
      : l.updatedAt
        ? Date.parse(l.updatedAt)
        : 0;
  const recencyBoost = ts > Date.now() - 4 * 3_600_000 ? -2 : 0;
  return src * 10 + band + recencyBoost + presenceBoostForLoop(l, presence);
}

/** One hero: fused screen context beats mailbox browsing; connectors are hands, not home. */
export function pickSheetHero<
  T extends {
    id: string;
    source?: string | null;
    objectType?: string | null;
    band?: string;
    updatedAt?: string | Date;
    evidence?: unknown;
    ambient?: unknown;
  },
>(loops: T[], presence?: PresenceHint | null): T | undefined {
  const live = loops.filter((l) => l.source !== "dev_fixture");
  if (!live.length) return undefined;

  const sorted = [...live].sort((a, b) => {
    const sa = heroScore(a, presence);
    const sb = heroScore(b, presence);
    if (sa !== sb) return sa - sb;
    return (
      presenceBoostForLoop(a, presence) - presenceBoostForLoop(b, presence)
    );
  });
  return sorted[0];
}

/** Work list: context-first, then band, then recency (fixtures last). */
export function sortLoopsForWork<
  T extends {
    source?: string | null;
    objectType?: string | null;
    band?: string;
    updatedAt?: string | Date;
    evidence?: unknown;
    ambient?: unknown;
  },
>(loops: T[], presence?: PresenceHint | null): T[] {
  const copy = [...loops];
  copy.sort((a, b) => {
    const pb =
      presenceBoostForLoop(a, presence) - presenceBoostForLoop(b, presence);
    if (pb !== 0) return pb;
    const rank = contextSourceRank(a) - contextSourceRank(b);
    if (rank !== 0) return rank;
    const band =
      (BAND_RANK[a.band ?? "normal"] ?? 9) - (BAND_RANK[b.band ?? "normal"] ?? 9);
    if (band !== 0) return band;
    const at =
      a.updatedAt instanceof Date
        ? a.updatedAt.getTime()
        : a.updatedAt
          ? Date.parse(a.updatedAt)
          : 0;
    const bt =
      b.updatedAt instanceof Date
        ? b.updatedAt.getTime()
        : b.updatedAt
          ? Date.parse(b.updatedAt)
          : 0;
    return bt - at;
  });
  return copy;
}
