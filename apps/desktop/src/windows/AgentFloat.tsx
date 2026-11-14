import { useEffect, useState } from "react";
import { AgentLottie } from "../components/AgentLottie";
import { fetchOsNudge, getToken } from "../lib/api";
import "./agent-float.css";

export function AgentFloat() {
  const [nudge, setNudge] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (!getToken()) {
        if (!cancelled) {
          setNudge(false);
          setCount(0);
        }
        return;
      }
      try {
        const n = await fetchOsNudge();
        if (!cancelled) {
          setNudge(n.hasNudge);
          setCount(n.count);
        }
      } catch {
        /* ignore while API down */
      }
    }
    void poll();
    const id = window.setInterval(() => void poll(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className={`agent-float ${nudge ? "has-nudge" : ""}`}>
      <div className="agent-drag" aria-hidden title="Drag to move" />
      <button
        type="button"
        className="agent-hit"
        title={nudge ? `${count} to close — open suggestion` : "Juvantage OS — open suggestion"}
        aria-label="Open suggestion sheet"
        onClick={() => void window.juvantageOs?.toggleSheet()}
      >
        <AgentLottie />
        {nudge ? <span className="nudge-dot" aria-hidden /> : null}
      </button>
    </div>
  );
}
