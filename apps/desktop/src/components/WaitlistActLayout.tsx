import type { LoopWithProposal, Proposal, PresenceHint } from "@juvantage/shared";
import { ModalityHost } from "./ModalityHost";
import {
  loopCardTitle,
  loopChannelTag,
  loopStallMeta,
  mergedEarsFromEvidence,
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
  onLinkGoogle?: () => void;
  onFindUnfinished?: () => void;
  presenceHint?: PresenceHint | null;
  earsStatus?: string;
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
  presenceHint,
  earsStatus,
}: Props) {
  const bodyForUi = draftBody || proposal?.body || "";
  const steps = stepsFromProposalBody(bodyForUi);
  const hasDraft = Boolean(bodyForUi.trim());
  const mergedEars = selected ? mergedEarsFromEvidence(selected.evidence) : [];
  const showHost = Boolean(selected && (hasDraft || proposal) && editorOpen);

  return (
    <div className="waitlist-act waitlist-act--split" aria-labelledby="open-loops-heading">
      <aside className="waitlist-loops-col">
        <div className="context-rail type-body">
          <div className="context-rail-row">
            <span className="type-label">Now</span>
            <span>
              {presenceHint?.app ?? "Idle"}
              {presenceHint?.title ? ` · ${presenceHint.title.slice(0, 48)}` : ""}
            </span>
          </div>
          <div className="context-rail-row">
            <span className="type-label">Ears</span>
            <span>{earsStatus ?? "Not linked"}</span>
          </div>
        </div>

        <header className="open-loops-head">
          <h2 id="open-loops-heading" className="type-label">
            Open loops
          </h2>
          <span className="open-loops-count type-body">
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
                  <span className="open-loop-title type-body">{loopCardTitle(loop)}</span>
                  <span className={`open-loop-stall open-loop-stall--${stall.tone}`}>
                    {stall.text}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="open-loop-empty type-body">
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

        <p className="waitlist-loops-foot type-body">
          Same loops on Mac and iPhone. You approve before anything sends.
        </p>
      </aside>

      <section className="proposed-next proposed-next--panel context-surface" aria-label="Close surface">
        <header className="proposed-panel-head">
          <span className="type-label">Close surface</span>
        </header>

        {selected ? (
          <>
            {mergedEars.length ? (
              <p className="proposed-merged-ears type-body">
                Folded in:{" "}
                {mergedEars
                  .map(
                    (e) =>
                      `${e.source === "gmail" ? "Gmail" : e.source}${e.title ? ` · ${e.title}` : ""}`,
                  )
                  .join("; ")}
              </p>
            ) : null}

            <div className={`context-box context-box--dynamic${showHost ? " context-box--host" : ""}`}>
              {showHost ? (
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
              ) : (
                <p className="type-body context-box-idle">
                  {hasDraft
                    ? "Open the editor to use the right tool for this loop."
                    : "Jos will draft the close step, then this box becomes mail, clip, PDF, or code."}
                </p>
              )}
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
                    className="btn"
                    onClick={onToggleEditor}
                    disabled={busy}
                  >
                    {showHost ? "Collapse" : "Open editor"}
                  </button>
                )}
              </div>
            </div>

            <ol className="proposed-steps proposed-steps--compact type-body">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

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

            <p className="proposed-trust type-body">Nothing submits until you approve.</p>
          </>
        ) : (
          <div className="proposed-idle">
            <p className="type-title proposed-headline--idle">Pick an open loop</p>
            <p className="type-body proposed-empty">
              The close surface picks the right editor for the task. You do not choose widgets.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}