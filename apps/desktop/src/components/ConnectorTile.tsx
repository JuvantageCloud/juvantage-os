import type { OsConnector, OsSyncSummary } from "@juvantage/shared";

const META: Record<
  OsConnector["provider"],
  { glyph: string; unit: string; count: (s: OsSyncSummary | null) => number }
> = {
  gmail: { glyph: "✉", unit: "threads", count: (s) => s?.mailCount ?? 0 },
  google_calendar: { glyph: "◷", unit: "events", count: (s) => s?.calCount ?? 0 },
};

export function ConnectorTile({
  connector,
  summary,
}: {
  connector: OsConnector;
  summary: OsSyncSummary | null;
}) {
  const live = connector.status === "connected";
  const meta = META[connector.provider];
  const count = meta.count(summary);

  return (
    <article className={`connector-tile ${live ? "connector-tile--live" : ""}`}>
      <div className="connector-tile-icon" aria-hidden>
        {meta.glyph}
      </div>
      <div className="connector-tile-body">
        <header>
          <h2>{connector.label}</h2>
          <span className={`pill ${live ? "pill--live" : ""}`}>
            {live ? "Live" : connector.status}
          </span>
        </header>
        <dl className="connector-tile-stats">
          <div>
            <dt>In store</dt>
            <dd>{live ? count : "—"}</dd>
            <dd className="unit">{meta.unit}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{connector.mode ?? "—"}</dd>
          </div>
          <div>
            <dt>Last sync</dt>
            <dd>
              {connector.lastSyncAt
                ? new Date(connector.lastSyncAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Never"}
            </dd>
          </div>
        </dl>
        <p className="connector-tile-detail">{connector.detail ?? "Not wired yet"}</p>
        {connector.hasToken ? (
          <span className="connector-tile-badge">Token encrypted</span>
        ) : null}
      </div>
    </article>
  );
}
