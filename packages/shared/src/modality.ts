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
