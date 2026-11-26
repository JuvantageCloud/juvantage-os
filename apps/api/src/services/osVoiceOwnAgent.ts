import { voiceQuickAnswerLlm } from "./osVoiceQuickLlm.js";
import { ownAgentConnected } from "./osUsage.js";

/**
 * Tier D — fn quick answer via user's connected cloud agent.
 * V1: uses same Brain LLM stack when agent connector is enabled; does not debit bundled quota.
 * V2: route to Cursor Bridge / BYO API key on the connection row.
 */
export async function voiceQuickAnswerOwnAgent(
  userId: string,
  transcript: string,
): Promise<string | null> {
  if (!(await ownAgentConnected(userId))) return null;
  return voiceQuickAnswerLlm(transcript);
}