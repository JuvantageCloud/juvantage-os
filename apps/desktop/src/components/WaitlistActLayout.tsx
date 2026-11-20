import type { LoopWithProposal, Proposal } from "@juvantage/shared";
import { ModalityHost } from "./ModalityHost";
import {
  loopChannelTag,
  loopStallLabel,
  mergedEarsFromEvidence,
  proposedHeadline,
  stepsFromProposalBody,
} from "../lib/loopDisplay";

type Props = {
  loops: LoopWithProposal[];
  selected: LoopWithProposal | null;
  onSelect: (loop: LoopWithProposal) => void;
  proposal: Proposal | null;
  draftTitle: string;
  draftBody: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  busy: boolean;
  editorOpen: boolean;
  onToggleEditor: () => void;
  onDraft: () => void;
  onApprove: () => void;
  onVoice?: () => void;
  onLinkGoogle?: () => void;
  onFindUnfinished?: () => void;
};

export function WaitlistActLayout({
  loops,
  selected,
  onSelect,
  proposal,
  draftTitle,
  draftBody,
  onTitleChange,
  onBodyChange,
  busy,
  editorOpen,
  onToggleEditor,
  onDraft,
  onApprove,
  onVoice,
  onLinkGoogle,
  onFindUnfinished,
}: Props) {
  const steps = stepsFromProposalBody(draftBody || proposal?.body || "");
  const mergedEars = selected ? mergedEarsFromEvidence(selected.evidence) : [];
  const headline = selected
    ? proposedHeadline(selected, draftTitle || proposal?.title || "")
    : "";

  return (
    <div className="waitlist-act waitlist-act--split" aria-labelledby="open-loops-heading">
      <aside className="waitlist-loops-col">
        <header className="open-loops-head">
          <h2 id="open-loops-heading" className="open-loops-label">
            Open loops
          </h2>
          <span className="open-loops-count">
            {loops.length ? `${loops.length} need you` : "Clear"}
          </span>
        </header>

        <div className="open-loop-cards" role="list">
          {loops.length ? (
            loops.slice(0, 8).map((loop) => {
              const tag = loopChannelTag(loop);
              const on = selected?.id === loop.id;
              return (
                <button
                  key={loop.id}
                  type="button"
                  role="listitem"
                  className={`open-loop-card${on ? " selected" : ""}`}
                  onClick={() => onSelect(loop)}
                >
                  <span className={`open-loop-channel open-loop-channel--${tag.toLowerCase()}`}>
                    {tag}
                  </span>
                  <span className="open-loop-title">{loop.title}</span>
                  <span className="open-loop-stall">{loopStallLabel(loop)}</span>
                </button>
              );
            })
          ) : (
            <div className="open-loop-empty">
              <p>
                <strong>Nothing open.</strong> Jos only shows work that’s still unfinished.
              </p>
              {onFindUnfinished ? (
                <button type="button" className="btn" onClick={() => void onFindUnfinished()}>
                  Find unfinished
                </button>
              ) : null}
              {onLinkGoogle ? (
                <button type="button" className="btn ghost" onClick={onLinkGoogle}>
                  Link Google (ears)
                </button>
              ) : null}
            </div>
          )}
        </div>

        <p className="waitlist-loops-foot">
          Mac · iPhone — same loop on both. Propose, you decide, then close.
        </p>
      </aside>

      <section className="proposed-next proposed-next--panel" aria-label="Proposed next step">
        <header className="proposed-panel-head">
          <span className="proposed-panel-label">Proposed next step</span>
        </header>

        {selected ? (
          <>
            <p className="proposed-eyebrow">{selected.title}</p>
            <h3 className="proposed-headline">{headline}</h3>
            {mergedEars.length ? (
              <p className="proposed-merged-ears">
                Jos folded in:{" "}
                {mergedEars.map((e) => `${e.source === "gmail" ? "Gmail" : e.source}${e.title ? ` · ${e.title}` : ""}`).join("; ")}
              </p>
            ) : null}
            {steps.length ? (
              <ol className="proposed-steps">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="proposed-empty">
                <button type="button" className="inline-link" onClick={() => void onDraft()}>
                  Preview
                </button>{" "}
                to generate steps from fused context.
              </p>
            )}

            <div className="proposed-actions">
              <button type="button" className="btn" onClick={onToggleEditor}>
                {editorOpen ? "Hide editor" : "Open editor"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => (onVoice ? onVoice() : onDraft())}
                disabled={busy}
              >
                Fill by voice
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => void onApprove()}
                disabled={busy}
              >
                {busy ? "Working…" : "Approve & continue"}
              </button>
            </div>

            {editorOpen ? (
              <div className="proposed-editor">
                <ModalityHost
                  loop={selected}
                  proposal={proposal}
                  draftTitle={draftTitle}
                  draftBody={draftBody}
                  onTitleChange={onTitleChange}
                  onBodyChange={onBodyChange}
                  busy={busy}
                />
                <button type="button" className="btn ghost" onClick={() => void onDraft()} disabled={busy}>
                  {busy ? "Drafting…" : proposal ? "Re-draft" : "Preview"}
                </button>
              </div>
            ) : null}

            <p className="proposed-trust">Nothing submits until you approve.</p>
          </>
        ) : (
          <div className="proposed-idle">
            <p className="proposed-headline proposed-headline--idle">Select an open loop</p>
            <p className="proposed-empty">
              The right column is your context box — steps, editor, and Approve live here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}