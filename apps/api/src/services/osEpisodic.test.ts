import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { episodicSignal } from "./osEpisodic.js";

describe("episodic front-window signal", () => {
  it("ignores an app name with no window text", () => {
    assert.equal(episodicSignal({ app: "Cursor", title: "Cursor", text: "" }), null);
    assert.equal(episodicSignal({ app: "Cursor", title: "", text: "" }), null);
  });

  it("uses selected text as the quote", () => {
    const signal = episodicSignal({
      app: "Mail",
      title: "Thursday pilot",
      text: "Can you confirm Thursday 2pm still works?",
    });
    assert.ok(signal);
    assert.match(signal!.quote, /Thursday 2pm/);
    assert.equal(signal!.headline.startsWith("Can you confirm"), true);
  });

  it("falls back to a real window title", () => {
    const signal = episodicSignal({
      app: "Notes",
      title: "Send the deck after the pilot",
      text: "",
    });
    assert.ok(signal);
    assert.equal(signal!.quote, "Send the deck after the pilot");
  });
});
