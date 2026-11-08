import { Hono } from "hono";
import { requireAuth, type AppVariables } from "../middleware/auth.js";
import {
  getIncident,
  listOpenIncidents,
  markInvestigating,
  recordIncident,
  serializeIncident,
  suggestFix,
} from "../services/opsIncidents.js";

export const incidentRoutes = new Hono<{ Variables: AppVariables }>();

/** Public-ish ingest for Desktop / monitors — still rate-limit later. Auth preferred. */
incidentRoutes.post("/report", async (c) => {
  const body = (await c.req.json()) as {
    source?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    message?: string;
    stack?: string;
    context?: Record<string, unknown>;
  };
  if (!body.message?.trim()) return c.json({ error: "message required" }, 400);

  let userId: string | null = null;
  const auth = c.req.header("authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      const { verifyToken } = await import("../lib/auth.js");
      const payload = await verifyToken(auth.slice(7));
      userId = payload.sub;
    } catch {
      /* anonymous report still allowed for client crashes */
    }
  }

  const row = await recordIncident({
    source: body.source ?? "client",
    method: body.method,
    path: body.path,
    statusCode: body.statusCode,
    message: body.message,
    stack: body.stack,
    context: body.context,
    userId,
  });

  return c.json({
    id: row.id,
    fingerprint: row.fingerprint,
    occurrenceCount: row.occurrenceCount,
    suggestion: suggestFix(row),
  });
});

incidentRoutes.use("/*", requireAuth);

incidentRoutes.get("/", async (c) => {
  const rows = await listOpenIncidents(Number(c.req.query("limit") ?? 20));
  return c.json({
    incidents: rows.map(serializeIncident),
  });
});

incidentRoutes.get("/:id", async (c) => {
  const row = await getIncident(c.req.param("id"));
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ incident: serializeIncident(row) });
});

incidentRoutes.post("/:id/investigate", async (c) => {
  const row = await getIncident(c.req.param("id"));
  if (!row) return c.json({ error: "Not found" }, 404);
  const suggestion = suggestFix(row);
  const updated = await markInvestigating(row.id, {
    at: new Date().toISOString(),
    engine: "rules-v1",
    suggestion,
  });
  return c.json({
    incident: serializeIncident(updated),
    dispatchHint: {
      event_type: "os-incident",
      client_payload: {
        incidentId: row.id,
        fingerprint: row.fingerprint,
        message: row.message,
        path: row.path,
        method: row.method,
        statusCode: row.statusCode,
        stack: row.stack,
        suggestion,
      },
    },
  });
});
