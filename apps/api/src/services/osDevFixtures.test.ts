import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { devFixturesAllowed } from "./osDevFixtures.js";

describe("dev fixtures gate", () => {
  it("stays off in production", () => {
    const prev = process.env.NODE_ENV;
    const flag = process.env.OS_DEV_FIXTURES;
    process.env.NODE_ENV = "production";
    delete process.env.OS_DEV_FIXTURES;
    assert.equal(devFixturesAllowed(), false);
    process.env.NODE_ENV = prev;
    if (flag === undefined) delete process.env.OS_DEV_FIXTURES;
    else process.env.OS_DEV_FIXTURES = flag;
  });

  it("stays off when OS_DEV_FIXTURES=false", () => {
    const prev = process.env.NODE_ENV;
    const flag = process.env.OS_DEV_FIXTURES;
    process.env.NODE_ENV = "development";
    process.env.OS_DEV_FIXTURES = "false";
    assert.equal(devFixturesAllowed(), false);
    process.env.NODE_ENV = prev;
    if (flag === undefined) delete process.env.OS_DEV_FIXTURES;
    else process.env.OS_DEV_FIXTURES = flag;
  });
});
