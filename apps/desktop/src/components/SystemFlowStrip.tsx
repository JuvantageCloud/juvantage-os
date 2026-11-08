type FlowStep = {
  id: string;
  label: string;
  hint: string;
  active?: boolean;
};

/** Explains Connect vs Loops — wires → raw store → obligations → close. */
export function SystemFlowStrip(props: { highlight: "connect" | "loops" | "inbox" }) {
  const steps: FlowStep[] = [
    {
      id: "connect",
      label: "Connect",
      hint: "Wire Gmail & Calendar into the Brain",
      active: props.highlight === "connect",
    },
    {
      id: "sync",
      label: "Sync",
      hint: "Pull raw threads & events (Inbox mirror)",
      active: props.highlight === "inbox",
    },
    {
      id: "extract",
      label: "Extract",
      hint: "Turn mail into open loops",
      active: props.highlight === "connect",
    },
    {
      id: "loops",
      label: "Loops",
      hint: "Draft → Approve → send — nothing auto-sends",
      active: props.highlight === "loops",
    },
  ];

  return (
    <div className="flow-strip" aria-label="How Juvantage OS flows">
      {steps.map((step, i) => (
        <div key={step.id} className="flow-step-wrap">
          <div className={`flow-step ${step.active ? "flow-step--on" : ""}`}>
            <span className="flow-step-num">{i + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <span>{step.hint}</span>
            </div>
          </div>
          {i < steps.length - 1 ? <span className="flow-arrow" aria-hidden /> : null}
        </div>
      ))}
    </div>
  );
}
