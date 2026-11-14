import { OsSensors } from "./components/OsSensors";
import { AgentFloat } from "./windows/AgentFloat";
import { QuickSheet } from "./windows/QuickSheet";
import { Desktop } from "./windows/Desktop";

function routeFromHash(): "agent" | "sheet" | "desktop" {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("route");
  if (q === "sheet") return "sheet";
  if (q === "desktop") return "desktop";
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (raw.startsWith("sheet")) return "sheet";
  if (raw.startsWith("desktop")) return "desktop";
  return "agent";
}

export function App() {
  const route = routeFromHash();

  return (
    <>
      {/* JOS-3: sensors own clip/ambient in exactly one surface — quick sheet (or Electron agent). */}
      {route === "sheet" || route === "agent" ? <OsSensors /> : null}
      {route === "sheet" ? <QuickSheet /> : null}
      {route === "desktop" ? <Desktop /> : null}
      {route === "agent" ? <AgentFloat /> : null}
    </>
  );
}
