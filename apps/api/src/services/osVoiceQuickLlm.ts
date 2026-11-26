import Anthropic from "@anthropic-ai/sdk";
import { env, hasLiveLlm } from "../lib/env.js";

/** Tier C — one-shot fn answer. No tools, no loop. */
export async function voiceQuickAnswerLlm(transcript: string): Promise<string | null> {
  if (!hasLiveLlm() || env.llmProvider !== "anthropic") return null;
  const text = transcript.trim();
  if (text.length < 2) return null;
  try {
    const client = new Anthropic({ apiKey: env.anthropicApiKey });
    const res = await client.messages.create({
      model: env.llmModel,
      max_tokens: 220,
      system:
        "You are Jos, the hands-free brain of Juvantage OS. Answer in one or two short spoken sentences. " +
        "No markdown, no lists, no preamble. If you cannot answer safely, say you will open it in the work queue.",
      messages: [{ role: "user", content: text }],
    });
    const answer = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/\s+/g, " ");
    return answer.length > 0 ? answer : null;
  } catch {
    return null;
  }
}