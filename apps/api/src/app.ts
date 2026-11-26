import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./lib/env.js";
import { authRoutes } from "./routes/auth.js";
import { businessRoutes } from "./routes/businesses.js";
import { connectionRoutes } from "./routes/connections.js";
import { incidentRoutes } from "./routes/incidents.js";
import { osRoutes } from "./routes/os.js";
import {
  agentRoutes,
  alertRoutes,
  calendarRoutes,
  socialRoutes,
} from "./routes/agents.js";
import { recordIncident } from "./services/opsIncidents.js";
import { stripeWebhookRoutes } from "./routes/stripeWebhook.js";

/** HTTP app — used by `index.ts` server and integration harness tests. */
export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: env.corsOrigin === "*" ? "*" : env.corsOrigin,
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "juvantage-business-core",
      demoMode: env.demoMode,
      llmConfigured: Boolean(env.anthropicApiKey || env.openaiApiKey),
    }),
  );

  app.route("/webhooks/stripe", stripeWebhookRoutes);
  app.route("/auth", authRoutes);
  app.route("/os", osRoutes);
  app.route("/os/incidents", incidentRoutes);
  app.route("/businesses", businessRoutes);
  app.route("/", connectionRoutes);
  app.route("/agents", agentRoutes);
  app.route("/alerts", alertRoutes);
  app.route("/social", socialRoutes);
  app.route("/calendar", calendarRoutes);

  app.onError((err, c) => {
    console.error(err);
    const path = c.req.path;
    if (!path.includes("/os/incidents")) {
      void recordIncident({
        source: "api",
        method: c.req.method,
        path,
        statusCode: 500,
        message: err.message || "Internal error",
        stack: err.stack ?? null,
      }).catch((e) => console.error("incident capture failed", e));
    }
    return c.json(
      {
        error: err.message || "Internal error",
        incidentCaptured: true,
      },
      500,
    );
  });

  return app;
}
