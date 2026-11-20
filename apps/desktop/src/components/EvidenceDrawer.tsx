import { useEffect, useMemo, useState } from "react";
import type { EvidenceLine, LoopWithProposal } from "@juvantage/shared";
import { evidenceLinesForLoop, evidenceLinesFromContextPack } from "@juvantage/shared";
import { fetchLoopContext } from "../lib/api";

type Props = {
  loop: LoopWithProposal;
  open: boolean;
  onToggle: () => void;
};

export function EvidenceDrawer({ loop, open, onToggle }: Props) {
  const [pack, setPack] = useState<Awaited<ReturnType<typeof fetchLoopContext>> | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchLoopContext(loop.id)
      .then((p) => {
        if (!cancelled) setPack(p);
      })
      .catch(() => {
        if (!cancelled) setPack(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, loop.id]);

  const lines = useMemo(() => {
    const base = evidenceLinesForLoop({
      source: loop.source,
      objectType: loop.objectType,
      evidence: loop.evidence,
      ambient: loop.ambient,
      routerConf: loop.routerConf,
    });
    const fused = evidenceLinesFromContextPack(pack);
    return [...base, ...fused];
  }, [loop, pack]);

  return (
    <section className="evidence-drawer" aria-label="Retrieved context">
      <button type="button" className="evidence-drawer-toggle" onClick={onToggle}>
        <span>Context used for this proposal</span>
        <span className="evidence-drawer-chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        lines.length ? (
          <dl className="evidence-lines">
            {lines.map((line: EvidenceLine) => (
              <div key={line.key} className="evidence-line">
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="evidence-empty">No fused context on this loop yet — sync and extract, or clip with evidence.</p>
        )
      ) : null}
    </section>
  );
}
