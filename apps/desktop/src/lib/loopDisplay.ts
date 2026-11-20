import type { LoopWithProposal } from "@juvantage/shared";

/** Waitlist-style channel pill (Gmail · Portal · PDF · …). */
export type MergedEar = { source: string; title: string };

export function mergedEarsFromEvidence(evidence: unknown): MergedEar[] {
  if (!evidence || typeof evidence !== "object") return [];
  const children = (evidence as { childSources?: unknown }).childSources;
  if (!Array.isArray(children)) return [];
  return children
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const row = c as { source?: string; title?: string };
      const source = row.source?.trim();
      const title = row.title?.trim() ?? "";
      if (!source) return null;
      return { source, title };
    })
    .filter((x): x is MergedEar => x != null);
}

export function loopChannelTag(loop: LoopWithProposal): string {
  const ev = loop.evidence as Record<string, unknown> | null;
  if (loop.source === "gmail") return "Gmail";
  if (loop.source === "google_calendar") return "Calendar";
  if (loop.source === "voice") return "Voice";
  if (loop.source === "clip") return "Clip";
  if (loop.objectType === "pdf") return "PDF";
  if (loop.source === "episodic") {
    const app = String(ev?.app ?? "").toLowerCase();
    if (/chrome|safari|firefox|edge/.test(app) || ev?.url) return "Portal";
    if (/preview|pdf|acrobat/.test(app)) return "PDF";
    return "Screen";
  }
  return "Context";
}

export function loopStallLabel(loop: LoopWithProposal): string {
  const mail = loop.evidence as { ageHours?: number } | null;
  if (mail?.ageHours != null && mail.ageHours >= 24) {
    const d = Math.max(1, Math.round(mail.ageHours / 24));
    return `${d}d stalled`;
  }
  if (loop.band === "critical") return "Urgent";
  if (loop.band === "high") return "Due soon";
  if (loop.kind === "appointment") return "Confirm";
  return "Waiting";
}

/** Numbered / bullet lines for the waitlist checklist. */
export function stepsFromProposalBody(body: string): string[] {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const steps: string[] = [];
  for (const line of lines) {
    const m = line.match(/^(\d+[\).:]|[-*•])\s*(.+)$/);
    if (m) steps.push(m[2] ?? line);
    else if (steps.length < 6 && line.length < 120) steps.push(line);
    if (steps.length >= 5) break;
  }
  if (!steps.length && body.trim()) {
    return [body.trim().slice(0, 160)];
  }
  return steps;
}

export function proposedHeadline(loop: LoopWithProposal, proposalTitle: string): string {
  if (proposalTitle.trim()) return proposalTitle.trim();
  const hint =
    loop.summary?.trim() ||
    (loop.kind === "reply_owed" ? "Draft your reply, then approve to send." : "Review and approve the next step.");
  return hint;
}