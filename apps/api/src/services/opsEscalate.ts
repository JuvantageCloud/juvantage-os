/**
 * Escalate OpsIncidents → GitHub repository_dispatch + Jira (human-supervised).
 * Token/Jira creds: env override, else AWS Secrets Manager (never logged).
 */
import { prisma } from "../db/client.js";
import { resolveEnvOrSecret, getJsonSecret } from "../lib/secrets.js";
import { suggestFix, type IncidentInput } from "./opsIncidents.js";

const GITHUB_SECRET_ID =
  process.env.AWS_SECRET_GITHUB_DISPATCH || "juvantage/jos/github-dispatch";
const JIRA_SECRET_ID = process.env.AWS_SECRET_JIRA || "juvantage/jos/jira";
const GITHUB_REPO =
  process.env.GITHUB_REPOSITORY || "JuvantageCloud/juvantage-os";

export function shouldEscalate(input: {
  path: string | null;
  occurrenceCount: number;
  statusCode: number | null;
}): boolean {
  const path = input.path ?? "";
  const criticalClose =
    /approve-send|\/execute|\/approve\b|\/verify\b/i.test(path);
  if (criticalClose) return true;
  return input.occurrenceCount >= 3;
}

function adfParagraphs(...lines: string[]) {
  return {
    type: "doc",
    version: 1,
    content: lines
      .filter(Boolean)
      .map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
  };
}

async function openOrCommentJira(input: {
  fingerprint: string;
  message: string;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  occurrenceCount: number;
  suggestionTitle: string;
}): Promise<string | null> {
  let base = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
  let email = process.env.JIRA_EMAIL;
  let token = process.env.JIRA_API_TOKEN;
  let projectKey = process.env.JIRA_PROJECT_KEY || "JOS";

  if (!base || !email || !token) {
    const jira = await getJsonSecret(JIRA_SECRET_ID);
    if (!jira) return null;
    base = (jira.JIRA_BASE_URL || base || "").replace(/\/$/, "");
    email = jira.JIRA_EMAIL || email;
    token = jira.JIRA_API_TOKEN || token;
    projectKey = jira.JIRA_PROJECT_KEY || projectKey;
  }
  if (!base || !email || !token) return null;

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  const label = `inc-fp-${input.fingerprint.slice(0, 12)}`;
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const found = await fetch(`${base}/rest/api/3/search/jql`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jql: `project = ${projectKey} AND labels = "${label}" AND resolution = Unresolved`,
      maxResults: 1,
      fields: ["key"],
    }),
  });
  const foundBody = (await found.json().catch(() => null)) as {
    issues?: Array<{ key: string }>;
  } | null;

  if (foundBody?.issues?.[0]?.key) {
    const key = foundBody.issues[0].key;
    await fetch(`${base}/rest/api/3/issue/${key}/comment`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        body: adfParagraphs(
          `Another occurrence (count=${input.occurrenceCount}).`,
          `${input.method ?? "?"} ${input.path ?? "?"} → ${input.statusCode ?? "?"}`,
          input.message.slice(0, 500),
        ),
      }),
    });
    return `${base}/browse/${key}`;
  }

  const summary = input.suggestionTitle.slice(0, 255);
  const fields: Record<string, unknown> = {
    project: { key: projectKey },
    summary,
    issuetype: { name: "Bug" },
    labels: [label, "incident-auto", "dept-qa-release", "stage-verification"],
    components: [{ name: "QA & Release" }],
    description: adfParagraphs(
      "Automated API incident (escalate after threshold / critical close path).",
      `Fingerprint: ${input.fingerprint}`,
      `Path: ${input.method ?? "?"} ${input.path ?? "?"}`,
      `Status: ${input.statusCode ?? "?"}`,
      `Occurrences: ${input.occurrenceCount}`,
      input.message.slice(0, 1000),
    ),
  };

  let created = await fetch(`${base}/rest/api/3/issue`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!created.ok) {
    fields.issuetype = { name: "Task" };
    delete fields.components;
    created = await fetch(`${base}/rest/api/3/issue`, {
      method: "POST",
      headers,
      body: JSON.stringify({ fields }),
    });
  }
  if (!created.ok) {
    console.error("opsEscalate: Jira create failed", created.status);
    return null;
  }
  const body = (await created.json()) as { key?: string };
  return body.key ? `${base}/browse/${body.key}` : null;
}

async function dispatchGithub(payload: Record<string, unknown>): Promise<string | null> {
  const token = await resolveEnvOrSecret(
    "GITHUB_DISPATCH_TOKEN",
    GITHUB_SECRET_ID,
    "GITHUB_DISPATCH_TOKEN",
  );
  if (!token) return null;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "os-incident",
      client_payload: payload,
    }),
  });
  if (!res.ok && res.status !== 204) {
    console.error("opsEscalate: GitHub dispatch failed", res.status);
    return null;
  }
  return `https://github.com/${GITHUB_REPO}/actions/workflows/investigate-incident.yml`;
}

/** Fire-and-forget after recordIncident. */
export async function escalateIfNeeded(row: {
  id: string;
  fingerprint: string;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  message: string;
  stack: string | null;
  source: string;
  occurrenceCount: number;
  githubIssueUrl: string | null;
}) {
  if (
    !shouldEscalate({
      path: row.path,
      occurrenceCount: row.occurrenceCount,
      statusCode: row.statusCode,
    })
  ) {
    return { skipped: true as const };
  }

  const suggestion = suggestFix(row);
  const jiraUrl = await openOrCommentJira({
    fingerprint: row.fingerprint,
    message: row.message,
    path: row.path,
    method: row.method,
    statusCode: row.statusCode,
    occurrenceCount: row.occurrenceCount,
    suggestionTitle: suggestion.title,
  });

  const ghUrl = await dispatchGithub({
    incidentId: row.id,
    fingerprint: row.fingerprint,
    message: row.message,
    path: row.path,
    method: row.method,
    statusCode: row.statusCode,
    stack: row.stack,
    source: row.source,
    occurrenceCount: row.occurrenceCount,
    jiraUrl,
    suggestion,
  });

  const link = jiraUrl || ghUrl || row.githubIssueUrl;
  if (link && link !== row.githubIssueUrl) {
    await prisma.opsIncident.update({
      where: { id: row.id },
      data: {
        githubIssueUrl: link,
        status: "investigating",
        investigationJson: JSON.stringify({
          at: new Date().toISOString(),
          engine: "escalate-v1",
          jiraUrl,
          githubWorkflow: ghUrl,
          suggestion,
        }),
      },
    });
  }

  return { skipped: false as const, jiraUrl, ghUrl };
}

/** Used by tests / typing for record path. */
export type EscalateRow = Parameters<typeof escalateIfNeeded>[0];

export type { IncidentInput };
