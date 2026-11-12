/** Google Calendar events.insert — used after approve + grant consume. */

export type CalendarEventTiming = {
  startIso: string;
  endIso: string;
};

/** Resolve start/end from loop evidence; default to tomorrow 10–11 local if missing. */
export function resolveEventTiming(evidence: {
  startsAt?: string | null;
  endsAt?: string | null;
} | null): CalendarEventTiming {
  const startRaw = evidence?.startsAt ? new Date(evidence.startsAt) : null;
  const endRaw = evidence?.endsAt ? new Date(evidence.endsAt) : null;
  const start =
    startRaw && !Number.isNaN(startRaw.getTime())
      ? startRaw
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(10, 0, 0, 0);
          return d;
        })();
  const end =
    endRaw && !Number.isNaN(endRaw.getTime()) && endRaw > start
      ? endRaw
      : new Date(start.getTime() + 60 * 60 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function calendarEventSummary(title: string): string {
  return title.replace(/^Confirm:\s*/i, "").trim() || "Confirmed meeting";
}

export async function insertCalendarEvent(input: {
  accessToken: string;
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  timeZone?: string;
}): Promise<{ eventId: string; htmlLink: string | null }> {
  const timeZone = input.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description ?? "",
        start: { dateTime: input.startIso, timeZone },
        end: { dateTime: input.endIso, timeZone },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Calendar events.insert failed: ${await res.text()}`);
  }
  const body = (await res.json()) as { id?: string; htmlLink?: string };
  if (!body.id) {
    throw new Error("Calendar events.insert returned no event id");
  }
  return { eventId: body.id, htmlLink: body.htmlLink ?? null };
}
