/**
 * SENI (Distinction Thm I.1) — linear ApprovalGrant store.
 * Host oracle: mint on approve, consume exactly once on execute.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "../db/client.js";
import { env } from "../lib/env.js";

export class GrantError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

const MASK_EXECUTE_SEND = 1n << 1n;
const MASK_EXECUTE_CAL = 1n << 2n;
const MASK_EXECUTE_PDF = 1n << 3n;
const MASK_EXECUTE_TODO = 1n << 6n;

export function maskForProposalKind(kind: string): bigint {
  if (kind === "reply" || kind === "note") return MASK_EXECUTE_SEND;
  if (kind === "event") return MASK_EXECUTE_CAL;
  if (kind === "todo") return MASK_EXECUTE_TODO | MASK_EXECUTE_PDF;
  return MASK_EXECUTE_SEND;
}

export type GrantMacFields = {
  grantId: string;
  proposalId: string;
  nonce: string;
  mask: string;
  expiresAt: string;
};

/** HMAC-SHA256 over the grant fields. Key stays in the Brain (TOKEN_ENCRYPTION_KEY). */
export function signGrantMac(key: string, fields: GrantMacFields): string {
  const payload = `${fields.grantId}|${fields.proposalId}|${fields.nonce}|${fields.mask}|${fields.expiresAt}`;
  return createHmac("sha256", key).update(payload).digest("hex");
}

/** Constant-time check. A shell that does not hold `key` cannot produce a match. */
export function grantMacMatches(key: string, fields: GrantMacFields, mac: string): boolean {
  const expected = signGrantMac(key, fields);
  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(expected, "hex");
    b = Buffer.from(mac, "hex");
  } catch {
    return false;
  }
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function macGrant(fields: GrantMacFields): string {
  return signGrantMac(env.tokenEncryptionKey, fields);
}

/** One fresh grant per proposal — expire stale fresh rows before mint. */
export async function ensureFreshApprovalGrant(
  userId: string,
  proposalId: string,
  kind: string,
) {
  const live = await prisma.approvalGrant.findFirst({
    where: {
      userId,
      proposalId,
      status: "fresh",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (live) return live;

  await prisma.approvalGrant.updateMany({
    where: { userId, proposalId, status: "fresh" },
    data: { status: "expired" },
  });
  return mintApprovalGrant(userId, proposalId, kind);
}

/** Mint a Fresh linear grant after human approve (host oracle). */
export async function mintApprovalGrant(
  userId: string,
  proposalId: string,
  kind: string,
) {
  const nonce = randomBytes(16).toString("hex");
  const mask = maskForProposalKind(kind);
  const expiresAt = new Date(Date.now() + 15 * 60_000);
  const grant = await prisma.approvalGrant.create({
    data: {
      userId,
      proposalId,
      nonce,
      mask: mask.toString(),
      status: "fresh",
      mac: "pending",
      expiresAt,
    },
  });
  const mac = macGrant({
    grantId: grant.id,
    proposalId,
    nonce,
    mask: mask.toString(),
    expiresAt: expiresAt.toISOString(),
  });
  return prisma.approvalGrant.update({
    where: { id: grant.id },
    data: { mac },
  });
}

/**
 * Consume grant for execute — SENI commit rule.
 * Throws 403 if missing/forged/replayed/expired.
 */
export async function consumeApprovalGrant(userId: string, proposalId: string) {
  const grant = await prisma.approvalGrant.findFirst({
    where: { userId, proposalId, status: "fresh" },
    orderBy: { createdAt: "desc" },
  });
  if (!grant) {
    throw new GrantError(
      "SENI: Approve grant required before execute — nothing sends without you",
      403,
    );
  }
  if (grant.expiresAt.getTime() < Date.now()) {
    await prisma.approvalGrant.update({
      where: { id: grant.id },
      data: { status: "expired" },
    });
    throw new GrantError("SENI: Approval grant expired — approve again", 403);
  }
  const fields = {
    grantId: grant.id,
    proposalId: grant.proposalId,
    nonce: grant.nonce,
    mask: grant.mask,
    expiresAt: grant.expiresAt.toISOString(),
  };
  if (!grantMacMatches(env.tokenEncryptionKey, fields, grant.mac)) {
    throw new GrantError("SENI: CapToken MAC invalid — forge blocked", 403);
  }

  // Linear consume: only one winner under concurrent execute
  const updated = await prisma.approvalGrant.updateMany({
    where: { id: grant.id, status: "fresh" },
    data: { status: "consumed", consumedAt: new Date() },
  });
  if (updated.count !== 1) {
    throw new GrantError("SENI: Approval grant already consumed (no replay)", 409);
  }
  return grant;
}

export async function assertNoReplay(userId: string, proposalId: string) {
  const consumed = await prisma.approvalGrant.count({
    where: { userId, proposalId, status: "consumed" },
  });
  const fresh = await prisma.approvalGrant.count({
    where: { userId, proposalId, status: "fresh" },
  });
  return { consumed, fresh };
}
