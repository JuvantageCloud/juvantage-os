import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evidenceLinesFromContextPack, pickSheetHero, sortLoopsForWork } from "@juvantage/shared";

describe("sheet hero (obligation-first)", () => {
  it("prefers gmail over episodic when both exist", () => {
    const hero = pickSheetHero([
      {
        id: "e1",
        source: "episodic",
        objectType: "clip",
        band: "high",
        kind: "todo",
        status: "proposed",
        title: "line from xcode",
        summary: null,
        evidence: null,
        ambient: null,
        routerConf: 0.8,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "g1",
        source: "gmail",
        objectType: "mail",
        band: "critical",
        kind: "reply_owed",
        status: "proposed",
        title: "Reply owed",
        summary: null,
        evidence: null,
        ambient: null,
        routerConf: 0.9,
        createdAt: "",
        updatedAt: "",
      },
    ]);
    assert.equal(hero?.id, "g1");
  });

  it("skips dev_fixture", () => {
    const hero = pickSheetHero([
      {
        id: "f1",
        source: "dev_fixture",
        objectType: "mail",
        band: "critical",
        kind: "reply_owed",
        status: "proposed",
        title: "Maya",
        summary: null,
        evidence: null,
        ambient: null,
        routerConf: 0.9,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "e1",
        source: "episodic",
        objectType: "clip",
        band: "high",
        kind: "todo",
        status: "proposed",
        title: "live",
        summary: null,
        evidence: null,
        ambient: null,
        routerConf: 0.8,
        createdAt: "",
        updatedAt: "",
      },
    ]);
    assert.equal(hero?.id, "e1");
  });
});

describe("sortLoopsForWork", () => {
  it("lists gmail before episodic", () => {
    const sorted = sortLoopsForWork([
      { id: "e", source: "episodic", objectType: "clip", band: "high", updatedAt: "2026-01-02" },
      { id: "m", source: "gmail", objectType: "mail", band: "high", updatedAt: "2026-01-01" },
    ]);
    assert.equal(sorted[0]?.id, "m");
  });
});

describe("evidenceLinesFromContextPack", () => {
  it("maps fused session events into drawer lines", () => {
    const lines = evidenceLinesFromContextPack({
      fingerprint: "abc123",
      sensitivityTags: ["pii_like"],
      events: [
        { kind: "clipboard", app: "Xcode", title: "A.swift", textPreview: "let x = 1" },
      ],
    });
    assert.ok(lines.some((l) => l.label === "Sensitivity"));
    assert.ok(lines.some((l) => l.value.includes("let x = 1")));
  });
});