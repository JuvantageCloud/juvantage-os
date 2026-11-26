import type { SettingsSection } from "./SettingsWorkbench";
import type { OsDogfoodMetrics } from "../lib/api";
import { dogfoodMetricsBlurb } from "./SettingsWorkbench";
import { PlanUsagePanel } from "./PlanUsagePanel";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; service: string; llm: boolean }
  | { status: "error"; message: string };

type BandFilter = "all" | "critical" | "high" | "normal" | "quiet";
type SourceFilter = "all" | "mail" | "clip" | "calendar";

type Props = {
  section: SettingsSection;
  apiBase: string;
  health: HealthState;
  userLabel: string | null;
  metrics: OsDogfoodMetrics | null;
  band: BandFilter;
  sourceFilter: SourceFilter;
  setBand: (b: BandFilter) => void;
  setSourceFilter: (s: SourceFilter) => void;
  onLogout: () => void;
  onOpenConnect: () => void;
  onOpenSyncDebug: () => void;
  onRefreshMetrics: () => void;
  onNotify: (text: string, tone?: "info" | "error" | "success") => void;
  pct: (rate: number | null) => string;
};

const APP_PATHS = {
  downloads: "~/Downloads/JuvantageOS",
  data: "~/Library/Application Support/JuvantageOS",
  packages: "~/Library/Application Support/JuvantageOS/packages",
};

export function DesktopSettingsContent(props: Props) {
  const { section } = props;

  if (section === "privacy") {
    return (
      <div className="settings-page">
        <h1 className="settings-page-title">Privacy & sensors</h1>
        <p className="type-body">
          <strong>On:</strong> Gmail + Calendar when linked, frontmost app and window title while you are
          active, and clips you mark with <strong>⌘⇧L</strong>.
        </p>
        <p className="type-body">
          <strong>Not yet:</strong> full-screen OCR. V2 episodic eyes in the roadmap, not this build.
        </p>
        <div className="form-row">
          <span>Eyes pause when idle ≥90s</span>
          <span className="ok">On</span>
        </div>
        <div className="form-row">
          <span>Raw ambient purge</span>
          <span className="type-body">≤24h</span>
        </div>
        <p className="meta-mono type-body">{props.apiBase}</p>
        {props.health.status === "ok" ? (
          <p className="ok type-body">
            Brain up · {props.health.service}
            {props.health.llm ? " · LLM ready" : " · template drafts (no LLM key)"}
          </p>
        ) : null}
        {props.health.status === "error" ? (
          <p className="err type-body">{props.health.message}</p>
        ) : null}
      </div>
    );
  }

  if (section === "account") {
    return (
      <div className="settings-page">
        <h1 className="settings-page-title">Account</h1>
        <p className="ok type-body">{props.userLabel}</p>
        <button type="button" className="btn" onClick={props.onLogout}>
          Sign out
        </button>
      </div>
    );
  }

  if (section === "plan") {
    return <PlanUsagePanel onNotify={props.onNotify} onOpenConnect={props.onOpenConnect} />;
  }

  if (section === "files") {
    return (
      <>
        <h2 className="type-title">Files & folders</h2>
        <p className="type-body">
          Jos stores approvals and packages under Application Support. Downloads from mail attachments land
          in Downloads unless you change this in V1.
        </p>
        {Object.entries(APP_PATHS).map(([key, path]) => (
          <div key={key} className="form-row">
            <span className="type-label" style={{ textTransform: "capitalize" }}>
              {key}
            </span>
            <code className="type-body">{path}</code>
          </div>
        ))}
      </>
    );
  }

  if (section === "filters") {
    return (
      <>
        <h2 className="type-title">Loop filters</h2>
        <p className="type-body">Narrow what appears under Work. Default hides noisy screen clips.</p>
        <div className="chips" style={{ marginBottom: 12 }}>
          <span className="chip-label">Urgency</span>
          {(
            [
              ["all", "All"],
              ["critical", "Urgent"],
              ["high", "Soon"],
              ["normal", "Normal"],
              ["quiet", "Quiet"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip ${props.band === id ? "on" : ""}`}
              onClick={() => props.setBand(id)}
            >
              {label}
            </button>
          ))}
          <span className="chip-label">From</span>
          {(
            [
              ["all", "All"],
              ["mail", "Mail"],
              ["clip", "Clips"],
              ["calendar", "Calendar"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip ${props.sourceFilter === id ? "on" : ""}`}
              onClick={() => props.setSourceFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="type-title">Developer</h2>
      <p className="type-body">Dogfood stats help us tune Jos. You can ignore them day to day.</p>
      <p className="type-body">{dogfoodMetricsBlurb(props.metrics)}</p>
      <button type="button" className="btn ghost" onClick={props.onRefreshMetrics}>
        Update stats
      </button>
      {props.metrics ? (
        <div className="settings-metrics type-body">
          <div className="form-row">
            <span>Clear rate</span>
            <span>{props.pct(props.metrics.clearRate)}</span>
          </div>
          <div className="form-row">
            <span>Accept rate</span>
            <span>{props.pct(props.metrics.acceptRate)}</span>
          </div>
          <div className="form-row">
            <span>Edit rate</span>
            <span>{props.pct(props.metrics.editRate)}</span>
          </div>
        </div>
      ) : null}
      <button type="button" className="btn ghost" onClick={props.onOpenSyncDebug}>
        Open connector cache (debug)
      </button>
    </>
  );
}