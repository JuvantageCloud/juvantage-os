import type { LoopWithProposal, Proposal } from "@juvantage/shared";
import { parseAmbientEvidence } from "@juvantage/shared";

type Props = {
  loop: LoopWithProposal;
  proposal: Proposal | null;
  title: string;
  body: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  disabled?: boolean;
};

export function ClipContextSurface({
  loop,
  proposal,
  title,
  body,
  onTitleChange,
  onBodyChange,
  disabled,
}: Props) {
  const ev = loop.evidence as { app?: string; windowTitle?: string; quote?: string } | null;
  const amb = parseAmbientEvidence(loop.ambient);
  const app = ev?.app ?? amb?.app ?? "Screen";
  const windowTitle = ev?.windowTitle ?? amb?.title ?? "";

  return (
    <div className="modality-surface modality-surface--clip">
      <header className="modality-surface-head">
        <span className="modality-badge">Clip</span>
        <span className="modality-surface-title">Close from context</span>
      </header>
      <dl className="modality-meta-grid">
        <div>
          <dt>App</dt>
          <dd>{app}</dd>
        </div>
        {windowTitle ? (
          <div>
            <dt>Window</dt>
            <dd>{windowTitle}</dd>
          </div>
        ) : null}
      </dl>
      <label className="modality-field">
        <span>What you owe (title)</span>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled || !proposal}
        />
      </label>
      <label className="modality-field modality-field--grow">
        <span>Close step</span>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          disabled={disabled || !proposal}
          rows={10}
          placeholder="Jos turns fused context into the action you approve."
        />
      </label>
      <footer className="modality-foot modality-foot--muted">
        Not a mail client. This surface turns what you were looking at into one approvable step.
      </footer>
    </div>
  );
}