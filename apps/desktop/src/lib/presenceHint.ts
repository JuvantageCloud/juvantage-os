import type { PresenceHint } from "@juvantage/shared";

/** Frontmost app/title for Brain rank (Electron ambient or macOS episodic reader). */
export async function readPresenceHint(): Promise<PresenceHint | null> {
  const eye = window.juvantageOs?.episodicContext;
  if (eye) {
    try {
      const ctx = await eye();
      const app = ctx.app?.trim();
      const winTitle = ctx.title?.trim();
      if (ctx.ok && (app || winTitle)) {
        return { app: app || undefined, title: winTitle || undefined };
      }
    } catch {
      /* ignore */
    }
  }

  const amb = window.juvantageOs?.ambientSample;
  if (amb) {
    try {
      const s = await amb();
      if (s.app && s.app !== "Unknown") {
        return {
          app: s.app,
          title: s.title?.trim() || undefined,
        };
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}