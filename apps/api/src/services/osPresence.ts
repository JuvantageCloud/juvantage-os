/**
 * Dark Room scheduler (Assignment 2).
 * Idle turns eyes off (no ambient ledger, no frames).
 * Obligation ears (connector extract / sync) are not gated here — they stay on.
 */

export const EYES_OFF_AFTER_IDLE_S = 90;

export type PresencePolicy = {
  eyesOff: boolean;
  /** Connectors and obligation extract keep running. */
  earsOn: true;
  /** Raw frames are never the product memory. */
  retainFrames: false;
  recordEyeLedger: boolean;
};

export function presencePolicy(idleSeconds: number): PresencePolicy {
  const eyesOff = idleSeconds >= EYES_OFF_AFTER_IDLE_S;
  return {
    eyesOff,
    earsOn: true,
    retainFrames: false,
    recordEyeLedger: !eyesOff,
  };
}
