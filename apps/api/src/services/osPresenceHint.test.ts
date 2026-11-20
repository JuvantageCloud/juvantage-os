import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { presenceFromQuery } from "./osPresenceHint.js";
import { pickSheetHero, sortLoopsForWork } from "@juvantage/shared";

describe("presenceFromQuery", () => {
  it("builds hint from app/title query", () => {
    const h = presenceFromQuery("Xcode", "VoiceController.swift");
    assert.deepEqual(h, { app: "Xcode", title: "VoiceController.swift" });
  });
});

describe("presence-aware hero", () => {
  it("boosts gmail loop matching frontmost mail window", () => {
    const presence = { app: "Mail", title: "Q3 pilot pack" };
    const loops = [
      {
        id: "e1",
        source: "episodic",
        objectType: "clip",
        band: "high",
        evidence: { app: "Xcode", windowTitle: "Other.swift" },
      },
      {
        id: "g1",
        source: "gmail",
        objectType: "mail",
        band: "high",
        evidence: { app: "Mail", windowTitle: "Q3 pilot pack — need your reply" },
      },
    ];
    const hero = pickSheetHero(loops, presence);
    assert.equal(hero?.id, "g1");
  });

  it("sorts matching episodic ahead of unrelated gmail", () => {
    const presence = { app: "Xcode", title: "VoiceController" };
    const sorted = sortLoopsForWork(
      [
        {
          id: "g",
          source: "gmail",
          band: "critical",
          evidence: { app: "Mail" },
        },
        {
          id: "e",
          source: "episodic",
          band: "high",
          evidence: { app: "Xcode", windowTitle: "VoiceController.swift" },
        },
      ],
      presence,
    );
    assert.equal(sorted[0]?.id, "e");
  });
});