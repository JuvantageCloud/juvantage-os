import { parseMailEvidence } from "@juvantage/shared";
import type { LoopWithProposal, Proposal } from "@juvantage/shared";

type Props = {
  loop: LoopWithProposal;
  proposal: Proposal | null;
  subject: string;
  body: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  disabled?: boolean;
};

export function MailComposeSurface({
  loop,
  proposal,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  disabled,
}: Props) {
  const mail = parseMailEvidence(loop.evidence);
  const to = mail?.fromAddr ?? "";

  return (
    <div className="modality-surface modality-surface--mail">
      <header className="modality-surface-head">
        <span className="modality-badge">Mail</span>
        <span className="modality-surface-title">{proposal ? "Editable reply" : "Reply draft"}</span>
      </header>
      <label className="modality-field">
        <span>To</span>
        <input type="text" value={to} readOnly tabIndex={-1} aria-label="Reply to" />
      </label>
      <label className="modality-field">
        <span>Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          disabled={disabled || !proposal}
          aria-label="Subject"
        />
      </label>
      <label className="modality-field modality-field--grow">
        <span>Message</span>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          disabled={disabled || !proposal}
          aria-label="Message body"
          rows={12}
        />
      </label>
      {proposal?.rationale ? (
        <footer className="modality-foot">{proposal.rationale}</footer>
      ) : (
        <footer className="modality-foot modality-foot--muted">
          Brain drafted from connector thread — edit here; nothing sends until Approve.
        </footer>
      )}
    </div>
  );
}
