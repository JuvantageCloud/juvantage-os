import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeQuietReason } from "./osMetrics.js";

describe("osMetrics quiet reasons", () => {
  it("keeps known reasons", () => {
    assert.equal(normalizeQuietReason("wrong_band"), "wrong_band");
    assert.equal(normalizeQuietReason("wrong_object"), "wrong_object");
    assert.equal(normalizeQuietReason("not_actionable"), "not_actionable");
    assert.equal(normalizeQuietReason("already_done"), "already_done");
  });

  it("falls back to other", () => {
    assert.equal(normalizeQuietReason("nope"), "other");
    assert.equal(normalizeQuietReason(null), "other");
  });
});
