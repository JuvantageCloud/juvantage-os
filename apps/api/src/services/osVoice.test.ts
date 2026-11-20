import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVoiceIntent, parseVoiceQuickAnswer, voiceDraft } from "./osVoice.js";

describe("parseVoiceQuickAnswer", () => {
  it("answers time questions", () => {
    const q = parseVoiceQuickAnswer("what time is it");
    assert.ok(q);
    assert.equal(q!.mode, "answer");
    assert.ok(q!.answer.length > 0);
  });

  it("answers simple math", () => {
    const q = parseVoiceQuickAnswer("what is 2 + 2");
    assert.deepEqual(q, { mode: "answer", answer: "4" });
  });
});

describe("parseVoiceIntent", () => {
  it("reads an email intent with recipient and topic", () => {
    const i = parseVoiceIntent("Draft an email to my investors about the Q3 update.");
    assert.equal(i.intent, "email");
    assert.equal(i.recipient, "investors");
    assert.equal(i.topic, "the Q3 update");
  });

  it("strips filler and handles no topic", () => {
    const i = parseVoiceIntent("Okay, can you write a quick email to Sarah");
    assert.equal(i.intent, "email");
    assert.equal(i.recipient, "Sarah");
    assert.equal(i.topic, "");
  });

  it("falls back to a todo", () => {
    const i = parseVoiceIntent("I need to renew the domain before Friday");
    assert.equal(i.intent, "todo");
    assert.equal(i.topic, "renew the domain before Friday");
  });
});

describe("voiceDraft", () => {
  it("drafts an email greeting the recipient", () => {
    const intent = parseVoiceIntent("email the team about launch timing");
    const d = voiceDraft({ transcript: "email the team about launch timing", intent });
    assert.match(d.body, /^Hi team,/);
    assert.equal(d.title, "Launch timing");
  });
});
