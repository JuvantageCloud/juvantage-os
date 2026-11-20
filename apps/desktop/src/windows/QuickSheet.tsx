import { useCallback, useEffect, useRef, useState } from "react";
import type { LoopWithProposal, Proposal } from "@juvantage/shared";
import { isClosableObjectType, pickSheetHero } from "@juvantage/shared";
import { readPresenceHint } from "../lib/presenceHint";
import {
  approveSendOsProposal,
  dismissOsLoop,
  editOsProposal,
  ensureDevFixtures,
  extractOsLoops,
  fetchOsConnectors,
  fetchOsLoops,
  syncOsConnectors,
  subscribeOsContextStream,
  surfaceEpisodic,
  getToken,
  proposeOsLoop,
  snoozeOsLoop,
  voiceOsLoop,
  type QuietReason,
} from "../lib/api";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { ModalityHost } from "../components/ModalityHost";
import "../components/modality-surfaces.css";
import "./quick-sheet.css";

const QUIET_REASONS: { id: QuietReason; label: string }[] = [
  { id: "wrong_band", label: "Shouldn’t have surfaced" },
  { id: "wrong_object", label: "Wrong object type" },
  { id: "not_actionable", label: "Not actionable" },
  { id: "already_done", label: "Already handled" },
  { id: "other", label: "Just quiet" },
];

function sourceLabel(source: string | null | undefined): string {
  if (source === "gmail") return "Mail";
  if (source === "google_calendar") return "Calendar";
  if (source === "clip") return "Clip";
  if (source === "voice") return "Voice";
  return source ?? "Context";
}

function kindLabel(kind: string): string {
  if (kind === "reply_owed") return "Reply owed";
  if (kind === "appointment") return "Confirm meeting";
  if (kind === "ask") return "Open ask";
  if (kind === "todo") return "To-do";
  return kind.replace(/_/g, " ");
}

function toolHint(loop: { source?: string | null; objectType?: string | null }): string {
  if (loop.source === "episodic") {
    return "Jos read the front window — edit, then Approve to close. This does not send email.";
  }
  const objectType = loop.objectType;
  if (objectType === "mail") return "Jos opened Mail compose — edit, then Approve to send.";
  if (objectType === "calendar") return "Jos opened Calendar — edit, then Approve to book/confirm.";
  if (objectType === "voice") return "Jos drafted from your voice — edit, then Approve to close.";
  if (objectType === "clip") return "Jos captured a clip — refine the note, then Approve to close.";
  return "Jos picked a tool for this context — edit, then Approve to close it.";
}

export function QuickSheet() {
  const [loops, setLoops] = useState<LoopWithProposal[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [quietPick, setQuietPick] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [heroKey, setHeroKey] = useState("");
  const focusRef = useRef<string | null>(null);
  focusRef.current = focusId;
  const appliedBody = useRef<string | null>(null);
  const firstLoad = useRef(true);
  const syncLeaseRef = useRef(0);
  const SYNC_MIN_MS = 60_000;

  async function maybeSyncExtract() {
    const now = Date.now();
    if (now - syncLeaseRef.current < SYNC_MIN_MS) return;
    try {
      const { connectors } = await fetchOsConnectors();
      const linked = connectors.some(
        (c) =>
          c.status === "connected" &&
          (c.provider === "gmail" || c.provider === "google_calendar"),
      );
      if (!linked) return;
      syncLeaseRef.current = now;
      await syncOsConnectors();
      await extractOsLoops();
    } catch {
      /* offline or unsigned */
    }
  }

  async function readFrontWindow() {
    const eye = window.juvantageOs?.episodicContext;
    if (!eye) {
      setMiss(
        "This Mac app is still the older build. In Xcode, press Stop, then Run. That loads the window reader.",
      );
      return;
    }
    try {
      const ctx = await eye();
      const app = ctx.app?.trim() || "the other window";
      const line = ctx.text?.trim() ?? "";
      const hasWords = Boolean(line || (ctx.title && ctx.title.trim().length >= 4));
      if (line.length >= 8) {
        const saved = await surfaceEpisodic({ app: ctx.app, title: ctx.title, text: ctx.text });
        if (saved.surfaced) {
          setMiss(null);
          return;
        }
      }
      if (!ctx.ok) {
        setMiss(
          "The menu bar at the very top does not name the window Jos should read. Click the Xcode window so the menu bar says Xcode, highlight a line so it turns blue, and leave it. This card checks again in a few seconds.",
        );
        return;
      }
      if (app.toLowerCase().includes("system settings") || app.toLowerCase() === "settings") {
        setMiss(
          "You opened this while looking at System Settings. Close the card, click your code window so the menu bar says Xcode, highlight one line, press ⌘C to copy, then click the teal circle.",
        );
        return;
      }
      if (ctx.axTrusted === false && !ctx.text?.trim()) {
        setMiss(
          `Jos found ${app}. The switch next to JuvantageOSMac can be on while the app icon still looks grey — that is normal in Xcode. macOS may still think this build is "not trusted" until you press Stop, then Run. Or skip the blue-line read: highlight a line, press ⌘C to copy, then open this card (clipboard does not need Accessibility).`,
        );
        return;
      }
      if (!hasWords) {
        setMiss(
          `Jos found ${app} but no line yet. Highlight one line, press ⌘C to copy it, then leave this card open — it checks again every few seconds.`,
        );
        return;
      }
      const saved = await surfaceEpisodic({ app: ctx.app, title: ctx.title, text: ctx.text });
      if (!saved.surfaced) {
        setMiss(
          `Jos looked at ${app} and still did not get a sentence. Highlight one line so it turns blue.`,
        );
        return;
      }
      setMiss(null);
    } catch {
      setMiss(
        "The window read didn't reach the Brain. The one in your terminal is already running — don't start a second copy.",
      );
    }
  }

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setLoops([]);
      setProposal(null);
      setMiss(
        "Not signed in to the Brain. Open Desktop from this card and sign in, or press Stop then Run in Xcode (dev builds sign in automatically on launch).",
      );
      setLoading(false);
      return;
    }
    if (firstLoad.current) setLoading(true);
    try {
      await ensureDevFixtures();
      await readFrontWindow();
      await maybeSyncExtract();
      const presence = await readPresenceHint();
      const data = await fetchOsLoops(8, presence);
      const hero = pickSheetHero(data.loops, presence);
      const shown = hero ? [hero] : [];
      setLoops(shown);
      const focused = shown.find((l) => l.id === focusRef.current) ?? shown[0];
      if (focused) setHeroKey(`${focused.id}:${focused.updatedAt ?? ""}`);
      if (focused?.id !== focusRef.current) setFocusId(focused?.id ?? null);
      const topProp = focused?.proposal ?? null;
      setProposal(topProp);
      const nextBody = topProp?.body ?? "";
      if (appliedBody.current !== nextBody) {
        appliedBody.current = nextBody;
        setDraftTitle(topProp?.title ?? "");
        setDraftBody(nextBody);
      }
    } catch {
      setLoops([]);
    } finally {
      firstLoad.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 45_000);
    const stopStream = subscribeOsContextStream(() => void refresh());
    const onToken = () => void refresh();
    window.addEventListener("juv-os-token", onToken);
    return () => {
      window.clearInterval(id);
      stopStream();
      window.removeEventListener("juv-os-token", onToken);
    };
  }, [refresh]);

  useEffect(() => {
    const bridge = window.juvantageOs;
    if (!bridge?.onVoiceTranscript) return;
    return bridge.onVoiceTranscript(async (text) => {
      const report = (ok: boolean, message: string) =>
        void bridge.voiceResult?.({ ok, message });
      if (!getToken()) {
        report(false, "Sign in on Desktop first");
        return;
      }
      setBusy("voice");
      try {
        const res = await voiceOsLoop({ text });
        if (res.mode === "quick_answer") {
          report(true, res.answer);
          return;
        }
        const loop = { ...res.loop, proposal: res.proposal };
        setLoops((prev) => [loop, ...prev.filter((l) => l.id !== loop.id)]);
        setFocusId(loop.id);
        setProposal(res.proposal);
        setDraftTitle(res.proposal.title);
        setDraftBody(res.proposal.body);
        const said = (res.loop.evidence as { intent?: string; recipient?: string } | null);
        report(
          true,
          said?.intent === "email"
            ? `Got it. Drafted an email to ${said.recipient ?? "them"} — review & Approve`
            : "Got it. Draft ready — review & Approve",
        );
      } catch (err) {
        report(false, err instanceof Error ? err.message : "Voice draft failed");
      } finally {
        setBusy(null);
      }
    });
  }, []);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  const top = loops.find((l) => l.id === focusId) ?? loops[0] ?? null;
  const canApprove = top ? isClosableObjectType(top.objectType) : false;
  const approveLabel =
    top?.objectType === "mail" ? "Approve & send" : "Approve & close context";

  async function onDraft() {
    if (!top) {
      flash("Nothing to draft");
      return;
    }
    setBusy("draft");
    try {
      const res = await proposeOsLoop(top.id);
      setProposal(res.proposal);
      setDraftTitle(res.proposal.title);
      setDraftBody(res.proposal.body);
      setLoops((prev) =>
        prev.map((l) =>
          l.id === res.loop.id ? { ...res.loop, proposal: res.proposal } : l,
        ),
      );
      flash("Preview ready — refine, then Approve to close");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setBusy(null);
    }
  }

  async function onApproveSend() {
    if (!top) return;
    setBusy("send");
    try {
      let prop = proposal;
      if (!prop) {
        const drafted = await proposeOsLoop(top.id);
        prop = drafted.proposal;
        setProposal(prop);
        setDraftTitle(prop.title);
        setDraftBody(prop.body);
      } else if (
        prop.status === "executed" ||
        prop.status === "failed" ||
        prop.status === "cancelled"
      ) {
        const drafted = await proposeOsLoop(top.id);
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
        const edited = await editOsProposal(prop.id, draftBody, draftTitle);
        prop = edited.proposal;
        setProposal(prop);
      }
      const res = await approveSendOsProposal(prop.id);
      const mode =
        res.result && typeof res.result === "object" && "mode" in res.result
          ? String((res.result as { mode?: string }).mode)
          : "";
      flash(
        mode === "demo"
          ? "Context closed (demo)"
          : mode === "gmail_live"
            ? "Sent — context closed"
            : mode === "calendar_live"
              ? "Booked — context closed"
              : "Context closed",
      );
      void window.juvantageOs?.contextClosed?.();
      await refresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function onSnooze() {
    if (!top) {
      flash("Nothing to snooze");
      return;
    }
    await snoozeOsLoop(top.id);
    flash("Snoozed 4h");
    await refresh();
  }

  async function onDismiss(reason: QuietReason) {
    if (!top) return;
    setQuietPick(false);
    await dismissOsLoop(top.id, reason);
    flash(
      reason === "wrong_band"
        ? "Noted — shouldn’t have surfaced"
        : reason === "already_done"
          ? "Noted — already handled"
          : "Quieted",
    );
    await refresh();
  }

  return (
    <div className={`sheet-shell${loading ? " sheet-loading" : ""}`}>
      <header className="sheet-header">
        <div>
          <h1>Preview</h1>
          <p className="meta">
            {loading
              ? "Looking…"
              : top
                ? `From ${sourceLabel(top.source)} · ${kindLabel(top.kind)}`
                : "Catch across context → preview → Approve closes it"}
          </p>
        </div>
        <button
          type="button"
          className="sheet-close"
          aria-label="Close"
          onClick={() => void window.juvantageOs?.closeSheet()}
        >
          ×
        </button>
      </header>

      {top ? (
        <div className="sheet-loops">
          <article key={heroKey || top.id} className="loop-card focus sheet-hero sheet-hero-enter">
            <div className="loop-meta">
              <span className={`band ${top.band}`}>
                {top.band === "critical"
                  ? "Urgent"
                  : top.band === "high"
                    ? "Soon"
                    : top.band}
              </span>
              <span className="kind">{sourceLabel(top.source)}</span>
              <span className="kind">{kindLabel(top.kind)}</span>
            </div>
            <h2>{top.title}</h2>
            {top.summary ? <p>{top.summary}</p> : null}
            <p className="loop-source">{toolHint(top)}</p>
          </article>

          <EvidenceDrawer
            loop={top}
            open={evidenceOpen}
            onToggle={() => setEvidenceOpen((v) => !v)}
          />
          <ModalityHost
            loop={top}
            proposal={proposal}
            draftTitle={draftTitle}
            draftBody={draftBody}
            onTitleChange={setDraftTitle}
            onBodyChange={setDraftBody}
            busy={busy !== null}
          />

        </div>
      ) : (
        <div className="sheet-empty">
          <p className="empty-title">No sentence from the window in front</p>
          <p className="empty-body">
            {miss ??
              "Click the window you were using, highlight one line, then click the teal circle."}
          </p>
          <p className="empty-body">
            Maya and “You were in some app” are practice cards. They stay on Desktop. They are not a read of your screen.
          </p>
          {miss?.includes("JuvantageOSMac") ? (
            <button
              type="button"
              className="btn-extract"
              onClick={() =>
                void window.juvantageOs?.openExternal(
                  "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility",
                )
              }
            >
              Open Accessibility settings
            </button>
          ) : null}
        </div>
      )}

      <div className="actions">
        <button
          type="button"
          className="btn-edit"
          disabled={!top || busy !== null}
          onClick={() => void onDraft()}
        >
          {busy === "draft" ? "Drafting…" : proposal ? "Re-draft" : "Preview"}
        </button>
        <button
          type="button"
          className="btn-approve"
          disabled={!top || busy !== null || !canApprove}
          title={
            canApprove
              ? "Approve closes this context with the tool Jos opened"
              : "Not closable yet — try Preview or pick Mail/Calendar"
          }
          onClick={() => void onApproveSend()}
        >
          {busy === "send" ? "Closing…" : approveLabel}
        </button>
        <button
          type="button"
          className="btn-snooze"
          disabled={!top}
          onClick={() => setQuietPick((v) => !v)}
        >
          Quiet
        </button>
        <button type="button" className="btn-snooze" onClick={() => void onSnooze()}>
          Snooze
        </button>
        <button
          type="button"
          className="btn-desktop"
          onClick={() => void window.juvantageOs?.openDesktop(top?.id)}
        >
          Open Desktop
        </button>
      </div>

      {quietPick && top ? (
        <div className="quiet-reasons" role="group" aria-label="Why quiet">
          <p className="quiet-label">Why quiet this?</p>
          {QUIET_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="quiet-chip"
              onClick={() => void onDismiss(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : null}

      {toast ? <p className="sheet-toast" role="status">{toast}</p> : null}
    </div>
  );
}
