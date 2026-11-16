/**
 * Try + backpressure for execute admission.
 * A full slot does not become a blocking retry (that path is not wait-free).
 */

export type TryAdmit =
  | { ok: true }
  | { ok: false; reason: "full" };

export function tryAdmit(inFlight: number, cap: number): TryAdmit {
  if (cap <= 0 || inFlight >= cap) return { ok: false, reason: "full" };
  return { ok: true };
}

const inflight = new Map<string, number>();

export const EXECUTE_SLOT_CAP = 4;

export function tryAdmitExecute(userId: string, cap = EXECUTE_SLOT_CAP): TryAdmit {
  const n = inflight.get(userId) ?? 0;
  const decision = tryAdmit(n, cap);
  if (!decision.ok) return decision;
  inflight.set(userId, n + 1);
  return { ok: true };
}

export function releaseExecuteSlot(userId: string) {
  const n = inflight.get(userId) ?? 0;
  if (n <= 1) inflight.delete(userId);
  else inflight.set(userId, n - 1);
}
