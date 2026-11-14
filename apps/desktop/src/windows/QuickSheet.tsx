import { useCallback, useEffect, useRef, useState } from "react";
import type { LoopWithProposal, Proposal } from "@juvantage/shared";
import { isClosableObjectType } from "@juvantage/shared";
import {
  approveSendOsProposal,
  dismissOsLoop,
  editOsProposal,
  extractOsLoops,
  fetchOsLoops,
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

function toolHint(objectType: string | null | undefined): string {
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
  const focusRef = useRef<string | null>(null);
  focusRef.current = focusId;

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setLoops([]);
      setProposal(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOsLoops(4);
      setLoops(data.loops);
      const focused =
        data.loops.find((l) => l.id === focusRef.current) ?? data.loops[0];
      if (focused?.id !== focusRef.current) setFocusId(focused?.id ?? null);
      const topProp = focused?.proposal ?? null;
      setProposal(topProp);
      setDraftTitle(topProp?.title ?? "");
      setDraftBody(topProp?.body ?? "");
    } catch {
      setLoops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(id);
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

  function focusLoop(loop: LoopWithProposal) {
    setFocusId(loop.id);
    setProposal(loop.proposal ?? null);
    setDraftTitle(loop.proposal?.title ?? "");
    setDraftBody(loop.proposal?.body ?? "");
    setQuietPick(false);
  }

  const top = loops.find((l) => l.id === focusId) ?? loops[0] ?? null;
  const others = top ? loops.filter((l) => l.id !== top.id) : [];
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

  async function onExtract() {
    if (!getToken()) {
      flash("Sign in on Desktop first");
      return;
    }
    const res = await extractOsLoops();
    setLoops(res.loops as LoopWithProposal[]);
    flash(
      res.createdCount
        ? `Found ${res.createdCount} new — pick one below`
        : res.loops.length
          ? `${res.loops.length} still open`
          : "Nothing unfinished matched yet",
    );
  }

  return (
    <div className="sheet-shell">
      <header className="sheet-header">
        <div>
          <h1>Suggestion</h1>
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
          <article className="loop-card focus sheet-hero">
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
            <p className="loop-source">{toolHint(top.objectType)}</p>
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

          {others.length > 0 ? (
            <div className="sheet-more" aria-label="Other suggestions">
              <p className="quiet-label">Also open</p>
              {others.map((loop) => (
                <button
                  key={loop.id}
                  type="button"
                  className="loop-card sheet-more-item"
                  onClick={() => focusLoop(loop)}
                >
                  <strong>{loop.title}</strong>
                  <span className="muted">
                    {sourceLabel(loop.source)} · {kindLabel(loop.kind)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="sheet-empty">
          <p className="empty-title">Nothing to close right now</p>
          <p className="empty-body">
            Link Google on Desktop, hold <kbd>fn</kbd> to talk, or press{" "}
            <kbd>⌘⇧L</kbd> to clip something you owe. Jos will suggest a close
            here.
          </p>
          <button type="button" className="btn-extract" onClick={() => void onExtract()}>
            Find unfinished
          </button>
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
