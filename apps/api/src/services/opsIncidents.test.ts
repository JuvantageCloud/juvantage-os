import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fingerprintIncident, suggestFix } from "./opsIncidents.js";
import { shouldEscalate } from "./opsEscalate.js";

describe("opsIncidents", () => {
  it("fingerprints normalize ids in paths", () => {
    const a = fingerprintIncident({
      message: "boom",
      path: "/os/loops/cmvwamgp400001iubqppjl8fx",
      method: "GET",
      statusCode: 500,
    });
    const b = fingerprintIncident({
      message: "boom",
      path: "/os/loops/cmvwzzzz999991iubzzzzzzzz",
      method: "GET",
      statusCode: 500,
    });
    assert.equal(a, b);
  });

  it("suggests auth file for 401s", () => {
    const s = suggestFix({
      message: "Unauthorized",
      path: "/os/connectors",
      method: "GET",
      statusCode: 401,
      stack: null,
      source: "api",
    });
    assert.match(s.likelyFile, /auth/);
    assert.equal(s.policy.includes("human review"), true);
  });

  it("escalates approve-send immediately; other paths after 3 hits", () => {
    assert.equal(
      shouldEscalate({
        path: "/os/proposals/x/approve-send",
        occurrenceCount: 1,
        statusCode: 500,
      }),
      true,
    );
    assert.equal(
      shouldEscalate({ path: "/os/loops", occurrenceCount: 1, statusCode: 500 }),
      false,
    );
    assert.equal(
      shouldEscalate({ path: "/os/loops", occurrenceCount: 3, statusCode: 500 }),
      true,
    );
  });
});
