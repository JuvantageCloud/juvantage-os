import { prisma } from "../db/client.js";
import { env, hasLiveLlm } from "../lib/env.js";
import { userOrgIds } from "./tenancy.js";

export type OsPlanId = "personal" | "brain_pro" | "teams";
export type FnRoute = "bundled" | "own_agent" | "bundled_then_own";

export const PLAN_CATALOG: Record<
  Exclude<OsPlanId, "teams">,
  {
    id: Exclude<OsPlanId, "teams">;
    label: string;
    priceLabel: string;
    quickAnswersPerDay: number;
    draftPolishPerMonth: number;
  }
> = {
  personal: {
    id: "personal",
    label: "Personal",
    priceLabel: "Included",
    quickAnswersPerDay: 25,
    draftPolishPerMonth: 30,
  },
  brain_pro: {
    id: "brain_pro",
    label: "Brain Pro",
    priceLabel: "$20 / mo",
    quickAnswersPerDay: 500,
    draftPolishPerMonth: 2000,
  },
};

function utcDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function utcMonthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export class OsUsageError extends Error {
  status: 401 | 400;
  constructor(message: string, status: 401 | 400 = 400) {
    super(message);
    this.status = status;
  }
}

/** JWT sub can lag after db:seed — fall back to email so Plan & usage still loads. */
export async function resolveAccountUserId(sub: string, email?: string): Promise<string> {
  const byId = await prisma.user.findUnique({ where: { id: sub }, select: { id: true } });
  if (byId) return byId.id;
  const normalized = email?.trim().toLowerCase();
  if (normalized) {
    const byEmail = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
    if (byEmail) return byEmail.id;
  }
  throw new OsUsageError("Session out of date — sign out and sign in again.", 401);
}

export async function ensureUserOsPlan(userId: string) {
  return prisma.userOsPlan.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

function effectivePlanId(raw: string): Exclude<OsPlanId, "teams"> {
  if (raw === "brain_pro") return "brain_pro";
  return "personal";
}

function limitsForPlan(plan: string) {
  return PLAN_CATALOG[effectivePlanId(plan)];
}

async function rolloverCounters(row: { quickAnswersDay: string | null; draftPolishMonth: string | null }) {
  const day = utcDayKey();
  const month = utcMonthKey();
  const patch: { quickAnswersUsed?: number; quickAnswersDay?: string; draftPolishUsed?: number; draftPolishMonth?: string } =
    {};
  if (row.quickAnswersDay !== day) {
    patch.quickAnswersUsed = 0;
    patch.quickAnswersDay = day;
  }
  if (row.draftPolishMonth !== month) {
    patch.draftPolishUsed = 0;
    patch.draftPolishMonth = month;
  }
  return patch;
}

export async function ownAgentConnected(userId: string): Promise<boolean> {
  const personal = await prisma.connection.findFirst({
    where: { userId, provider: "cursor_agents", enabled: true },
  });
  if (personal) return true;
  const orgIds = await userOrgIds(userId);
  if (orgIds.length === 0) return false;
  const orgRow = await prisma.connection.findFirst({
    where: {
      provider: "cursor_agents",
      enabled: true,
      business: { organizationId: { in: orgIds } },
    },
  });
  return Boolean(orgRow);
}

export type OsUsageSnapshot = {
  plan: OsPlanId;
  planLabel: string;
  priceLabel: string;
  fnRoute: FnRoute;
  ownAgentConnected: boolean;
  stripeConfigured: boolean;
  billingPortalAvailable: boolean;
  quickAnswers: {
    used: number;
    limit: number;
    resetsAt: string;
    label: string;
  };
  draftPolish: {
    used: number;
    limit: number;
    resetsAt: string;
    label: string;
  };
  catalog: typeof PLAN_CATALOG;
};

export async function getOsUsageSnapshot(sub: string, email?: string): Promise<OsUsageSnapshot> {
  const userId = await resolveAccountUserId(sub, email);
  let row = await ensureUserOsPlan(userId);
  const roll = await rolloverCounters(row);
  if (Object.keys(roll).length > 0) {
    row = await prisma.userOsPlan.update({ where: { userId }, data: roll });
  }

  const limits = limitsForPlan(row.plan);
  const fnRoute = (row.fnRoute as FnRoute) || "bundled";
  const stripeConfigured = Boolean(env.stripeSecretKey && env.stripePriceBrainPro);

  const day = row.quickAnswersDay ?? utcDayKey();
  const month = row.draftPolishMonth ?? utcMonthKey();
  const quickReset = new Date(`${day}T00:00:00.000Z`);
  quickReset.setUTCDate(quickReset.getUTCDate() + 1);
  const draftReset = new Date(`${month}-01T00:00:00.000Z`);
  draftReset.setUTCMonth(draftReset.getUTCMonth() + 1);

  return {
    plan: row.plan === "brain_pro" ? "brain_pro" : row.plan === "teams" ? "teams" : "personal",
    planLabel: limits.label,
    priceLabel: limits.priceLabel,
    fnRoute: fnRoute === "own_agent" || fnRoute === "bundled_then_own" ? fnRoute : "bundled",
    ownAgentConnected: await ownAgentConnected(userId),
    stripeConfigured,
    billingPortalAvailable: Boolean(row.stripeCustomerId && stripeConfigured),
    quickAnswers: {
      used: row.quickAnswersUsed,
      limit: limits.quickAnswersPerDay,
      resetsAt: quickReset.toISOString(),
      label: "Fn quick answers (Jos Brain)",
    },
    draftPolish: {
      used: row.draftPolishUsed,
      limit: limits.draftPolishPerMonth,
      resetsAt: draftReset.toISOString(),
      label: "Draft polish (approve path)",
    },
    catalog: PLAN_CATALOG,
  };
}

export async function updateFnRoute(sub: string, fnRoute: FnRoute, email?: string) {
  const allowed: FnRoute[] = ["bundled", "own_agent", "bundled_then_own"];
  if (!allowed.includes(fnRoute)) {
    throw new OsUsageError("Invalid fn route");
  }
  const userId = await resolveAccountUserId(sub, email);
  await prisma.userOsPlan.upsert({
    where: { userId },
    create: { userId, fnRoute },
    update: { fnRoute },
  });
  return getOsUsageSnapshot(sub, email);
}

export type VoiceQuickPath =
  | { path: "bundled"; userId: string }
  | { path: "own_agent"; userId: string }
  | { path: "deny"; reason: "quota" | "routing" | "no_llm"; message: string };

/** Route fn quick answer to tier C (bundled), tier D (BYO agent), or deny. */
export async function resolveVoiceQuickPath(sub: string, email?: string): Promise<VoiceQuickPath> {
  let userId: string;
  try {
    userId = await resolveAccountUserId(sub, email);
  } catch {
    return {
      path: "deny",
      reason: "no_llm",
      message: "Sign in again on Desktop — your session is out of date.",
    };
  }
  let row = await ensureUserOsPlan(userId);
  const roll = await rolloverCounters(row);
  if (Object.keys(roll).length > 0) {
    row = await prisma.userOsPlan.update({ where: { userId }, data: roll });
  }

  const route = (row.fnRoute as FnRoute) || "bundled";
  const own = await ownAgentConnected(userId);
  const brainLive = hasLiveLlm();

  if (route === "own_agent") {
    if (own) return { path: "own_agent", userId };
    return {
      path: "deny",
      reason: "routing",
      message: "Connect your cloud agent in Settings, or switch fn back to Jos Brain.",
    };
  }

  const limits = limitsForPlan(row.plan);
  const quotaLeft = row.quickAnswersUsed < limits.quickAnswersPerDay;

  if (!quotaLeft) {
    if (route === "bundled_then_own" && own) return { path: "own_agent", userId };
    return {
      path: "deny",
      reason: "quota",
      message: "Daily quick-answer limit reached. Upgrade in Settings → Plan & usage, or connect your agent.",
    };
  }

  if (!brainLive) {
    if (own && route === "bundled_then_own") return { path: "own_agent", userId };
    return {
      path: "deny",
      reason: "no_llm",
      message: "Jos Brain is not configured on this server. I'll open a loop instead.",
    };
  }

  return { path: "bundled", userId };
}

export async function recordQuickAnswerUse(sub: string, email?: string) {
  let userId: string;
  try {
    userId = await resolveAccountUserId(sub, email);
  } catch {
    return;
  }
  let row = await ensureUserOsPlan(userId);
  const roll = await rolloverCounters(row);
  if (Object.keys(roll).length > 0) {
    row = await prisma.userOsPlan.update({ where: { userId }, data: roll });
  }
  await prisma.userOsPlan.update({
    where: { userId },
    data: {
      quickAnswersUsed: row.quickAnswersUsed + 1,
      quickAnswersDay: row.quickAnswersDay ?? utcDayKey(),
    },
  });
}

/** True when bundled Brain may polish a draft this month. */
export async function canUseDraftPolish(sub: string, email?: string): Promise<boolean> {
  let userId: string;
  try {
    userId = await resolveAccountUserId(sub, email);
  } catch {
    return false;
  }
  let row = await ensureUserOsPlan(userId);
  const roll = await rolloverCounters(row);
  if (Object.keys(roll).length > 0) {
    row = await prisma.userOsPlan.update({ where: { userId }, data: roll });
  }
  const limits = limitsForPlan(row.plan);
  return row.draftPolishUsed < limits.draftPolishPerMonth;
}

export async function recordDraftPolishUse(sub: string, email?: string) {
  let userId: string;
  try {
    userId = await resolveAccountUserId(sub, email);
  } catch {
    return;
  }
  let row = await ensureUserOsPlan(userId);
  const roll = await rolloverCounters(row);
  if (Object.keys(roll).length > 0) {
    row = await prisma.userOsPlan.update({ where: { userId }, data: roll });
  }
  await prisma.userOsPlan.update({
    where: { userId },
    data: {
      draftPolishUsed: row.draftPolishUsed + 1,
      draftPolishMonth: row.draftPolishMonth ?? utcMonthKey(),
    },
  });
}

export async function setPlanForUser(userId: string, plan: OsPlanId) {
  if (plan !== "personal" && plan !== "brain_pro" && plan !== "teams") {
    throw new Error("Unknown plan");
  }
  await prisma.userOsPlan.upsert({
    where: { userId },
    create: { userId, plan },
    update: { plan },
  });
}

export async function createBrainProCheckout(sub: string, email?: string): Promise<{
  ok: boolean;
  url?: string;
  message?: string;
}> {
  let userId: string;
  try {
    userId = await resolveAccountUserId(sub, email);
  } catch (err) {
    const message = err instanceof OsUsageError ? err.message : "User not found";
    return { ok: false, message };
  }

  if (!env.stripeSecretKey || !env.stripePriceBrainPro) {
    if (env.demoMode) {
      await setPlanForUser(userId, "brain_pro");
      return { ok: true, message: "Demo mode: Brain Pro activated (no Stripe keys)." };
    }
    return {
      ok: false,
      message: "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_BRAIN_PRO on the Brain.",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, message: "User not found" };

  const planRow = await ensureUserOsPlan(userId);
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.stripeSecretKey);

  let customerId = planRow.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { juvantageUserId: userId },
    });
    customerId = customer.id;
    await prisma.userOsPlan.update({
      where: { userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const successUrl = `${env.osBillingReturnUrl}?billing=success`;
  const cancelUrl = `${env.osBillingReturnUrl}?billing=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: env.stripePriceBrainPro, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { juvantageUserId: userId, plan: "brain_pro" },
  });

  if (!session.url) {
    return { ok: false, message: "Checkout session missing URL" };
  }
  return { ok: true, url: session.url };
}

export async function createBillingPortalSession(
  sub: string,
  email?: string,
): Promise<{ ok: boolean; url?: string; message?: string }> {
  let userId: string;
  try {
    userId = await resolveAccountUserId(sub, email);
  } catch (err) {
    const message = err instanceof OsUsageError ? err.message : "User not found";
    return { ok: false, message };
  }
  if (!env.stripeSecretKey) {
    return { ok: false, message: "Stripe not configured" };
  }
  const planRow = await ensureUserOsPlan(userId);
  if (!planRow.stripeCustomerId) {
    return { ok: false, message: "No billing profile yet — upgrade first." };
  }
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.stripeSecretKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: planRow.stripeCustomerId,
    return_url: env.osBillingReturnUrl,
  });
  return { ok: true, url: session.url };
}

/** Apply subscription from Stripe webhook payload (minimal V1). */
export async function applyStripeCheckoutCompleted(payload: {
  customerId?: string | null;
  subscriptionId?: string | null;
  userId?: string | null;
  plan?: string | null;
}) {
  const userId = payload.userId;
  if (!userId) return;
  const plan = payload.plan === "brain_pro" ? "brain_pro" : "personal";
  await prisma.userOsPlan.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      stripeCustomerId: payload.customerId ?? undefined,
      stripeSubscriptionId: payload.subscriptionId ?? undefined,
    },
    update: {
      plan,
      stripeCustomerId: payload.customerId ?? undefined,
      stripeSubscriptionId: payload.subscriptionId ?? undefined,
    },
  });
}