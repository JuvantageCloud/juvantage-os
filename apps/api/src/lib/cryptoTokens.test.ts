import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
} from "./cryptoTokens.js";

describe("cryptoTokens", () => {
  it("round-trips secrets", () => {
    const plain = "ya29.demo-access-token";
    const enc = encryptSecret(plain);
    assert.ok(enc);
    assert.ok(isEncryptedSecret(enc));
    assert.notEqual(enc, plain);
    assert.equal(decryptSecret(enc), plain);
  });

  it("is idempotent on already-encrypted values", () => {
    const once = encryptSecret("refresh-token")!;
    const twice = encryptSecret(once)!;
    assert.equal(once, twice);
    assert.equal(decryptSecret(twice), "refresh-token");
  });

  it("passes through null/empty", () => {
    assert.equal(encryptSecret(null), null);
    assert.equal(encryptSecret(""), null);
    assert.equal(decryptSecret(null), null);
  });

  it("reads legacy plaintext tokens", () => {
    assert.equal(decryptSecret("legacy-plain"), "legacy-plain");
    assert.equal(isEncryptedSecret("legacy-plain"), false);
  });
});
