import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LoopWithProposal,
  OsConnector,
  OsSyncSummary,
  Proposal,
} from "@juvantage/shared";
import { isClosableObjectType, pickSheetHero } from "@juvantage/shared";
import {
  apiBaseUrl,
  approveSendOsProposal,
  connectOsDemo,
  dismissOsLoop,
  editOsProposal,
  ensureDevFixtures,
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
  if (source === "episodic") return "Screen";
  if (source === "voice") return "Voice";
  return source;
}

function kindFriendly(kind: string): string {
  if (kind === "reply_owed") return "Reply owed";
  if (kind === "appointment") return "Confirm meeting";
  if (kind === "ask") return "Open ask";
  if (kind === "todo") return "To-do";
  return kind.replace(/_/g, " ");
}

function bandFriendly(band: string): string {
  if (band === "critical") return "Urgent";
  if (band === "high") return "Soon";
  if (band === "normal") return "Normal";
  if (band === "quiet") return "Quiet";
  return band;
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
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  /** When Source=All, clips stay collapsed until expanded (mail stays front). */
  const [clipsExpanded, setClipsExpanded] = useState(false);
  /** Layout B default: one hero; list is opt-in ("Show queue"). */
  const [queueOpen, setQueueOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    await ensureDevFixtures();
    const data = await fetchOsLoops(40);
    setLoops(data.loops);
    setSelectedId((current) => {
      const prefer = preferId ?? current ?? loopIdFromHash();
      const next =
        data.loops.find((l) => l.id === prefer) ??
        pickSheetHero(data.loops) ??
        data.loops.find((l) => l.source !== "dev_fixture") ??
        data.loops[0] ??
        null;
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
      notify(formatApiError(err, "Load Work"), "error"),
    );
  }, [authed, notify, refreshConnectors, refreshLoops]);

  useEffect(() => {
    if (!authed) return;
    const onFocus = () => {
      void (async () => {
        try {
          await refreshConnectors();
          await refreshLoops();
          // Clear sticky “finish Google in browser” once OAuth landed.
          setMessage((prev) =>
            prev?.includes("Finish Google in the browser") ? null : prev,
          );
        } catch {
          /* ignore focus refresh errors */
        }
      })();
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
      list = list.filter(
        (l) => l.source !== "clip" && l.source !== "episodic" && l.source !== "dev_fixture",
      );
    }
    return list;
  }, [loops, band, sourceFilter, clipsExpanded]);

  const heroLoop = useMemo(
    () => pickSheetHero(filtered) ?? filtered[0] ?? null,
    [filtered],
  );

  const queueCount = useMemo(() => {
    if (!heroLoop) return Math.max(0, filtered.length);
    return filtered.filter((l) => l.id !== heroLoop.id).length;
  }, [filtered, heroLoop]);

  const collapsedClipCount = useMemo(() => {
    if (sourceFilter !== "all" || clipsExpanded) return 0;
    let list = loops;
    if (band !== "all") list = list.filter((l) => l.band === band);
    return list.filter((l) => l.source === "clip" || l.source === "episodic").length;
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
        `Demo linked · ${res.summary.mailCount} sample messages · check Work`,
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
        `Test mail in your inbox · open Work → “${res.subject.slice(0, 36)}…” → Draft → Approve`,
        "success",
      );
    } catch (err) {
      notify(formatApiError(err, "Test mail"), "error");
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
      notify(
        res.createdCount
          ? `Found ${res.createdCount} new · ${res.loops.length} to close`
          : `No new unfinished work · ${res.loops.length} still open`,
        "success",
      );
    } catch (err) {
      notify(formatApiError(err, "Find unfinished"), "error");
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
          "Clip closed locally — no email sent. Use From → Mail for a real send.",
          "info",
        );
      } else if (mode === "local" || selected.objectType !== "mail") {
        notify("Marked done locally — no email was sent.", "info");
      } else {
        notify("Closed — draft approved and finished.", "success");
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
          <p className="page-sub">
            Jos catches unfinished work and helps you close it — nothing sends
            without your Approve.
          </p>
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
            <span className="nav-label">Close</span>
            <span className="nav-sub">Next thing to send</span>
          </button>
          <button type="button" className={nav === "inbox" ? "on" : ""} onClick={() => setNav("inbox")}>
            <span className="nav-label">Synced</span>
            <span className="nav-sub">Mail &amp; calendar feed</span>
          </button>
          <div className="sep" />
          <button type="button" className={nav === "connect" ? "on" : ""} onClick={() => setNav("connect")}>
            <span className="nav-label">Google</span>
            <span className="nav-sub">{gmailLive ? "Linked" : "Sign in once"}</span>
          </button>
          <button type="button" className={nav === "settings" ? "on" : ""} onClick={() => setNav("settings")}>
            <span className="nav-label">Settings</span>
            <span className="nav-sub">Privacy &amp; metrics</span>
          </button>
        </nav>

        <main className="desk-main">
          {nav === "loops" ? (
            <>
              <h1>Next to close</h1>
              <p className="page-sub loops-one-liner">
                Edit the draft, then Approve. Daily work also lives on the teal sheet.
                {userLabel ? ` · ${userLabel}` : null}
              </p>
              {loops.length ? (
                <div className="status-strip" aria-live="polite">
                  <span>
                    <strong>{loops.length}</strong> open
                  </span>
                  <span className="status-strip-dot" aria-hidden />
                  <span>{summary?.mailCount ?? 0} mail synced</span>
                </div>
              ) : null}
              <div className="hero-toolbar">
                {queueCount > 0 && !queueOpen ? (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setQueueOpen(true)}
                  >
                    {queueCount} more in queue
                  </button>
                ) : queueOpen ? (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setQueueOpen(false)}
                  >
                    Hide queue
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  {filtersOpen ? "Hide filters" : "Filters & sync"}
                </button>
              </div>
              {filtersOpen ? (
                <div className="chips">
                  <span className="chip-label">Urgency</span>
                  {(
                    [
                      ["all", "All"],
                      ["critical", "Urgent"],
                      ["high", "Soon"],
                      ["normal", "Normal"],
                      ["quiet", "Quiet"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`chip ${band === id ? "on" : ""}`}
                      onClick={() => setBand(id)}
                    >
                      {label}
                    </button>
                  ))}
                  <span className="chip-label">From</span>
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
                    {busy === "extract" ? "Looking…" : "Find unfinished"}
                  </button>
                </div>
              ) : null}

              {!filtered.length && loops.length > 0 ? (
                <div className="empty-panel">
                  <strong>Nothing matches these filters.</strong> Tap <strong>All</strong> under
                  From / Urgency.
                </div>
              ) : null}
              {!loops.length ? (
                <div className="empty-panel empty-panel--guide">
                  <p>
                    <strong>You’re caught up — or Jos hasn’t found unfinished work yet.</strong>
                  </p>
                  {!gmailConnected ? (
                    <p>
                      First link Google under{" "}
                      <button type="button" className="inline-link" onClick={() => setNav("connect")}>
                        Google
                      </button>
                      . Then come back here — Jos looks for replies you owe and
                      meetings to confirm.
                    </p>
                  ) : (
                    <p>
                      Newsletters are ignored on purpose. Press{" "}
                      <strong>⌘⇧L</strong> on something you owe, or under Google
                      tap <strong>Send me a test to close</strong> to walk the
                      full draft → Approve path.
                    </p>
                  )}
                </div>
              ) : null}
              {loops.length > 0 && (filtered.length > 0 || collapsedClipCount > 0) ? (
                <div
                  className={`loops-layout${queueOpen ? "" : " focus-mode"}`}
                >
                  <div className="loop-list">
                    {filtered.map((loop) => (
                      <button
                        key={loop.id}
                        type="button"
                        className={`loop-row ${selectedId === loop.id ? "selected" : ""}`}
                        onClick={() => selectLoop(loop)}
                      >
                        <span className={`band-pill ${loop.band}`}>{bandFriendly(loop.band)}</span>
                        <strong>{loop.title}</strong>
                        <span className="muted">
                          {kindFriendly(loop.kind)}
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
                        <span className="band-pill normal">notes</span>
                        <strong>
                          {collapsedClipCount} screen note{collapsedClipCount === 1 ? "" : "s"}{" "}
                          hidden
                        </strong>
                        <span className="muted">Show screen notes</span>
                      </button>
                    ) : null}
                    {sourceFilter === "all" && clipsExpanded ? (
                      <button
                        type="button"
                        className="btn ghost"
                        style={{ margin: "8px 0" }}
                        onClick={() => setClipsExpanded(false)}
                      >
                        Hide screen notes again
                      </button>
                    ) : null}
                  </div>

                  <div className="detail-pane">
                    {selected ? (
                      <>
                        <div className="detail-top">
                          <span className={`band-pill ${selected.band}`}>{bandFriendly(selected.band)}</span>
                          {selected.source ? (
                            <span className="band-pill" style={{ marginLeft: 6 }}>
                              {sourceFriendly(selected.source)}
                            </span>
                          ) : null}
                          <h2>{selected.title}</h2>
                          <p>{selected.summary || kindFriendly(selected.kind)}</p>
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
                                : "This item can’t send — pick a Mail or Calendar item"
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
                        Pick something on the left to draft and Approve.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {nav === "inbox" ? (
            <>
              <h1>Synced from Google</h1>
              <p className="page-sub">
                This is the raw feed Jos reads. You don’t act here — unfinished
                work shows up under <strong>Work</strong>.{" "}
                <strong>Mail</strong> = replies you may owe.{" "}
                <strong>Calendar</strong> = upcoming events; tentative ones can
                become “confirm this meeting” on Approve (creates/locks the event).
              </p>
              {!summary ? (
                <div className="empty-panel">
                  Link Google first, then Jos can sync mail and calendar.
                </div>
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
                    <span className="status-strip-hint">Close work lives in Work</span>
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
              <h1>Google</h1>
              <p className="page-sub">
                Link once so Jos can read mail &amp; calendar, then draft
                replies and create events — only after you Approve.
              </p>

              <div className="connector-grid">
                {connectors.map((c) => (
                  <ConnectorTile key={c.id} connector={c} summary={summary} />
                ))}
              </div>

              {gmailConnected && !gmailLive ? (
                <div className="empty-panel" style={{ marginBottom: 12, borderColor: "#c44" }}>
                  <strong>Demo mode — not real Gmail.</strong> Tap{" "}
                  <strong>Sign in with Google</strong> for live send.
                </div>
              ) : null}

              <section className="panel panel-actions" aria-label="Google actions">
                {gmailLive ? (
                  <p className="ok" style={{ marginTop: 0 }}>
                    Google is linked. Jos can sync and close work from{" "}
                    <strong>Work</strong>.
                  </p>
                ) : (
                  <p className="page-sub" style={{ marginTop: 0 }}>
                    One sign-in covers Gmail + Calendar.
                  </p>
                )}
                <div className="btn-row">
                  <button type="button" className="btn primary" onClick={onConnectGoogle} disabled={Boolean(busy)}>
                    {gmailLive ? "Reconnect Google" : "Sign in with Google"}
                  </button>
                  <button type="button" className="btn" onClick={onSync} disabled={Boolean(busy) || !gmailConnected}>
                    {busy === "sync" ? "Syncing…" : "Refresh mail & calendar"}
                  </button>
                  <button type="button" className="btn accent" onClick={() => setNav("loops")}>
                    Go to Work →
                  </button>
                </div>
                <div className="btn-row" style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void onP01Seed()}
                    disabled={Boolean(busy) || !gmailLive}
                    title="Emails you a fake ‘need your reply’ so you can practice Approve & send"
                  >
                    {busy === "p01" ? "Sending…" : "Send me a test to close"}
                  </button>
                </div>
                <details className="oauth-advanced" style={{ marginTop: 16 }}>
                  <summary>Advanced / dogfood</summary>
                  <div className="btn-row" style={{ marginTop: 10 }}>
                    <button type="button" className="btn ghost dark" onClick={onExtract} disabled={Boolean(busy)}>
                      Find unfinished now
                    </button>
                    <button type="button" className="btn ghost dark" onClick={onDemoConnect} disabled={Boolean(busy)}>
                      Demo connect (fake data)
                    </button>
                  </div>
                  {googleConfigured && googleRedirectUri ? (
                    <p className="page-sub">
                      Redirect URI: <code>{googleRedirectUri}</code>
                    </p>
                  ) : null}
                </details>
              </section>
            </>
          ) : null}

          {nav === "settings" ? (
            <>
              <h1>Settings</h1>
              <p className="page-sub">What Jos can see · privacy · dogfood metrics.</p>
              <div className="panel">
                <h2>What Jos can see today</h2>
                <p className="page-sub" style={{ marginTop: 0 }}>
                  <strong>On:</strong> Gmail + Calendar (when linked), frontmost
                  app / window title while you’re present, and clips you mark with{" "}
                  <strong>⌘⇧L</strong>.
                  <br />
                  <strong>Not yet:</strong> full screen OCR / pixel reading — that’s
                  V2 episodic eyes in the plan, not this build. We won’t pretend it’s
                  here.
                </p>
                <p className="meta-mono">{apiBaseUrl()}</p>
                {health.status === "ok" ? (
                  <p className="ok">
                    Brain up · {health.service}
                    {health.llm ? " · LLM ready" : " · template drafts (no LLM key)"}
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
                <p className="page-sub">
                  We keep unfinished work + approvals — not a searchable screen journal
                  (that’s Reyn’s category).
                </p>
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
