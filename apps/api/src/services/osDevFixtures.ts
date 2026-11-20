/**
 * Dev-only sample loops so host 1 is not empty.
 * Refuses to run when NODE_ENV=production. Opt out with OS_DEV_FIXTURES=false.
 * Approve on these rows never calls Gmail or Calendar (see osClose).
 */
import { prisma } from "../db/client.js";

export const DEV_FIXTURE_SOURCE = "dev_fixture";

export function devFixturesAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.OS_DEV_FIXTURES === "false") return false;
  return true;
}

type Fixture = {
  sourceRef: string;
  kind: string;
  band: string;
  objectType: string;
  title: string;
  summary: string;
  proposalKind: string;
  proposalTitle: string;
  proposalBody: string;
  evidence: Record<string, unknown>;
};

const FIXTURES: Fixture[] = [
  {
    sourceRef: "reply-maya",
    kind: "reply_owed",
    band: "critical",
    objectType: "mail",
    title: "Reply to Maya about Thursday’s pilot",
    summary: "Maya Chen — Can you confirm Thursday 2pm still works for the pilot walkthrough?",
    proposalKind: "reply",
    proposalTitle: "Re: Thursday pilot walkthrough",
    proposalBody:
      "Maya — Thursday 2pm still works. I’ll bring the deck and we can close the open questions then.\n\n— John",
    evidence: { fromAddr: "maya@example.com", fixture: true },
  },
  {
    sourceRef: "hold-harbor",
    kind: "appointment",
    band: "high",
    objectType: "calendar",
    title: "Confirm the Harbor check-in",
    summary: "A hold is sitting unconfirmed. Approve books it in this dev fixture (no live calendar).",
    proposalKind: "event",
    proposalTitle: "Harbor check-in",
    proposalBody: "30 minutes. Walk the open loops and pick the one to close this week.",
    evidence: { fixture: true },
  },
  {
    sourceRef: "clip-deck",
    kind: "todo",
    band: "normal",
    objectType: "clip",
    title: "Clip: send the deck after the pilot",
    summary: "You marked this while in Cursor. Refine the note, then Approve closes it.",
    proposalKind: "note",
    proposalTitle: "Send the deck",
    proposalBody: "After Thursday’s pilot, send Maya the deck and the two open questions.",
    evidence: { fixture: true, app: "Cursor" },
  },
  {
    sourceRef: "weak-hint",
    kind: "other",
    band: "quiet",
    objectType: "hint",
    title: "You were in some app",
    summary: "Weak signal. Approve must stay off — this is not a closable object.",
    proposalKind: "note",
    proposalTitle: "Not closable",
    proposalBody: "This hint exists so you can see the blocked tool. Do not approve it.",
    evidence: { fixture: true },
  },
];

export async function ensureDevFixtures(userId: string) {
  if (!devFixturesAllowed()) {
    return { ok: false as const, reason: "disabled" as const, created: [] as string[] };
  }

  const created: string[] = [];
  for (const fixture of FIXTURES) {
    const existing = await prisma.loop.findFirst({
      where: { userId, source: DEV_FIXTURE_SOURCE, sourceRef: fixture.sourceRef },
    });
    if (existing) continue;

    const loop = await prisma.loop.create({
      data: {
        userId,
        kind: fixture.kind,
        band: fixture.band,
        status: "proposed",
        title: fixture.title,
        summary: fixture.summary,
        source: DEV_FIXTURE_SOURCE,
        sourceRef: fixture.sourceRef,
        objectType: fixture.objectType,
        routerConf: fixture.objectType === "hint" ? 0.2 : 0.9,
        evidenceJson: JSON.stringify(fixture.evidence),
      },
    });
    await prisma.proposal.create({
      data: {
        loopId: loop.id,
        userId,
        kind: fixture.proposalKind,
        status: "pending_approval",
        title: fixture.proposalTitle,
        body: fixture.proposalBody,
        rationale: "Dev fixture — safe to approve. Does not call Google.",
      },
    });
    created.push(fixture.sourceRef);
  }

  return { ok: true as const, created };
}
