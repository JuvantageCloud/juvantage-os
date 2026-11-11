#!/usr/bin/env node
/**
 * Open/update a Jira Bug when CI on main is a real failure — not every red build.
 *
 * Rules (agreed):
 * - pull_request failures → never (this script should not be invoked for them)
 * - main fails once after a green → no ticket yet
 * - main fails on 2 consecutive runs → open/update ticket
 * - same fingerprint failed ≥3 times in 7 days (even with greens between) → open/update "flaky" ticket
 *
 * Env: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY
 *      GITHUB_TOKEN, GITHUB_REPOSITORY, WORKFLOW_RUN_ID (or github.event.workflow_run.id)
 */
import { createHash } from "node:crypto";

const {
  JIRA_BASE_URL,
  JIRA_EMAIL,
  JIRA_API_TOKEN,
  JIRA_PROJECT_KEY = "JOS",
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  WORKFLOW_RUN_ID,
  WORKFLOW_NAME = "CI",
} = process.env;

for (const [k, v] of Object.entries({
  JIRA_BASE_URL,
  JIRA_EMAIL,
  JIRA_API_TOKEN,
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  WORKFLOW_RUN_ID,
})) {
  if (!v) {
    console.error(`Missing env ${k}`);
    process.exit(1);
  }
}

const jiraBase = JIRA_BASE_URL.replace(/\/$/, "");
const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return body;
}

async function jira(path, init = {}) {
  const res = await fetch(`${jiraBase}/rest/api/3${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${jiraAuth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw Object.assign(
      new Error(`Jira ${path} → ${res.status}: ${text.slice(0, 400)}`),
      { status: res.status, body },
    );
  }
  return body;
}

function adf(...paragraphs) {
  return {
    type: "doc",
    version: 1,
    content: paragraphs.flatMap((p) => {
      if (Array.isArray(p)) {
        return [
          {
            type: "bulletList",
            content: p.map((item) => ({
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
            })),
          },
        ];
      }
      return [{ type: "paragraph", content: [{ type: "text", text: String(p) }] }];
    }),
  };
}

const runId = WORKFLOW_RUN_ID;
const run = await gh(`/repos/${GITHUB_REPOSITORY}/actions/runs/${runId}`);
if (run.conclusion !== "failure") {
  console.log(`Run ${runId} conclusion=${run.conclusion} — skip`);
  process.exit(0);
}
if (run.event !== "push") {
  console.log(`Run event=${run.event} — skip (PRs never ticket)`);
  process.exit(0);
}
if (run.head_branch !== "main" && run.head_branch !== "master") {
  console.log(`Branch ${run.head_branch} — skip`);
  process.exit(0);
}

const jobs = await gh(`/repos/${GITHUB_REPOSITORY}/actions/runs/${runId}/jobs`);
const failedJobs = (jobs.jobs || []).filter((j) => j.conclusion === "failure");
const failedSteps = failedJobs.flatMap((j) =>
  (j.steps || [])
    .filter((s) => s.conclusion === "failure")
    .map((s) => `${j.name} / ${s.name}`),
);
const fingerprintSrc = failedSteps.join("|") || failedJobs.map((j) => j.name).join("|") || "ci-failure";
const fingerprint = createHash("sha256").update(fingerprintSrc).digest("hex").slice(0, 12);
const label = `ci-fp-${fingerprint}`;

const history = await gh(
  `/repos/${GITHUB_REPOSITORY}/actions/workflows/${encodeURIComponent(WORKFLOW_NAME)}.yml/runs?branch=${run.head_branch}&event=push&per_page=30`,
);
const runs = (history.workflow_runs || []).filter((r) =>
  ["success", "failure"].includes(r.conclusion),
);
// runs are newest-first; current should be first
const idx = runs.findIndex((r) => String(r.id) === String(runId));
const ordered = idx >= 0 ? runs.slice(idx) : runs;
const previous = ordered[1];
const consecutive =
  previous && previous.conclusion === "failure" ? true : false;

const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
const sameFpFailures = [];
for (const r of runs) {
  if (r.conclusion !== "failure") continue;
  if (new Date(r.created_at).getTime() < weekAgo) continue;
  // approximate: same failing job names from run jobs would be expensive;
  // use head_sha path — for flaky we count failures that share our label's ticket history
  sameFpFailures.push(r);
}
// Better flaky signal: open/search Jira comments later; for now count consecutive +
// if ≥3 failures in 7d on main for this workflow, open flaky ticket when fingerprint matches
// via checking jobs on recent failures (cap 8)
let fingerprintFailCount = 0;
for (const r of runs.slice(0, 15)) {
  if (r.conclusion !== "failure") continue;
  if (new Date(r.created_at).getTime() < weekAgo) continue;
  try {
    const js = await gh(`/repos/${GITHUB_REPOSITORY}/actions/runs/${r.id}/jobs`);
    const steps = (js.jobs || [])
      .filter((j) => j.conclusion === "failure")
      .flatMap((j) =>
        (j.steps || [])
          .filter((s) => s.conclusion === "failure")
          .map((s) => `${j.name} / ${s.name}`),
      );
    const fp = createHash("sha256")
      .update(steps.join("|") || (js.jobs || []).filter((j) => j.conclusion === "failure").map((j) => j.name).join("|") || "ci-failure")
      .digest("hex")
      .slice(0, 12);
    if (fp === fingerprint) fingerprintFailCount += 1;
  } catch {
    /* ignore */
  }
}

const flaky = fingerprintFailCount >= 3;
const shouldTicket = consecutive || flaky;

console.log(
  JSON.stringify({
    runId,
    fingerprint,
    failedSteps,
    previousConclusion: previous?.conclusion ?? null,
    consecutive,
    fingerprintFailCount,
    flaky,
    shouldTicket,
  }),
);

if (!shouldTicket) {
  console.log("First isolated main failure after green — no ticket (will ticket on 2nd consecutive or flaky pattern)");
  process.exit(0);
}

const runUrl = run.html_url;
const summary = flaky
  ? `Flaky CI: ${failedSteps[0] || "Build & test"} (${fingerprintFailCount}×/7d)`
  : `CI red on main (2×): ${failedSteps[0] || "Build & test"}`;

const found = await jira("/search/jql", {
  method: "POST",
  body: JSON.stringify({
    jql: `project = ${JIRA_PROJECT_KEY} AND labels = "${label}" AND resolution = Unresolved`,
    maxResults: 1,
    fields: ["key"],
  }),
});

const description = adf(
  `Automated CI ticket (${flaky ? "flaky" : "consecutive failure"}).`,
  `Fingerprint: ${fingerprint}`,
  `Failed steps:`,
  failedSteps.length ? failedSteps : ["(unknown step)"],
  `Run: ${runUrl}`,
  `SHA: ${run.head_sha}`,
  `Branch: ${run.head_branch}`,
);

if (found.issues?.length) {
  const key = found.issues[0].key;
  await jira(`/issue/${key}/comment`, {
    method: "POST",
    body: JSON.stringify({
      body: adf(
        `Another matching CI failure.`,
        `Run: ${runUrl}`,
        `SHA: ${run.head_sha}`,
        `Consecutive: ${consecutive}`,
        `Fingerprint failures (7d): ${fingerprintFailCount}`,
      ),
    }),
  });
  console.log(`Commented on existing ${key}`);
  process.exit(0);
}

// Prefer Bug; fall back to Task
let issue;
const fieldsBase = {
  project: { key: JIRA_PROJECT_KEY },
  summary: summary.slice(0, 255),
  labels: [label, "ci-auto", "dept-qa-release", "stage-verification"],
  description,
  components: [{ name: "QA & Release" }],
};
try {
  issue = await jira("/issue", {
    method: "POST",
    body: JSON.stringify({
      fields: { ...fieldsBase, issuetype: { name: "Bug" }, priority: { name: "High" } },
    }),
  });
} catch {
  try {
    issue = await jira("/issue", {
      method: "POST",
      body: JSON.stringify({
        fields: { ...fieldsBase, issuetype: { name: "Bug" } },
      }),
    });
  } catch {
    issue = await jira("/issue", {
      method: "POST",
      body: JSON.stringify({
        fields: { ...fieldsBase, issuetype: { name: "Task" } },
      }),
    });
  }
}

console.log(`Created ${issue.key}: ${summary}`);
