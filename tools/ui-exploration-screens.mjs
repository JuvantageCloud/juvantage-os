/** Product-faithful screen markup for UI style galleries (maps to OS_UI_MAP + running Desktop/QuickSheet). */

export const MAC = {
  desktop: { w: 980, h: 680 },
  sheet: { w: 340, h: 560 },
  soloScene: { w: 1024, h: 640 },
  menuBar: { w: 280, h: 320 },
};

export function titlebar(t, label, extra = "") {
  return `<div class="titlebar">
  <div class="traffic"><i class="r"></i><i class="y"></i><i class="g"></i></div>
  <span class="win-title">${label}</span>
  <span class="win-actions">${extra}</span>
</div>`;
}

export function deskNav(t, active) {
  const item = (key, label, sub) =>
    `<button type="button" class="nav-item${active === key ? " on" : ""}">
      <span class="nav-label">${label}</span>
      <span class="nav-sub">${sub}</span>
    </button>`;
  return `<nav class="desk-nav" aria-label="Desktop">
    ${item("work", "Work", "What you still owe")}
    ${item("synced", "Synced", "Mail &amp; calendar feed")}
    <h4 class="nav-sep" aria-hidden="true"></h4>
    ${item("google", "Google", "Linked")}
    ${item("settings", "Settings", "Privacy &amp; metrics")}
  </nav>`;
}

export function trafficPill(label, kind, t) {
  const cls =
    kind === "critical" ? "pill-warn" : kind === "high" ? "pill-soon" : "pill-quiet";
  return `<span class="pill ${cls}">${label}</span>`;
}

export function screenBody(screen, t) {
  switch (screen.id) {
    case "01-sign-in":
      return `${titlebar(t, "Juvantage OS — Desktop", "Undock")}
<div class="signin-body">
  <div class="signin-card">
    <p class="eyebrow">Brain on this Mac</p>
    <h1>Sign in</h1>
    <p class="lede">OAuth tokens and approve grants never live in the WebView shell.</p>
    <label>Email<input readonly value="john@juvantage.com" /></label>
    <label>Password<input readonly type="password" value="demo1234" /></label>
    <button class="btn primary block" type="button">Sign in</button>
    <p class="fine">Demo: john@juvantage.com / demo1234</p>
  </div>
</div>`;

    case "02-onboarding-connect":
      return `${titlebar(t, "Juvantage OS — Desktop", "Undock")}
<div class="desk-body">
  ${deskNav(t, "google")}
  <main class="desk-main">
    <h1>Google</h1>
    <p class="lede">Hands for Jos — read mail &amp; calendar. <strong>Nothing sends</strong> until you Approve on a loop.</p>
    <div class="conn-card">
      <div><strong>Gmail</strong><p class="muted">Read threads · send only after approve</p></div>
      <span class="state off">Not connected</span>
      <button class="btn primary" type="button">Connect Google</button>
    </div>
    <div class="conn-card">
      <div><strong>Calendar</strong><p class="muted">Read events · create on approve</p></div>
      <span class="state off">Not connected</span>
      <button class="btn ghost" type="button">Use demo data</button>
    </div>
    <p class="fine">Or: menu bar agent → teal circle → sign in when Brain is down.</p>
  </main>
</div>`;

    case "03-agent-idle":
      return `<div class="mac-wallpaper solo-scene">
  <div class="menu-bar-mock"><span>􀣺</span> Juvantage · File · Edit · View</div>
  <p class="wall-hint">Your Mac — only Jos floats</p>
  <div class="agent-float idle" title="Jos"><span class="agent-face"></span></div>
</div>`;

    case "04-agent-nudge":
      return `<div class="mac-wallpaper solo-scene">
  <div class="menu-bar-mock">Menu bar · Juvantage</div>
  <div class="agent-float nudge"><span class="badge">1</span><span class="agent-face"></span></div>
  <div class="sheet-ghost">Click → quick sheet (340×560)</div>
</div>`;

    case "05-quick-sheet-mail":
      return `<div class="sheet-panel">
  <header class="sheet-meta">
    <span>1 hero · mail</span>
    <button class="btn ghost mini" type="button">Desktop</button>
  </header>
  ${trafficPill("URGENT", "critical", t)}
  <span class="chip-src">Mail · reply owed</span>
  <h2 class="sheet-title">Q3 pilot pack — need your reply</h2>
  <p class="tool-hint">Jos opened Mail compose — edit, then Approve to send.</p>
  <button class="evidence-toggle" type="button">Context used for this proposal ▸</button>
  <label class="field-label">Title<input readonly value="Re: Q3 pilot pack" /></label>
  <label class="field-label">Draft<textarea readonly>Hi Maya,

Thanks for the note on the pilot pack. I can confirm Thursday works on our side.

Best,
John</textarea></label>
  <div class="engine-chips"><span>mail</span><span>gmail</span><span>92% router</span></div>
  <div class="sheet-actions">
    <button class="btn primary" type="button">Approve &amp; send</button>
    <button class="btn ghost" type="button">Quiet</button>
    <button class="btn ghost" type="button">Snooze</button>
  </div>
</div>`;

    case "06-quick-sheet-episodic":
      return `<div class="sheet-panel">
  <header class="sheet-meta"><span>Screen note</span></header>
  ${trafficPill("SOON", "high", t)}
  <span class="chip-src">Screen · local close</span>
  <h2 class="sheet-title">npm run test:integration</h2>
  <p class="tool-hint">Approve files this away. <strong>Does not</strong> send Gmail or run the command.</p>
  <button class="evidence-toggle open" type="button">Context used ▾</button>
  <dl class="evidence-lines">
    <div><dt>Source</dt><dd>Front window + clipboard</dd></div>
    <div><dt>App</dt><dd>Cursor</dd></div>
    <div><dt>Signals</dt><dd>2 fused</dd></div>
  </dl>
  <textarea readonly>Jos fused 2 signals… Edit, then Approve to close locally.</textarea>
  <button class="btn primary block" type="button">Approve</button>
</div>`;

    case "07-desktop-work":
      return `${titlebar(t, "Juvantage OS — Desktop", "Undock")}
<div class="desk-body">
  ${deskNav(t, "work")}
  <main class="desk-main work-layout">
    <h1>What you still owe</h1>
    <p class="lede">Jos finds unfinished work → draft → you Approve → sends or books.</p>
    <div class="status-strip"><strong>6</strong> to close · 20 mail synced · Edit, then Approve</div>
    <div class="chips-row">
      <span class="chip-label">Urgency</span>
      <button class="chip on" type="button">All</button>
      <button class="chip" type="button">Urgent</button>
      <button class="chip" type="button">Soon</button>
      <span class="chip-label">From</span>
      <button class="chip on" type="button">All</button>
      <button class="chip" type="button">Mail</button>
      <button class="chip" type="button">Calendar</button>
      <button class="btn accent" type="button">Find unfinished</button>
    </div>
    <div class="work-split">
      <div class="loop-list">
        <button class="loop-row sel" type="button">
          ${trafficPill("URGENT", "critical", t)}<strong>Q3 pilot pack — Maya</strong>
          <span class="loop-meta">reply owed · Mail</span>
        </button>
        <button class="loop-row" type="button">
          ${trafficPill("SOON", "high", t)}<strong>Confirm Thursday standup</strong>
          <span class="loop-meta">appointment · Calendar</span>
        </button>
        <button class="loop-row muted" type="button"><em>2 screen notes hidden — Show</em></button>
      </div>
      <div class="detail-pane">
        ${trafficPill("URGENT", "critical", t)} ${trafficPill("Mail", "quiet", t)}
        <h2>Q3 pilot pack — need your reply</h2>
        <p class="loop-meta">Reply owed · aging 22h</p>
        <button class="evidence-toggle open" type="button">Context used ▾</button>
        <dl class="evidence-lines">
          <div><dt>Thread</dt><dd>Re: Pilot timeline</dd></div>
          <div><dt>From</dt><dd>maya@example.com</dd></div>
          <div><dt>Router</dt><dd>92%</dd></div>
        </dl>
        <label class="field-label">Title<input value="Re: Q3 pilot pack" readonly /></label>
        <textarea readonly>Hi Maya,…</textarea>
        <div class="detail-actions">
          <button class="btn accent" type="button">Draft</button>
          <button class="btn primary" type="button">Approve &amp; send</button>
          <button class="btn ghost" type="button">Dismiss</button>
        </div>
      </div>
    </div>
  </main>
</div>`;

    case "08-evidence-drawer":
      return `${titlebar(t, "Work · evidence open", "Undock")}
<div class="desk-body">
  ${deskNav(t, "work")}
  <main class="desk-main work-layout single-detail">
    <h2>Q3 pilot pack</h2>
    <section class="evidence-panel">
      <h3>Context used for this proposal</h3>
      <dl class="evidence-lines full">
        <div><dt>Source</dt><dd>Gmail sync</dd></div>
        <div><dt>Subject</dt><dd>Re: Q3 pilot pack</dd></div>
        <div><dt>Snippet</dt><dd>…confirm timeline by EOD Thursday?</dd></div>
        <div><dt>Session</dt><dd>—</dd></div>
        <div><dt>Router</dt><dd>mail · 92%</dd></div>
      </dl>
    </section>
    <textarea class="tall" readonly>Full draft body…</textarea>
  </main>
</div>`;

    case "09-connectors":
      return `${titlebar(t, "Google", "Undock")}
<div class="desk-body">
  ${deskNav(t, "google")}
  <main class="desk-main">
    <h1>Google</h1>
    <p class="lede">Synced · <strong>20</strong> mail · <strong>18</strong> events</p>
    <div class="conn-card on">
      <div><strong>Gmail</strong><p class="muted">Last sync 2m ago</p></div>
      <span class="state ok">Connected · demo</span>
      <div class="row-btns"><button class="btn ghost" type="button">Sync</button><button class="btn ghost" type="button">Disconnect</button></div>
    </div>
    <div class="conn-card on">
      <div><strong>Calendar</strong><p class="muted">events.read + events.create</p></div>
      <span class="state ok">Connected</span>
    </div>
    <button class="btn primary" type="button">Send me a test to close</button>
  </main>
</div>`;

    case "10-settings-privacy":
      return `${titlebar(t, "Settings", "Undock")}
<div class="desk-body">
  ${deskNav(t, "settings")}
  <main class="desk-main">
    <h1>Privacy</h1>
    <p class="lede">Quartet: eyes off when idle · raw context purged ≤24h.</p>
    <div class="setting-row"><div><strong>Pause eyes when idle ≥ 90s</strong><p class="muted">Ears stay on (mail extract)</p></div><span class="toggle on">On</span></div>
    <div class="setting-row"><div><strong>Purge ambient &amp; context ≤ 24h</strong><p class="muted">Keep loops + proposals</p></div><span class="toggle on">On</span></div>
    <div class="setting-row"><div><strong>Blocklist apps</strong><p class="muted">Never read these front windows</p></div><button class="btn ghost" type="button">Edit</button></div>
    <p class="fine">Metrics: <code>GET /os/metrics</code> · dogfood clear rate</p>
  </main>
</div>`;

    case "11-approve-success":
      return `<div class="sheet-panel success">
  <div class="toast pulse">Sent · verified closed</div>
  <p class="lede center">Demo simulated send. Loop marked done.</p>
  <div class="agent-float mini"><span class="agent-face"></span></div>
  <button class="btn ghost block" type="button">Open Desktop</button>
</div>`;

    case "12-synced-inbox":
      return `${titlebar(t, "Synced", "Undock")}
<div class="desk-body">
  ${deskNav(t, "synced")}
  <main class="desk-main inbox">
    <h1>Mail &amp; calendar feed</h1>
    <p class="lede">Raw sync store — debug. Obligations surface on Work.</p>
    <div class="inbox-split">
      <section><h3>Mail threads</h3><ul class="feed"><li>Maya · pilot pack</li><li>Investor update</li></ul></section>
      <section><h3>Calendar</h3><ul class="feed"><li>Thu 10am standup</li><li>Fri coffee Sarah</li></ul></section>
    </div>
  </main>
</div>`;

    case "13-tray-menu":
      return `<div class="tray-scene">
  <div class="menu-bar-mock">􀣺 Juvantage</div>
  <div class="tray-menu">
    <p>Show agent</p>
    <p>Open quick sheet</p>
    <p>Open Desktop</p>
    <hr />
    <p>Quit Juvantage OS</p>
  </div>
</div>`;

    default:
      return `<div class="placeholder">Unknown screen</div>`;
  }
}