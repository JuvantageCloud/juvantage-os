import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertExecutable, OsCloseError } from "./osClose.js";

describe("osClose approve gate", () => {
  it("allows execute only when approved", () => {
    assert.equal(assertExecutable("approved"), true);
  });

  it("403 when pending_approval", () => {
    try {
      assertExecutable("pending_approval");
      assert.fail("expected throw");
    } catch (err) {
      assert.ok(err instanceof OsCloseError);
      assert.equal(err.status, 403);
      assert.match(err.message, /Approve required/i);
    }
  });

  it("403 when draft", () => {
    try {
      assertExecutable("draft");
      assert.fail("expected throw");
    } catch (err) {
      assert.ok(err instanceof OsCloseError);
      assert.equal(err.status, 403);
    }
  });
});
