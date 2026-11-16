import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { grantMacMatches, maskForProposalKind, signGrantMac } from "./osGrants.js";
import { presencePolicy } from "./osPresence.js";
import { releaseExecuteSlot, tryAdmit, tryAdmitExecute } from "./osBus.js";
import { isClosableObjectType } from "@juvantage/shared";
import { canApproveExecute } from "./osModality.js";

const fields = {
  grantId: "g1",
  proposalId: "p1",
  nonce: "abc",
  mask: "2",
  expiresAt: "2026-11-14T00:00:00.000Z",
};

describe("osGrants SENI masks", () => {
  it("maps reply to send capability bit", () => {
    assert.equal(maskForProposalKind("reply"), 1n << 1n);
  });

  it("maps event to calendar bit", () => {
    assert.equal(maskForProposalKind("event"), 1n << 2n);
  });
});

describe("quartet grant MAC", () => {
  it("brain key verifies; a shell key does not", () => {
    const mac = signGrantMac("brain-key", fields);
    assert.equal(grantMacMatches("brain-key", fields, mac), true);
    assert.equal(grantMacMatches("shell-key", fields, mac), false);
  });

  it("rejects a tampered nonce", () => {
    const mac = signGrantMac("brain-key", fields);
    assert.equal(
      grantMacMatches("brain-key", { ...fields, nonce: "forged" }, mac),
      false,
    );
  });
});

describe("quartet presence", () => {
  it("idle turns eyes off and leaves ears on", () => {
    const active = presencePolicy(0);
    assert.equal(active.eyesOff, false);
    assert.equal(active.earsOn, true);
    assert.equal(active.retainFrames, false);
    assert.equal(active.recordEyeLedger, true);

    const idle = presencePolicy(90);
    assert.equal(idle.eyesOff, true);
    assert.equal(idle.earsOn, true);
    assert.equal(idle.recordEyeLedger, false);
  });
});

describe("quartet bus", () => {
  it("a full slot stays full on every retry", () => {
    for (let n = 0; n < 8; n++) {
      assert.deepEqual(tryAdmit(4, 4), { ok: false, reason: "full" });
    }
  });

  it("admits under the cap and releases", () => {
    const user = "quartet-bus-user";
    assert.equal(tryAdmitExecute(user, 1).ok, true);
    assert.deepEqual(tryAdmitExecute(user, 1), { ok: false, reason: "full" });
    releaseExecuteSlot(user);
    assert.equal(tryAdmitExecute(user, 1).ok, true);
    releaseExecuteSlot(user);
  });
});

describe("quartet close rule", () => {
  it("matches the shell closable set and blocks hint", () => {
    for (const t of ["mail", "chat", "pdf", "form", "calendar", "clip", "voice"] as const) {
      assert.equal(canApproveExecute(t), isClosableObjectType(t));
      assert.equal(canApproveExecute(t), true);
    }
    assert.equal(canApproveExecute("hint"), false);
    assert.equal(canApproveExecute("unknown"), false);
    assert.equal(canApproveExecute(null), false);
  });
});
