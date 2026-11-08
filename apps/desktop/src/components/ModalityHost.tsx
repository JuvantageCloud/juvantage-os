import type { LoopWithProposal, Proposal } from "@juvantage/shared";
import { resolveModalityId } from "@juvantage/shared";
import { draftKindLabel } from "../lib/draftMeta";
import { BlockedHintSurface } from "./surfaces/BlockedHintSurface";
import { MailComposeSurface } from "./surfaces/MailComposeSurface";
import { StructuredNoteSurface } from "./surfaces/StructuredNoteSurface";

type Props = {
  loop: LoopWithProposal;
  proposal: Proposal | null;
  draftTitle: string;
  draftBody: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  busy?: boolean;
};

export function ModalityHost({
  loop,
  proposal,
  draftTitle,
  draftBody,
  onTitleChange,
  onBodyChange,
  busy,
}: Props) {
  const modality = resolveModalityId(loop.objectType, proposal?.kind);

  if (!proposal) {
    return (
      <div className="modality-surface modality-surface--empty">
        <header className="modality-surface-head">
          <span className="modality-badge">{draftKindLabel(null)}</span>
        </header>
        <p className="modality-empty-copy">
          Tap <strong>Draft</strong> — Brain fuses connector + ambient context and opens the right editor here.
        </p>
      </div>
    );
  }

  if (modality === "blocked_hint") {
    return <BlockedHintSurface objectType={loop.objectType} />;
  }

  if (modality === "mail_compose") {
    return (
      <MailComposeSurface
        loop={loop}
        proposal={proposal}
        subject={draftTitle}
        body={draftBody}
        onSubjectChange={onTitleChange}
        onBodyChange={onBodyChange}
        disabled={busy}
      />
    );
  }

  const voiceIntent = (loop.evidence as { intent?: string } | null)?.intent;
  const label =
    modality === "event_compose"
      ? "Calendar"
      : loop.objectType === "clip"
        ? "Clip"
        : loop.objectType === "voice"
          ? voiceIntent === "email"
            ? "Voice · email draft"
            : "Voice"
          : "Note";

  return (
    <StructuredNoteSurface
      title={draftTitle}
      body={draftBody}
      proposal={proposal}
      modalityLabel={label}
      onTitleChange={onTitleChange}
      onBodyChange={onBodyChange}
      disabled={busy}
    />
  );
}
