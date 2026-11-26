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
  { id: "plan", label: "Plan & usage" },
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
  const planSection = section === "plan";
  return (
    <div className={`settings-workbench${planSection ? " settings-workbench--plan" : ""}`}>
      <header className="settings-workbench-head">
        <button type="button" className="btn ghost settings-back" onClick={onBack}>
          ← Back
        </button>
        <span className="settings-workbench-eyebrow">Juvantage OS</span>
      </header>
      <div className="settings-workbench-split">
        <nav className="settings-nav" aria-label="Settings sections">
          <div className="settings-nav-search" aria-hidden>
            Search settings
          </div>
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
        <div
          className={`settings-detail type-body${planSection ? " settings-detail--plan" : ""}`}
        >
          {children}
        </div>
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