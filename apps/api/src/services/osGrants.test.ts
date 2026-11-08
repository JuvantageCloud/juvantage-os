import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskForProposalKind } from "./osGrants.js";

describe("osGrants SENI masks", () => {
  it("maps reply to send capability bit", () => {
    assert.equal(maskForProposalKind("reply"), 1n << 1n);
  });

  it("maps event to calendar bit", () => {
    assert.equal(maskForProposalKind("event"), 1n << 2n);
  });
});
