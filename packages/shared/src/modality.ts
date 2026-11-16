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

const BAND_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  quiet: 3,
};

/** One hero on the float: real mail/calendar obligations beat episodic; fixtures never win. */
export function pickSheetHero<
  T extends { id: string; source?: string | null; objectType?: string | null; band?: string },
>(loops: T[]): T | undefined {
  const live = loops.filter((l) => l.source !== "dev_fixture");
  if (!live.length) return undefined;

  const obligations = live.filter(
    (l) =>
      (l.source === "gmail" || l.source === "google_calendar") &&
      (l.objectType === "mail" || l.objectType === "calendar"),
  );
  if (obligations.length) {
    obligations.sort(
      (a, b) =>
        (BAND_RANK[a.band ?? "normal"] ?? 9) - (BAND_RANK[b.band ?? "normal"] ?? 9),
    );
    return obligations[0];
  }

  const episodic = live.find((l) => l.source === "episodic");
  if (episodic) return episodic;
  return live[0];
}

function loopWorkRank(l: {
  source?: string | null;
  objectType?: string | null;
}): number {
  if (l.source === "dev_fixture") return 90;
  if (
    (l.source === "gmail" || l.source === "google_calendar") &&
    (l.objectType === "mail" || l.objectType === "calendar")
  ) {
    return 0;
  }
  if (l.source === "episodic") return 20;
  return 10;
}

/** Work list + Desktop default: real obligations first, episodic last, fixtures hidden at bottom. */
export function sortLoopsForWork<
  T extends {
    source?: string | null;
    objectType?: string | null;
    band?: string;
    updatedAt?: string | Date;
  },
>(loops: T[]): T[] {
  const copy = [...loops];
  copy.sort((a, b) => {
    const rank = loopWorkRank(a) - loopWorkRank(b);
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
