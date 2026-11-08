import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LoopWithProposal,
  OsConnector,
  OsSyncSummary,
  Proposal,
} from "@juvantage/shared";
import { isClosableObjectType } from "@juvantage/shared";
import {
  apiBaseUrl,
  approveSendOsProposal,
  connectOsDemo,
  dismissOsLoop,
  editOsProposal,
  extractOsLoops,
  fetchApiHealth,
  fetchOsConnectors,
  fetchOsLoops,
  fetchOsMetrics,
  formatApiError,
  getToken,
  login,
  proposeOsLoop,
  setToken,
  seedP01MailTest,
  snoozeOsLoop,
  startOsGoogleOAuth,
  syncOsConnectors,
  type OsDogfoodMetrics,
  type QuietReason,
} from "../lib/api";
import { ConnectorTile } from "../components/ConnectorTile";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { ModalityHost } from "../components/ModalityHost";
import "../components/modality-surfaces.css";
import "./desktop.css";

type NavId = "loops" | "inbox" | "connect" | "settings";
type BandFilter = "all" | "critical" | "high" | "normal" | "quiet";
type SourceFilter = "all" | "mail" | "clip" | "calendar";

const QUIET_REASONS: { id: QuietReason; label: string }[] = [
  { id: "wrong_band", label: "Shouldn’t have surfaced" },
  { id: "wrong_object", label: "Wrong object type" },
  { id: "not_actionable", label: "Not actionable" },
  { id: "already_done", label: "Already handled" },
  { id: "other", label: "Just quiet" },
];

function pct(rate: number | null) {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

type HealthState =
  | { status: "loading" }
  | { status: "ok"; service: string; llm: boolean }
  | { status: "error"; message: string };

function loopIdFromHash(): string | null {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const q = raw.includes("?") ? raw.split("?")[1] : "";
  return new URLSearchParams(q).get("loopId");
}

function sourceFriendly(source: string | null | undefined): string {
  if (!source) return "";
  if (source === "gmail") return "Mail";
  if (source === "google_calendar") return "Calendar";
  if (source === "clip") return "Clip";
  return source;
}

function senderShortLabel(fromAddr: string | null): string {
  if (!fromAddr) return "Mail";
  const email = fromAddr.match(/[\w.+-]+@([\w.-]+)/);
  if (!email) return fromAddr.slice(0, 14) || "Mail";
  const host = email[1].split(".")[0] ?? email[1];
  return host.charAt(0).toUpperCase() + host.slice(1);
}

async function openUrl(url: string) {
  if (window.juvantageOs?.openExternal) {
    await window.juvantageOs.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function Desktop() {
  const [nav, setNav] = useState<NavId>("loops");
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [email, setEmail] = useState("john@juvantage.com");
  const [password, setPassword] = useState("demo1234");
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<OsConnector[]>([]);
  const [summary, setSummary] = useState<OsSyncSummary | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [googleRedirectUri, setGoogleRedirectUri] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "error" | "success">(
    "info",
  );

  const notify = useCallback(
    (text: string, tone: "info" | "error" | "success" = "info") => {
      setMessage(text);
      setMessageTone(tone);
    },
    [],
  );
  const [loops, setLoops] = useState<LoopWithProposal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(loopIdFromHash());
  const [band, setBand] = useState<BandFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("mail");
  /** When Source=All, clips stay collapsed until expanded (mail stays front). */
  const [clipsExpanded, setClipsExpanded] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [quietPick, setQuietPick] = useState(false);
  const [metrics, setMetrics] = useState<OsDogfoodMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApiHealth()
      .then((h) => {
        if (cancelled) return;
        setHealth({
          status: "ok",
          service: h.service,
          llm: Boolean(h.llmConfigured),
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setHealth({ status: "error", message: err.message || "API unreachable" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshConnectors = useCallback(async () => {
    if (!getToken()) return;
    const data = await fetchOsConnectors();
    setConnectors(data.connectors);
    setSummary(data.summary);
    setGoogleConfigured(data.oauth.googleConfigured);
    setGoogleRedirectUri(data.oauth.redirectUri ?? "");
  }, []);

  const refreshLoops = useCallback(async (preferId?: string | null) => {
    if (!getToken()) {
      setLoops([]);
      return;
    }
    const data = await fetchOsLoops(40);
    setLoops(data.loops);
    setSelectedId((current) => {
      const prefer = preferId ?? current ?? loopIdFromHash();
      const next =
        data.loops.find((l) => l.id === prefer) ?? data.loops[0] ?? null;
      setProposal(next?.proposal ?? null);
      setDraftTitle(next?.proposal?.title ?? "");
      setDraftBody(next?.proposal?.body ?? "");
      return next?.id ?? null;
    });
  }, []);

  useEffect(() => {
    if (!authed) return;
    refreshConnectors().catch((err: Error) =>
      notify(formatApiError(err, "Load connectors"), "error"),
    );
    refreshLoops(loopIdFromHash()).catch((err: Error) =>
      notify(formatApiError(err, "Load loops"), "error"),
    );
  }, [authed, notify, refreshConnectors, refreshLoops]);

  useEffect(() => {
    if (!authed) return;
    const onFocus = () => {
      void refreshConnectors().catch(() => undefined);
      void refreshLoops().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [authed, refreshConnectors, refreshLoops]);

  const selected = useMemo(
    () => loops.find((l) => l.id === selectedId) ?? null,
    [loops, selectedId],
  );

  const filtered = useMemo(() => {
    let list = loops;
    if (band !== "all") list = list.filter((l) => l.band === band);
    if (sourceFilter === "mail") list = list.filter((l) => l.source === "gmail");
    else if (sourceFilter === "clip") list = list.filter((l) => l.source === "clip");
    else if (sourceFilter === "calendar") {
      list = list.filter((l) => l.source === "google_calendar");
    } else if (sourceFilter === "all" && !clipsExpanded) {
      list = list.filter((l) => l.source !== "clip");
    }
    return list;
  }, [loops, band, sourceFilter, clipsExpanded]);

  const collapsedClipCount = useMemo(() => {
    if (sourceFilter !== "all" || clipsExpanded) return 0;
    let list = loops;
    if (band !== "all") list = list.filter((l) => l.band === band);
    return list.filter((l) => l.source === "clip").length;
  }, [loops, band, sourceFilter, clipsExpanded]);

  const gmailConnected = useMemo(
    () => connectors.some((c) => c.provider === "gmail" && c.status === "connected"),
    [connectors],
  );

  const gmailLive = useMemo(
    () =>
      connectors.some(
        (c) =>
          c.provider === "gmail" &&
          c.status === "connected" &&
          c.mode === "oauth" &&
          c.hasToken,
      ),
    [connectors],
  );

  function selectLoop(loop: LoopWithProposal) {
    setSelectedId(loop.id);
    setProposal(loop.proposal ?? null);
    setDraftTitle(loop.proposal?.title ?? "");
    setDraftBody(loop.proposal?.body ?? "");
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy("login");
    setMessage(null);
    try {
      const res = await login(email.trim(), password);
      setAuthed(true);
      setUserLabel(res.user.email);
      notify(`Signed in as ${res.user.name}`, "success");
      await refreshConnectors();
      await refreshLoops();
    } catch (err) {
      notify(formatApiError(err, "Sign in"), "error");
      setAuthed(false);
    } finally {
      setBusy(null);
    }
  }

  function onLogout() {
    setToken(null);
    setAuthed(false);
    setUserLabel(null);
    setConnectors([]);
    setSummary(null);
    setLoops([]);
    notify("Signed out", "info");
  }

  async function onConnectGoogle() {
    setBusy("oauth");
    try {
      const start = await startOsGoogleOAuth();
      if (start.mode === "demo" || !start.authUrl) {
        notify(start.message || "Use Demo connect — OAuth not configured.", "info");
        return;
      }
      await openUrl(start.authUrl);
      notify(
        "Finish Google in the browser — this app refreshes when you come back.",
        "info",
      );
    } catch (err) {
      notify(formatApiError(err, "Connect Google"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function onDemoConnect() {
    setBusy("demo");
    try {
      const res = await connectOsDemo();
      setConnectors(res.connectors);
      setSummary(res.summary);
      await refreshLoops();
      setNav("loops");
      notify(
        `Demo connected · ${res.summary.mailCount} threads · loops ready`,
        "success",
      );
    } catch (err) {
      notify(formatApiError(err, "Demo connect"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function onP01Seed() {
    setBusy("p01");
    try {
      const res = await seedP01MailTest();
      await refreshLoops();
      setNav("loops");
      setSourceFilter("mail");
      notify(
        `Test mail sent to ${res.to} · ${res.extractedCount} new loop(s). Open Work → Mail → ${res.subject.slice(0, 32)}…`,
        "success",
      );
    } catch (err) {
      notify(formatApiError(err, "P0.1 test mail"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function onExtract() {
    setBusy("extract");
    try {
      const res = await extractOsLoops();
      await refreshLoops();
      setNav("loops");
      notify(`Extracted ${res.createdCount} · ${res.loops.length} open`, "success");
    } catch (err) {
      notify(formatApiError(err, "Extract loops"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function onSync() {
    setBusy("sync");
    try {
      const res = await syncOsConnectors();
      setConnectors(res.connectors);
      setSummary(res.summary);
      notify(
        `Synced · ${res.summary.mailCount} mail · ${res.summary.calCount} events`,
        "success",
      );
    } catch (err) {
      notify(formatApiError(err, "Sync mail & calendar"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function onDraft() {
    if (!selected) return;
    setBusy("draft");
    try {
      const res = await proposeOsLoop(selected.id);
      setProposal(res.proposal);
      setDraftTitle(res.proposal.title);
      setDraftBody(res.proposal.body);
      await refreshLoops(selected.id);
      notify("Draft ready", "success");
    } catch (err) {
      notify(formatApiError(err, "Draft"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function onApproveSend() {
    if (!selected) return;
    setBusy("send");
    try {
      let prop = proposal;
      if (!prop) {
        const drafted = await proposeOsLoop(selected.id);
        prop = drafted.proposal;
        setProposal(prop);
        setDraftTitle(prop.title);
        setDraftBody(prop.body);
      } else if (
        prop.status === "executed" ||
        prop.status === "failed" ||
        prop.status === "cancelled"
      ) {
        const drafted = await proposeOsLoop(selected.id);
        prop = drafted.proposal;
        setProposal(prop);
        setDraftTitle(prop.title);
        setDraftBody(prop.body);
      }
      const editable =
        prop.status === "draft" || prop.status === "pending_approval";
      const bodyChanged = editable && draftBody.trim() && draftBody !== prop.body;
      const titleChanged = editable && draftTitle.trim() && draftTitle !== prop.title;
      if (bodyChanged || titleChanged) {
        prop = (await editOsProposal(prop.id, draftBody, draftTitle)).proposal;
        setProposal(prop);
      }
      const res = await approveSendOsProposal(prop.id);
      const mode =
        res.result && typeof res.result === "object" && "mode" in res.result
          ? String((res.result as { mode?: string }).mode)
          : "";
      if (mode === "demo" || (res.result as { simulatedSend?: boolean })?.simulatedSend) {
        notify(
          "Closed in demo mode — nothing was sent to Gmail. Connect Google (not Demo) for a real send.",
          "info",
        );
      } else if (mode === "gmail_live") {
        notify("Sent via Gmail — check Sent mail for the thread.", "success");
      } else if (selected.source === "clip" || selected.objectType === "clip") {
        notify(
          "Clip closed locally — this was not a Gmail send. Use Source → Mail for P0.1.",
          "info",
        );
      } else if (mode === "local" || selected.objectType !== "mail") {
        notify("Marked done locally — no email was sent.", "info");
      } else {
        notify("Approved → executed → verified", "success");
      }
      await refreshLoops();
    } catch (err) {
      notify(formatApiError(err, "Approve & send"), "error");
    } finally {
      setBusy(null);
    }
  }

  if (!authed) {
    return (
      <div className="desk-shell app-opaque">
        <div className="desk-titlebar">
          <p className="brand">Juvantage OS</p>
        </div>
        <div className="sign-gate">
          <h1>Sign in</h1>
          <p className="page-sub">Desktop opens on Loops after auth — same close engine as Solo.</p>
          <form className="auth-form" onSubmit={onLogin}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn primary" disabled={busy === "login"}>
              {busy === "login" ? "Signing in…" : "Sign in"}
            </button>
            <p className="page-sub">Seed: john@juvantage.com / demo1234</p>
          </form>
          {message ? (
            <p className={`toast toast--${messageTone}`}>{message}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="desk-shell app-opaque">
      <div className="desk-titlebar">
        <div className="titlebar-left">
          <span
            className={`brain-lamp ${health.status === "ok" ? "on" : ""}`}
            title={health.status === "ok" ? "Brain connected" : "Brain offline"}
            aria-hidden
          />
          <p className="brand">Juvantage OS · Desktop</p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => void window.juvantageOs?.undock()}
          >
            Undock
          </button>
        </div>
      </div>

      <div className="desk-body">
        <nav className="desk-nav" aria-label="Desktop">
          <button type="button" className={nav === "loops" ? "on" : ""} onClick={() => setNav("loops")}>
            <span className="nav-label">Work</span>
            <span className="nav-sub">Ranked obligations</span>
          </button>
          <button type="button" className={nav === "inbox" ? "on" : ""} onClick={() => setNav("inbox")}>
            <span className="nav-label">Inbox</span>
            <span className="nav-sub">Debug mirror</span>
          </button>
          <div className="sep" />
          <button type="button" className={nav === "connect" ? "on" : ""} onClick={() => setNav("connect")}>
            <span className="nav-label">Connect</span>
            <span className="nav-sub">Wire accounts</span>
          </button>
          <button type="button" className={nav === "settings" ? "on" : ""} onClick={() => setNav("settings")}>
            <span className="nav-label">Settings</span>
            <span className="nav-sub">Brain &amp; metrics</span>
          </button>
        </nav>

        <main className="desk-main">
          {nav === "loops" ? (
            <>
              <h1>Work</h1>
              <p className="page-sub loops-one-liner">
                Fused context → editable proposal → Approve. Nothing executes without you.
                {userLabel ? ` · ${userLabel}` : null}
              </p>
              {loops.length ? (
                <div className="status-strip" aria-live="polite">
                  <span>
                    <strong>{loops.length}</strong> open loop{loops.length === 1 ? "" : "s"}
                  </span>
                  <span className="status-strip-dot" aria-hidden />
                  <span>{summary?.mailCount ?? 0} threads synced</span>
                  <span className="status-strip-hint">Draft → Approve to send</span>
                </div>
              ) : null}
              <div className="chips">
                <span className="chip-label">Band</span>
                {(["all", "critical", "high", "normal", "quiet"] as BandFilter[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`chip ${band === b ? "on" : ""}`}
                    onClick={() => setBand(b)}
                  >
                    {b}
                  </button>
                ))}
                <span className="chip-label">Source</span>
                {(
                  [
                    ["all", "All"],
                    ["mail", "Mail"],
                    ["clip", "Clips"],
                    ["calendar", "Calendar"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`chip ${sourceFilter === id ? "on" : ""}`}
                    onClick={() => setSourceFilter(id)}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" className="btn accent" onClick={() => void onExtract()} disabled={Boolean(busy)}>
                  {busy === "extract" ? "Extracting…" : "Extract"}
                </button>
              </div>

              {!filtered.length && loops.length > 0 ? (
                <div className="empty-panel">
                  <strong>No loops match these filters.</strong> Try <strong>All</strong> under Source, or switch
                  band.
                </div>
              ) : null}
              {!loops.length ? (
                <div className="empty-panel empty-panel--guide">
                  <p>
                    <strong>Nothing in your close queue yet.</strong>
                  </p>
                  {!gmailConnected ? (
                    <p>
                      Go to <button type="button" className="inline-link" onClick={() => setNav("connect")}>
                        Connect
                      </button>{" "}
                      to sign in to Google, then run <strong>Sync</strong> and <strong>Extract loops</strong>.
                    </p>
                  ) : (
                    <p>
                      On{" "}
                      <button type="button" className="inline-link" onClick={() => setNav("connect")}>
                        Connect
                      </button>
                      , tap <strong>Sync</strong> then <strong>Extract loops</strong>. Or press{" "}
                      <strong>⌘⇧L</strong> to clip context from another app.
                    </p>
                  )}
                </div>
              ) : null}
              {loops.length > 0 && (filtered.length > 0 || collapsedClipCount > 0) ? (
                <div className="loops-layout">
                  <div className="loop-list">
                    {filtered.map((loop) => (
                      <button
                        key={loop.id}
                        type="button"
                        className={`loop-row ${selectedId === loop.id ? "selected" : ""}`}
                        onClick={() => selectLoop(loop)}
                      >
                        <span className={`band-pill ${loop.band}`}>{loop.band}</span>
                        <strong>{loop.title}</strong>
                        <span className="muted">
                          {loop.kind.replace("_", " ")}
                          {loop.source ? ` · ${sourceFriendly(loop.source)}` : ""}
                        </span>
                      </button>
                    ))}
                    {collapsedClipCount > 0 ? (
                      <button
                        type="button"
                        className="loop-row"
                        onClick={() => setClipsExpanded(true)}
                      >
                        <span className="band-pill normal">clips</span>
                        <strong>
                          {collapsedClipCount} clip{collapsedClipCount === 1 ? "" : "s"} hidden
                        </strong>
                        <span className="muted">Show clips</span>
                      </button>
                    ) : null}
                    {sourceFilter === "all" && clipsExpanded ? (
                      <button
                        type="button"
                        className="btn ghost"
                        style={{ margin: "8px 0" }}
                        onClick={() => setClipsExpanded(false)}
                      >
                        Hide clips again
                      </button>
                    ) : null}
                  </div>

                  <div className="detail-pane">
                    {selected ? (
                      <>
                        <div className="detail-top">
                          <span className={`band-pill ${selected.band}`}>{selected.band}</span>
                          {selected.objectType ? (
                            <span className="band-pill" style={{ marginLeft: 6 }}>
                              {selected.objectType}
                            </span>
                          ) : null}
                          <h2>{selected.title}</h2>
                          <p>{selected.summary || "No summary"}</p>
                        </div>
                        <EvidenceDrawer
                          loop={selected}
                          open={evidenceOpen}
                          onToggle={() => setEvidenceOpen((v) => !v)}
                        />
                        <ModalityHost
                          loop={selected}
                          proposal={proposal}
                          draftTitle={draftTitle}
                          draftBody={draftBody}
                          onTitleChange={setDraftTitle}
                          onBodyChange={setDraftBody}
                          busy={Boolean(busy)}
                        />
                        <div className="detail-actions">
                          <button type="button" className="btn accent" onClick={() => void onDraft()} disabled={Boolean(busy)}>
                            {busy === "draft" ? "Drafting…" : "Draft"}
                          </button>
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => void onApproveSend()}
                            disabled={
                              Boolean(busy) ||
                              !isClosableObjectType(selected.objectType)
                            }
                            title={
                              isClosableObjectType(selected.objectType)
                                ? "Sends only after you approve — one-time send grant"
                                : "Can’t send this type (e.g. clip) — choose Mail or Calendar loop"
                            }
                          >
                            {busy === "send"
                              ? "Sending…"
                              : selected.source === "gmail" && selected.objectType === "mail"
                                ? "Approve & send"
                                : "Approve & close"}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setQuietPick((v) => !v)}
                          >
                            Quiet
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() =>
                              selected &&
                              snoozeOsLoop(selected.id).then(() => refreshLoops())
                            }
                          >
                            Snooze
                          </button>
                        </div>
                        {quietPick && selected ? (
                          <div className="quiet-reasons" style={{ padding: "0 14px 14px" }}>
                            <p className="page-sub" style={{ marginBottom: 8 }}>
                              Why quiet this?
                            </p>
                            <div className="chips" style={{ margin: 0 }}>
                              {QUIET_REASONS.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  className="chip"
                                  onClick={() =>
                                    dismissOsLoop(selected.id, r.id).then(() => {
                                      setQuietPick(false);
                                      notify(
                                        r.id === "wrong_band"
                                          ? "Noted — shouldn’t have surfaced"
                                          : "Quieted",
                                        "success",
                                      );
                                      return refreshLoops();
                                    })
                                  }
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="empty-panel" style={{ margin: 16 }}>
                        Select a loop
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {nav === "inbox" ? (
            <>
              <h1>Inbox</h1>
              <p className="page-sub">Synced raw store — act on Loops, not here.</p>
              {!summary ? (
                <div className="empty-panel">Connect + sync first.</div>
              ) : (
                <>
                  <div className="status-strip">
                    <span>
                      <strong>{summary.mailCount}</strong> mail
                    </span>
                    <span className="status-strip-dot" aria-hidden />
                    <span>
                      <strong>{summary.calCount}</strong> events
                    </span>
                    <span className="status-strip-hint">Read-only mirror · close work lives in Loops</span>
                  </div>
                  <div className="sync-grid">
                    <section className="feed-well feed-well--mail">
                      <header className="feed-head">
                        <span>Mail</span>
                        <span className="feed-count">{summary.mailCount}</span>
                      </header>
                      <ul>
                        {summary.recentMail.map((m) => (
                          <li key={m.id} className="feed-item">
                            <div className="feed-item-top">
                              <span className="feed-tag">{senderShortLabel(m.fromAddr)}</span>
                            </div>
                            <strong className="feed-title">{m.subject || "(no subject)"}</strong>
                            <span className="feed-meta">{m.fromAddr}</span>
                            {m.snippet ? <p className="feed-snippet">{m.snippet}</p> : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section className="feed-well feed-well--cal">
                      <header className="feed-head">
                        <span>Calendar</span>
                        <span className="feed-count">{summary.calCount}</span>
                      </header>
                      <ul>
                        {summary.upcoming.map((e) => (
                          <li key={e.id} className="feed-item feed-item--event">
                            <strong className="feed-title">{e.title}</strong>
                            <time className="feed-meta">
                              {new Date(e.startsAt).toLocaleString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </time>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </>
              )}
            </>
          ) : null}

          {nav === "connect" ? (
            <>
              <h1>Connect</h1>
              <p className="page-sub">
                Sign in to Google, sync mail, then Extract — that feeds Loops.
              </p>

              <div className="connector-grid">
                {connectors.map((c) => (
                  <ConnectorTile key={c.id} connector={c} summary={summary} />
                ))}
              </div>

              {gmailConnected && !gmailLive ? (
                <div className="empty-panel" style={{ marginBottom: 12, borderColor: "#c44" }}>
                  <strong>Demo mode — not real Gmail.</strong> P0.1 and live send are off until
                  you click <strong>1 · Connect Google</strong>. Do not use{" "}
                  <strong>Demo connect</strong> for the proof.
                </div>
              ) : null}

              <section className="panel panel-actions" aria-label="Connector actions">
                <h2>Pipeline</h2>
                <p className="page-sub" style={{ marginTop: 0 }}>
                  Run in order once: connect → sync → extract → switch to Loops.
                </p>
                <div className="btn-row">
                  <button type="button" className="btn primary" onClick={onConnectGoogle} disabled={Boolean(busy)}>
                    1 · Connect Google
                  </button>
                  <button type="button" className="btn" onClick={onSync} disabled={Boolean(busy)}>
                    2 · Sync
                  </button>
                  <button type="button" className="btn accent" onClick={onExtract} disabled={Boolean(busy)}>
                    3 · Extract loops
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => void onP01Seed()}
                    disabled={Boolean(busy) || !gmailLive}
                    title="Real Google OAuth only — emails you, syncs, extracts a mail loop"
                  >
                    {busy === "p01" ? "Sending…" : "4 · P0.1 test → my inbox"}
                  </button>
                </div>
                <p className="page-sub" style={{ marginTop: 8 }}>
                  <strong>P0.1:</strong> Step 4 → <strong>Work → Mail</strong> →{" "}
                  <code>[Juvantage P0.1]</code> → Draft → Approve &amp; send → Gmail Sent.
                </p>
                <div className="btn-row">
                  <button type="button" className="btn ghost dark" onClick={onDemoConnect} disabled={Boolean(busy)}>
                    Demo connect
                  </button>
                  <button
                    type="button"
                    className="btn ghost dark"
                    onClick={() =>
                      refreshConnectors()
                        .then(() => notify("Status refreshed", "success"))
                        .catch((err: Error) =>
                          notify(formatApiError(err, "Refresh status"), "error"),
                        )
                    }
                  >
                    Refresh status
                  </button>
                  <button type="button" className="btn ghost dark" onClick={() => setNav("loops")}>
                    Open Loops →
                  </button>
                </div>
              </section>

              {googleConfigured && googleRedirectUri ? (
                <details className="oauth-advanced">
                  <summary>Google Cloud redirect URI (setup)</summary>
                  <p className="page-sub">
                    Authorized redirect URIs must include exactly:{" "}
                    <code>{googleRedirectUri}</code>
                  </p>
                </details>
              ) : null}
            </>
          ) : null}

          {nav === "settings" ? (
            <>
              <h1>Settings</h1>
              <p className="page-sub">Dogfood metrics · quiet · privacy.</p>
              <div className="panel">
                <h2>Brain</h2>
                <p className="meta-mono">{apiBaseUrl()}</p>
                {health.status === "ok" ? (
                  <p className="ok">
                    Connected · {health.service}
                    {health.llm ? " · LLM ready" : " · demo LLM"}
                  </p>
                ) : null}
                {health.status === "error" ? <p className="err">{health.message}</p> : null}
              </div>
              <div className="panel">
                <h2>Dogfood metrics (14d)</h2>
                <p className="page-sub">
                  Clear / accept / edit rates from your approve + quiet history.
                </p>
                <div className="btn-row" style={{ marginBottom: 10 }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      fetchOsMetrics(14)
                        .then((m) => {
                          setMetrics(m);
                          notify("Metrics refreshed", "success");
                        })
                        .catch((err: Error) =>
                          notify(formatApiError(err, "Metrics"), "error"),
                        )
                    }
                  >
                    Refresh metrics
                  </button>
                </div>
                {metrics ? (
                  <>
                    <div className="form-row">
                      <span>Clear rate</span>
                      <span className="ok">{pct(metrics.clearRate)}</span>
                    </div>
                    <div className="form-row">
                      <span>Accept rate</span>
                      <span>{pct(metrics.acceptRate)}</span>
                    </div>
                    <div className="form-row">
                      <span>Edit rate</span>
                      <span>{pct(metrics.editRate)}</span>
                    </div>
                    <div className="form-row">
                      <span>Done / dismissed / open</span>
                      <span className="page-sub" style={{ margin: 0 }}>
                        {metrics.loops.done} / {metrics.loops.dismissed} / {metrics.loops.open}
                      </span>
                    </div>
                    <div className="form-row">
                      <span>Quiet: wrong band</span>
                      <span>{metrics.quietReasons.wrong_band}</span>
                    </div>
                    <div className="form-row">
                      <span>Quiet: wrong object</span>
                      <span>{metrics.quietReasons.wrong_object ?? 0}</span>
                    </div>
                    <div className="form-row">
                      <span>Quiet: not actionable</span>
                      <span>{metrics.quietReasons.not_actionable}</span>
                    </div>
                    <div className="form-row">
                      <span>Quiet: already handled</span>
                      <span>{metrics.quietReasons.already_done}</span>
                    </div>
                  </>
                ) : (
                  <p className="page-sub">Refresh after a few quiet/approve actions.</p>
                )}
              </div>
              <div className="panel">
                <h2>General</h2>
                <div className="form-row"><span>Check-in morning</span><span className="page-sub" style={{ margin: 0 }}>09:30</span></div>
                <div className="form-row"><span>Check-in afternoon</span><span className="page-sub" style={{ margin: 0 }}>15:30</span></div>
                <div className="form-row"><span>Context window</span><span className="page-sub" style={{ margin: 0 }}>4 hours</span></div>
              </div>
              <div className="panel">
                <h2>Privacy</h2>
                <div className="form-row"><span>Eyes pause when idle ≥90s</span><span className="ok">On</span></div>
                <div className="form-row"><span>Raw ambient purge</span><span className="page-sub" style={{ margin: 0 }}>≤24h</span></div>
                <p className="page-sub">We keep Loops + approvals — not a searchable journal.</p>
              </div>
              <div className="panel">
                <h2>Account</h2>
                <p className="ok">{userLabel}</p>
                <div className="btn-row">
                  <button type="button" className="btn" onClick={onLogout}>
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {message ? (
            <p className={`toast toast--${messageTone}`}>{message}</p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
