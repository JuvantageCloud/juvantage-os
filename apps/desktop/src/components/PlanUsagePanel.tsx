import { useCallback, useEffect, useState } from "react";
import type { FnRoute, OsUsageSnapshot } from "../lib/api";
import {
  fetchOsUsage,
  patchOsFnRoute,
  startBrainProCheckout,
  startBillingPortal,
} from "../lib/api";

type Props = {
  onNotify: (text: string, tone?: "info" | "error" | "success") => void;
  onOpenConnect: () => void;
};

function pct(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function parseApiError(raw: string): string {
  try {
    const data = JSON.parse(raw) as { error?: string; message?: string };
    return data.error ?? data.message ?? raw;
  } catch {
    return raw;
  }
}

function formatReset(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function UsageMeter(props: {
  title: string;
  used: number;
  limit: number;
  resetsAt: string;
}) {
  const p = pct(props.used, props.limit);
  const hot = p >= 90;
  return (
    <div className="usage-meter" data-hot={hot || undefined}>
      <div className="usage-meter-top">
        <span className="usage-meter-title">{props.title}</span>
        <span className="usage-meter-nums">
          {props.used}
          <span className="usage-meter-of"> / {props.limit}</span>
        </span>
      </div>
      <div
        className="usage-meter-track"
        role="meter"
        aria-valuenow={props.used}
        aria-valuemax={props.limit}
        aria-label={props.title}
      >
        <div className="usage-meter-fill" style={{ width: `${p}%` }} />
      </div>
      <p className="usage-meter-meta">Resets {formatReset(props.resetsAt)}</p>
    </div>
  );
}

const FN_ROUTES: { id: FnRoute; title: string; blurb: string }[] = [
  {
    id: "bundled",
    title: "Jos Brain (bundled)",
    blurb: "Included quota — best day-one experience.",
  },
  {
    id: "bundled_then_own",
    title: "Brain, then your agent",
    blurb: "Use quota first, then your connected cloud agent.",
  },
  {
    id: "own_agent",
    title: "Your cloud agent only",
    blurb: "You pay inference to your provider.",
  },
];

export function PlanUsagePanel({ onNotify, onOpenConnect }: Props) {
  const [usage, setUsage] = useState<OsUsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    return fetchOsUsage()
      .then((u) => setUsage(u))
      .catch((err: Error) => {
        const msg = parseApiError(err.message);
        onNotify(msg || "Could not load usage", "error");
      })
      .finally(() => setLoading(false));
  }, [onNotify]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onFnRoute = (fnRoute: FnRoute) => {
    if (!usage || usage.fnRoute === fnRoute) return;
    setBusy("route");
    void patchOsFnRoute(fnRoute)
      .then((u) => {
        setUsage(u);
        onNotify("Fn routing updated", "success");
      })
      .catch((err: Error) => onNotify(err.message || "Update failed", "error"))
      .finally(() => setBusy(null));
  };

  const onUpgrade = () => {
    setBusy("checkout");
    void startBrainProCheckout()
      .then((res) => {
        if (res.url) {
          window.open(res.url, "_blank", "noopener,noreferrer");
          onNotify("Checkout opened in your browser", "info");
          return;
        }
        if (res.message) {
          onNotify(res.message, res.ok ? "success" : "info");
          void reload();
        }
      })
      .catch((err: Error) => onNotify(err.message || "Checkout failed", "error"))
      .finally(() => setBusy(null));
  };

  const onPortal = () => {
    setBusy("portal");
    void startBillingPortal()
      .then((res) => {
        if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
        else onNotify(res.message ?? "No portal", "info");
      })
      .catch((err: Error) => onNotify(err.message || "Portal failed", "error"))
      .finally(() => setBusy(null));
  };

  if (loading && !usage) {
    return <p className="settings-page-muted">Loading plan & usage…</p>;
  }

  if (!usage) {
    return (
      <p className="settings-page-muted">
        Usage unavailable. Check that the Brain is running, then{" "}
        <button type="button" className="linkish" onClick={() => void reload()}>
          retry
        </button>
        .
      </p>
    );
  }

  const onPro = usage.plan === "brain_pro";

  return (
    <div className="settings-page plan-usage-page">
      <header className="settings-page-head">
        <h1 className="settings-page-title">Plan & usage</h1>
        <p className="settings-page-lede">
          Bundled Jos Brain for fn quick answers. Optional cloud agent — you pay your provider, like
          Cursor&apos;s plan vs API usage.
        </p>
        <button type="button" className="btn ghost btn-compact plan-refresh" onClick={() => void reload()}>
          Refresh
        </button>
      </header>

      <section className="settings-section">
        <h2 className="settings-section-cap">Plans</h2>
        <div className="plan-compare">
          <article className={`settings-surface plan-tile${!onPro ? " plan-tile--current" : ""}`}>
            <div className="plan-tile-head">
              <div>
                <p className="plan-tile-name">{usage.planLabel}</p>
                <p className="plan-tile-price">{usage.priceLabel}</p>
              </div>
              {!onPro ? <span className="plan-tile-pill">Current</span> : null}
            </div>
            <UsageMeter title="Quick answers" {...usage.quickAnswers} />
            <UsageMeter title="Draft polish" {...usage.draftPolish} />
          </article>

          <article
            className={`settings-surface plan-tile plan-tile--upgrade${onPro ? " plan-tile--current" : ""}`}
          >
            <div className="plan-tile-head">
              <div>
                <p className="plan-tile-name">{usage.catalog.brain_pro.label}</p>
                <p className="plan-tile-price">{usage.catalog.brain_pro.priceLabel}</p>
              </div>
              {onPro ? (
                <span className="plan-tile-pill">Current</span>
              ) : (
                <span className="plan-tile-pill plan-tile-pill--muted">Upgrade</span>
              )}
            </div>
            <p className="plan-tile-detail">
              {usage.catalog.brain_pro.quickAnswersPerDay} quick answers / day ·{" "}
              {usage.catalog.brain_pro.draftPolishPerMonth} draft polishes / mo
            </p>
            {!onPro ? (
              <button type="button" className="btn primary" disabled={Boolean(busy)} onClick={onUpgrade}>
                {busy === "checkout" ? "Opening…" : "Upgrade"}
              </button>
            ) : usage.billingPortalAvailable ? (
              <button type="button" className="btn ghost" disabled={Boolean(busy)} onClick={onPortal}>
                Manage billing
              </button>
            ) : null}
            {!usage.stripeConfigured ? (
              <p className="plan-tile-foot">Demo mode can activate Pro without Stripe.</p>
            ) : null}
          </article>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-cap">Fn routing</h2>
        <p className="settings-section-hint">Choose what happens on hold-fn when Brain can answer.</p>
        <ul className="settings-surface settings-surface--flush settings-choice-list">
          {FN_ROUTES.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={`settings-choice${usage.fnRoute === r.id ? " on" : ""}`}
                disabled={Boolean(busy)}
                onClick={() => onFnRoute(r.id)}
              >
                <span className="settings-choice-text">
                  <span className="settings-choice-title">{r.title}</span>
                  <span className="settings-choice-desc">{r.blurb}</span>
                </span>
                {usage.fnRoute === r.id ? <span className="settings-choice-check" aria-hidden>✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-cap">Cloud agent</h2>
        <div className="settings-surface settings-row">
          <div className="settings-row-text">
            <p className="settings-row-title">Bring your own agent</p>
            <p className="settings-row-desc">
              {usage.ownAgentConnected
                ? "Cursor Agents connected — fn fallover ships next."
                : "Connect when you want your agent to pick up after quota."}
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onOpenConnect}>
            {usage.ownAgentConnected ? "Manage" : "Connect"}
          </button>
        </div>
      </section>
    </div>
  );
}