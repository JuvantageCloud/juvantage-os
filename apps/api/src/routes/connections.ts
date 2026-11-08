import { Hono } from "hono";
import { prisma } from "../db/client.js";
import { requireAuth, type AppVariables } from "../middleware/auth.js";
import { userOrgIds } from "../services/tenancy.js";
import {
  buildGoogleAuthUrl,
  buildInstagramAuthUrl,
  connectDemoProvider,
  exchangeGoogleCode,
  fetchGoogleCalendarEvents,
  googleOAuthConfigured,
  instagramOAuthConfigured,
} from "../services/connections.js";

export const connectionRoutes = new Hono<{ Variables: AppVariables }>();

connectionRoutes.get("/oauth/google/start", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");
  if (!businessId) return c.json({ error: "businessId required" }, 400);
  if (!googleOAuthConfigured()) {
    return c.json({
      mode: "demo",
      message: "Google OAuth not configured; use POST /connections/demo",
      authUrl: null,
    });
  }
  const state = Buffer.from(
    JSON.stringify({ businessId, userId: c.get("user").sub }),
  ).toString("base64url");
  return c.json({ mode: "oauth", authUrl: buildGoogleAuthUrl(state) });
});

connectionRoutes.get("/oauth/google/callback", async (c) => {
  const code = c.req.query("code");
  const stateRaw = c.req.query("state");
  if (!code || !stateRaw) return c.text("Missing code/state", 400);
  const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString()) as {
    businessId: string;
    userId: string;
  };
  const tokens = await exchangeGoogleCode(code);
  await prisma.connection.updateMany({
    where: { businessId: state.businessId, provider: "google_calendar" },
    data: {
      status: "connected",
      enabled: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      lastSyncAt: new Date(),
      metadata: JSON.stringify({ mode: "oauth" }),
    },
  });

  try {
    const cal = await fetchGoogleCalendarEvents(tokens.access_token);
    for (const item of cal.items ?? []) {
      const start = item.start?.dateTime ?? item.start?.date;
      const end = item.end?.dateTime ?? item.end?.date;
      if (!start || !end) continue;
      await prisma.calendarEvent.create({
        data: {
          businessId: state.businessId,
          title: item.summary ?? "Calendar event",
          startsAt: new Date(start),
          endsAt: new Date(end),
          externalId: item.id,
          icon: "calendar",
        },
      });
    }
  } catch {
    // Keep connection even if event sync fails
  }

  return c.html(
    `<html><body style="font-family:sans-serif;padding:2rem"><h1>Google Calendar connected</h1><p>You can close this window and return to Juvantage OS.</p></body></html>`,
  );
});

connectionRoutes.get("/oauth/instagram/start", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");
  if (!businessId) return c.json({ error: "businessId required" }, 400);
  if (!instagramOAuthConfigured()) {
    return c.json({
      mode: "demo",
      message: "Meta OAuth not configured; use POST /connections/demo",
      authUrl: null,
    });
  }
  const state = Buffer.from(
    JSON.stringify({ businessId, userId: c.get("user").sub }),
  ).toString("base64url");
  return c.json({ mode: "oauth", authUrl: buildInstagramAuthUrl(state) });
});

connectionRoutes.get("/oauth/instagram/callback", async (c) => {
  const businessId = c.req.query("state");
  // Meta review is slow — accept callback and mark connected in demo-compatible way
  if (businessId) {
    try {
      const state = JSON.parse(Buffer.from(businessId, "base64url").toString()) as {
        businessId: string;
      };
      await connectDemoProvider(state.businessId, "instagram");
    } catch {
      /* ignore */
    }
  }
  return c.html(
    `<html><body style="font-family:sans-serif;padding:2rem"><h1>Instagram connected</h1><p>You can close this window and return to Juvantage OS.</p></body></html>`,
  );
});

connectionRoutes.use("/connections/*", requireAuth);
connectionRoutes.use("/connections", requireAuth);

connectionRoutes.get("/connections", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const businessId = c.req.query("businessId");
  const connections = await prisma.connection.findMany({
    where: {
      business: {
        organizationId: { in: orgIds },
        ...(businessId ? { id: businessId } : {}),
      },
    },
    orderBy: { label: "asc" },
  });

  // De-dupe by provider for portfolio-level view
  const byProvider = new Map<string, (typeof connections)[0]>();
  for (const conn of connections) {
    const prev = byProvider.get(conn.provider);
    if (!prev || conn.enabled) byProvider.set(conn.provider, conn);
  }

  const list = [...byProvider.values()].map((conn) => ({
    id: conn.id,
    businessId: conn.businessId,
    provider: conn.provider,
    status: conn.status,
    label: conn.label,
    detail: conn.detail,
    enabled: conn.enabled,
    comingSoon: conn.comingSoon,
    lastSyncAt: conn.lastSyncAt?.toISOString() ?? null,
  }));

  const order = [
    "instagram",
    "tiktok",
    "google_calendar",
    "cursor_agents",
    "stripe",
    "quickbooks",
  ];
  list.sort((a, b) => order.indexOf(a.provider) - order.indexOf(b.provider));
  return c.json({
    connections: list,
    oauth: {
      googleConfigured: googleOAuthConfigured(),
      instagramConfigured: instagramOAuthConfigured(),
    },
  });
});

connectionRoutes.post("/connections/demo", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    businessId: string;
    provider: "instagram" | "google_calendar" | "tiktok" | "cursor_agents";
  }>();
  const orgIds = await userOrgIds(user.sub);
  const business = await prisma.business.findFirst({
    where: { id: body.businessId, organizationId: { in: orgIds } },
  });
  if (!business) return c.json({ error: "Business not found" }, 404);
  const conn = await connectDemoProvider(body.businessId, body.provider);
  return c.json({
    id: conn.id,
    provider: conn.provider,
    status: conn.status,
    enabled: conn.enabled,
    lastSyncAt: conn.lastSyncAt?.toISOString() ?? null,
    mode: "demo",
  });
});

connectionRoutes.patch("/connections/:id", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const enabled = Boolean((await c.req.json<{ enabled: boolean }>()).enabled);
  const conn = await prisma.connection.findFirst({
    where: {
      id: c.req.param("id"),
      business: { organizationId: { in: orgIds } },
    },
  });
  if (!conn) return c.json({ error: "Not found" }, 404);
  if (conn.comingSoon) return c.json({ error: "Coming soon" }, 400);
  const updated = await prisma.connection.update({
    where: { id: conn.id },
    data: {
      enabled,
      status: enabled ? "connected" : "disconnected",
      lastSyncAt: enabled ? new Date() : conn.lastSyncAt,
    },
  });
  return c.json({
    id: updated.id,
    enabled: updated.enabled,
    status: updated.status,
  });
});
