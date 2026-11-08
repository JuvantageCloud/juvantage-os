import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isProposalEditable,
  isProposalSendable,
} from "./osClose.js";

describe("integration — proposal lifecycle states", () => {
  it("editable only before approve", () => {
    assert.equal(isProposalEditable("pending_approval"), true);
    assert.equal(isProposalEditable("draft"), true);
    assert.equal(isProposalEditable("approved"), false);
    assert.equal(isProposalEditable("executed"), false);
  });

  it("sendable includes approved grant, excludes executed", () => {
    assert.equal(isProposalSendable("pending_approval"), true);
    assert.equal(isProposalSendable("approved"), true);
    assert.equal(isProposalSendable("executed"), false);
    assert.equal(isProposalSendable("failed"), false);
    assert.equal(isProposalSendable("cancelled"), false);
  });
});
