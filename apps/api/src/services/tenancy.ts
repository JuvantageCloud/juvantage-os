import { prisma } from "../db/client.js";

export async function userOrgIds(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  return memberships.map((m) => m.organizationId);
}

export async function assertBusinessAccess(userId: string, businessId: string) {
  const orgIds = await userOrgIds(userId);
  const business = await prisma.business.findFirst({
    where: { id: businessId, organizationId: { in: orgIds } },
  });
  if (!business) throw new Error("Business not found");
  return business;
}

export function mapBusiness(b: {
  id: string;
  name: string;
  category: string;
  status: string;
  metricLabel: string;
  metricValue: string;
  metricDelta: number | null;
  timezone: string;
  currency: string;
  revenueToday: number;
  openTasks: number;
}) {
  return {
    id: b.id,
    name: b.name,
    category: b.category,
    status: b.status as "healthy" | "attention" | "offline",
    metricLabel: b.metricLabel,
    metricValue: b.metricValue,
    metricDelta: b.metricDelta,
    timezone: b.timezone,
    currency: b.currency,
    revenueToday: b.revenueToday,
    openTasks: b.openTasks,
  };
}

export function greetingForNow(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
