import { useEffect, useState } from "react";
import { fetchLoopContext } from "../lib/api";

type Pack = Awaited<ReturnType<typeof fetchLoopContext>>;

type Props = {
  loopId: string;
  /** Bump when fuse may have changed (refresh loops). */
  refreshKey?: string | number;
};

export function ContextCanvas({ loopId, refreshKey }: Props) {
  const [pack, setPack] = useState<Pack | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchLoopContext(loopId)
        .then((p) => {
          if (!cancelled) {
            setPack(p);
            setPulse((n) => n + 1);
          }
        })
        .catch(() => {
          if (!cancelled) setPack(null);
        });
    void load();
    const timer = window.setInterval(load, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [loopId, refreshKey]);

  const events = pack?.events ?? [];

  return (
    <section
      className={`context-canvas${pulse > 0 ? " context-canvas--pulse" : ""}`}
      aria-label="Live fused context"
      key={`pulse-${pulse}`}
    >
      <header className="context-canvas-head">
        <span className="context-canvas-live" aria-hidden />
        <strong>What Jos pieced together</strong>
        <span className="context-canvas-meta">
          {pack?.eventCount != null ? `${pack.eventCount} signals` : "—"}
        </span>
      </header>
      {pack?.fingerprint ? (
        <p className="context-canvas-hint">
          Maybe you were still on: <em>{pack.fingerprint.slice(0, 72)}</em>
        </p>
      ) : (
        <p className="context-canvas-hint muted">
          Capture runs on window focus + clip. Nothing renders unless the loop stays open.
        </p>
      )}
      <ul className="context-canvas-timeline">
        {events.length ? (
          events.slice(0, 8).map((ev, i) => (
            <li
              key={`${ev.kind}-${ev.title ?? ""}-${i}`}
              className="context-canvas-event"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span className="context-canvas-kind">{ev.kind.replace(/_/g, " ")}</span>
              <span className="context-canvas-where">
                {[ev.app, ev.title].filter(Boolean).join(" · ") || "—"}
              </span>
              {ev.textPreview ? (
                <span className="context-canvas-preview">{ev.textPreview.slice(0, 120)}</span>
              ) : null}
            </li>
          ))
        ) : (
          <li className="context-canvas-event context-canvas-event--empty">
            No session ledger yet — work in the app you care about, or clip with ⌘⇧L.
          </li>
        )}
      </ul>
    </section>
  );
}