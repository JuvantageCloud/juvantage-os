import type { Proposal } from "@juvantage/shared";

type Props = {
  proposal: Proposal | null;
  body: string;
  onBodyChange: (v: string) => void;
  disabled?: boolean;
};

type DiffLine = { kind: "add" | "del" | "ctx"; text: string };

function parseDiffLines(body: string): DiffLine[] {
  const lines: DiffLine[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
      lines.push({ kind: "ctx", text: line });
      continue;
    }
    if (line.startsWith("+")) lines.push({ kind: "add", text: line.slice(1).trimStart() });
    else if (line.startsWith("-")) lines.push({ kind: "del", text: line.slice(1).trimStart() });
    else if (/^proposed next steps:/i.test(line)) break;
    else lines.push({ kind: "ctx", text: line });
  }
  return lines.slice(0, 80);
}

export function CodeDiffSurface({ proposal, body, onBodyChange, disabled }: Props) {
  const rows = parseDiffLines(body);
  const hasDiff = rows.some((r) => r.kind === "add" || r.kind === "del");

  return (
    <div className="modality-surface modality-surface--code">
      <header className="modality-surface-head">
        <span className="modality-badge">Code</span>
        <span className="modality-surface-title">Proposed changes</span>
      </header>
      {hasDiff ? (
        <pre className="code-diff" aria-label="Suggested diff">
          {rows.map((row, i) => (
            <DiffLineView key={`${i}-${row.text.slice(0, 24)}`} kind={row.kind} text={row.text} />
          ))}
        </pre>
      ) : (
        <p className="modality-empty-copy">
          Brain will show file-by-file diffs here (red removed, green added) when code context is
          wired. For now, edit the proposal text below.
        </p>
      )}
      <label className="modality-field modality-field--grow">
        <span>Full proposal</span>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          disabled={disabled || !proposal}
          rows={8}
        />
      </label>
    </div>
  );
}

function DiffLineView({ kind, text }: { kind: DiffLine["kind"]; text: string }) {
  return (
    <code className={`code-diff-line code-diff-line--${kind}`}>
      {kind === "add" ? "+ " : kind === "del" ? "- " : "  "}
      {text}
      {"\n"}
    </code>
  );
}