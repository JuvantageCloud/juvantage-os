import { prisma } from "../db/client.js";
import { userOrgIds } from "../services/tenancy.js";

export async function getBusinessSummary(userId: string, businessId?: string) {
  const orgIds = await userOrgIds(userId);
  const businesses = await prisma.business.findMany({
    where: {
      organizationId: { in: orgIds },
      ...(businessId ? { id: businessId } : {}),
    },
  });

  const revenueToday = businesses.reduce((s, b) => s + b.revenueToday, 0);
  const openTasks = businesses.reduce((s, b) => s + b.openTasks, 0);
  const attention = businesses.filter((b) => b.status === "attention");

  return {
    businessCount: businesses.length,
    revenueToday,
    openTasks,
    attentionBusinesses: attention.map((b) => ({
      id: b.id,
      name: b.name,
      openTasks: b.openTasks,
    })),
    businesses: businesses.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      revenueToday: b.revenueToday,
      category: b.category,
      metricLabel: b.metricLabel,
      metricValue: b.metricValue,
      metricDelta: b.metricDelta,
    })),
  };
}

export async function getSocialMetrics(userId: string, businessId?: string) {
  const orgIds = await userOrgIds(userId);
  const posts = await prisma.socialPost.findMany({
    where: {
      business: {
        organizationId: { in: orgIds },
        ...(businessId ? { id: businessId } : {}),
      },
    },
    include: { business: true },
    orderBy: { views: "desc" },
  });

  return posts.map((p) => ({
    id: p.id,
    businessId: p.businessId,
    businessName: p.business.name,
    platform: p.platform,
    title: p.title,
    caption: p.caption,
    views: p.views,
    engagementDelta: p.engagementDelta,
    engagementRate: p.engagementRate,
  }));
}

export async function getCalendarEvents(userId: string, businessId?: string) {
  const orgIds = await userOrgIds(userId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const events = await prisma.calendarEvent.findMany({
    where: {
      startsAt: { gte: start, lt: end },
      OR: [
        { businessId: null },
        {
          business: {
            organizationId: { in: orgIds },
            ...(businessId ? { id: businessId } : {}),
          },
        },
      ],
    },
    orderBy: { startsAt: "asc" },
  });

  return events.map((e) => ({
    id: e.id,
    businessId: e.businessId,
    title: e.title,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    icon: e.icon,
  }));
}

export async function listAlerts(userId: string, businessId?: string) {
  const orgIds = await userOrgIds(userId);
  const alerts = await prisma.alert.findMany({
    where: {
      OR: [
        { businessId: null },
        {
          business: {
            organizationId: { in: orgIds },
            ...(businessId ? { id: businessId } : {}),
          },
        },
      ],
    },
    include: { business: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return alerts.map((a) => ({
    id: a.id,
    businessId: a.businessId,
    businessName: a.business?.name ?? null,
    severity: a.severity,
    title: a.title,
    body: a.body,
    labels: JSON.parse(a.labels) as string[],
    impactOrders: a.impactOrders,
    impactRevenue: a.impactRevenue,
    createdAt: a.createdAt.toISOString(),
  }));
}

export const agentToolDefinitions = [
  {
    name: "getBusinessSummary",
    description: "Get revenue, tasks, and health status across businesses or one business.",
    input_schema: {
      type: "object",
      properties: {
        businessId: { type: "string", description: "Optional business id filter" },
      },
    },
  },
  {
    name: "getSocialMetrics",
    description: "Get Instagram/TikTok post performance metrics.",
    input_schema: {
      type: "object",
      properties: {
        businessId: { type: "string" },
      },
    },
  },
  {
    name: "getCalendarEvents",
    description: "Get today's calendar events.",
    input_schema: {
      type: "object",
      properties: {
        businessId: { type: "string" },
      },
    },
  },
  {
    name: "listAlerts",
    description: "List recent alerts needing attention.",
    input_schema: {
      type: "object",
      properties: {
        businessId: { type: "string" },
      },
    },
  },
] as const;

export async function runAgentTool(
  name: string,
  userId: string,
  input: { businessId?: string },
) {
  switch (name) {
    case "getBusinessSummary":
      return getBusinessSummary(userId, input.businessId);
    case "getSocialMetrics":
      return getSocialMetrics(userId, input.businessId);
    case "getCalendarEvents":
      return getCalendarEvents(userId, input.businessId);
    case "listAlerts":
      return listAlerts(userId, input.businessId);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
