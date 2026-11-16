import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { requireAuth, type AppVariables } from "../middleware/auth.js";
import { googleOAuthConfigured } from "../services/connections.js";
import {
  buildOsGoogleAuthUrl,
  connectOsDemo,
  exchangeOsGoogleCode,
  listOsConnectors,
  osSyncSummary,
  syncAllOs,
  syncOsCalendar,
  syncOsGmail,
  upsertOsOAuthTokens,
  type OsProvider,
} from "../services/osConnectors.js";
import {
  OsCloseError,
  approveExecuteVerify,
  approveProposal,
  executeProposal,
  latestProposalForLoop,
  listAudit,
  proposeForLoop,
  updateProposalBody,
  verifyProposal,
} from "../services/osClose.js";
import {
  createClipLoop,
  dismissLoop,
  extractLoopsFromSync,
  listOpenLoops,
  nudgeState,
  recordAmbient,
  serializeLoop,
  snoozeLoop,
} from "../services/osLoops.js";
import { dogfoodMetrics, normalizeQuietReason } from "../services/osMetrics.js";
import { presencePolicy } from "../services/osPresence.js";
import { ensureDevFixtures } from "../services/osDevFixtures.js";
import { captureAndFuseLoop, ingestCaptureEvents } from "../services/osContextFuse.js";
import { getLoopContextPack } from "../services/osLoopContext.js";
import { seedP01MailTest } from "../services/osProof.js";
import { VoiceLoopError, createVoiceLoop } from "../services/osVoice.js";
import {
  osGoogleOAuthErrorHtml,
  osGoogleOAuthSuccessHtml,
} from "../lib/osOAuthPages.js";

export const osRoutes = new Hono<{ Variables: AppVariables }>();

osRoutes.get("/oauth/google/callback", async (c) => {
  const code = c.req.query("code");
  const stateRaw = c.req.query("state");
  const err = c.req.query("error");
  if (err) {
    return c.html(osGoogleOAuthErrorHtml(err), 400);
  }
  if (!code || !stateRaw) return c.text("Missing code/state", 400);

  let state: { kind: string; userId: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString()) as {
      kind: string;
      userId: string;
    };
  } catch {
    return c.text("Invalid state", 400);
  }
  if (state.kind !== "os" || !state.userId) return c.text("Invalid OS state", 400);

  const tokens = await exchangeOsGoogleCode(code);
  await upsertOsOAuthTokens(state.userId, tokens);

  try {
    await syncOsGmail(state.userId);
    await syncOsCalendar(state.userId);
  } catch (e) {
    console.error("OS post-OAuth sync failed", e);
  }

  return c.html(osGoogleOAuthSuccessHtml());
});

osRoutes.use("/*", requireAuth);

osRoutes.get("/connectors", async (c) => {
  const user = c.get("user");
  const connectors = await listOsConnectors(user.sub);
  const summary = await osSyncSummary(user.sub);
  return c.json({
    connectors,
    oauth: {
      googleConfigured: googleOAuthConfigured(),
      redirectUri: process.env.GOOGLE_OS_REDIRECT_URI
        ?? "http://localhost:3001/os/oauth/google/callback",
    },
    summary,
  });
});

osRoutes.get("/oauth/google/start", async (c) => {
  const user = c.get("user");
  if (!googleOAuthConfigured()) {
    return c.json({
      mode: "demo",
      message:
        "Google OAuth not configured. Use POST /os/connectors/demo, or set GOOGLE_CLIENT_ID / SECRET in apps/api/.env",
      authUrl: null,
    });
  }
  const state = Buffer.from(
    JSON.stringify({ kind: "os", userId: user.sub }),
  ).toString("base64url");
  return c.json({
    mode: "oauth",
    authUrl: buildOsGoogleAuthUrl(state),
  });
});

osRoutes.post("/connectors/demo", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { provider?: OsProvider };
  await connectOsDemo(user.sub, body.provider);
  const sync = await syncAllOs(user.sub);
  const extracted = await extractLoopsFromSync(user.sub);
  const connectors = await listOsConnectors(user.sub);
  const summary = await osSyncSummary(user.sub);
  const loops = await listOpenLoops(user.sub);
  return c.json({ mode: "demo", sync, extracted, connectors, summary, loops });
});

osRoutes.post("/dev/fixtures", async (c) => {
  const user = c.get("user");
  const result = await ensureDevFixtures(user.sub);
  if (!result.ok) return c.json({ error: "Dev fixtures are off" }, 404);
  const loops = await listOpenLoops(user.sub, 20);
  return c.json({ ...result, count: loops.length });
});

osRoutes.post("/proof/p0-mail-seed", async (c) => {
  const user = c.get("user");
  try {
    return c.json(await seedP01MailTest(user.sub));
  } catch (err) {
    return closeErr(c, err);
  }
});

osRoutes.post("/connectors/sync", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as {
    provider?: OsProvider | "all";
  };
  const provider = body.provider ?? "all";
  let sync;
  if (provider === "gmail") sync = [await syncOsGmail(user.sub)];
  else if (provider === "google_calendar") sync = [await syncOsCalendar(user.sub)];
  else sync = await syncAllOs(user.sub);

  const connectors = await listOsConnectors(user.sub);
  const summary = await osSyncSummary(user.sub);
  return c.json({ sync, connectors, summary });
});

osRoutes.get("/sync/summary", async (c) => {
  const user = c.get("user");
  return c.json(await osSyncSummary(user.sub));
});

osRoutes.post("/loops/extract", async (c) => {
  const user = c.get("user");
  const result = await extractLoopsFromSync(user.sub);
  const loops = await listOpenLoops(user.sub);
  const nudge = await nudgeState(user.sub);
  return c.json({ ...result, loops, nudge });
});

osRoutes.get("/loops", async (c) => {
  const user = c.get("user");
  const limit = Number(c.req.query("limit") ?? 3);
  const loops = await listOpenLoops(user.sub, Number.isFinite(limit) ? limit : 3);
  const withProposals = await Promise.all(
    loops.map(async (loop) => ({
      ...loop,
      proposal: await latestProposalForLoop(user.sub, loop.id),
    })),
  );
  const nudge = await nudgeState(user.sub);
  return c.json({ loops: withProposals, nudge });
});

/** RP-01 evidence pack — fused session events for the float drawer (not a separate Context tab). */
osRoutes.get("/loops/:id/context", async (c) => {
  const user = c.get("user");
  const pack = await getLoopContextPack(user.sub, c.req.param("id"));
  if (!pack) return c.json({ error: "loop not found" }, 404);
  return c.json(pack);
});

osRoutes.get("/audit", async (c) => {
  const user = c.get("user");
  const limit = Number(c.req.query("limit") ?? 30);
  return c.json({
    events: await listAudit(user.sub, Number.isFinite(limit) ? limit : 30),
  });
});

function closeErr(c: { json: (body: unknown, status?: number) => Response }, err: unknown) {
  if (err instanceof OsCloseError) {
    return c.json({ error: err.message }, err.status);
  }
  throw err;
}

osRoutes.post("/loops/:id/propose", async (c) => {
  const user = c.get("user");
  try {
    const result = await proposeForLoop(user.sub, c.req.param("id"));
    return c.json({ ...result, nudge: await nudgeState(user.sub) });
  } catch (err) {
    return closeErr(c, err);
  }
});

osRoutes.patch("/proposals/:id", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { body?: string; title?: string };
  if (!body.body?.trim()) return c.json({ error: "body required" }, 400);
  try {
    const proposal = await updateProposalBody(
      user.sub,
      c.req.param("id"),
      body.body,
      body.title,
    );
    return c.json({ proposal });
  } catch (err) {
    return closeErr(c, err);
  }
});

osRoutes.post("/proposals/:id/approve", async (c) => {
  const user = c.get("user");
  try {
    const result = await approveProposal(user.sub, c.req.param("id"));
    return c.json({ ...result, nudge: await nudgeState(user.sub) });
  } catch (err) {
    return closeErr(c, err);
  }
});

osRoutes.post("/proposals/:id/execute", async (c) => {
  const user = c.get("user");
  try {
    const result = await executeProposal(user.sub, c.req.param("id"));
    return c.json({ ...result, nudge: await nudgeState(user.sub) });
  } catch (err) {
    return closeErr(c, err);
  }
});

osRoutes.post("/proposals/:id/verify", async (c) => {
  const user = c.get("user");
  try {
    const result = await verifyProposal(user.sub, c.req.param("id"));
    return c.json({ ...result, nudge: await nudgeState(user.sub) });
  } catch (err) {
    return closeErr(c, err);
  }
});

/** One-shot close: approve → execute → verify (approve still required before execute). */
osRoutes.post("/proposals/:id/approve-send", async (c) => {
  const user = c.get("user");
  try {
    const result = await approveExecuteVerify(user.sub, c.req.param("id"));
    return c.json({ ...result, nudge: await nudgeState(user.sub) });
  } catch (err) {
    return closeErr(c, err);
  }
});

osRoutes.get("/loops/nudge", async (c) => {
  const user = c.get("user");
  return c.json(await nudgeState(user.sub));
});

/** Live sheet: push when the hero loop changes (client refetches; no polling required). */
osRoutes.get("/nudge/stream", async (c) => {
  const user = c.get("user");
  return streamSSE(c, async (stream) => {
    let lastSig = "";
    const maxTicks = 600;
    for (let i = 0; i < maxTicks; i++) {
      const loops = await listOpenLoops(user.sub, 5);
      const live = loops.find((l) => l.source !== "dev_fixture") ?? loops[0];
      const sig = live ? `${live.id}:${live.updatedAt}` : "empty";
      if (sig !== lastSig) {
        await stream.writeSSE({
          event: "context",
          data: JSON.stringify({
            sig,
            loopId: live?.id ?? null,
            title: live?.title ?? null,
            refresh: true,
          }),
        });
        lastSig = sig;
      } else if (i % 20 === 0) {
        await stream.writeSSE({ event: "ping", data: "{}" });
      }
      await stream.sleep(2000);
    }
  });
});

osRoutes.post("/loops/:id/snooze", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { hours?: number };
  const updated = await snoozeLoop(user.sub, c.req.param("id"), body.hours ?? 4);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ loop: serializeLoop(updated), nudge: await nudgeState(user.sub) });
});

osRoutes.post("/loops/:id/dismiss", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  const reason = normalizeQuietReason(body.reason);
  const updated = await dismissLoop(user.sub, c.req.param("id"), reason);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({
    loop: serializeLoop(updated),
    reason,
    nudge: await nudgeState(user.sub),
  });
});

osRoutes.get("/metrics", async (c) => {
  const user = c.get("user");
  const daysRaw = Number(c.req.query("days") ?? "14");
  const days = Number.isFinite(daysRaw) ? Math.min(90, Math.max(1, daysRaw)) : 14;
  return c.json(await dogfoodMetrics(user.sub, days));
});

osRoutes.post("/capture/events", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as {
    events?: Array<{
      kind?: string;
      app?: string | null;
      title?: string | null;
      text?: string | null;
      recordedAt?: string;
    }>;
    idleSeconds?: number;
  };
  const events = (body.events ?? []).map((e) => ({
    kind: (e.kind === "clipboard" || e.kind === "window_focus" ? e.kind : "window_read") as
      | "window_read"
      | "clipboard"
      | "window_focus",
    app: e.app,
    title: e.title,
    text: e.text,
    recordedAt: e.recordedAt,
  }));
  const result = await ingestCaptureEvents(user.sub, events, body.idleSeconds);
  return c.json({ ...result, nudge: await nudgeState(user.sub) });
});

osRoutes.post("/loops/episodic", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as {
    app?: string;
    title?: string | null;
    text?: string | null;
    idleSeconds?: number;
  };
  const result = await captureAndFuseLoop(user.sub, body);
  if (!result.surfaced) {
    return c.json({ surfaced: false, reason: result.reason, nudge: await nudgeState(user.sub) });
  }
  return c.json({
    surfaced: true,
    fresh: result.fresh,
    loop: result.loop,
    nudge: await nudgeState(user.sub),
  });
});

osRoutes.post("/loops/clip", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as {
    title?: string;
    summary?: string;
    app?: string;
    url?: string;
  };
  const result = await createClipLoop(user.sub, body);
  if (result.refused) {
    return c.json({
      refused: true,
      reason: result.reason,
      hint: result.hint,
      nudge: await nudgeState(user.sub),
    });
  }
  return c.json({
    refused: false,
    loop: result.loop,
    nudge: await nudgeState(user.sub),
  });
});

/** Hold-fn voice → high loop + draft proposal (approve still required). */
osRoutes.post("/loops/voice", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { text?: string; app?: string };
  try {
    const loop = await createVoiceLoop(user.sub, body);
    const drafted = await proposeForLoop(user.sub, loop.id);
    return c.json({ ...drafted, nudge: await nudgeState(user.sub) });
  } catch (err) {
    if (err instanceof VoiceLoopError) return c.json({ error: err.message }, 400);
    return closeErr(c, err);
  }
});

osRoutes.post("/ambient", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json()) as {
    events?: Array<{ app: string; title?: string | null; url?: string | null; recordedAt?: string }>;
    idleSeconds?: number;
  };
  const idleSeconds = body.idleSeconds ?? 0;
  const policy = presencePolicy(idleSeconds);
  if (!policy.recordEyeLedger) {
    return c.json({
      inserted: 0,
      eyesOff: true,
      earsOn: policy.earsOn,
      retainFrames: policy.retainFrames,
      reason: "idle — eyes off, obligation ears still on",
    });
  }
  const result = await recordAmbient(user.sub, body.events ?? []);
  return c.json({
    ...result,
    eyesOff: false,
    earsOn: policy.earsOn,
    retainFrames: policy.retainFrames,
  });
});
