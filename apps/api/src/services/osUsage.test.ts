import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PLAN_CATALOG } from "./osUsage.js";

describe("PLAN_CATALOG", () => {
  it("personal has a modest daily fn cap", () => {
    assert.ok(PLAN_CATALOG.personal.quickAnswersPerDay >= 10);
    assert.ok(PLAN_CATALOG.brain_pro.quickAnswersPerDay > PLAN_CATALOG.personal.quickAnswersPerDay);
  });
});