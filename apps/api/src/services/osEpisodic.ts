/**
 * Episodic signal parsing (host window + text → headline/fingerprint).
 */
export const EPISODIC_SOURCE = "episodic";

export type EpisodicInput = {
  app?: string | null;
  title?: string | null;
  text?: string | null;
  idleSeconds?: number;
};

export type EpisodicSignal = {
  app: string;
  windowTitle: string;
  quote: string;
  headline: string;
  summary: string;
  fingerprint: string;
};

export function episodicSignal(input: EpisodicInput): EpisodicSignal | null {
  const app = (input.app ?? "").trim().slice(0, 80);
  const windowTitle = (input.title ?? "").trim().slice(0, 200);
  const raw = (input.text ?? "").trim().replace(/\s+/g, " ");
  const quote = raw.slice(0, 600);
  const usable = quote.length >= 8 ? quote : windowTitle.length >= 4 ? windowTitle : "";
  if (!usable) return null;
  if (app && usable.toLowerCase() === app.toLowerCase()) return null;

  const headline = (quote.length >= 8 ? quote : windowTitle).split(/[.?\n]/)[0]!.trim().slice(0, 140);
  const summary = [app || null, windowTitle || null].filter(Boolean).join(" — ");
  const fingerprint = `${app}|${windowTitle}|${usable.slice(0, 180)}`;
  return {
    app: app || "Front window",
    windowTitle,
    quote: quote.length >= 8 ? quote : windowTitle,
    headline: headline || usable.slice(0, 140),
    summary: summary || app || "Front window",
    fingerprint,
  };
}