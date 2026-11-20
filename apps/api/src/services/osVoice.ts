/**
 * Hold-fn voice capture → loop. Spoken intent is explicit user evidence, so the loop
 * ranks high and is drafted immediately; nothing executes until Approve.
 */
import { prisma } from "../db/client.js";
import { serializeLoop } from "./osLoops.js";

export type VoiceIntent = {
  intent: "email" | "todo";
  recipient: string | null;
  topic: string;
};

export type VoiceQuickAnswer = { mode: "answer"; answer: string };

const TIME_RE = /^(?:what(?:'s| is) the time|what time is it)\??$/i;
const MATH_RE = /^what(?:'s| is)\s+([\d.+\-*/()\s]+)\??$/i;

const EMAIL_RE =
  /\b(?:draft|write|send|compose|shoot)?\s*(?:an?\s+|the\s+)?(?:quick\s+)?(?:(?:email|e-mail|message)\s+(?:(?:to|for)\s+)?|(?:mail|note)\s+(?:to|for)\s+)(.+)$/i;
const TOPIC_SPLIT_RE = /\s+(?:about|re|regarding|saying|that|telling them|letting them know|to say)\s+/i;
const FILLER_RE = /^(?:hey\s+juvantage[,\s]*|ok(?:ay)?[,\s]+|so[,\s]+|please[,\s]+|can you\s+|could you\s+|i need to\s+|i want to\s+|let'?s\s+)+/i;

function tidy(s: string) {
  return s.replace(/\s+/g, " ").replace(/[\s,.;!?]+$/, "").trim();
}

/** Instant fn answers — no loop when matched (JOS-28). */
export function parseVoiceQuickAnswer(raw: string): VoiceQuickAnswer | null {
  const text = tidy(raw).replace(FILLER_RE, "");
  if (TIME_RE.test(text)) {
    const answer = new Date().toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return { mode: "answer", answer };
  }
  const math = text.match(MATH_RE);
  if (math?.[1]) {
    const expr = math[1].trim();
    if (!/^[\d.+\-*/()\s]+$/.test(expr)) return null;
    try {
      const value = Function(`"use strict"; return (${expr})`)() as unknown;
      if (typeof value === "number" && Number.isFinite(value)) {
        return { mode: "answer", answer: String(value) };
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function parseVoiceIntent(raw: string): VoiceIntent {
  const text = tidy(raw).replace(FILLER_RE, "");
  const email = text.match(EMAIL_RE);
  if (email) {
    const rest = email[1];
    const [who, ...topicParts] = rest.split(TOPIC_SPLIT_RE);
    const recipient = tidy(who.replace(/^(?:my|our|the)\s+/i, "")) || null;
    return {
      intent: "email",
      recipient,
      topic: tidy(topicParts.join(" ")),
    };
  }
  return { intent: "todo", recipient: null, topic: text };
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function voiceDraft(input: {
  transcript: string;
  intent: VoiceIntent;
}): { title: string; body: string; rationale: string } {
  const { intent } = input;
  if (intent.intent === "email") {
    const who = intent.recipient ?? "there";
    const subject = intent.topic ? capitalize(intent.topic) : "Quick update";
    const line = intent.topic
      ? `Quick note on ${intent.topic}.`
      : "Wanted to share a quick update.";
    return {
      title: subject.slice(0, 160),
      body: `Hi ${who},\n\n${line}\n\n[Your points here]\n\nBest,\nJohn`,
      rationale: `Voice: email to ${who}`,
    };
  }
  return {
    title: capitalize(intent.topic).slice(0, 160) || "Voice note",
    body: `Next step for me:\n1) ${intent.topic}\n\n(Voice — edit before approve.)`,
    rationale: "Voice → checklist",
  };
}

export class VoiceLoopError extends Error {
  status: 400;
  constructor(message: string) {
    super(message);
    this.status = 400;
  }
}

export async function createVoiceLoop(
  userId: string,
  input: { text?: string; app?: string | null },
) {
  const transcript = tidy(input.text ?? "");
  if (transcript.length < 3) {
    throw new VoiceLoopError("Didn't catch that — hold fn and speak");
  }
  const intent = parseVoiceIntent(transcript);
  const title =
    intent.intent === "email"
      ? `Email ${intent.recipient ?? "someone"}${intent.topic ? ` — ${intent.topic}` : ""}`
      : capitalize(intent.topic);

  const recentDup = await prisma.loop.findFirst({
    where: {
      userId,
      source: "voice",
      title: title.slice(0, 160),
      status: { in: ["open", "proposed"] },
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentDup) return serializeLoop(recentDup);

  const loop = await prisma.loop.create({
    data: {
      userId,
      kind: "todo",
      band: "high",
      status: "open",
      title: title.slice(0, 160),
      summary: `“${transcript.slice(0, 400)}”`,
      source: "voice",
      sourceRef: `voice-${Date.now()}`,
      objectType: "voice",
      routerConf: 0.85,
      ambientJson: input.app ? JSON.stringify({ app: input.app }) : null,
      evidenceJson: JSON.stringify({
        voice: true,
        transcript: transcript.slice(0, 2000),
        intent: intent.intent,
        recipient: intent.recipient,
        topic: intent.topic,
        spokenAt: new Date().toISOString(),
      }),
    },
  });
  return serializeLoop(loop);
}
