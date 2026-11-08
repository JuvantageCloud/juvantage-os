import type { Proposal } from "@juvantage/shared";

type Props = {
  title: string;
  body: string;
  proposal: Proposal | null;
  modalityLabel: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  disabled?: boolean;
};

export function StructuredNoteSurface({
  title,
  body,
  proposal,
  modalityLabel,
  onTitleChange,
  onBodyChange,
  disabled,
}: Props) {
  return (
    <div className="modality-surface modality-surface--note">
      <header className="modality-surface-head">
        <span className="modality-badge">{modalityLabel}</span>
        <span className="modality-surface-title">Editable proposal</span>
      </header>
      <label className="modality-field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled || !proposal}
        />
      </label>
      <label className="modality-field modality-field--grow">
        <span>Body</span>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          disabled={disabled || !proposal}
          rows={12}
        />
      </label>
      {proposal?.rationale ? <footer className="modality-foot">{proposal.rationale}</footer> : null}
    </div>
  );
}
