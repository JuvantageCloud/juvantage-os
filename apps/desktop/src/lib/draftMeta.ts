import type { LoopWithProposal, Proposal } from "@juvantage/shared";

type Module = { id: string; title: string; sub: string };

export function closeEngineModules(
  loop: LoopWithProposal | null,
  proposal: Proposal | null,
): Module[] {
  if (!loop) return [];
  const modules: Module[] = [];

  if (loop.source === "gmail") {
    modules.push({
      id: "wire",
      title: "Gmail",
      sub: "Connector — thread in sync store",
    });
  } else if (loop.source === "google_calendar") {
    modules.push({
      id: "wire",
      title: "Calendar",
      sub: "Connector — event in sync store",
    });
  } else if (loop.source === "clip") {
    modules.push({
      id: "wire",
      title: "Clip",
      sub: "Hotkey context — not mail",
    });
  }

  if (loop.ambient) {
    modules.push({ id: "ambient", title: "Ambient", sub: "App / title ledger ≤24h" });
  }
  if (loop.evidence) {
    modules.push({ id: "evidence", title: "Evidence", sub: "Thread id, from, age" });
  }

  modules.push({
    id: "close",
    title: "Close engine",
    sub: proposal
      ? /LLM/i.test(proposal.rationale ?? "")
        ? "LLM-polished draft"
        : "Template draft"
      : "Waiting for Draft",
  });

  return modules;
}

export function draftKindLabel(proposal: Proposal | null): string {
  if (!proposal) return "Draft";
  if (proposal.kind === "reply") return "Reply draft";
  if (proposal.kind === "event") return "Event draft";
  if (proposal.kind === "todo") return "Next-step draft";
  return "Draft";
}

/** @deprecated use closeEngineModules in UI */
export function draftEngineChips(
  loop: LoopWithProposal | null,
  proposal: Proposal | null,
): string[] {
  return closeEngineModules(loop, proposal).map((m) => m.title);
}
