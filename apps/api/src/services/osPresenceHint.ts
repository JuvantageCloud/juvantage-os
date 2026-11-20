import { prisma } from "../db/client.js";
import type { PresenceHint } from "@juvantage/shared";

const PRESENCE_WINDOW_MS = 30 * 60_000;

/** Latest host signal — used to boost loops that match what you're in now. */
export async function getPresenceHint(userId: string): Promise<PresenceHint | null> {
  const since = new Date(Date.now() - PRESENCE_WINDOW_MS);
  const ev = await prisma.contextEvent.findFirst({
    where: { userId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "desc" },
  });
  if (!ev) return null;
  const app = ev.app?.trim() || undefined;
  const title = ev.title?.trim() || undefined;
  if (!app && !title) return null;
  return { app, title };
}

export function presenceFromQuery(app?: string, title?: string): PresenceHint | null {
  const a = app?.trim();
  const t = title?.trim();
  if (!a && !t) return null;
  return { app: a || undefined, title: t || undefined };
}