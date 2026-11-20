type Props = {
  gmailConnected: boolean;
  onConnect: () => void;
  onDemo: () => void;
  onExtract: () => void;
};

export function ProductHomeEmpty({
  gmailConnected,
  onConnect,
  onDemo,
  onExtract,
}: Props) {
  return (
    <div className="product-home-empty">
      <p className="product-home-kicker">Personal</p>
      <h2 className="product-home-title">Nothing open right now</h2>
      <p className="product-home-copy">
        Jos listens while you work. Open loops from mail, portal, PDF, and your screen show up here
        with one proposed next step.
      </p>
      <p className="product-home-trust">Nothing submits until you approve.</p>
      <div className="product-home-actions">
        {!gmailConnected ? (
          <>
            <button type="button" className="btn primary" onClick={onConnect}>
              Link Google (ears only)
            </button>
            <button type="button" className="btn" onClick={onDemo}>
              Try demo close
            </button>
          </>
        ) : (
          <button type="button" className="btn primary" onClick={onExtract}>
            Find unfinished
          </button>
        )}
        <span className="product-home-hint">Or clip with ⌘⇧L · use the teal sheet for quick Approve</span>
      </div>
    </div>
  );
}