import { Hono } from "hono";
import { AgentChatRequestSchema } from "@juvantage/shared";
import { prisma } from "../db/client.js";
import { requireAuth, type AppVariables } from "../middleware/auth.js";
import { chatWithOpsAgent } from "../agent/orchestrator.js";
import { userOrgIds } from "../services/tenancy.js";
import { evaluateAlertRules } from "../services/connections.js";

export const agentRoutes = new Hono<{ Variables: AppVariables }>();
agentRoutes.use("*", requireAuth);

agentRoutes.get("/", async (c) => {
  const now = new Date().toISOString();
  return c.json([
    {
      id: "ops",
      kind: "ops",
      name: "Ops Agent",
      statusLabel: "Online",
      activity: "Inventory discrepancy resolved for Harbor",
      connected: true,
      updatedAt: now,
    },
    {
      id: "growth",
      kind: "growth",
      name: "Growth Agent",
      statusLabel: "Online",
      activity: "Drafted 3 Reel hooks from top TikTok",
      connected: true,
      updatedAt: now,
    },
    {
      id: "finance",
      kind: "finance",
      name: "Finance Agent",
      statusLabel: "Online",
      activity: "Daily cash summary ready",
      connected: true,
      updatedAt: now,
    },
    {
      id: "cursor_bridge",
      kind: "cursor_bridge",
      name: "Cursor Bridge",
      statusLabel: "Connected ✓",
      activity: "Ask your coding agents about product",
      connected: true,
      updatedAt: now,
    },
  ]);
});

agentRoutes.get("/cursor-bridge", async (c) => {
  return c.json({
    connected: true,
    agentsAvailable: 3,
    statusText: "Connected • 3 agents available",
    detail: "All systems operational.",
    permissions: [
      { agent: "Ops Agent", access: "Read+Act" },
      { agent: "Growth Agent", access: "Read only" },
      { agent: "Finance Agent", access: "Read+Suggest" },
    ],
    allowProposeActions: true,
    securityNote: "Actions require your confirmation in-app.",
    stub: true,
    v2Note:
      "V1 is a stub. V2 agent gateway will route approved tasks to Cursor/GitHub with human-in-the-loop confirmation.",
  });
});

agentRoutes.post("/chat", async (c) => {
  const user = c.get("user");
  const body = AgentChatRequestSchema.parse(await c.req.json());
  if (body.businessId) {
    const orgIds = await userOrgIds(user.sub);
    const biz = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: { in: orgIds } },
    });
    if (!biz) return c.json({ error: "Business not found" }, 404);
  }
  const reply = await chatWithOpsAgent({
    userId: user.sub,
    message: body.message,
    businessId: body.businessId,
    conversationId: body.conversationId,
  });
  return c.json(reply);
});

export const alertRoutes = new Hono<{ Variables: AppVariables }>();
alertRoutes.use("*", requireAuth);

alertRoutes.get("/", async (c) => {
  const user = c.get("user");
  await evaluateAlertRules(user.sub);
  const orgIds = await userOrgIds(user.sub);
  const severity = c.req.query("severity");
  const alerts = await prisma.alert.findMany({
    where: {
      ...(severity && severity !== "all" ? { severity } : {}),
      OR: [
        { businessId: null },
        { business: { organizationId: { in: orgIds } } },
      ],
    },
    include: { business: true },
    orderBy: { createdAt: "desc" },
  });
  return c.json(
    alerts.map((a) => ({
      id: a.id,
      businessId: a.businessId,
      businessName: a.business?.name ?? null,
      severity: a.severity,
      title: a.title,
      body: a.body,
      labels: JSON.parse(a.labels) as string[],
      read: a.read,
      createdAt: a.createdAt.toISOString(),
      impactOrders: a.impactOrders,
      impactRevenue: a.impactRevenue,
    })),
  );
});

alertRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const alert = await prisma.alert.findFirst({
    where: {
      id: c.req.param("id"),
      OR: [
        { businessId: null },
        { business: { organizationId: { in: orgIds } } },
      ],
    },
    include: { business: true },
  });
  if (!alert) return c.json({ error: "Not found" }, 404);
  return c.json({
    id: alert.id,
    businessId: alert.businessId,
    businessName: alert.business?.name ?? null,
    severity: alert.severity,
    title: alert.title,
    body: alert.body,
    labels: JSON.parse(alert.labels) as string[],
    read: alert.read,
    createdAt: alert.createdAt.toISOString(),
    impactOrders: alert.impactOrders,
    impactRevenue: alert.impactRevenue,
    recommendedActions: [
      {
        id: "ask_ops",
        label: "Ask Ops Agent to diagnose",
        detail: "Get details and run a sync check",
        deeplink: "juvantage://agents/ops",
      },
      {
        id: "open_tiktok",
        label: "Open TikTok connection",
        detail: "Check and refresh the integration",
        deeplink: "juvantage://connections",
      },
      {
        id: "snooze",
        label: "Snooze 1 hour",
        detail: "Temporarily pause this alert",
        deeplink: null,
      },
    ],
  });
});

alertRoutes.post("/mark-all-read", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  await prisma.alert.updateMany({
    where: {
      read: false,
      OR: [
        { businessId: null },
        { business: { organizationId: { in: orgIds } } },
      ],
    },
    data: { read: true },
  });
  return c.json({ ok: true });
});

export const socialRoutes = new Hono<{ Variables: AppVariables }>();
socialRoutes.use("*", requireAuth);

socialRoutes.get("/", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const platform = c.req.query("platform");
  const posts = await prisma.socialPost.findMany({
    where: {
      business: { organizationId: { in: orgIds } },
      ...(platform && platform !== "all" ? { platform } : {}),
    },
    include: { business: true },
    orderBy: { views: "desc" },
  });
  return c.json(
    posts.map((p) => ({
      id: p.id,
      businessId: p.businessId,
      businessName: p.business.name,
      platform: p.platform,
      title: p.title,
      caption: p.caption,
      views: p.views,
      engagementDelta: p.engagementDelta,
      durationSec: p.durationSec,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      engagementRate: p.engagementRate,
    })),
  );
});

socialRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const post = await prisma.socialPost.findFirst({
    where: {
      id: c.req.param("id"),
      business: { organizationId: { in: orgIds } },
    },
    include: { business: true },
  });
  if (!post) return c.json({ error: "Not found" }, 404);
  return c.json({
    id: post.id,
    businessId: post.businessId,
    businessName: post.business.name,
    platform: post.platform,
    title: post.title,
    caption: post.caption,
    views: post.views,
    engagementDelta: post.engagementDelta,
    durationSec: post.durationSec,
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    engagementRate: post.engagementRate,
    insight: `${post.business.name} Reel outperforming average by 2.1x.`,
  });
});

export const calendarRoutes = new Hono<{ Variables: AppVariables }>();
calendarRoutes.use("*", requireAuth);

calendarRoutes.get("/", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const events = await prisma.calendarEvent.findMany({
    where: {
      startsAt: { gte: start, lt: end },
      OR: [
        { businessId: null },
        { business: { organizationId: { in: orgIds } } },
      ],
    },
    orderBy: { startsAt: "asc" },
  });
  const sync = await prisma.connection.findFirst({
    where: {
      provider: "google_calendar",
      enabled: true,
      business: { organizationId: { in: orgIds } },
    },
    orderBy: { lastSyncAt: "desc" },
  });
  return c.json({
    syncedAt: sync?.lastSyncAt?.toISOString() ?? null,
    source: sync ? "Google Calendar" : "Demo calendar",
    events: events.map((e) => ({
      id: e.id,
      businessId: e.businessId,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      icon: e.icon,
    })),
  });
});
