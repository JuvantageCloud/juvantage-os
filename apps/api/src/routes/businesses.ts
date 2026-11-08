import { Hono } from "hono";
import { CreateBusinessRequestSchema } from "@juvantage/shared";
import { prisma } from "../db/client.js";
import { requireAuth, type AppVariables } from "../middleware/auth.js";
import { greetingForNow, mapBusiness, userOrgIds } from "../services/tenancy.js";
import { connectDemoProvider } from "../services/connections.js";

export const businessRoutes = new Hono<{ Variables: AppVariables }>();
businessRoutes.use("*", requireAuth);

businessRoutes.get("/command", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const businesses = await prisma.business.findMany({
    where: { organizationId: { in: orgIds } },
    orderBy: { name: "asc" },
  });
  const revenueToday = businesses.reduce((s, b) => s + b.revenueToday, 0);
  const openTasks = businesses.reduce((s, b) => s + b.openTasks, 0);
  return c.json({
    greeting: greetingForNow(),
    systemsLive: true,
    revenueToday,
    revenueDeltaPct: 12,
    openTasks,
    mentions: 142,
    businesses: businesses.map(mapBusiness),
  });
});

businessRoutes.get("/", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const businesses = await prisma.business.findMany({
    where: { organizationId: { in: orgIds } },
    orderBy: { name: "asc" },
  });
  return c.json(businesses.map(mapBusiness));
});

businessRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const orgIds = await userOrgIds(user.sub);
  const business = await prisma.business.findFirst({
    where: { id: c.req.param("id"), organizationId: { in: orgIds } },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 10 },
      metricSnapshots: {
        where: { key: "revenue" },
        orderBy: { capturedAt: "asc" },
        take: 24,
      },
    },
  });
  if (!business) return c.json({ error: "Not found" }, 404);
  return c.json({
    ...mapBusiness(business),
    liveActivity: business.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      detail: e.detail,
      createdAt: e.createdAt.toISOString(),
    })),
    performance: business.metricSnapshots.map((m) => ({
      t: m.capturedAt.toISOString(),
      v: m.value,
    })),
  });
});

businessRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = CreateBusinessRequestSchema.parse(await c.req.json());
  const membership = await prisma.membership.findFirst({ where: { userId: user.sub } });
  if (!membership) return c.json({ error: "No organization" }, 400);

  const business = await prisma.business.create({
    data: {
      organizationId: membership.organizationId,
      name: body.name,
      category: body.category,
      timezone: body.timezone,
      currency: body.currency,
      status: "healthy",
      metricLabel: "Revenue today",
      metricValue: "$0",
      revenueToday: 0,
      openTasks: 0,
    },
  });

  const providers = [
    { key: "instagram" as const, on: body.connectInstagram },
    { key: "tiktok" as const, on: body.connectTiktok },
    { key: "google_calendar" as const, on: body.connectCalendar },
  ];
  for (const p of providers) {
    if (p.on) await connectDemoProvider(business.id, p.key);
    else {
      await prisma.connection.create({
        data: {
          businessId: business.id,
          provider: p.key,
          label:
            p.key === "google_calendar"
              ? "Google Calendar"
              : p.key === "instagram"
                ? "Instagram"
                : "TikTok",
          status: "disconnected",
          enabled: false,
        },
      });
    }
  }
  await connectDemoProvider(business.id, "cursor_agents");
  await prisma.connection.createMany({
    data: [
      {
        businessId: business.id,
        provider: "stripe",
        label: "Stripe",
        status: "optional",
        enabled: false,
        comingSoon: true,
        detail: "Coming soon",
      },
      {
        businessId: business.id,
        provider: "quickbooks",
        label: "QuickBooks",
        status: "optional",
        enabled: false,
        comingSoon: true,
        detail: "Coming soon",
      },
    ],
  });

  return c.json(mapBusiness(business), 201);
});
