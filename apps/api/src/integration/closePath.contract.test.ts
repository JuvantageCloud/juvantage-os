/**
 * Integration contract — proposal gate + send modes (no live Gmail).
 * Principal Integration Test Engineer: expand to HTTP harness + Playwright.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isProposalEditable,
  isProposalSendable,
} from "../services/osClose.js";
import { canApproveExecute } from "../services/osModality.js";

describe("close path contracts (MVP)", () => {
  it("mail loops are sendable; hints are not", () => {
    assert.equal(canApproveExecute("mail"), true);
    assert.equal(canApproveExecute("hint"), false);
    assert.equal(canApproveExecute("clip"), true);
  });

  it("only pending proposals are editable", () => {
    assert.equal(isProposalEditable("pending_approval"), true);
    assert.equal(isProposalEditable("executed"), false);
  });

  it("approve-send allowed only before executed", () => {
    assert.equal(isProposalSendable("approved"), true);
    assert.equal(isProposalSendable("executed"), false);
  });
});
