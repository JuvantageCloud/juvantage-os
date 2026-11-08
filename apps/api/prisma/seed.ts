import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.agentMessage.deleteMany();
  await prisma.agentConversation.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.metricSnapshot.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.opsIncident.deleteMany();
  await prisma.loop.deleteMany();
  await prisma.ambientEvent.deleteMany();
  await prisma.osMailThread.deleteMany();
  await prisma.osCalendarItem.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.businessEvent.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.business.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.create({
    data: {
      email: "john@juvantage.com",
      name: "John Uja",
      passwordHash,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Juvantage",
      memberships: {
        create: { userId: user.id, role: "owner" },
      },
    },
  });

  const northside = await prisma.business.create({
    data: {
      organizationId: org.id,
      name: "Northside Studio",
      category: "Design & Creative",
      status: "healthy",
      metricLabel: "Revenue today",
      metricValue: "$8.6k",
      metricDelta: 12.4,
      revenueToday: 8620,
      openTasks: 1,
      timezone: "America/Los_Angeles",
      currency: "USD",
    },
  });

  const harbor = await prisma.business.create({
    data: {
      organizationId: org.id,
      name: "Harbor Retail",
      category: "Retail",
      status: "attention",
      metricLabel: "Open tasks",
      metricValue: "5",
      metricDelta: -8.7,
      revenueToday: 7200,
      openTasks: 5,
    },
  });

  const atlas = await prisma.business.create({
    data: {
      organizationId: org.id,
      name: "Atlas Consulting",
      category: "Consulting",
      status: "healthy",
      metricLabel: "Revenue today",
      metricValue: "$7.2k",
      metricDelta: 5.6,
      revenueToday: 7200,
      openTasks: 1,
    },
  });

  const connectionDefs = [
    {
      provider: "instagram",
      label: "Instagram",
      status: "connected",
      enabled: true,
      detail: null,
      comingSoon: false,
    },
    {
      provider: "tiktok",
      label: "TikTok",
      status: "connected",
      enabled: true,
      detail: null,
      comingSoon: false,
    },
    {
      provider: "google_calendar",
      label: "Google Calendar",
      status: "connected",
      enabled: true,
      detail: null,
      comingSoon: false,
    },
    {
      provider: "cursor_agents",
      label: "Cursor Agents",
      status: "connected",
      enabled: true,
      detail: "3 agents",
      comingSoon: false,
    },
    {
      provider: "stripe",
      label: "Stripe",
      status: "optional",
      enabled: false,
      detail: "Coming soon",
      comingSoon: true,
    },
    {
      provider: "quickbooks",
      label: "QuickBooks",
      status: "optional",
      enabled: false,
      detail: "Coming soon",
      comingSoon: true,
    },
  ] as const;

  for (const biz of [northside, harbor, atlas]) {
    for (const def of connectionDefs) {
      await prisma.connection.create({
        data: {
          businessId: biz.id,
          ...def,
          lastSyncAt: def.enabled ? new Date(Date.now() - 2 * 60 * 1000) : null,
        },
      });
    }
  }

  await prisma.socialPost.createMany({
    data: [
      {
        businessId: harbor.id,
        platform: "instagram",
        title: "Latest Reel",
        caption:
          "Behind the scenes at Harbor Retail. New collection, real people, real style.",
        views: 12400,
        engagementDelta: 18,
        durationSec: 28,
        likes: 980,
        comments: 64,
        shares: 112,
        engagementRate: 7.8,
      },
      {
        businessId: harbor.id,
        platform: "tiktok",
        title: "Latest Video",
        caption: "Quick walk-through of our Harbor Retail store.",
        views: 89200,
        engagementDelta: 42,
        durationSec: 35,
        likes: 4200,
        comments: 210,
        shares: 890,
        engagementRate: 9.1,
      },
      {
        businessId: northside.id,
        platform: "instagram",
        title: "Instagram Reel",
        caption: "Studio shoot BTS — Northside light tests.",
        views: 12400,
        engagementDelta: 18,
        durationSec: 28,
        likes: 980,
        comments: 64,
        shares: 112,
        engagementRate: 7.8,
      },
    ],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const at = (h: number, m = 0) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d;
  };

  await prisma.calendarEvent.createMany({
    data: [
      {
        businessId: atlas.id,
        title: "Team standup",
        startsAt: at(8, 30),
        endsAt: at(10, 30),
        icon: "people",
      },
      {
        businessId: atlas.id,
        title: "Client consult — Atlas",
        startsAt: at(11, 30),
        endsAt: at(12, 30),
        icon: "chat",
      },
      {
        businessId: northside.id,
        title: "Studio shoot — Northside",
        startsAt: at(14, 0),
        endsAt: at(16, 0),
        icon: "camera",
      },
      {
        businessId: northside.id,
        title: "Content review",
        startsAt: at(16, 30),
        endsAt: at(17, 30),
        icon: "doc",
      },
    ],
  });

  await prisma.businessEvent.createMany({
    data: [
      {
        businessId: northside.id,
        kind: "instagram",
        title: "12.4k views",
        detail: "Instagram Reel",
      },
      {
        businessId: northside.id,
        kind: "calendar",
        title: "Client shoot",
        detail: "2pm",
      },
      {
        businessId: harbor.id,
        kind: "agent",
        title: "Agent: inventory alert",
        detail: "resolved",
      },
    ],
  });

  for (const biz of [northside, harbor, atlas]) {
    const base = biz.revenueToday;
    for (let i = 0; i < 12; i++) {
      await prisma.metricSnapshot.create({
        data: {
          businessId: biz.id,
          key: "revenue",
          value: base * (0.4 + i * 0.05),
          capturedAt: new Date(Date.now() - (11 - i) * 60 * 60 * 1000),
        },
      });
    }
  }

  await prisma.alert.createMany({
    data: [
      {
        businessId: harbor.id,
        severity: "critical",
        title: "Harbor Retail needs attention — inventory lag.",
        body: "Orders and inventory updates from TikTok Shop are delayed. This may affect stock accuracy and order fulfillment.",
        labels: JSON.stringify(["CRITICAL", "Inventory", "Harbor Retail"]),
        impactOrders: 14,
        impactRevenue: 1200,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        businessId: northside.id,
        severity: "social",
        title: "Northside Studio Reel hit 10k views.",
        body: "Your latest Reel is outperforming average by 2.1x.",
        labels: JSON.stringify(["SOCIAL", "Performance", "Social"]),
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        businessId: northside.id,
        severity: "calendar",
        title: "Calendar: Studio shoot in 45 min.",
        body: "Studio shoot — Northside starts soon.",
        labels: JSON.stringify(["Today", "10:30 AM", "Studio"]),
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        severity: "agent",
        title: "Finance Agent posted daily cash summary.",
        body: "Daily cash summary ready across businesses.",
        labels: JSON.stringify(["AGENT", "Finance", "Summary"]),
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        severity: "integration",
        title: "Cursor Bridge: 2 agents idle.",
        body: "Ops and Growth agents are idle and ready.",
        labels: JSON.stringify(["Integration", "Agents", "Cursor Bridge"]),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("Seeded demo user john@juvantage.com / demo1234");
  console.log({ userId: user.id, orgId: org.id, businesses: [northside.name, harbor.name, atlas.name] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
