import { prisma } from "../db/client.js";
import { decryptSecret, encryptSecret } from "../lib/cryptoTokens.js";
import { env } from "../lib/env.js";
import { exchangeGoogleCode, googleOAuthConfigured } from "./connections.js";

export const OS_PROVIDERS = ["gmail", "google_calendar"] as const;
export type OsProvider = (typeof OS_PROVIDERS)[number];

const OS_GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
  // events.insert on approve (calendar.readonly alone cannot create)
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
].join(" ");

export function osGoogleScopeString(): string {
  return OS_GOOGLE_SCOPES;
}

export function scopesIncludeGmailSend(scopeStr: string): boolean {
  return /gmail\.send|gmail\.compose/.test(scopeStr);
}

export function scopesIncludeCalendarEvents(scopeStr: string): boolean {
  if (/calendar\.events/.test(scopeStr)) return true;
  // Full calendar scope only — not calendar.readonly
  return /\/auth\/calendar([?\s"]|$)/.test(scopeStr);
}

export async function userHasGmailSendScope(userId: string): Promise<boolean> {
  const row = await prisma.connection.findFirst({
    where: { userId, provider: "gmail", businessId: null, enabled: true },
  });
  if (!row) return false;
  const meta = safeJson(row.metadata);
  if (meta.mode === "demo") return true;
  return scopesIncludeGmailSend(String(meta.scopes ?? ""));
}

export async function userHasCalendarEventsScope(userId: string): Promise<boolean> {
  const row = await prisma.connection.findFirst({
    where: { userId, provider: "google_calendar", businessId: null, enabled: true },
  });
  if (!row) return false;
  const meta = safeJson(row.metadata);
  if (meta.mode === "demo") return true;
  return scopesIncludeCalendarEvents(String(meta.scopes ?? ""));
}

const LABELS: Record<OsProvider, string> = {
  gmail: "Gmail",
  google_calendar: "Google Calendar",
};

export function buildOsGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleOsRedirectUri,
    response_type: "code",
    scope: OS_GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeOsGoogleCode(code: string) {
  if (!googleOAuthConfigured()) {
    throw new Error("Google OAuth not configured");
  }
  const body = new URLSearchParams({
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: env.googleOsRedirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  }>;
}

export async function ensureOsConnectorRows(userId: string) {
  for (const provider of OS_PROVIDERS) {
    const existing = await prisma.connection.findFirst({
      where: { userId, provider, businessId: null },
    });
    if (!existing) {
      await prisma.connection.create({
        data: {
          userId,
          businessId: null,
          provider,
          label: LABELS[provider],
          status: "disconnected",
          enabled: false,
          comingSoon: false,
        },
      });
    }
  }
}

export async function listOsConnectors(userId: string) {
  await ensureOsConnectorRows(userId);
  const rows = await prisma.connection.findMany({
    where: { userId, provider: { in: [...OS_PROVIDERS] }, businessId: null },
  });
  const byProvider = new Map(rows.map((r) => [r.provider, r]));
  return OS_PROVIDERS.map((provider) => {
    const row = byProvider.get(provider)!;
    const meta = safeJson(row.metadata);
    return {
      id: row.id,
      provider,
      label: row.label,
      status: row.status,
      enabled: row.enabled,
      detail: row.detail,
      lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
      mode: (meta.mode as string) ?? null,
      hasToken: Boolean(row.accessToken),
    };
  });
}

export async function upsertOsOAuthTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  },
) {
  await ensureOsConnectorRows(userId);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const access = encryptSecret(tokens.access_token);
  const refresh = encryptSecret(tokens.refresh_token ?? null);
  const grantedScope = tokens.scope ?? OS_GOOGLE_SCOPES;

  for (const provider of OS_PROVIDERS) {
    const existing = await prisma.connection.findFirst({
      where: { userId, provider, businessId: null },
    });
    if (!existing) continue;
    await prisma.connection.update({
      where: { id: existing.id },
      data: {
        status: "connected",
        enabled: true,
        accessToken: access,
        refreshToken: refresh ?? existing.refreshToken,
        tokenExpiresAt: expiresAt,
        lastSyncAt: new Date(),
        detail:
          scopesIncludeGmailSend(grantedScope) &&
          scopesIncludeCalendarEvents(grantedScope)
            ? "OAuth connected (mail send + calendar create on approve)"
            : "OAuth connected (reconnect if send/calendar create missing)",
        metadata: JSON.stringify({ mode: "oauth", scopes: grantedScope }),
      },
    });
  }
}

export async function connectOsDemo(userId: string, provider?: OsProvider) {
  await ensureOsConnectorRows(userId);
  const targets = provider ? [provider] : [...OS_PROVIDERS];
  const updated = [];
  for (const p of targets) {
    const row = await prisma.connection.findFirst({
      where: { userId, provider: p, businessId: null },
    });
    if (!row) continue;
    updated.push(
      await prisma.connection.update({
        where: { id: row.id },
        data: {
          status: "connected",
          enabled: true,
          detail: "Demo mode — sample sync data",
          lastSyncAt: new Date(),
          accessToken: encryptSecret(`demo-access-${p}`),
          refreshToken: encryptSecret(`demo-refresh-${p}`),
          tokenExpiresAt: new Date(Date.now() + 3600_000),
          metadata: JSON.stringify({ mode: "demo" }),
        },
      }),
    );
  }
  return updated;
}

export async function getOsProviderAuth(
  userId: string,
  provider: OsProvider,
): Promise<{
  token: string;
  mode: "demo" | "oauth";
} | null> {
  const row = await prisma.connection.findFirst({
    where: { userId, provider, businessId: null, enabled: true },
  });
  if (!row?.accessToken) return null;
  const meta = safeJson(row.metadata);
  const mode = meta.mode === "demo" ? "demo" : "oauth";
  return { token: decryptSecret(row.accessToken)!, mode };
}

async function getAccessToken(userId: string, provider: OsProvider) {
  return getValidOsAccessToken(userId, provider);
}

const TOKEN_REFRESH_SKEW_MS = 120_000;

async function refreshOsGoogleAccessToken(userId: string): Promise<void> {
  if (!googleOAuthConfigured()) {
    throw new Error("Google OAuth not configured");
  }
  const row = await prisma.connection.findFirst({
    where: { userId, provider: "gmail", businessId: null, enabled: true },
  });
  const refreshPlain = row?.refreshToken ? decryptSecret(row.refreshToken) : null;
  if (!refreshPlain) {
    throw new Error(
      "Gmail session expired — open Desktop → Connect → Connect Google again.",
    );
  }

  const body = new URLSearchParams({
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    refresh_token: refreshPlain,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(
      `Gmail token refresh failed — reconnect Google in Desktop → Connect (${await res.text()})`,
    );
  }
  const tokens = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };
  await upsertOsOAuthTokens(userId, tokens);
}

/** OAuth access token with refresh; demo tokens unchanged. */
export async function getValidOsAccessToken(
  userId: string,
  provider: OsProvider,
): Promise<{
  token: string;
  mode: "demo" | "oauth";
} | null> {
  const auth = await getOsProviderAuth(userId, provider);
  if (!auth || auth.mode === "demo") return auth;

  const row = await prisma.connection.findFirst({
    where: { userId, provider: "gmail", businessId: null, enabled: true },
  });
  const expiresAt = row?.tokenExpiresAt?.getTime() ?? 0;
  if (expiresAt > Date.now() + TOKEN_REFRESH_SKEW_MS) {
    return auth;
  }

  await refreshOsGoogleAccessToken(userId);
  return getOsProviderAuth(userId, provider);
}

export async function syncOsGmail(userId: string) {
  const auth = await getAccessToken(userId, "gmail");
  if (!auth) throw new Error("Gmail not connected");

  if (auth.mode === "demo") {
    return seedDemoMail(userId);
  }

  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/threads");
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("q", "newer_than:14d");
  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${await listRes.text()}`);
  }
  const list = (await listRes.json()) as {
    threads?: Array<{ id: string; snippet?: string; historyId?: string }>;
  };

  let upserted = 0;
  for (const t of list.threads ?? []) {
    const detailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    );
    if (!detailRes.ok) continue;
    const detail = (await detailRes.json()) as {
      id: string;
      snippet?: string;
      messages?: Array<{
        id: string;
        internalDate?: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      }>;
    };
    const first = detail.messages?.[0];
    const headers = first?.payload?.headers ?? [];
    const subject = headerValue(headers, "Subject");
    const fromAddr = headerValue(headers, "From");
    const last = detail.messages?.[detail.messages.length - 1];
    const lastMessageAt = last?.internalDate
      ? new Date(Number(last.internalDate))
      : null;

    await prisma.osMailThread.upsert({
      where: { userId_externalId: { userId, externalId: detail.id } },
      create: {
        userId,
        externalId: detail.id,
        threadId: detail.id,
        subject,
        snippet: detail.snippet ?? t.snippet ?? null,
        fromAddr,
        lastMessageAt,
        payloadJson: JSON.stringify({ messageCount: detail.messages?.length ?? 0 }),
      },
      update: {
        subject,
        snippet: detail.snippet ?? t.snippet ?? null,
        fromAddr,
        lastMessageAt,
        payloadJson: JSON.stringify({ messageCount: detail.messages?.length ?? 0 }),
        syncedAt: new Date(),
      },
    });
    upserted += 1;
  }

  await touchSync(userId, "gmail", `${upserted} threads`);
  return { provider: "gmail" as const, upserted, mode: "oauth" as const };
}

export async function syncOsCalendar(userId: string) {
  const auth = await getAccessToken(userId, "google_calendar");
  if (!auth) throw new Error("Google Calendar not connected");

  if (auth.mode === "demo") {
    return seedDemoCalendar(userId);
  }

  const timeMin = new Date();
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + 14);
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "40");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) {
    throw new Error(`Calendar fetch failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  let upserted = 0;
  for (const item of data.items ?? []) {
    const start = item.start?.dateTime ?? item.start?.date;
    const end = item.end?.dateTime ?? item.end?.date;
    if (!item.id || !start || !end) continue;
    await prisma.osCalendarItem.upsert({
      where: { userId_externalId: { userId, externalId: item.id } },
      create: {
        userId,
        externalId: item.id,
        title: item.summary ?? "Calendar event",
        startsAt: new Date(start),
        endsAt: new Date(end),
        payloadJson: JSON.stringify(item),
      },
      update: {
        title: item.summary ?? "Calendar event",
        startsAt: new Date(start),
        endsAt: new Date(end),
        payloadJson: JSON.stringify(item),
        syncedAt: new Date(),
      },
    });
    upserted += 1;
  }

  await touchSync(userId, "google_calendar", `${upserted} events`);
  return { provider: "google_calendar" as const, upserted, mode: "oauth" as const };
}

export async function syncAllOs(userId: string) {
  const results = [];
  const gmail = await getAccessToken(userId, "gmail");
  if (gmail) results.push(await syncOsGmail(userId));
  const cal = await getAccessToken(userId, "google_calendar");
  if (cal) results.push(await syncOsCalendar(userId));
  return results;
}

export async function osSyncSummary(userId: string) {
  const [mailCount, calCount] = await Promise.all([
    prisma.osMailThread.count({ where: { userId } }),
    prisma.osCalendarItem.count({ where: { userId } }),
  ]);
  const recentMail = await prisma.osMailThread.findMany({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    take: 5,
  });
  const upcoming = await prisma.osCalendarItem.findMany({
    where: { userId, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 5,
  });
  return {
    mailCount,
    calCount,
    recentMail: recentMail.map((m) => ({
      id: m.id,
      subject: m.subject,
      fromAddr: m.fromAddr,
      snippet: m.snippet,
      lastMessageAt: m.lastMessageAt?.toISOString() ?? null,
    })),
    upcoming: upcoming.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
    })),
  };
}

async function seedDemoMail(userId: string) {
  const samples = [
    {
      externalId: "demo-thread-sarah",
      subject: "Friday coffee?",
      fromAddr: "Sarah Chen <sarah@example.com>",
      snippet: "Does Friday afternoon still work for you to meet?",
      hoursAgo: 26,
    },
    {
      externalId: "demo-thread-boss",
      subject: "Q3 pilot pack — need your reply",
      fromAddr: "Alex Rivera <alex@acme.com>",
      snippet: "Can you confirm the pilot timeline by EOD Thursday?",
      hoursAgo: 8,
    },
    {
      externalId: "demo-thread-flight",
      subject: "Your Lisbon trip — price alert",
      fromAddr: "Flights <noreply@travel.example>",
      snippet: "Fare moved from $948 to $989. Still holding your draft booking.",
      hoursAgo: 3,
    },
  ];
  for (const s of samples) {
    await prisma.osMailThread.upsert({
      where: { userId_externalId: { userId, externalId: s.externalId } },
      create: {
        userId,
        externalId: s.externalId,
        threadId: s.externalId,
        subject: s.subject,
        fromAddr: s.fromAddr,
        snippet: s.snippet,
        lastMessageAt: new Date(Date.now() - s.hoursAgo * 3600_000),
        payloadJson: JSON.stringify({ mode: "demo" }),
      },
      update: {
        subject: s.subject,
        fromAddr: s.fromAddr,
        snippet: s.snippet,
        lastMessageAt: new Date(Date.now() - s.hoursAgo * 3600_000),
        syncedAt: new Date(),
      },
    });
  }
  await touchSync(userId, "gmail", `${samples.length} threads (demo)`);
  return {
    provider: "gmail" as const,
    upserted: samples.length,
    mode: "demo" as const,
  };
}

async function seedDemoCalendar(userId: string) {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(15, 0, 0, 0);
  const end = new Date(start);
  end.setHours(16, 0, 0, 0);
  const samples = [
    {
      externalId: "demo-cal-standup",
      title: "Team standup",
      startsAt: new Date(Date.now() + 5 * 3600_000),
      endsAt: new Date(Date.now() + 5.5 * 3600_000),
    },
    {
      externalId: "demo-cal-sarah",
      title: "Coffee with Sarah (tentative)",
      startsAt: start,
      endsAt: end,
    },
  ];
  for (const s of samples) {
    await prisma.osCalendarItem.upsert({
      where: { userId_externalId: { userId, externalId: s.externalId } },
      create: {
        userId,
        externalId: s.externalId,
        title: s.title,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        payloadJson: JSON.stringify({ mode: "demo" }),
      },
      update: {
        title: s.title,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        syncedAt: new Date(),
      },
    });
  }
  await touchSync(userId, "google_calendar", `${samples.length} events (demo)`);
  return {
    provider: "google_calendar" as const,
    upserted: samples.length,
    mode: "demo" as const,
  };
}

async function touchSync(userId: string, provider: OsProvider, detail: string) {
  await prisma.connection.updateMany({
    where: { userId, provider, businessId: null },
    data: { lastSyncAt: new Date(), detail },
  });
}

function headerValue(
  headers: Array<{ name: string; value: string }>,
  name: string,
) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function safeJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// re-export for callback that still uses business exchange helper name clarity
export { exchangeGoogleCode, googleOAuthConfigured };
