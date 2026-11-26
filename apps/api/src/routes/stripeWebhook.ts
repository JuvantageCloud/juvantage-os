import { Hono } from "hono";
import { env } from "../lib/env.js";
import { applyStripeCheckoutCompleted, setPlanForUser } from "../services/osUsage.js";

export const stripeWebhookRoutes = new Hono();

stripeWebhookRoutes.post("/", async (c) => {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return c.json({ error: "Stripe webhook not configured" }, 503);
  }
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.text("Missing signature", 400);

  const raw = await c.req.text();
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.stripeSecretKey);
  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEvent>>;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, env.stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return c.text(message, 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { customer?: string | null; subscription?: string | null; metadata?: Record<string, string> };
      await applyStripeCheckoutCompleted({
        customerId: session.customer as string | null,
        subscriptionId: session.subscription as string | null,
        userId: session.metadata?.juvantageUserId ?? null,
        plan: session.metadata?.plan ?? "brain_pro",
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as { metadata?: Record<string, string> };
      const userId = sub.metadata?.juvantageUserId;
      if (userId) await setPlanForUser(userId, "personal");
      break;
    }
    default:
      break;
  }

  return c.json({ received: true });
});