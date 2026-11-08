#!/usr/bin/env node
/**
 * Seeds Jira with department components + evidence-backed backlog.
 * Dry run by default; `--apply` writes. Re-runnable: issues are matched by `ref` label.
 *
 * Env: JIRA_BASE_URL (https://<site>.atlassian.net), JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY
 */
import { readFile } from "node:fs/promises";

const apply = process.argv.includes("--apply");
const backlog = JSON.parse(
  await readFile(new URL("./backlog.json", import.meta.url), "utf8"),
);

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY } = process.env;

function refLabel(ref) {
  return ref.toLowerCase();
}

function adf(issue) {
  const para = (text) => ({ type: "paragraph", content: [{ type: "text", text }] });
  const heading = (text) => ({
    type: "heading",
    attrs: { level: 3 },
    content: [{ type: "text", text }],
  });
  return {
    type: "doc",
    version: 1,
    content: [
      heading("Evidence"),
      para(issue.evidence),
      heading("Fix"),
      para(issue.fix),
      heading("Acceptance criteria"),
      {
        type: "bulletList",
        content: issue.acceptance.map((a) => ({ type: "listItem", content: [para(a)] })),
      },
      para(`Waterfall stage: ${issue.stage} · Ref: ${issue.ref}`),
    ],
  };
}

if (!apply) {
  console.log(`DRY RUN — ${backlog.components.length} components, ${backlog.issues.length} issues\n`);
  for (const c of backlog.components) console.log(`  [component] ${c.name}`);
  console.log("");
  for (const i of backlog.issues) {
    console.log(`  ${i.ref}  ${i.type.padEnd(5)} ${i.priority.padEnd(7)} [${i.component}] ${i.summary}`);
  }
  console.log("\nRe-run with --apply (and JIRA_* env set) to create.");
  process.exit(0);
}

for (const [k, v] of Object.entries({ JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY })) {
  if (!v) {
    console.error(`Missing ${k}`);
    process.exit(1);
  }
}

const base = JIRA_BASE_URL.replace(/\/$/, "");
const auth = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

async function jira(path, init = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

const project = await jira(`/rest/api/3/project/${JIRA_PROJECT_KEY}`);
const existingComponents = new Set((project.components ?? []).map((c) => c.name));
for (const c of backlog.components) {
  if (existingComponents.has(c.name)) continue;
  await jira("/rest/api/3/component", {
    method: "POST",
    body: JSON.stringify({ name: c.name, description: c.description, project: JIRA_PROJECT_KEY }),
  });
  console.log(`+ component ${c.name}`);
}

const issueTypes = new Set((project.issueTypes ?? []).map((t) => t.name));

for (const issue of backlog.issues) {
  const label = refLabel(issue.ref);
  const found = await jira("/rest/api/3/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql: `project = ${JIRA_PROJECT_KEY} AND labels = "${label}"`,
      fields: ["key"],
      maxResults: 1,
    }),
  });
  if (found.issues?.length) {
    console.log(`= ${found.issues[0].key} already exists (${issue.ref})`);
    continue;
  }
  const type = issueTypes.has(issue.type) ? issue.type : "Task";
  const fields = {
    project: { key: JIRA_PROJECT_KEY },
    summary: issue.summary,
    issuetype: { name: type },
    labels: [label, `stage-${issue.stage}`],
    components: [{ name: issue.component }],
    description: adf(issue),
    priority: { name: issue.priority },
  };
  let created;
  try {
    created = await jira("/rest/api/3/issue", { method: "POST", body: JSON.stringify({ fields }) });
  } catch (err) {
    if (err.status !== 400 || !JSON.stringify(err.body ?? "").includes("priority")) throw err;
    delete fields.priority;
    created = await jira("/rest/api/3/issue", { method: "POST", body: JSON.stringify({ fields }) });
  }
  console.log(`+ ${created.key}  ${issue.summary}`);
}
