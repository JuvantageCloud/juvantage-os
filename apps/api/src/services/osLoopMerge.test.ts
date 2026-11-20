import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../db/client.js";
import { mergeRelatedOpenLoops } from "./osLoopMerge.js";

describe("mergeRelatedOpenLoops v0", () => {
  const userId = "merge-v0-user";

  beforeEach(async () => {
    await prisma.osAuditEvent.deleteMany({ where: { userId } });
    await prisma.proposal.deleteMany({ where: { userId } });
    await prisma.loop.deleteMany({ where: { userId } });
  });

  it("folds overlapping gmail loop into episodic anchor", async () => {
    const anchor = await prisma.loop.create({
      data: {
        userId,
        kind: "todo",
        band: "high",
        status: "proposed",
        title: "VoiceController.swift line",
        source: "episodic",
        sourceRef: "context-bundle",
        objectType: "clip",
        evidenceJson: JSON.stringify({ sessionId: "s1", fingerprint: "f1" }),
      },
    });
    const mail = await prisma.loop.create({
      data: {
        userId,
        kind: "reply_owed",
        band: "high",
        status: "open",
        title: "Q3 pilot pack — need your reply",
        source: "gmail",
        sourceRef: "demo-thread-boss",
        objectType: "mail",
      },
    });

    const { merged, childSources } = await mergeRelatedOpenLoops(userId, anchor.id, {
      title: "VoiceController change",
      quote: "Need to confirm Q3 pilot timeline before merge",
      windowTitle: "VoiceController.swift",
      sessionId: "s1",
    });

    assert.equal(merged, 1);
    assert.equal(childSources.length, 1);
    assert.equal(childSources[0]?.ref, "demo-thread-boss");

    const afterMail = await prisma.loop.findUnique({ where: { id: mail.id } });
    assert.equal(afterMail?.status, "dismissed");

    const afterAnchor = await prisma.loop.findUnique({ where: { id: anchor.id } });
    const ev = JSON.parse(afterAnchor?.evidenceJson ?? "{}") as {
      childSources?: Array<{ source: string }>;
    };
    assert.equal(ev.childSources?.length, 1);
    assert.equal(ev.childSources?.[0]?.source, "gmail");
  });
});