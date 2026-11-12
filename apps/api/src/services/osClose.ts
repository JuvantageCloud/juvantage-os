import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../db/client.js";
import { env, hasLiveLlm } from "../lib/env.js";
import {
  calendarEventSummary,
  insertCalendarEvent,
  resolveEventTiming,
} from "./osCalendarCreate.js";
import {
  getValidOsAccessToken,
  userHasCalendarEventsScope,
  userHasGmailSendScope,
} from "./osConnectors.js";
import { parseReplyToAddress, sendGmailReply } from "./osGmailSend.js";
import { serializeLoop } from "./osLoops.js";
import {
  GrantError,
  consumeApprovalGrant,
  ensureFreshApprovalGrant,
} from "./osGrants.js";
import { canApproveExecute } from "./osModality.js";
import { voiceDraft } from "./osVoice.js";

export class OsCloseError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function serializeProposal(p: {
  id: string;
  loopId: string;
  kind: string;
  status: string;
  title: string;
  body: string;
  rationale: string | null;
  resultJson: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    loopId: p.loopId,
    kind: p.kind,
    status: p.status,
    title: p.title,
    body: p.body,
    rationale: p.rationale,
    result: safeJson(p.resultJson),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

async function audit(
  userId: string,
  action: string,
  input: { loopId?: string; proposalId?: string; detail?: Record<string, unknown> },
) {
  await prisma.osAuditEvent.create({
    data: {
      userId,
      loopId: input.loopId ?? null,
      proposalId: input.proposalId ?? null,
      action,
      detailJson: input.detail ? JSON.stringify(input.detail) : null,
    },
  });
}

function safeJson(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function requireLoop(userId: string, loopId: string) {
  const loop = await prisma.loop.findFirst({ where: { id: loopId, userId } });
  if (!loop) throw new OsCloseError("Loop not found", 404);
  if (["done", "dismissed"].includes(loop.status)) {
    throw new OsCloseError(`Loop is ${loop.status}`, 409);
  }
  return loop;
}

function draftKindForLoop(kind: string): "reply" | "event" | "todo" | "note" {
  if (kind === "appointment") return "event";
  if (kind === "todo" || kind === "other") return "todo";
  return "reply";
}

function templateDraft(loop: {
  kind: string;
  title: string;
  summary: string | null;
  evidenceJson: string | null;
}): { title: string; body: string; rationale: string } {
  const evidence = safeJson(loop.evidenceJson) as {
    fromAddr?: string;
    threadId?: string;
  } | null;
  const from = evidence?.fromAddr?.replace(/<.*>/, "").trim() || "there";
  const topic = loop.title.replace(/^Re:\s*/i, "");

  if (loop.kind === "appointment") {
    return {
      title: `Confirm: ${topic}`,
      body: `Hi,\n\nConfirming this works on my side — locking it in.\n\nThanks,\nJohn`,
      rationale: "Appointment loop → calendar confirm draft",
    };
  }
  if (loop.kind === "todo" || loop.kind === "other") {
    return {
      title: `Next step: ${topic}`,
      body: `Next step for me:\n1) ${topic}\n2) Reply once done.\n\n(Clip/ambient context — edit before approve.)`,
      rationale: "Clip/todo loop → checklist draft",
    };
  }

  return {
    title: `Reply: ${topic}`,
    body: `Hi ${from.split(" ")[0] || "there"},\n\nThanks for the note on "${topic}".\n\nI can take this — here's where things stand and what I'll send next. Let me know if you need anything else before then.\n\nBest,\nJohn`,
    rationale: loop.summary
      ? `Reply-owed from mail: ${loop.summary.slice(0, 120)}`
      : "Reply-owed template (no LLM key — deterministic draft)",
  };
}

function voiceEvidence(raw: string | null) {
  const ev = safeJson(raw) as {
    transcript?: string;
    intent?: string;
    recipient?: string | null;
    topic?: string;
  } | null;
  if (!ev?.transcript) return null;
  return {
    transcript: ev.transcript,
    intent: ev.intent === "email" ? ("email" as const) : ("todo" as const),
    recipient: ev.recipient ?? null,
    topic: ev.topic ?? "",
  };
}

async function maybeLlmPolish(input: {
  title: string;
  body: string;
  rationale: string;
  loopTitle: string;
  summary: string | null;
}): Promise<{ title: string; body: string; rationale: string }> {
  if (!hasLiveLlm() || env.llmProvider !== "anthropic") return input;
  try {
    const client = new Anthropic({ apiKey: env.anthropicApiKey });
    const res = await client.messages.create({
      model: env.llmModel,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You draft a short professional email reply the user will APPROVE before send.
Return ONLY JSON: {"title":"...","body":"...","rationale":"one sentence"}.
Loop: ${input.loopTitle}
Context: ${input.summary ?? "n/a"}
Starter draft:\n${input.body}`,
        },
      ],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return input;
    const parsed = JSON.parse(match[0]) as {
      title?: string;
      body?: string;
      rationale?: string;
    };
    return {
      title: parsed.title?.trim() || input.title,
      body: parsed.body?.trim() || input.body,
      rationale: parsed.rationale?.trim() || `${input.rationale} (LLM polished)`,
    };
  } catch {
    return input;
  }
}

/** Create or refresh a pending proposal for a loop. */
export async function proposeForLoop(userId: string, loopId: string) {
  const loop = await requireLoop(userId, loopId);
  if (loop.objectType === "hint") {
    throw new OsCloseError(
      "Cannot draft AmbientHint — not a closable object (select text and clip again)",
      409,
    );
  }
  const kind = draftKindForLoop(loop.kind);
  const voice = loop.source === "voice" ? voiceEvidence(loop.evidenceJson) : null;
  const starter = voice
    ? voiceDraft({ transcript: voice.transcript, intent: voice })
    : templateDraft(loop);
  const draft = await maybeLlmPolish({
    ...starter,
    loopTitle: loop.title,
    summary: loop.summary,
  });

  await prisma.proposal.updateMany({
    where: {
      loopId: loop.id,
      userId,
      status: { in: ["draft", "pending_approval"] },
    },
    data: { status: "cancelled" },
  });

  const proposal = await prisma.proposal.create({
    data: {
      loopId: loop.id,
      userId,
      kind,
      status: "pending_approval",
      title: draft.title.slice(0, 200),
      body: draft.body,
      rationale: draft.rationale,
    },
  });

  const updatedLoop = await prisma.loop.update({
    where: { id: loop.id },
    data: { status: "proposed" },
  });

  await audit(userId, "propose", {
    loopId: loop.id,
    proposalId: proposal.id,
    detail: { kind },
  });

  return {
    loop: serializeLoop(updatedLoop),
    proposal: serializeProposal(proposal),
  };
}

export async function updateProposalBody(
  userId: string,
  proposalId: string,
  body: string,
  title?: string,
) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, userId },
  });
  if (!proposal) throw new OsCloseError("Proposal not found", 404);
  if (!isProposalEditable(proposal.status)) {
    throw new OsCloseError(
      `Proposal is locked (${proposal.status}) — tap Draft to create a fresh proposal`,
      409,
    );
  }
  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      body: body.slice(0, 8000),
      status: "pending_approval",
      ...(title !== undefined ? { title: title.slice(0, 500) } : {}),
    },
  });
  await audit(userId, "edit_proposal", {
    loopId: proposal.loopId,
    proposalId: proposal.id,
  });
  return serializeProposal(updated);
}

/** Approve gate — required before execute. */
export async function approveProposal(userId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, userId },
  });
  if (!proposal) throw new OsCloseError("Proposal not found", 404);
  if (proposal.status === "approved") {
    const loop = await requireLoop(userId, proposal.loopId);
    const grant = await ensureFreshApprovalGrant(
      userId,
      proposal.id,
      proposal.kind,
    );
    await audit(userId, "approve", {
      loopId: loop.id,
      proposalId: proposal.id,
      detail: { grantId: grant.id, seni: true, rearm: true },
    });
    return {
      loop: serializeLoop(loop),
      proposal: serializeProposal(proposal),
      grantId: grant.id,
    };
  }
  if (!["draft", "pending_approval"].includes(proposal.status)) {
    throw new OsCloseError(`Cannot approve from status ${proposal.status}`, 409);
  }

  const loopRow = await prisma.loop.findFirst({
    where: { id: proposal.loopId, userId },
  });
  if (!canApproveExecute(loopRow?.objectType)) {
    throw new OsCloseError(
      `Object type "${loopRow?.objectType ?? "unknown"}" cannot approve/execute (Thm III)`,
      409,
    );
  }

  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: "approved" },
  });
  const loop = await prisma.loop.update({
    where: { id: proposal.loopId },
    data: { status: "approved" },
  });
  // SENI: mint linear CapToken (Fresh) — execute must consume it
  const grant = await ensureFreshApprovalGrant(
    userId,
    proposal.id,
    proposal.kind,
  );
  await audit(userId, "approve", {
    loopId: loop.id,
    proposalId: proposal.id,
    detail: { grantId: grant.id, seni: true },
  });
  return {
    loop: serializeLoop(loop),
    proposal: serializeProposal(updated),
    grantId: grant.id,
  };
}

/**
 * Execute side effect. **403** unless proposal status is approved.
 * Demo simulates send; live OAuth calls Gmail API when send scope is granted.
 */
export async function executeProposal(userId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, userId },
  });
  if (!proposal) throw new OsCloseError("Proposal not found", 404);
  if (proposal.status !== "approved") {
    throw new OsCloseError(
      "Approve required before execute — nothing sends without you",
      403,
    );
  }

  const loop = await requireLoop(userId, proposal.loopId);
  const gmail = await getValidOsAccessToken(userId, "gmail");
  const calendar = await getValidOsAccessToken(userId, "google_calendar");

  if (
    (proposal.kind === "reply" || proposal.kind === "note") &&
    gmail?.mode === "oauth"
  ) {
    if (!(await userHasGmailSendScope(userId))) {
      throw new OsCloseError(
        "Gmail send scope missing — open Desktop → Connect and sign in to Google again (consent includes send on approve).",
        403,
      );
    }
    const evidence = safeJson(loop.evidenceJson) as {
      threadId?: string;
      fromAddr?: string;
    } | null;
    if (!evidence?.threadId) {
      throw new OsCloseError(
        "Missing mail thread id on loop — re-sync Gmail and extract loops",
        409,
      );
    }
    if (!parseReplyToAddress(evidence.fromAddr)) {
      throw new OsCloseError("Cannot parse reply address from loop evidence", 409);
    }
  }

  if (proposal.kind === "event" && calendar?.mode === "oauth") {
    if (!(await userHasCalendarEventsScope(userId))) {
      throw new OsCloseError(
        "Calendar events scope missing — open Desktop → Connect and sign in to Google again (consent includes calendar create on approve).",
        403,
      );
    }
  }

  try {
    await consumeApprovalGrant(userId, proposal.id);
  } catch (err) {
    if (err instanceof GrantError) {
      throw new OsCloseError(err.message, err.status);
    }
    throw err;
  }

  await prisma.loop.update({
    where: { id: loop.id },
    data: { status: "executing" },
  });

  let result: Record<string, unknown>;

  if (proposal.kind === "reply" || proposal.kind === "note") {
    if (!gmail || gmail.mode === "demo") {
      result = {
        channel: "gmail",
        mode: "demo",
        simulatedSend: true,
        to: (safeJson(loop.evidenceJson) as { fromAddr?: string } | null)?.fromAddr ?? null,
        subject: proposal.title,
        bodyPreview: proposal.body.slice(0, 240),
        at: new Date().toISOString(),
      };
    } else {
      const evidence = safeJson(loop.evidenceJson) as {
        threadId?: string;
        fromAddr?: string;
      } | null;
      const to = parseReplyToAddress(evidence?.fromAddr)!;
      let sent;
      try {
        sent = await sendGmailReply({
          accessToken: gmail.token,
          threadId: evidence!.threadId!,
          to,
          subject: proposal.title,
          body: proposal.body,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/401|UNAUTHENTICATED|invalid authentication/i.test(msg)) {
          throw new OsCloseError(
            "Gmail session expired — Connect → Connect Google, then Approve & send again.",
            401,
          );
        }
        throw err;
      }
      result = {
        channel: "gmail",
        mode: "gmail_live",
        sent: true,
        messageId: sent.messageId,
        threadId: sent.threadId,
        to,
        at: new Date().toISOString(),
      };
    }
  } else if (proposal.kind === "event") {
    if (!calendar || calendar.mode === "demo") {
      result = {
        channel: "google_calendar",
        mode: "demo",
        created: true,
        title: proposal.title,
        at: new Date().toISOString(),
      };
    } else {
      const evidence = safeJson(loop.evidenceJson) as {
        startsAt?: string;
        endsAt?: string;
        title?: string;
      } | null;
      const timing = resolveEventTiming(evidence);
      let created;
      try {
        created = await insertCalendarEvent({
          accessToken: calendar.token,
          summary: calendarEventSummary(proposal.title),
          description: proposal.body,
          startIso: timing.startIso,
          endIso: timing.endIso,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/401|UNAUTHENTICATED|invalid authentication/i.test(msg)) {
          throw new OsCloseError(
            "Calendar session expired — Connect → Connect Google, then Approve & send again.",
            401,
          );
        }
        throw err;
      }
      result = {
        channel: "google_calendar",
        mode: "calendar_live",
        created: true,
        eventId: created.eventId,
        htmlLink: created.htmlLink,
        title: proposal.title,
        start: timing.startIso,
        end: timing.endIso,
        at: new Date().toISOString(),
      };
    }
  } else {
    result = {
      channel: "local",
      mode: "checklist",
      noted: true,
      at: new Date().toISOString(),
    };
  }

  const executed = await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      status: "executed",
      resultJson: JSON.stringify(result),
    },
  });

  await audit(userId, "execute", {
    loopId: loop.id,
    proposalId: proposal.id,
    detail: result,
  });

  return {
    loop: serializeLoop(
      await prisma.loop.findFirstOrThrow({ where: { id: loop.id } }),
    ),
    proposal: serializeProposal(executed),
    result,
  };
}

/** Verify close — marks loop done after a successful execute. */
export async function verifyProposal(userId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, userId },
  });
  if (!proposal) throw new OsCloseError("Proposal not found", 404);
  if (proposal.status !== "executed") {
    throw new OsCloseError("Execute before verify", 409);
  }

  const result = safeJson(proposal.resultJson) as {
    simulatedSend?: boolean;
    sent?: boolean;
    created?: boolean;
    noted?: boolean;
    needsSendScope?: boolean;
  } | null;

  const ok =
    Boolean(result?.simulatedSend) ||
    Boolean(result?.sent) ||
    Boolean(result?.created) ||
    Boolean(result?.noted);

  if (!ok) throw new OsCloseError("Nothing to verify", 409);

  const loop = await prisma.loop.update({
    where: { id: proposal.loopId },
    data: { status: "done" },
  });

  await audit(userId, "verify", {
    loopId: loop.id,
    proposalId: proposal.id,
    detail: { ok: true, result },
  });

  return {
    loop: serializeLoop(loop),
    proposal: serializeProposal(proposal),
    verified: true,
  };
}

/** Convenience: approve → execute → verify in order (still gated). */
export async function approveExecuteVerify(userId: string, proposalId: string) {
  await approveProposal(userId, proposalId);
  const executed = await executeProposal(userId, proposalId);
  const verified = await verifyProposal(userId, proposalId);
  return {
    loop: verified.loop,
    proposal: verified.proposal,
    result: executed.result,
    verified: true,
  };
}

/** UI may edit only these; executed/failed must re-Draft. */
export const PROPOSAL_EDITABLE_STATUSES = ["draft", "pending_approval"] as const;

/** Approve-send allowed without re-draft (approved = already gated once). */
export const PROPOSAL_SENDABLE_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
] as const;

export function isProposalEditable(status: string): boolean {
  return (PROPOSAL_EDITABLE_STATUSES as readonly string[]).includes(status);
}

export function isProposalSendable(status: string): boolean {
  return (PROPOSAL_SENDABLE_STATUSES as readonly string[]).includes(status);
}

export async function latestProposalForLoop(userId: string, loopId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      userId,
      loopId,
      status: { in: [...PROPOSAL_SENDABLE_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });
  return proposal ? serializeProposal(proposal) : null;
}

export async function listAudit(userId: string, limit = 30) {
  const rows = await prisma.osAuditEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    loopId: r.loopId,
    proposalId: r.proposalId,
    action: r.action,
    detail: safeJson(r.detailJson),
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Pure helper for tests — approve gate. */
export function assertExecutable(status: string) {
  if (status !== "approved") {
    const err = new OsCloseError(
      "Approve required before execute — nothing sends without you",
      403,
    );
    throw err;
  }
  return true;
}
