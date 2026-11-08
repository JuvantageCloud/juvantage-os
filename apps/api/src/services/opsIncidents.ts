import { createHash } from "node:crypto";
import { prisma } from "../db/client.js";

export type IncidentInput = {
  source?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  message: string;
  stack?: string | null;
  context?: Record<string, unknown>;
  userId?: string | null;
};

export function fingerprintIncident(input: IncidentInput): string {
  const norm = [
    input.source ?? "api",
    (input.method ?? "").toUpperCase(),
    normalizePath(input.path ?? ""),
    normalizeMessage(input.message),
    String(input.statusCode ?? 500),
  ].join("|");
  return createHash("sha256").update(norm).digest("hex").slice(0, 32);
}

function normalizePath(path: string) {
  return path
    .split("?")[0]
    .replace(/\/c[a-z0-9]{8,}/gi, "/:id") // cuid-ish
    .replace(/\/[0-9a-f]{8,}/gi, "/:id")
    .replace(/\/\d+/g, "/:id");
}

function normalizeMessage(message: string) {
  return message
    .replace(/[0-9a-f]{8,}-[0-9a-f-]{20,}/gi, "<uuid>")
    .replace(/\d{4,}/g, "<n>")
    .slice(0, 240);
}

export async function recordIncident(input: IncidentInput) {
  const fingerprint = fingerprintIncident(input);
  const existing = await prisma.opsIncident.findUnique({ where: { fingerprint } });
  if (existing) {
    return prisma.opsIncident.update({
      where: { id: existing.id },
      data: {
        occurrenceCount: { increment: 1 },
        lastSeenAt: new Date(),
        message: input.message.slice(0, 2000),
        stack: input.stack?.slice(0, 8000) ?? existing.stack,
        contextJson: input.context
          ? JSON.stringify(input.context).slice(0, 8000)
          : existing.contextJson,
        status: existing.status === "resolved" ? "open" : existing.status,
      },
    });
  }
  return prisma.opsIncident.create({
    data: {
      fingerprint,
      source: input.source ?? "api",
      method: input.method ?? null,
      path: input.path ? normalizePath(input.path) : null,
      statusCode: input.statusCode ?? null,
      message: input.message.slice(0, 2000),
      stack: input.stack?.slice(0, 8000) ?? null,
      contextJson: input.context
        ? JSON.stringify(input.context).slice(0, 8000)
        : null,
      userId: input.userId ?? null,
    },
  });
}

export async function listOpenIncidents(limit = 20) {
  return prisma.opsIncident.findMany({
    where: { status: { in: ["open", "investigating"] } },
    orderBy: [{ occurrenceCount: "desc" }, { lastSeenAt: "desc" }],
    take: limit,
  });
}

export async function getIncident(id: string) {
  return prisma.opsIncident.findUnique({ where: { id } });
}

export async function markInvestigating(
  id: string,
  investigation: Record<string, unknown>,
) {
  return prisma.opsIncident.update({
    where: { id },
    data: {
      status: "investigating",
      investigationJson: JSON.stringify(investigation),
    },
  });
}

/** Rule-based first-pass investigation (CI / local). LLM can deepen later. */
export function suggestFix(incident: {
  message: string;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  stack: string | null;
  source: string;
}) {
  const msg = incident.message.toLowerCase();
  const path = incident.path ?? "";
  const suggestions: string[] = [];
  let likelyFile = "apps/api/src/index.ts";
  let title = `Investigate: ${incident.message.slice(0, 72)}`;

  if (msg.includes("unauthorized") || incident.statusCode === 401) {
    likelyFile = "apps/api/src/middleware/auth.ts";
    suggestions.push(
      "Check JWT_SECRET consistency between environments and Authorization Bearer header on the client.",
    );
    suggestions.push("Confirm Desktop localStorage token is set after /auth/login.");
    title = "Fix auth 401 on OS Brain request";
  } else if (msg.includes("google") || path.includes("oauth")) {
    likelyFile = "apps/api/src/services/osConnectors.ts";
    suggestions.push(
      "Verify GOOGLE_CLIENT_ID/SECRET and GOOGLE_OS_REDIRECT_URI match Google Cloud Console.",
    );
    suggestions.push("Confirm demo mode path still works when OAuth is unset.");
    title = "Fix Google OAuth / connector failure";
  } else if (msg.includes("prisma") || msg.includes("sqlite") || msg.includes("database")) {
    likelyFile = "apps/api/prisma/schema.prisma";
    suggestions.push("Run prisma generate + db push; check DATABASE_URL for the environment.");
    suggestions.push("Ensure CI and prod use compatible schema migrations.");
    title = "Fix database / Prisma incident";
  } else if (path.startsWith("/os/loops") || msg.includes("loop")) {
    likelyFile = "apps/api/src/services/osLoops.ts";
    suggestions.push("Reproduce with demo connect + extract; check Loop unique constraints.");
    title = "Fix OS loops extract/list failure";
  } else if (incident.source === "desktop") {
    likelyFile = "apps/desktop/src/lib/api.ts";
    suggestions.push("Check VITE_API_BASE_URL points at reachable Brain (local or os-brain).");
    suggestions.push("Surface user-visible error toast; retry once on network blip.");
    title = "Fix Desktop → Brain client failure";
  } else {
    suggestions.push("Add a regression test that reproduces this message.");
    suggestions.push("Tighten error handling at the failing route; avoid leaking stack to clients.");
  }

  if (incident.stack) {
    const fileHit = incident.stack.match(/apps\/[^\s):]+|src\/[^\s):]+/);
    if (fileHit) likelyFile = fileHit[0].replace(/^\//, "");
  }

  return {
    title,
    likelyFile,
    suggestions,
    proposedChecks: [
      "npm test -w @juvantage/api",
      "npm run build -w @juvantage/api",
      "npx tsc -p apps/desktop --noEmit",
    ],
    policy: "Draft PR only — human review required. Never auto-merge or auto-deploy.",
  };
}

export function serializeIncident(row: {
  id: string;
  fingerprint: string;
  source: string;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  message: string;
  stack: string | null;
  contextJson: string | null;
  occurrenceCount: number;
  status: string;
  investigationJson: string | null;
  githubIssueUrl: string | null;
  lastSeenAt: Date;
  createdAt: Date;
}) {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    source: row.source,
    method: row.method,
    path: row.path,
    statusCode: row.statusCode,
    message: row.message,
    stack: row.stack,
    context: row.contextJson ? JSON.parse(row.contextJson) : null,
    occurrenceCount: row.occurrenceCount,
    status: row.status,
    investigation: row.investigationJson
      ? JSON.parse(row.investigationJson)
      : null,
    githubIssueUrl: row.githubIssueUrl,
    lastSeenAt: row.lastSeenAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    suggestion: suggestFix(row),
  };
}
