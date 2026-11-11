#!/usr/bin/env node
/**
 * Ensure a Jira ticket exists for an OS incident fingerprint; comment with proposal pointer.
 * Uses JIRA_* env (GitHub Actions secrets). Never prints the token.
 */
import { readFile } from "node:fs/promises";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

const {
  JIRA_BASE_URL,
  JIRA_EMAIL,
  JIRA_API_TOKEN,
  JIRA_PROJECT_KEY = "JOS",
} = process.env;

if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.log("Jira secrets not configured — skip note");
  process.exit(0);
}

const inputPath = arg("--input");
const proposalPath = arg("--proposal");
if (!inputPath) {
  console.error("--input required");
  process.exit(1);
}

const incident = JSON.parse(await readFile(inputPath, "utf8"));
const fingerprint = String(incident.fingerprint || "unknown").slice(0, 12);
const label = `inc-fp-${fingerprint}`;
const base = JIRA_BASE_URL.replace(/\/$/, "");
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
const headers = {
  Authorization: `Basic ${auth}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

function adf(...lines) {
  return {
    type: "doc",
    version: 1,
    content: lines.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text: String(text) }],
    })),
  };
}

const foundRes = await fetch(`${base}/rest/api/3/search/jql`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    jql: `project = ${JIRA_PROJECT_KEY} AND labels = "${label}" AND resolution = Unresolved`,
    maxResults: 1,
    fields: ["key"],
  }),
});
const found = await foundRes.json();
let key = found.issues?.[0]?.key;

if (!key) {
  const title =
    incident.suggestion?.title ||
    `Investigate: ${String(incident.message || "API incident").slice(0, 72)}`;
  const fields = {
    project: { key: JIRA_PROJECT_KEY },
    summary: String(title).slice(0, 255),
    issuetype: { name: "Bug" },
    labels: [label, "incident-auto", "dept-qa-release"],
    components: [{ name: "QA & Release" }],
    description: adf(
      "Opened from investigate-incident workflow.",
      `Fingerprint: ${incident.fingerprint || fingerprint}`,
      `${incident.method || "?"} ${incident.path || "?"}`,
      String(incident.message || "").slice(0, 1000),
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
    console.error("Jira create failed", created.status, await created.text());
    process.exit(1);
  }
  key = (await created.json()).key;
  console.log("Created", key);
} else {
  console.log("Existing", key);
}

const proposalNote = proposalPath
  ? `Proposal artifact: ${proposalPath}`
  : "Proposal generated in workflow artifacts.";
await fetch(`${base}/rest/api/3/issue/${key}/comment`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    body: adf(
      "Investigate workflow ran (draft PR for human review — never auto-merge).",
      proposalNote,
      `Run: ${process.env.GITHUB_SERVER_URL || "https://github.com"}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    ),
  }),
});
console.log(`Commented on ${key}`);
