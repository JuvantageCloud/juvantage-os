import type { LoopWithProposal, Proposal } from "@juvantage/shared";
import { ModalityHost } from "./ModalityHost";
import {
  loopChannelTag,
  loopStallMeta,
  mergedEarsFromEvidence,
  previewExcerptFromBody,
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
  onLinkGoogle,
  onFindUnfinished,
}: Props) {
  const bodyForUi = draftBody || proposal?.body || "";
  const steps = stepsFromProposalBody(bodyForUi);
  const previewExcerpt = previewExcerptFromBody(bodyForUi);
  const hasDraft = Boolean(bodyForUi.trim());
  const mergedEars = selected ? mergedEarsFromEvidence(selected.evidence) : [];
  const headline = selected
    ? proposedHeadline(selected, draftTitle || proposal?.title || "")
    : "";
  const showEditor = hasDraft && editorOpen;

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
              const stall = loopStallMeta(loop);
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
                  <span className={`open-loop-stall open-loop-stall--${stall.tone}`}>
                    {stall.text}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="open-loop-empty">
              <p>
                <strong>Nothing open.</strong> Jos only surfaces work that still needs you.
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
          Same loops on Mac and iPhone. Jos proposes; you approve before anything sends.
        </p>
      </aside>

      <section className="proposed-next proposed-next--panel context-surface" aria-label="Close surface">
        <header className="proposed-panel-head">
          <span className="proposed-panel-label">Close surface</span>
        </header>

        {selected ? (
          <>
            <p className="proposed-eyebrow">{selected.title}</p>
            <h3 className="proposed-headline">{headline}</h3>
            {mergedEars.length ? (
              <p className="proposed-merged-ears">
                Folded in:{" "}
                {mergedEars.map((e) => `${e.source === "gmail" ? "Gmail" : e.source}${e.title ? ` · ${e.title}` : ""}`).join("; ")}
              </p>
            ) : null}
            <ol className="proposed-steps">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <div className={`context-box${showEditor ? " context-box--editing" : ""}`}>
              {!showEditor ? (
                <p className="context-box-excerpt">
                  {hasDraft ? previewExcerpt : "Jos will draft the close step from this loop."}
                </p>
              ) : null}
              {showEditor ? (
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
                </div>
              ) : null}
              <div className="context-box-tools">
                {!hasDraft ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void onDraft()}
                    disabled={busy}
                  >
                    {busy ? "Drafting…" : "Draft close step"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={onToggleEditor}
                    disabled={busy}
                  >
                    {showEditor ? "Done editing" : "Edit draft"}
                  </button>
                )}
              </div>
            </div>

            <div className="proposed-actions proposed-actions--primary">
              <button
                type="button"
                className="btn primary"
                onClick={() => void onApprove()}
                disabled={busy || !hasDraft}
              >
                {busy ? "Working…" : "Approve now"}
              </button>
              <button
                type="button"
                className="btn"
                disabled
                title="Scheduled approve is on the V1 roadmap"
              >
                Approve later
              </button>
            </div>

            <p className="proposed-trust">Nothing submits until you approve.</p>
          </>
        ) : (
          <div className="proposed-idle">
            <p className="proposed-headline proposed-headline--idle">Pick an open loop</p>
            <p className="proposed-empty">
              This panel follows the task: draft, edit, and approve live here. You do not pick a widget.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}