import { z } from "zod";

/** Score bands for unfinished work (Phase 3+). */
export const LoopBandSchema = z.enum([
  "critical",
  "high",
  "normal",
  "quiet",
]);
export type LoopBand = z.infer<typeof LoopBandSchema>;

export const LoopStatusSchema = z.enum([
  "open",
  "proposed",
  "approved",
  "executing",
  "done",
  "dismissed",
  "snoozed",
]);
export type LoopStatus = z.infer<typeof LoopStatusSchema>;

export const LoopKindSchema = z.enum([
  "reply_owed",
  "ask",
  "appointment",
  "todo",
  "other",
]);
export type LoopKind = z.infer<typeof LoopKindSchema>;

export const LoopObjectTypeSchema = z.enum([
  "mail",
  "chat",
  "pdf",
  "form",
  "calendar",
  "clip",
  "voice",
  "hint",
  "unknown",
]);
export type LoopObjectType = z.infer<typeof LoopObjectTypeSchema>;

export const CLOSABLE_OBJECT_TYPES = [
  "mail",
  "chat",
  "pdf",
  "form",
  "calendar",
  "clip",
  "voice",
] as const satisfies readonly LoopObjectType[];

export function isClosableObjectType(
  objectType: string | null | undefined,
): boolean {
  if (!objectType) return false;
  return (CLOSABLE_OBJECT_TYPES as readonly string[]).includes(objectType);
}

export const LoopSchema = z.object({
  id: z.string(),
  kind: LoopKindSchema,
  band: LoopBandSchema,
  status: LoopStatusSchema,
  title: z.string(),
  summary: z.string().nullable(),
  source: z.string().nullable(),
  sourceRef: z.string().nullable().optional(),
  objectType: LoopObjectTypeSchema.optional(),
  routerConf: z.number().nullable().optional(),
  canonicalUri: z.string().nullable().optional(),
  evidence: z.unknown().nullable().optional(),
  ambient: z.unknown().nullable().optional(),
  dueAt: z.string().nullable(),
  snoozedUntil: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Loop = z.infer<typeof LoopSchema>;

export const OsNudgeSchema = z.object({
  hasNudge: z.boolean(),
  count: z.number(),
  topBand: z.string().nullable(),
  topTitle: z.string().nullable(),
});
export type OsNudge = z.infer<typeof OsNudgeSchema>;

export const ProposalKindSchema = z.enum([
  "reply",
  "event",
  "todo",
  "note",
]);
export type ProposalKind = z.infer<typeof ProposalKindSchema>;

export const ProposalStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "executed",
  "failed",
  "cancelled",
]);
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

export const ProposalSchema = z.object({
  id: z.string(),
  loopId: z.string(),
  kind: ProposalKindSchema,
  status: ProposalStatusSchema,
  title: z.string(),
  body: z.string(),
  rationale: z.string().nullable().optional(),
  result: z.unknown().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Proposal = z.infer<typeof ProposalSchema>;

/** Loop as returned by GET /os/loops (includes latest proposal when present). */
export const LoopWithProposalSchema = LoopSchema.extend({
  proposal: ProposalSchema.nullable().optional(),
});
export type LoopWithProposal = z.infer<typeof LoopWithProposalSchema>;

export const OsHealthSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  demoMode: z.boolean().optional(),
  llmConfigured: z.boolean().optional(),
});
export type OsHealth = z.infer<typeof OsHealthSchema>;

/** Personal OS connectors (Phase 2). */
export const OsConnectorProviderSchema = z.enum(["gmail", "google_calendar"]);
export type OsConnectorProvider = z.infer<typeof OsConnectorProviderSchema>;

export const OsConnectorSchema = z.object({
  id: z.string(),
  provider: OsConnectorProviderSchema,
  label: z.string(),
  status: z.string(),
  enabled: z.boolean(),
  detail: z.string().nullable(),
  lastSyncAt: z.string().nullable(),
  mode: z.string().nullable(),
  hasToken: z.boolean(),
});
export type OsConnector = z.infer<typeof OsConnectorSchema>;

export const OsSyncSummarySchema = z.object({
  mailCount: z.number(),
  calCount: z.number(),
  recentMail: z.array(
    z.object({
      id: z.string(),
      subject: z.string().nullable(),
      fromAddr: z.string().nullable(),
      snippet: z.string().nullable(),
      lastMessageAt: z.string().nullable(),
    }),
  ),
  upcoming: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
    }),
  ),
});
export type OsSyncSummary = z.infer<typeof OsSyncSummarySchema>;
