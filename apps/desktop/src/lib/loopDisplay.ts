import type { LoopWithProposal } from "@juvantage/shared";

/** Waitlist-style channel pill (Gmail · Portal · PDF · …). */
export type MergedEar = { source: string; title: string };

export type StallTone = "urgent" | "soon" | "warm" | "calm" | "stale";

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

export function bodyLooksLikeDiff(body: string): boolean {
  const hits = body.split(/\r?\n/).filter((l) => /^[+-]/.test(l.trim())).length;
  return hits >= 2;
}

export function loopCardTitle(loop: LoopWithProposal, max = 72): string {
  const raw = loop.title?.trim() || "Open loop";
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1)}…`;
}

/** Screen clips that are chat dumps / runbooks should not crowd Work. */
export function loopLooksLikeNoise(loop: LoopWithProposal): boolean {
  if (loop.source !== "clip" && loop.source !== "episodic") return false;
  const t = loop.title ?? "";
  if (t.length > 140) return true;
  if (/^how i'll run from here/i.test(t)) return true;
  if (/batch ui\/brain fixes/i.test(t)) return true;
  return false;
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

export function loopStallMeta(loop: LoopWithProposal): { text: string; tone: StallTone } {
  if (loop.dueAt) {
    const due = new Date(loop.dueAt).getTime();
    if (!Number.isNaN(due)) {
      const mins = (due - Date.now()) / 60_000;
      if (mins < 0) return { text: "Overdue", tone: "urgent" };
      if (mins < 120) {
        const m = Math.max(1, Math.round(mins));
        return { text: `Due in ${m}m`, tone: "urgent" };
      }
      if (mins < 24 * 60) {
        const h = Math.max(1, Math.round(mins / 60));
        return { text: `Due in ${h}h`, tone: "soon" };
      }
      const d = Math.max(1, Math.round(mins / (24 * 60)));
      return { text: `Due in ${d}d`, tone: "calm" };
    }
  }

  const mail = loop.evidence as { ageHours?: number } | null;
  if (mail?.ageHours != null && mail.ageHours >= 24) {
    const d = Math.max(1, Math.round(mail.ageHours / 24));
    return { text: `${d}d stalled`, tone: "stale" };
  }
  if (loop.band === "critical") return { text: "Urgent", tone: "urgent" };
  if (loop.band === "high") return { text: "Due soon", tone: "soon" };
  if (loop.kind === "appointment") return { text: "Confirm", tone: "warm" };
  return { text: "Waiting", tone: "calm" };
}

/** @deprecated use loopStallMeta */
export function loopStallLabel(loop: LoopWithProposal): string {
  return loopStallMeta(loop).text;
}

const META_STEP =
  /^(confirm the quote|edit the draft|approve|skim the thread|check time on your calendar)/i;

const BRAIN_NOISE =
  /^(where:|hi[, ]|nothing is sent|juvantage|let input|fused \d|jos fused|let mvpgate|\/\/)/i;

/** User-facing checklist — only lines under “Proposed next steps”, not the draft body. */
export function stepsFromProposalBody(body: string): string[] {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const head = lines.findIndex((l) => /^proposed next steps:/i.test(l));
  const slice = head >= 0 ? lines.slice(head + 1) : lines;
  const steps: string[] = [];
  for (const line of slice) {
    if (BRAIN_NOISE.test(line)) break;
    const m = line.match(/^(\d+[\).:])\s*(.+)$/);
    if (!m) continue;
    const text = (m[2] ?? "").trim();
    if (!text || META_STEP.test(text)) continue;
    steps.push(text);
    if (steps.length >= 4) break;
  }
  if (steps.length) return steps;
  return ["Review the draft", "Edit if needed", "Approve when it matches what you owe"];
}

/** Short preview blurb for the modality panel (not the checklist block). */
export function previewExcerptFromBody(body: string): string {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const content: string[] = [];
  for (const line of lines) {
    if (/^proposed next steps:/i.test(line)) continue;
    if (/^(\d+[\).:])\s/.test(line) && META_STEP.test(line.replace(/^\d+[\).:]\s*/, ""))) continue;
    if (/^(\d+[\).:])\s/.test(line)) continue;
    if (BRAIN_NOISE.test(line)) continue;
    content.push(line);
    if (content.join(" ").length > 280) break;
  }
  const text = content.join(" ").trim();
  if (text.length > 220) return `${text.slice(0, 217)}…`;
  return text || "Your draft will show here once Jos proposes a close step.";
}

export function proposedHeadline(loop: LoopWithProposal, proposalTitle: string): string {
  if (proposalTitle.trim()) return proposalTitle.trim();
  const hint =
    loop.summary?.trim() ||
    (loop.kind === "reply_owed" ? "Draft your reply, then approve to send." : "Review and approve the next step.");
  return hint;
}