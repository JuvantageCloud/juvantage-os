import type {
  AuthResponse,
  Loop,
  LoopWithProposal,
  OsConnector,
  OsHealth,
  OsNudge,
  OsSyncSummary,
  PresenceHint,
  Proposal,
} from "@juvantage/shared";

/** Local dogfood default. For aws-dev/prod set VITE_API_BASE_URL to the os-brain URL. */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3001";

const TOKEN_KEY = "juvantage_os_token";

export function apiBaseUrl() {
  return API_BASE;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function reportIncident(payload: {
  source: string;
  method?: string;
  path?: string;
  statusCode?: number;
  message: string;
  context?: Record<string, unknown>;
}) {
  try {
    const headers = new Headers({ "Content-Type": "application/json" });
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    await fetch(`${API_BASE}/os/incidents/report`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    /* never block UX on telemetry */
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Turn browser "Failed to fetch" into something actionable in the desktop UI. */
export function formatApiError(err: unknown, action?: string): string {
  const label = action ? `${action}: ` : "";
  if (!(err instanceof Error)) return `${label}Request failed`;
  let msg = err.message.trim();
  if (msg.startsWith("{") && msg.includes('"error"')) {
    try {
      const parsed = JSON.parse(msg) as { error?: string };
      if (parsed.error) msg = parsed.error;
    } catch {
      /* keep raw */
    }
  }
  const network =
    err instanceof TypeError ||
    msg === "Failed to fetch" ||
    /network|load failed|fetch/i.test(msg);
  if (network) {
    return `${label}Could not reach Brain at ${API_BASE}. Keep npm run dev:os running, then Sync or Refresh.`;
  }
  return msg ? `${label}${msg}` : `${label}Request failed`;
}

async function apiFetchOnce(path: string, init: RequestInit, headers: Headers) {
  const method = (init.method ?? "GET").toUpperCase();
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (!res.ok) {
      const text = await res.text();
      if (res.status >= 500 || path.startsWith("/os/")) {
        void reportIncident({
          source: "desktop",
          method,
          path,
          statusCode: res.status,
          message: text || `Request failed (${res.status})`,
        });
      }
      throw new Error(text || `Request failed (${res.status})`);
    }
    return res;
  } catch (err) {
    if (err instanceof TypeError) {
      void reportIncident({
        source: "desktop",
        method,
        path,
        statusCode: 0,
        message: err.message || "Network failure reaching Brain",
        context: { apiBase: API_BASE },
      });
    }
    throw err;
  }
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const attempts = 3;
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await apiFetchOnce(path, init, headers);
    } catch (err) {
      last = err;
      const retryable =
        err instanceof TypeError ||
        (err instanceof Error && err.message === "Failed to fetch");
      if (!retryable || i === attempts - 1) throw err;
      await sleep(280 * (i + 1));
    }
  }
  throw last;
}

export async function fetchApiHealth(): Promise<OsHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`API health failed (${res.status})`);
  return (await res.json()) as OsHealth;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as AuthResponse;
  setToken(data.token);
  return data;
}

export async function fetchOsConnectors(): Promise<{
  connectors: OsConnector[];
  oauth: { googleConfigured: boolean; redirectUri: string };
  summary: OsSyncSummary;
}> {
  const res = await apiFetch("/os/connectors");
  return res.json();
}

export async function startOsGoogleOAuth(): Promise<{
  mode: string;
  authUrl: string | null;
  message?: string;
}> {
  const res = await apiFetch("/os/oauth/google/start");
  return res.json();
}

export async function connectOsDemo(): Promise<{
  mode: string;
  connectors: OsConnector[];
  summary: OsSyncSummary;
  loops?: Loop[];
}> {
  const res = await apiFetch("/os/connectors/demo", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return res.json();
}

export async function seedP01MailTest(): Promise<{
  ok: boolean;
  to: string;
  subject: string;
  messageId: string;
  threadId: string;
  extractedCount: number;
  steps: string[];
}> {
  const res = await apiFetch("/os/proof/p0-mail-seed", { method: "POST", body: "{}" });
  return res.json();
}

export async function syncOsConnectors(): Promise<{
  sync: unknown;
  connectors: OsConnector[];
  summary: OsSyncSummary;
}> {
  const res = await apiFetch("/os/connectors/sync", {
    method: "POST",
    body: JSON.stringify({ provider: "all" }),
  });
  return res.json();
}

export async function extractOsLoops(): Promise<{
  createdCount: number;
  loops: Loop[];
  nudge: OsNudge;
}> {
  const res = await apiFetch("/os/loops/extract", { method: "POST", body: "{}" });
  return res.json();
}

let devFixturesOnce: Promise<void> | null = null;

/** Local Vite dev only. Production builds skip this. The API also refuses when NODE_ENV=production. */
export function ensureDevFixtures(): Promise<void> {
  if (!import.meta.env.DEV || !getToken()) return Promise.resolve();
  if (!devFixturesOnce) {
    devFixturesOnce = apiFetch("/os/dev/fixtures", { method: "POST", body: "{}" })
      .then(() => undefined)
      .catch(() => {
        devFixturesOnce = null;
      });
  }
  return devFixturesOnce;
}

export async function fetchOsLoops(
  limit = 3,
  presence?: PresenceHint | null,
): Promise<{
  loops: LoopWithProposal[];
  nudge: OsNudge;
}> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (presence?.app) q.set("app", presence.app);
  if (presence?.title) q.set("title", presence.title);
  const res = await apiFetch(`/os/loops?${q.toString()}`);
  return res.json();
}

/** Assignment 1 / OS_CONTEXT_FUSE — ledger behind the hero loop. */
export type LoopContextPack = {
  loopId: string;
  source: string | null;
  objectType: string | null;
  fingerprint: string | null;
  sensitivityTags: string[];
  sessionId: string | null;
  eventCount: number;
  events: Array<{
    kind: string;
    app: string | null;
    title: string | null;
    textPreview: string | null;
    recordedAt: string;
  }>;
  evidence: Record<string, unknown>;
};

export async function fetchLoopContext(loopId: string): Promise<LoopContextPack> {
  const res = await apiFetch(`/os/loops/${loopId}/context`);
  if (!res.ok) throw new Error(`context ${res.status}`);
  return res.json();
}

/** SSE from Brain when the hero loop changes — keeps the sheet alive without constant polling. */
export function subscribeOsContextStream(onContextChange: () => void): () => void {
  const token = getToken();
  if (!token) return () => undefined;
  const ac = new AbortController();
  void (async () => {
    try {
      const res = await fetch(`${API_BASE}/os/nudge/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        signal: ac.signal,
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const blocks = buf.split("\n\n");
        buf = blocks.pop() ?? "";
        for (const block of blocks) {
          if (!block.includes("event: context")) continue;
          const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          try {
            const payload = JSON.parse(dataLine.slice(5).trim()) as { refresh?: boolean };
            if (payload.refresh) onContextChange();
          } catch {
            /* partial */
          }
        }
      }
    } catch {
      /* offline — polling fallback still runs */
    }
  })();
  return () => ac.abort();
}

export async function proposeOsLoop(loopId: string): Promise<{
  loop: Loop;
  proposal: Proposal;
  nudge: OsNudge;
}> {
  const res = await apiFetch(`/os/loops/${loopId}/propose`, {
    method: "POST",
    body: "{}",
  });
  return res.json();
}

export async function editOsProposal(
  proposalId: string,
  body: string,
  title?: string,
): Promise<{ proposal: Proposal }> {
  const res = await apiFetch(`/os/proposals/${proposalId}`, {
    method: "PATCH",
    body: JSON.stringify({ body, ...(title !== undefined ? { title } : {}) }),
  });
  return res.json();
}

export async function approveSendOsProposal(proposalId: string): Promise<{
  loop: Loop;
  proposal: Proposal;
  result: unknown;
  verified: boolean;
  nudge: OsNudge;
}> {
  const res = await apiFetch(`/os/proposals/${proposalId}/approve-send`, {
    method: "POST",
    body: "{}",
  });
  return res.json();
}

export async function fetchOsNudge(): Promise<OsNudge> {
  const res = await apiFetch("/os/loops/nudge");
  return res.json();
}

export type QuietReason =
  | "wrong_band"
  | "wrong_object"
  | "not_actionable"
  | "already_done"
  | "other";

export type OsDogfoodMetrics = {
  windowDays: number;
  since: string;
  loops: { done: number; dismissed: number; open: number; touched: number };
  clearRate: number | null;
  acceptRate: number | null;
  editRate: number | null;
  actions: {
    propose: number;
    edit: number;
    approve: number;
    execute: number;
    verify: number;
    dismiss: number;
    snooze: number;
  };
  quietReasons: Partial<Record<QuietReason, number>> & {
    wrong_band: number;
    not_actionable: number;
    already_done: number;
    other: number;
  };
};

export async function dismissOsLoop(
  id: string,
  reason: QuietReason = "other",
): Promise<void> {
  await apiFetch(`/os/loops/${id}/dismiss`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchOsMetrics(days = 14): Promise<OsDogfoodMetrics> {
  const res = await apiFetch(`/os/metrics?days=${days}`);
  return res.json();
}

export async function surfaceEpisodic(input: {
  app?: string;
  title?: string | null;
  text?: string | null;
}): Promise<{ surfaced: boolean; reason?: string; loop?: LoopWithProposal }> {
  const res = await apiFetch("/os/loops/episodic", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function clipOsLoop(input: {
  title?: string;
  summary?: string;
  app?: string;
  url?: string;
}): Promise<
  | { refused: false; loop: Loop; nudge: OsNudge }
  | { refused: true; reason: string; hint: { app: string | null; at: string }; nudge: OsNudge }
> {
  const res = await apiFetch("/os/loops/clip", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.json();
}

export type VoiceOsResponse =
  | { mode: "quick_answer"; answer: string; nudge: OsNudge }
  | { mode: "loop"; loop: Loop; proposal: Proposal; nudge: OsNudge };

export async function voiceOsLoop(input: {
  text: string;
  app?: string | null;
}): Promise<VoiceOsResponse> {
  const res = await apiFetch("/os/loops/voice", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function snoozeOsLoop(id: string, hours = 4): Promise<void> {
  await apiFetch(`/os/loops/${id}/snooze`, {
    method: "POST",
    body: JSON.stringify({ hours }),
  });
}

export async function postAmbient(input: {
  events: Array<{ app: string; title?: string | null; url?: string | null }>;
  idleSeconds: number;
}): Promise<void> {
  await apiFetch("/os/ambient", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
