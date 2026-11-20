import type { Proposal } from "@juvantage/shared";

type Props = {
  proposal: Proposal | null;
  title: string;
  body: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  disabled?: boolean;
};

/** Heuristic: lines like `Label: value` become inline fields (V1 PDF extraction lands on Brain). */
function fieldLinesFromBody(body: string): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9 _-]{1,40}):\s*(.+)$/);
    if (!m) continue;
    out.push({ label: m[1]!.trim(), value: m[2]!.trim() });
    if (out.length >= 12) break;
  }
  return out;
}

export function PdfFormSurface({
  proposal,
  title,
  body,
  onTitleChange,
  onBodyChange,
  disabled,
}: Props) {
  const fields = fieldLinesFromBody(body);

  return (
    <div className="modality-surface modality-surface--pdf">
      <header className="modality-surface-head">
        <span className="modality-badge">PDF</span>
        <span className="modality-surface-title">Interactive fields</span>
      </header>
      <p className="modality-empty-copy">
        Jos maps detected PDF fields into inputs you can edit before approve. Full in-app PDF render is
        on the V1 modality roadmap.
      </p>
      <label className="modality-field">
        <span>Document</span>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled || !proposal}
        />
      </label>
      {fields.length ? (
        <div className="pdf-field-grid">
          {fields.map((f) => (
            <label key={f.label} className="modality-field">
              <span>{f.label}</span>
              <input type="text" defaultValue={f.value} readOnly={!proposal} />
            </label>
          ))}
        </div>
      ) : null}
      <label className="modality-field modality-field--grow">
        <span>Notes / overflow</span>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          disabled={disabled || !proposal}
          rows={6}
        />
      </label>
    </div>
  );
}