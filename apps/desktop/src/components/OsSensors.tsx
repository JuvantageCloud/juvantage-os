import { useEffect } from "react";
import { clipOsLoop, getToken, postAmbient } from "../lib/api";

/** Background ambient + clip hotkey bridge (Phase 3). */
export function OsSensors() {
  useEffect(() => {
    let cancelled = false;

    async function sampleAmbient() {
      if (!getToken() || !window.juvantageOs?.ambientSample) return;
      try {
        const sample = await window.juvantageOs.ambientSample();
        if (cancelled) return;
        await postAmbient({
          idleSeconds: sample.idleSeconds,
          events:
            sample.idleSeconds >= 90
              ? []
              : [{ app: sample.app, title: sample.title, url: sample.url }],
        });
      } catch {
        /* API or permission errors — ignore in background */
      }
    }

    async function onClip() {
      if (!getToken() || !window.juvantageOs?.clipContext) return;
      try {
        const ctx = await window.juvantageOs.clipContext();
        await clipOsLoop({
          title: ctx.title,
          summary: ctx.summary,
          app: ctx.app,
        });
      } catch {
        /* ignore */
      }
    }

    void sampleAmbient();
    const ambientId = window.setInterval(() => void sampleAmbient(), 60_000);
    const unsub = window.juvantageOs?.onClipHotkey?.(() => void onClip());

    return () => {
      cancelled = true;
      window.clearInterval(ambientId);
      unsub?.();
    };
  }, []);

  return null;
}
