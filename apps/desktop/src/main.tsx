import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

function Root() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const onHash = () => setTick((n) => n + 1);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
