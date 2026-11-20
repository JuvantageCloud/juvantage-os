import type { ReactNode } from "react";
import type { OsDogfoodMetrics } from "../lib/api";

export type SettingsSection =
  | "privacy"
  | "account"
  | "plan"
  | "files"
  | "filters"
  | "developer";

const NAV: { id: SettingsSection; label: string }[] = [
  { id: "privacy", label: "Privacy & sensors" },
  { id: "account", label: "Account" },
  { id: "plan", label: "Plan & billing" },
  { id: "files", label: "Files & folders" },
  { id: "filters", label: "Loop filters" },
  { id: "developer", label: "Developer" },
];

type Props = {
  section: SettingsSection;
  onSection: (id: SettingsSection) => void;
  onBack: () => void;
  children: ReactNode;
};

export function SettingsWorkbench({ section, onSection, onBack, children }: Props) {
  return (
    <div className="settings-workbench">
      <header className="settings-workbench-head">
        <h1 className="type-title">Settings</h1>
        <button type="button" className="btn primary btn-back-work" onClick={onBack}>
          ← Back to work
        </button>
      </header>
      <div className="settings-workbench-split">
        <nav className="settings-nav" aria-label="Settings sections">
          <ul>
            {NAV.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`settings-nav-item${section === item.id ? " on" : ""}`}
                  onClick={() => onSection(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="settings-detail type-body">{children}</div>
      </div>
    </div>
  );
}

export function dogfoodMetricsBlurb(metrics: OsDogfoodMetrics | null): string {
  if (!metrics) {
    return "No stats yet. After you approve or quiet a few loops, numbers show how often Jos got it right.";
  }
  return `Last 14 days: ${metrics.loops.done} closed, ${metrics.loops.open} still open, ${metrics.loops.dismissed} quieted.`;
}