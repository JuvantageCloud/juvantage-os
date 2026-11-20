import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../db/client.js";
import { reconcileOpenLoops } from "./osLoopLiveness.js";

describe("reconcileOpenLoops", () => {
  const userId = "liveness-test-user";

  beforeEach(async () => {
    await prisma.osAuditEvent.deleteMany({ where: { userId } });
    await prisma.proposal.deleteMany({ where: { userId } });
    await prisma.loop.deleteMany({ where: { userId } });
    await prisma.osMailThread.deleteMany({ where: { userId } });
  });

  it("dismisses gmail loop when thread left the cache", async () => {
    const loop = await prisma.loop.create({
      data: {
        userId,
        kind: "reply_owed",
        band: "high",
        status: "open",
        title: "Reply owed",
        source: "gmail",
        sourceRef: "ext-missing",
        objectType: "mail",
      },
    });

    const { closed } = await reconcileOpenLoops(userId);
    assert.equal(closed, 1);

    const after = await prisma.loop.findUnique({ where: { id: loop.id } });
    assert.equal(after?.status, "dismissed");
  });

  it("dismisses gmail loop when thread no longer actionable", async () => {
    await prisma.osMailThread.create({
      data: {
        userId,
        externalId: "ext-1",
        threadId: "t1",
        subject: "Thanks — all set",
        snippet: "No further action needed.",
        fromAddr: "friend@example.com",
        lastMessageAt: new Date(),
      },
    });
    const loop = await prisma.loop.create({
      data: {
        userId,
        kind: "reply_owed",
        band: "high",
        status: "open",
        title: "Reply owed",
        source: "gmail",
        sourceRef: "ext-1",
        objectType: "mail",
      },
    });

    const { closed } = await reconcileOpenLoops(userId);
    assert.equal(closed, 1);
    assert.equal((await prisma.loop.findUnique({ where: { id: loop.id } }))?.status, "dismissed");
  });

  it("dismisses when last message is from the user", async () => {
    await prisma.osMailThread.create({
      data: {
        userId,
        externalId: "ext-self",
        threadId: "t-self",
        subject: "Re: Need your reply",
        snippet: "Following up — sent the doc.",
        fromAddr: "boss@example.com",
        lastMessageAt: new Date(),
        payloadJson: JSON.stringify({ lastFrom: "liveness-test@local" }),
      },
    });
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: "liveness-test@local",
        name: "Liveness",
        passwordHash: "x",
      },
      update: { email: "liveness-test@local" },
    });
    const loop = await prisma.loop.create({
      data: {
        userId,
        kind: "reply_owed",
        band: "high",
        status: "open",
        title: "Reply owed",
        source: "gmail",
        sourceRef: "ext-self",
        objectType: "mail",
      },
    });

    const { closed } = await reconcileOpenLoops(userId);
    assert.equal(closed, 1);
    assert.equal((await prisma.loop.findUnique({ where: { id: loop.id } }))?.status, "dismissed");
  });

  it("keeps actionable gmail loop", async () => {
    await prisma.osMailThread.create({
      data: {
        userId,
        externalId: "ext-2",
        threadId: "t2",
        subject: "Need your reply",
        snippet: "Can you confirm by Friday?",
        fromAddr: "boss@example.com",
        lastMessageAt: new Date(),
      },
    });
    await prisma.loop.create({
      data: {
        userId,
        kind: "reply_owed",
        band: "high",
        status: "open",
        title: "Reply owed",
        source: "gmail",
        sourceRef: "ext-2",
        objectType: "mail",
      },
    });

    const { closed } = await reconcileOpenLoops(userId);
    assert.equal(closed, 0);
  });
});