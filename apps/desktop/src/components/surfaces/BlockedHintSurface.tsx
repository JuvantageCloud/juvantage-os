type Props = {
  objectType?: string | null;
};

export function BlockedHintSurface({ objectType }: Props) {
  return (
    <div className="modality-surface modality-surface--blocked">
      <header className="modality-surface-head">
        <span className="modality-badge">Needs context</span>
      </header>
      <p>
        Signal too weak to propose a close ({objectType ?? "hint"}). Sync mail, clip with real selection, or quiet
        this item.
      </p>
    </div>
  );
}
