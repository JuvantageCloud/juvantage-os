import type { OsConnector, OsSyncSummary } from "@juvantage/shared";

const META: Record<
  OsConnector["provider"],
  { glyph: string; blurb: string; count: (s: OsSyncSummary | null) => number; unit: string }
> = {
  gmail: {
    glyph: "✉",
    blurb: "Finds replies you still owe. Sends only after Approve.",
    count: (s) => s?.mailCount ?? 0,
    unit: "messages synced",
  },
  google_calendar: {
    glyph: "◷",
    blurb: "Spots meetings to confirm. Can create/lock events on Approve.",
    count: (s) => s?.calCount ?? 0,
    unit: "events synced",
  },
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
            {live ? (connector.mode === "demo" ? "Demo" : "Linked") : "Not linked"}
          </span>
        </header>
        <p className="connector-tile-detail">{meta.blurb}</p>
        <dl className="connector-tile-stats">
          <div>
            <dt>Synced</dt>
            <dd>{live ? count : "—"}</dd>
            <dd className="unit">{meta.unit}</dd>
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
        {connector.hasToken ? (
          <span className="connector-tile-badge">Tokens encrypted</span>
        ) : null}
      </div>
    </article>
  );
}
