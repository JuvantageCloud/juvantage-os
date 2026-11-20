import type { LoopWithProposal, Proposal } from "@juvantage/shared";
import { resolveModalityId } from "@juvantage/shared";
import { draftKindLabel } from "../lib/draftMeta";
import { BlockedHintSurface } from "./surfaces/BlockedHintSurface";
import { ClipContextSurface } from "./surfaces/ClipContextSurface";
import { bodyLooksLikeDiff } from "../lib/loopDisplay";
import { CodeDiffSurface } from "./surfaces/CodeDiffSurface";
import { MailComposeSurface } from "./surfaces/MailComposeSurface";
import { PdfFormSurface } from "./surfaces/PdfFormSurface";
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
          Tap <strong>Draft close step</strong>. Jos picks mail, clip, PDF, or code tools here based on
          context.
        </p>
      </div>
    );
  }

  if (modality === "blocked_hint") {
    return <BlockedHintSurface objectType={loop.objectType} />;
  }

  if (loop.objectType === "pdf" || loopChannelHintsPdf(loop)) {
    return (
      <PdfFormSurface
        proposal={proposal}
        title={draftTitle}
        body={draftBody}
        onTitleChange={onTitleChange}
        onBodyChange={onBodyChange}
        disabled={busy}
      />
    );
  }

  const objectType = String(loop.objectType ?? "");
  if (
    objectType === "code_task" ||
    (loop.source === "voice" && (loop.evidence as { intent?: string } | null)?.intent === "code") ||
    bodyLooksLikeDiff(draftBody)
  ) {
    return (
      <CodeDiffSurface
        proposal={proposal}
        body={draftBody}
        onBodyChange={onBodyChange}
        disabled={busy}
      />
    );
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

  if (loop.source === "clip" || objectType === "clip") {
    return (
      <ClipContextSurface
        loop={loop}
        proposal={proposal}
        title={draftTitle}
        body={draftBody}
        onTitleChange={onTitleChange}
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

function loopChannelHintsPdf(loop: LoopWithProposal): boolean {
  const ev = loop.evidence as { url?: string; app?: string } | null;
  const u = (ev?.url ?? "").toLowerCase();
  const app = (ev?.app ?? "").toLowerCase();
  return u.includes(".pdf") || /pdf|preview/.test(app);
}
