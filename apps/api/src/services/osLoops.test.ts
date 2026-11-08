import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyMailCandidate } from "./osLoops.js";

describe("osLoops classifyMailCandidate", () => {
  it("flags reply-owed language", () => {
    const hit = classifyMailCandidate(
      "Q3 pilot pack — need your reply",
      "Can you confirm the pilot timeline by EOD Thursday?",
    );
    assert.ok(hit);
    assert.equal(hit.kind, "reply_owed");
    assert.equal(hit.band, "critical");
  });

  it("flags asks with a question mark", () => {
    const hit = classifyMailCandidate("Friday coffee?", "Does Friday afternoon still work?");
    assert.ok(hit);
    assert.equal(hit.kind, "ask");
  });

  it("ignores non-obligation noise", () => {
    const hit = classifyMailCandidate("Newsletter", "Here are 10 tips for SQL.");
    assert.equal(hit, null);
  });
});
