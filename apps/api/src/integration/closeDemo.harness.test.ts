/**
 * HTTP harness — demo mail close loop through real Hono routes (Integration Test Engineer).
 * Run: `npm run test:integration -w @juvantage/api` (isolated DB `harness.db`).
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./harness.db";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "ci-jwt-secret-not-for-production";
process.env.TOKEN_ENCRYPTION_KEY =
  process.env.TOKEN_ENCRYPTION_KEY ?? "ci-token-encryption-key";
process.env.DEMO_MODE = process.env.DEMO_MODE ?? "true";
process.env.PORT = process.env.PORT ?? "3001";

const { createApp } = await import("../app.js");
const app = createApp();

async function json<T>(res: Response): Promise<T> {
  const body = await res.text();
  assert.ok(res.ok, `HTTP ${res.status}: ${body}`);
  return JSON.parse(body) as T;
}

describe("HTTP harness — demo approve-send close loop", () => {
  before(() => {
    const env = { ...process.env };
    execSync("npx prisma db push --skip-generate", {
      cwd: apiRoot,
      env,
      stdio: "pipe",
    });
    execSync("npx tsx prisma/seed.ts", { cwd: apiRoot, env, stdio: "pipe" });
  });

  it("demo connect → extract → propose → approve-send → loop done", async () => {
    const loginRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "john@juvantage.com",
        password: "demo1234",
      }),
    });
    const { token } = await json<{ token: string }>(loginRes);
    const auth = { Authorization: `Bearer ${token}` };

    await json(
      await app.request("/os/connectors/demo", {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: "{}",
      }),
    );

    await json(
      await app.request("/os/loops/extract", {
        method: "POST",
        headers: auth,
        body: "{}",
      }),
    );

    const loopsRes = await app.request("/os/loops?limit=20", { headers: auth });
    const { loops } = await json<{
      loops: Array<{
        id: string;
        source: string | null;
        objectType?: string;
        status: string;
      }>;
    }>(loopsRes);

    const mailLoop =
      loops.find((l) => l.source === "gmail" && l.objectType === "mail") ??
      loops.find((l) => l.source === "gmail");
    assert.ok(mailLoop, "expected at least one gmail loop after demo extract");

    const proposeRes = await app.request(`/os/loops/${mailLoop.id}/propose`, {
      method: "POST",
      headers: auth,
      body: "{}",
    });
    const { proposal } = await json<{ proposal: { id: string } }>(proposeRes);

    const closeRes = await app.request(`/os/proposals/${proposal.id}/approve-send`, {
      method: "POST",
      headers: auth,
      body: "{}",
    });
    const closed = await json<{
      verified: boolean;
      loop: { status: string };
      result: { mode?: string; simulatedSend?: boolean };
    }>(closeRes);

    assert.equal(closed.verified, true);
    assert.equal(closed.loop.status, "done");
    assert.equal(closed.result?.mode, "demo");
    assert.equal(closed.result?.simulatedSend, true);
  });

  it("hold-fn voice → high loop + draft → approve-close", async () => {
    const { token } = await json<{ token: string }>(
      await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "john@juvantage.com", password: "demo1234" }),
      }),
    );
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const drafted = await json<{
      loop: { id: string; band: string; objectType: string; status: string };
      proposal: { id: string; status: string; body: string };
    }>(
      await app.request("/os/loops/voice", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ text: "Draft an email to my investors about the Q3 update" }),
      }),
    );
    assert.equal(drafted.loop.objectType, "voice");
    assert.equal(drafted.loop.band, "high");
    assert.equal(drafted.proposal.status, "pending_approval");
    assert.match(drafted.proposal.body, /investors/);

    const empty = await app.request("/os/loops/voice", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ text: " " }),
    });
    assert.equal(empty.status, 400);

    const closed = await json<{ verified: boolean; loop: { status: string } }>(
      await app.request(`/os/proposals/${drafted.proposal.id}/approve-send`, {
        method: "POST",
        headers: auth,
        body: "{}",
      }),
    );
    assert.equal(closed.verified, true);
    assert.equal(closed.loop.status, "done");
  });
});
