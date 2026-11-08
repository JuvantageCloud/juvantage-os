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
            ? `Got it. Drafted an email to ${said.recipient ?? "them"} — review & approve`
            : "Got it. Draft ready — review & approve",
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
  const canApprove = top ? isClosableObjectType(top.objectType) : false;
  const approveLabel = top?.objectType === "mail" ? "Approve & send" : "Approve & close";

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
      flash("Draft ready — edit, then Approve & send");
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
      const messageId =
        res.result && typeof res.result === "object" && "messageId" in res.result
          ? String((res.result as { messageId?: string }).messageId)
          : "";
      flash(
        mode === "demo"
          ? "Approved → sent (demo) → verified closed"
          : mode === "gmail_live"
            ? `Sent · id ${messageId.slice(0, 8)}… → closed`
            : "Approved → executed → verified",
      );
      await refresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Approve/send failed");
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
        ? `Extracted ${res.createdCount} new loop(s)`
        : `Showing ${res.loops.length} open loop(s)`,
    );
  }

  return (
    <div className="sheet-shell">
      <header className="sheet-header">
        <div>
          <h1>Quick sheet</h1>
          <p className="meta">
            {loading
              ? "Loading…"
              : top
                ? `${loops.length} open · ${top.band} · ${top.status}`
                : "No open loops — extract from synced mail"}
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
          {loops.map((loop) => (
            <article
              key={loop.id}
              className={`loop-card ${loop.id === top.id ? "focus" : ""}`}
              onClick={() => focusLoop(loop)}
            >
              <div className="loop-meta">
                <span className={`band ${loop.band}`}>{loop.band}</span>
                <span className="kind">{loop.kind.replace("_", " ")}</span>
                {loop.objectType ? (
                  <span className="kind">{loop.objectType}</span>
                ) : null}
              </div>
              <h2>{loop.title}</h2>
              {loop.summary ? <p>{loop.summary}</p> : null}
              {loop.source ? <p className="loop-source">via {loop.source}</p> : null}
            </article>
          ))}

          {top ? (
            <EvidenceDrawer
              loop={top}
              open={evidenceOpen}
              onToggle={() => setEvidenceOpen((v) => !v)}
            />
          ) : null}
          {top ? (
            <ModalityHost
              loop={top}
              proposal={proposal}
              draftTitle={draftTitle}
              draftBody={draftBody}
              onTitleChange={setDraftTitle}
              onBodyChange={setDraftBody}
              busy={busy !== null}
            />
          ) : null}
        </div>
      ) : (
        <div className="sheet-empty">
          <p className="empty-title">All clear</p>
          <p className="empty-body">
            Sign in on Desktop, Demo connect, then Extract — hold <kbd>fn</kbd> to
            talk, or press <kbd>⌘⇧L</kbd> to clip.
          </p>
          <button type="button" className="btn-extract" onClick={() => void onExtract()}>
            Extract loops now
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
          {busy === "draft" ? "Drafting…" : "Draft"}
        </button>
        <button
          type="button"
          className="btn-approve"
          disabled={!top || busy !== null || !canApprove}
          title={
            canApprove
              ? "Approve then execute (SENI grant)"
              : "Not a closable object type"
          }
          onClick={() => void onApproveSend()}
        >
          {busy === "send" ? "Sending…" : approveLabel}
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
