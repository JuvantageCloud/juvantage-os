import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bundleFromEvents, captureEventFingerprint, sensitivityTags } from "./osContextFuse.js";
import { episodicSignal } from "./osEpisodic.js";
import { canApproveExecute } from "./osModality.js";

describe("context fuse (unit)", () => {
  it("tags email and secret-like patterns", () => {
    assert.ok(sensitivityTags("reach maya@example.com").includes("pii_email"));
    assert.ok(sensitivityTags("api_key: sk_live_abc").includes("secret_credential_like"));
  });

  it("fuses window then clipboard into one quote", () => {
    const bundle = bundleFromEvents("sess-1", [
      { app: "Xcode", title: "VoiceController.swift", text: null },
      { app: "Xcode", title: "VoiceController.swift", text: "let input = engine.inputNode" },
    ]);
    assert.ok(bundle);
    assert.equal(bundle!.eventCount, 2);
    assert.equal(bundle!.quote, "let input = engine.inputNode");
    assert.equal(bundle!.app, "Xcode");
    assert.ok(episodicSignal({ app: bundle!.app, title: bundle!.windowTitle, text: bundle!.quote }));
  });

  it("marks credential-like bundles as non-approvable hints", () => {
    const bundle = bundleFromEvents("sess-2", [
      { app: "Terminal", title: "zsh", text: "export API_KEY=sk_live_deadbeef" },
    ]);
    assert.ok(bundle!.sensitivityTags.includes("secret_credential_like"));
    assert.equal(canApproveExecute("hint"), false);
  });

  it("dedupe fingerprint treats same title reads alike", () => {
    const a = captureEventFingerprint({
      kind: "window_read",
      app: "Cursor",
      title: "npm test",
      text: null,
    });
    const b = captureEventFingerprint({
      kind: "window_read",
      app: "Cursor",
      title: "npm test",
      text: null,
    });
    assert.equal(a, b);
  });

  it("refuses empty fuse", () => {
    assert.equal(bundleFromEvents("sess-3", []), null);
    assert.equal(
      bundleFromEvents("sess-4", [{ app: "Foo", title: "Bar", text: "short" }]),
      null,
    );
  });
});