import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  calendarEventSummary,
  insertCalendarEvent,
  resolveEventTiming,
} from "./osCalendarCreate.js";
import { scopesIncludeCalendarEvents } from "./osConnectors.js";

describe("osCalendarCreate helpers", () => {
  it("strips Confirm: prefix from summary", () => {
    assert.equal(calendarEventSummary("Confirm: Coffee with Sarah"), "Coffee with Sarah");
    assert.equal(calendarEventSummary("Standup"), "Standup");
  });

  it("uses evidence startsAt/endsAt when present", () => {
    const t = resolveEventTiming({
      startsAt: "2026-11-12T15:00:00.000Z",
      endsAt: "2026-11-12T15:30:00.000Z",
    });
    assert.equal(t.startIso, "2026-11-12T15:00:00.000Z");
    assert.equal(t.endIso, "2026-11-12T15:30:00.000Z");
  });

  it("defaults end to +1h when endsAt missing", () => {
    const t = resolveEventTiming({ startsAt: "2026-11-12T15:00:00.000Z" });
    assert.equal(t.startIso, "2026-11-12T15:00:00.000Z");
    assert.equal(t.endIso, "2026-11-12T16:00:00.000Z");
  });
});

describe("Calendar events scope", () => {
  it("detects calendar.events in scope string", () => {
    assert.equal(
      scopesIncludeCalendarEvents(
        "openid https://www.googleapis.com/auth/calendar.events",
      ),
      true,
    );
    assert.equal(
      scopesIncludeCalendarEvents("https://www.googleapis.com/auth/calendar"),
      true,
    );
    assert.equal(
      scopesIncludeCalendarEvents(
        "https://www.googleapis.com/auth/calendar.readonly",
      ),
      false,
    );
  });
});

describe("insertCalendarEvent", () => {
  it("POSTs events.insert and returns eventId (stubbed fetch)", async () => {
    const original = globalThis.fetch;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = mock.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          id: "evt_live_1",
          htmlLink: "https://calendar.google.com/event?eid=1",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    try {
      const out = await insertCalendarEvent({
        accessToken: "tok",
        summary: "Coffee with Sarah",
        description: "Confirming",
        startIso: "2026-11-12T15:00:00.000Z",
        endIso: "2026-11-12T16:00:00.000Z",
        timeZone: "UTC",
      });
      assert.equal(out.eventId, "evt_live_1");
      assert.match(out.htmlLink ?? "", /calendar\.google/);
      assert.equal(calls.length, 1);
      assert.match(calls[0]!.url, /calendars\/primary\/events$/);
      assert.equal(calls[0]!.init?.method, "POST");
      const body = JSON.parse(String(calls[0]!.init?.body));
      assert.equal(body.summary, "Coffee with Sarah");
      assert.equal(body.start.dateTime, "2026-11-12T15:00:00.000Z");
    } finally {
      globalThis.fetch = original;
    }
  });
});
