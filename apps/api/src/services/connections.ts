import { prisma } from "../db/client.js";
import { env } from "../lib/env.js";
import { userOrgIds } from "./tenancy.js";

/** Simple rules that create/refresh alerts from live-ish data. */
export async function evaluateAlertRules(userId: string) {
  const orgIds = await userOrgIds(userId);
  const businesses = await prisma.business.findMany({
    where: { organizationId: { in: orgIds } },
    include: {
      socialPosts: true,
      calendarEvents: {
        where: {
          startsAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 60 * 1000),
          },
        },
      },
    },
  });

  const created: string[] = [];

  for (const biz of businesses) {
    if (biz.status === "attention" && biz.openTasks >= 3) {
      const existing = await prisma.alert.findFirst({
        where: {
          businessId: biz.id,
          severity: "critical",
          title: { contains: "inventory" },
        },
      });
      if (!existing) {
        const alert = await prisma.alert.create({
          data: {
            businessId: biz.id,
            severity: "critical",
            title: `${biz.name} needs attention — inventory lag.`,
            body: "Orders and inventory updates from TikTok Shop are delayed.",
            labels: JSON.stringify(["CRITICAL", "Inventory", biz.name]),
            impactOrders: 14,
            impactRevenue: 1200,
          },
        });
        created.push(alert.id);
      }
    }

    for (const post of biz.socialPosts) {
      if (post.views >= 10000) {
        const title = `${biz.name} Reel hit 10k views.`;
        const existing = await prisma.alert.findFirst({
          where: { businessId: biz.id, title },
        });
        if (!existing) {
          const alert = await prisma.alert.create({
            data: {
              businessId: biz.id,
              severity: "social",
              title,
              body: `${post.platform} post outperforming average.`,
              labels: JSON.stringify(["SOCIAL", "Performance", "Social"]),
            },
          });
          created.push(alert.id);
        }
      }
    }

    for (const ev of biz.calendarEvents) {
      const title = `Calendar: ${ev.title} soon.`;
      const existing = await prisma.alert.findFirst({
        where: { businessId: biz.id, title },
      });
      if (!existing) {
        const alert = await prisma.alert.create({
          data: {
            businessId: biz.id,
            severity: "calendar",
            title,
            body: `${ev.title} starts at ${ev.startsAt.toISOString()}`,
            labels: JSON.stringify(["Today", "Calendar", biz.name]),
          },
        });
        created.push(alert.id);
      }
    }
  }

  return { createdCount: created.length, created };
}

export function googleOAuthConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

export function instagramOAuthConfigured() {
  return Boolean(env.metaAppId && env.metaAppSecret);
}

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function buildInstagramAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.metaAppId,
    redirect_uri: env.metaRedirectUri,
    response_type: "code",
    scope: "instagram_basic,instagram_manage_insights,pages_show_list",
    state,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

/** Demo connector: mark provider connected and refresh lastSyncAt. */
export async function connectDemoProvider(
  businessId: string,
  provider: "instagram" | "google_calendar" | "tiktok" | "cursor_agents",
) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    google_calendar: "Google Calendar",
    tiktok: "TikTok",
    cursor_agents: "Cursor Agents",
  };
  const existing = await prisma.connection.findFirst({
    where: { businessId, provider },
  });
  if (existing) {
    return prisma.connection.update({
      where: { id: existing.id },
      data: {
        status: "connected",
        enabled: true,
        comingSoon: false,
        lastSyncAt: new Date(),
        detail: provider === "cursor_agents" ? "3 agents" : existing.detail,
        metadata: JSON.stringify({ mode: "demo" }),
      },
    });
  }
  return prisma.connection.create({
    data: {
      businessId,
      provider,
      label: labels[provider],
      status: "connected",
      enabled: true,
      lastSyncAt: new Date(),
      detail: provider === "cursor_agents" ? "3 agents" : null,
      metadata: JSON.stringify({ mode: "demo" }),
    },
  });
}

export async function exchangeGoogleCode(code: string) {
  if (!googleOAuthConfigured()) {
    throw new Error("Google OAuth not configured");
  }
  const body = new URLSearchParams({
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: env.googleRedirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function fetchGoogleCalendarEvents(accessToken: string) {
  const timeMin = new Date();
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + 1);
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google Calendar fetch failed: ${await res.text()}`);
  }
  return res.json() as Promise<{
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  }>;
}
