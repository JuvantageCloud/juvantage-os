import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LoopWithProposal,
  OsConnector,
  OsSyncSummary,
  Proposal,
} from "@juvantage/shared";
import { isClosableObjectType, pickSheetHero, type PresenceHint } from "@juvantage/shared";
import { readPresenceHint } from "../lib/presenceHint";
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
import { DesktopSettingsContent } from "../components/DesktopSettingsContent";
import {
  SettingsWorkbench,
  type SettingsSection,
} from "../components/SettingsWorkbench";
import { WaitlistActLayout } from "../components/WaitlistActLayout";
import { loopLooksLikeNoise } from "../lib/loopDisplay";
import "../components/modality-surfaces.css";
import "./desktop.css";

type OverlayId = "connect" | "settings" | "inbox" | null;
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
  if (rate == null) return "n/a";
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
  const [overlay, setOverlay] = useState<OverlayId>(null);
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
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [quietPick, setQuietPick] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [listeningHelp, setListeningHelp] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("privacy");
  const [metrics, setMetrics] = useState<OsDogfoodMetrics | null>(null);

  const hostShell = Boolean(window.juvantageOs?.hostShell);
  const showUndock = Boolean(window.juvantageOs) && !hostShell;

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

  const [presenceHint, setPresenceHint] = useState<PresenceHint | null>(null);

  const refreshLoops = useCallback(async (preferId?: string | null) => {
    if (!getToken()) {
      setLoops([]);
      return;
    }
    await ensureDevFixtures();
    const presence = await readPresenceHint();
    setPresenceHint(presence);
    const data = await fetchOsLoops(40, presence);
    setLoops(data.loops);
    setSelectedId((current) => {
      const prefer = preferId ?? current ?? loopIdFromHash();
      const next =
        data.loops.find((l) => l.id === prefer) ??
        pickSheetHero(data.loops, presence) ??
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
    const onHash = () => {
      const id = loopIdFromHash();
      if (!id) return;
      setSelectedId(id);
      void refreshLoops(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    const raw = window.location.hash.replace(/^#\/?/, "");
    const q = raw.includes("?") ? raw.split("?")[1] : "";
    const params = new URLSearchParams(q);
    if (params.get("settings") === "plan") {
      setOverlay("settings");
      setSettingsSection("plan");
    }
    if (params.get("billing") === "success") {
      notify("Payment received — refresh Plan & usage if limits look stale.", "success");
    }
  }, [authed, notify]);

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
      list = list.filter((l) => {
        if (l.source === "clip" || l.source === "dev_fixture") return false;
        if (l.source === "episodic" && l.band !== "critical" && l.band !== "high") return false;
        if (l.source === "voice" && l.band === "quiet") return false;
        if (loopLooksLikeNoise(l)) return false;
        return true;
      });
    }
    return list;
  }, [loops, band, sourceFilter, clipsExpanded]);

  useEffect(() => {
    if (!selected) {
      setEditorOpen(false);
      return;
    }
    const body = draftBody.trim() || selected.proposal?.body?.trim();
    setEditorOpen(Boolean(body));
  }, [selected?.id, selected?.proposal?.id, draftBody]);

  const heroLoop = useMemo(
    () => pickSheetHero(filtered, presenceHint) ?? filtered[0] ?? null,
    [filtered, presenceHint],
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

  const earsStatus = useMemo(() => {
    if (gmailLive) return "Gmail + Calendar (live)";
    if (gmailConnected) return "Demo mail & calendar";
    return "Not linked";
  }, [gmailConnected, gmailLive]);

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
      setOverlay(null);
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
      setOverlay(null);
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
      setOverlay(null);
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
      <div className={`desk-shell app-opaque${hostShell ? " desk-shell--host" : ""}`}>
        <div className="desk-titlebar">
          {hostShell ? (
            <span className="titlebar-spacer" aria-hidden />
          ) : (
            <p className="brand">Juvantage OS</p>
          )}
        </div>
        <div className="sign-gate">
          <h1>Sign in</h1>
          <p className="page-sub">
            Jos catches unfinished work and helps you close it. Nothing sends without your approve.
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
    <div className={`desk-shell app-opaque${hostShell ? " desk-shell--host" : ""}`}>
      <div className="desk-titlebar">
        {!hostShell ? (
          <>
            <div className="traffic-lights" aria-hidden>
              <i className="r" />
              <i className="y" />
              <i className="g" />
            </div>
            <p className="brand">Juvantage OS</p>
          </>
        ) : (
          <span className="titlebar-spacer" aria-hidden />
        )}
        <div className="titlebar-end">
          <button
            type="button"
            className="listening-pill listening-pill--btn"
            aria-expanded={listeningHelp}
            onClick={() => setListeningHelp((v) => !v)}
          >
            <span className="listening-dot" aria-hidden />
            <span className="listening-label">Listening</span>
          </button>
          {listeningHelp ? (
            <div className="listening-popover" role="dialog" aria-label="What listening means">
              <p>
                <strong>Eyes:</strong> frontmost app and window title while you are active.
              </p>
              <p>
                <strong>Ears:</strong> Gmail and Calendar after you link Google.
              </p>
              <p>
                <strong>Voice:</strong> hold <kbd>fn</kbd> on the quick sheet.
              </p>
              {presenceHint?.app ? (
                <p className="listening-popover-now">
                  Now: <strong>{presenceHint.app}</strong>
                  {presenceHint.title ? ` · ${presenceHint.title}` : ""}
                </p>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            className="btn-icon btn-ghost"
            title="Settings"
            aria-label="Settings"
            onClick={() => {
              setSettingsSection("privacy");
              setOverlay(overlay === "settings" ? null : "settings");
            }}
          >
            <svg className="icon-gear" viewBox="0 0 20 20" aria-hidden>
              <path
                fill="currentColor"
                d="M10 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Zm7.4-2.2.9-.7.8-1.4-.9-.7a7.5 7.5 0 0 0 0-2l.9-.7-.8-1.4-.9.7a7.7 7.7 0 0 0-1.7-1l-.3-1.1h-1.6l-.3 1.1c-.6.3-1.2.6-1.7 1l-.9-.7-.8 1.4.9.7a7.5 7.5 0 0 0 0 2l-.9.7.8 1.4.9-.7c.5.4 1.1.7 1.7 1l.3 1.1h1.6l.3-1.1c.6-.3 1.2-.6 1.7-1Z"
              />
            </svg>
          </button>
          {showUndock ? (
            <button
              type="button"
              className="btn ghost btn-compact"
              title="Open desktop in its own window"
              onClick={() => void window.juvantageOs?.undock()}
            >
              Pop out
            </button>
          ) : null}
        </div>
      </div>

      <div className="desk-body desk-body--product">
        <main className="desk-main desk-main--product">
          {message ? (
            <p className={`toast toast--float toast--${messageTone}`}>{message}</p>
          ) : null}

          {!overlay ? (
            <div className="desk-stage desk-stage--work">
              <WaitlistActLayout
                loops={filtered}
                selected={selected}
                onSelect={(loop) => selectLoop(loop)}
                proposal={proposal}
                draftTitle={draftTitle}
                draftBody={draftBody}
                onTitleChange={setDraftTitle}
                onBodyChange={setDraftBody}
                busy={Boolean(busy)}
                editorOpen={editorOpen}
                onToggleEditor={() => setEditorOpen((v) => !v)}
                onDraft={() => void onDraft()}
                onApprove={() => void onApproveSend()}
                onApproveLater={() => {
                  if (!selected) return;
                  setBusy("snooze");
                  void snoozeOsLoop(selected.id, 2)
                    .then(() => {
                      notify("Snoozed 2 hours — will resurface then", "success");
                      return refreshLoops();
                    })
                    .catch((err: Error) => notify(formatApiError(err, "Snooze"), "error"))
                    .finally(() => setBusy(null));
                }}
                onLinkGoogle={() => setOverlay("connect")}
                onFindUnfinished={() => void onExtract()}
                presenceHint={presenceHint}
                earsStatus={earsStatus}
              />
              {selected && quietPick ? (
                <div className="quiet-reasons quiet-reasons--inline">
                  <div className="chips">
                    {QUIET_REASONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="chip"
                        onClick={() =>
                          dismissOsLoop(selected.id, r.id).then(() => {
                            setQuietPick(false);
                            notify(
                              r.id === "wrong_band" ? "Noted — shouldn’t have surfaced" : "Quieted",
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
              ) : selected ? (
                <button
                  type="button"
                  className="btn ghost quiet-loop-btn"
                  onClick={() => setQuietPick(true)}
                >
                  Quiet this loop
                </button>
              ) : null}
            </div>
          ) : (
            <div
              className="desk-stage desk-stage--overlay"
              role="dialog"
              aria-modal="true"
              aria-label={
                overlay === "connect" ? "Google" : overlay === "inbox" ? "Connector cache" : "Settings"
              }
            >
              <div
                className={`desk-overlay-panel desk-overlay-panel--full${
                  overlay === "settings" ? " desk-overlay-panel--settings" : ""
                }`}
              >
                {overlay !== "settings" ? (
                  <div className="desk-overlay-head">
                    <h1 className="type-title">
                      {overlay === "connect"
                        ? "Google"
                        : overlay === "inbox"
                          ? "Connector cache (dev)"
                          : ""}
                    </h1>
                    <button
                      type="button"
                      className="btn primary btn-back-work"
                      onClick={() => setOverlay(null)}
                    >
                      ← Back to work
                    </button>
                  </div>
                ) : null}

                {overlay === "inbox" ? (
            <>
              <p className="page-sub">Raw Gmail and Calendar cache for engineers. You do not work from this screen.</p>
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

                {overlay === "connect" ? (
            <>
              <p className="page-sub">
                Ears only — Jos checks mail/calendar in the background. You never browse a full inbox here.
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
                  <button type="button" className="btn" onClick={() => setOverlay(null)}>
                    ← Back to work
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

                {overlay === "settings" ? (
                  <SettingsWorkbench
                    section={settingsSection}
                    onSection={setSettingsSection}
                    onBack={() => setOverlay(null)}
                  >
                    <DesktopSettingsContent
                      section={settingsSection}
                      apiBase={apiBaseUrl()}
                      health={health}
                      userLabel={userLabel}
                      metrics={metrics}
                      band={band}
                      sourceFilter={sourceFilter}
                      setBand={setBand}
                      setSourceFilter={setSourceFilter}
                      onLogout={onLogout}
                      onOpenConnect={() => setOverlay("connect")}
                      onOpenSyncDebug={() => setOverlay("inbox")}
                      onNotify={notify}
                      onRefreshMetrics={() =>
                        void fetchOsMetrics(14)
                          .then((m) => {
                            setMetrics(m);
                            notify("Stats updated", "success");
                          })
                          .catch((err: Error) => notify(formatApiError(err, "Stats"), "error"))
                      }
                      pct={pct}
                    />
                  </SettingsWorkbench>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
