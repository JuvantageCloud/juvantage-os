/**
 * HTTP harness — demo mail close loop through real Hono routes (Integration Test Engineer).
 * Run: `npm run test:integration -w @juvantage/api` (isolated DB `harness.db`).
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickSheetHero } from "@juvantage/shared";

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
    const dbBase = path.join(apiRoot, "harness.db");
    for (const f of [`${dbBase}`, `${dbBase}-journal`, `${dbBase}-wal`, `${dbBase}-shm`]) {
      try {
        fs.unlinkSync(f);
      } catch {
        /* fresh harness */
      }
    }
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

    const hero = pickSheetHero(loops);
    assert.equal(hero?.id, mailLoop.id, "sheet hero should be obligation mail when linked");

    const ctx = await json<{
      loopId: string;
      events: Array<{ kind: string }>;
      sessionId: string | null;
    }>(await app.request(`/os/loops/${mailLoop.id}/context`, { headers: auth }));
    assert.equal(ctx.loopId, mailLoop.id);

    const proposeRes = await app.request(`/os/loops/${mailLoop.id}/propose`, {
      method: "POST",
      headers: auth,
      body: "{}",
    });
    const { proposal } = await json<{ proposal: { id: string; body: string } }>(proposeRes);
    assert.match(proposal.body, /Proposed next steps:/i);

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

  it("demo calendar appointment → propose → approve-send → loop done", async () => {
    const { token } = await json<{ token: string }>(
      await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "john@juvantage.com", password: "demo1234" }),
      }),
    );
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

    const { loops } = await json<{
      loops: Array<{ id: string; source: string | null; kind?: string; status: string }>;
    }>(await app.request("/os/loops?limit=20", { headers: auth }));

    const appt =
      loops.find((l) => l.source === "google_calendar") ??
      loops.find((l) => l.kind === "appointment");
    assert.ok(appt, "expected a calendar/appointment loop after demo extract");

    const { proposal } = await json<{ proposal: { id: string; kind: string } }>(
      await app.request(`/os/loops/${appt.id}/propose`, {
        method: "POST",
        headers: auth,
        body: "{}",
      }),
    );
    assert.equal(proposal.kind, "event");

    const closed = await json<{
      verified: boolean;
      loop: { status: string };
      result: { mode?: string; created?: boolean; channel?: string };
    }>(
      await app.request(`/os/proposals/${proposal.id}/approve-send`, {
        method: "POST",
        headers: auth,
        body: "{}",
      }),
    );

    assert.equal(closed.verified, true);
    assert.equal(closed.loop.status, "done");
    assert.equal(closed.result?.channel, "google_calendar");
    assert.equal(closed.result?.mode, "demo");
    assert.equal(closed.result?.created, true);
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

  it("capture/events fuses window + clipboard into episodic draft", async () => {
    const { token } = await json<{ token: string }>(
      await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "john@juvantage.com", password: "demo1234" }),
      }),
    );
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const cap = await json<{
      surfaced: boolean;
      inserted: number;
      sessionId?: string;
      loop?: { id: string; source: string };
    }>(
      await app.request("/os/capture/events", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          events: [
            { kind: "window_focus", app: "Xcode", title: "VoiceController.swift" },
            {
              kind: "clipboard",
              app: "Xcode",
              title: "VoiceController.swift",
              text: "let input = engine.inputNode",
            },
          ],
        }),
      }),
    );
    assert.equal(cap.surfaced, true);
    assert.equal(cap.inserted, 2);
    assert.equal(cap.loop?.source, "episodic");

    const { loops } = await json<{
      loops: Array<{ id: string; source: string; proposal?: { body: string } | null }>;
    }>(await app.request("/os/loops?limit=10", { headers: auth }));
    const live = loops.find((l) => l.source === "episodic");
    assert.ok(live?.proposal);
    assert.match(live!.proposal!.body, /fused 2 signals/i);
    assert.match(live!.proposal!.body, /Proposed next steps:/i);
    assert.match(live!.proposal!.body, /1\)/);
    assert.match(live!.proposal!.body, /let input = engine.inputNode/);

    const ranked = await json<{
      loops: Array<{ id: string; source: string }>;
    }>(
      await app.request(
        "/os/loops?limit=10&app=Xcode&title=VoiceController.swift",
        { headers: auth },
      ),
    );
    assert.equal(ranked.loops[0]?.source, "episodic");

    const loopId = cap.loop?.id ?? live!.id ?? loops.find((l) => l.source === "episodic")?.id;
    assert.ok(loopId, "expected loop id for context pack");
    const pack = await json<{
      sessionId: string | null;
      eventCount: number;
      events: Array<{ textPreview: string | null }>;
      sensitivityTags: string[];
    }>(await app.request(`/os/loops/${loopId}/context`, { headers: auth }));
    assert.equal(pack.sessionId, cap.sessionId);
    assert.ok(pack.eventCount >= 2);
    assert.ok(pack.events.some((e) => e.textPreview?.includes("engine.inputNode")));
  });

  it("merge v0 folds actionable gmail into episodic fuse", async () => {
    const { token } = await json<{ token: string }>(
      await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "john@juvantage.com", password: "demo1234" }),
      }),
    );
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    await json(
      await app.request("/os/connectors/demo", {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    await json(await app.request("/os/loops/extract", { method: "POST", headers: auth, body: "{}" }));

    const before = await json<{
      loops: Array<{ id: string; source: string; title: string; status: string }>;
    }>(await app.request("/os/loops?limit=20", { headers: auth }));
    const mailLoop = before.loops.find(
      (l) => l.source === "gmail" && ["open", "proposed"].includes(l.status),
    );
    assert.ok(mailLoop, "expected an open gmail loop before fuse");

    await json(
      await app.request("/os/capture/events", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          events: [
            { kind: "window_focus", app: "Mail", title: mailLoop!.title },
            {
              kind: "clipboard",
              app: "Mail",
              title: mailLoop!.title,
              text: `Need your reply on ${mailLoop!.title} before I merge this context`,
            },
          ],
        }),
      }),
    );

    const after = await json<{
      loops: Array<{
        id: string;
        source: string;
        status: string;
        evidence?: { childSources?: Array<{ source: string; ref: string }> };
      }>;
    }>(await app.request("/os/loops?limit=20", { headers: auth }));

    const episodic = after.loops.find((l) => l.source === "episodic");
    assert.ok(episodic?.evidence?.childSources?.length, "episodic should list merged childSources");

    assert.ok(
      !after.loops.some((l) => l.id === mailLoop!.id),
      "merged gmail loop should drop off the open list",
    );

    const pack = await json<{
      evidence: { childSources?: Array<{ source: string; title?: string }> };
    }>(await app.request(`/os/loops/${episodic!.id}/context`, { headers: auth }));
    assert.ok(pack.evidence.childSources?.length, "context pack should list merged ears");
  });
});
