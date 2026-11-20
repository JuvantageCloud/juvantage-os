/** Renders OS_UI_MAP screens for each of 7 layout architectures (neutral chrome). */

export const LAYOUT_IDS = [
  { id: "01-widened-sheet", name: "Widened sheet", blurb: "OS_UI_MAP default: nav + list + detail." },
  { id: "02-inbox-command", name: "Inbox command", blurb: "Mail threads left, draft right; tabs not side nav." },
  { id: "03-one-hero", name: "One hero", blurb: "Single obligation; queue hidden." },
  { id: "04-sheet-primary", name: "Sheet primary", blurb: "Work on float; Desktop = system pages." },
  { id: "05-vertical-flow", name: "Vertical flow", blurb: "Step spine: connect → find → draft → approve." },
  { id: "06-command-rail", name: "Command rail", blurb: "Icon rail + main + fixed context column." },
  { id: "07-hub-home", name: "Service hub", blurb: "Home grid: Mail, Calendar, Screen, Settings." },
];

function tb(label, extra = "Undock") {
  return `<div class="titlebar"><div class="traffic"><i class="r"></i><i class="y"></i><i class="g"></i></div><span class="win-title">${label}</span><span class="win-actions">${extra}</span></div>`;
}

function pills() {
  return `<span class="pill warn">Urgent</span><span class="pill soon">Mail</span>`;
}

function draftBlock(short = false) {
  const body = short
    ? "Hi Maya — Thursday works for the pilot pack."
    : `Hi Maya,

Thanks for the note on the pilot pack. I can confirm Thursday on our side.

Best,
John`;
  return `<label class="lbl">Title<input readonly value="Re: Q3 pilot pack" /></label>
<label class="lbl">Draft<textarea readonly>${body}</textarea></label>
<div class="actions"><button class="btn primary" type="button">Approve &amp; send</button><button class="btn" type="button">Quiet</button><button class="btn" type="button">Snooze</button></div>`;
}

function navWidened(active) {
  const on = (k) => (active === k ? " on" : "");
  return `<nav class="desk-nav wide">${[
    ["work", "Loops", "Open loops"],
    ["context", "Context", "Last 4 hours"],
    ["inbox", "Inbox", "Synced raw feed"],
    ["sep", "", ""],
    ["connect", "Connect", "Gmail + Calendar"],
    ["settings", "Settings", "Privacy · metrics"],
  ]
    .map(([k, label, sub]) =>
      k === "sep"
        ? `<h4 class="nav-sep"></h4>`
        : `<button type="button" class="nav-item${on(k)}"><span class="nav-label">${label}</span><span class="nav-sub">${sub}</span></button>`,
    )
    .join("")}</nav>`;
}

function navClose(active) {
  const on = (k) => (active === k ? " on" : "");
  return `<nav class="desk-nav wide">${[
    ["work", "Close", "Next to send"],
    ["synced", "Synced", "Mail feed"],
    ["sep"],
    ["connect", "Google", "Linked"],
    ["settings", "Settings", "Privacy"],
  ]
    .map((row) => {
      if (row[0] === "sep") return `<h4 class="nav-sep"></h4>`;
      const [k, label, sub] = row;
      return `<button type="button" class="nav-item${on(k)}"><span class="nav-label">${label}</span><span class="nav-sub">${sub}</span></button>`;
    })
    .join("")}</nav>`;
}

function topTabs(active) {
  const on = (k) => (active === k ? " on" : "");
  return `<div class="top-tabs"><button type="button" class="${on("inbox")}">Inbox</button><button type="button" class="${on("cal")}">Calendar</button><button type="button" class="${on("context")}">Context</button><button type="button" class="${on("audit")}">Audit</button><span class="spacer"></span><button type="button">⚙ Settings</button></div>`;
}

function iconRail(active) {
  const items = [
    ["work", "◎"],
    ["inbox", "✉"],
    ["context", "◷"],
    ["connect", "⇄"],
    ["settings", "⚙"],
  ];
  return `<div class="icon-rail">${items
    .map(
      ([k, icon]) =>
        `<button type="button" class="ir${active === k ? " on" : ""}" title="${k}">${icon}</button>`,
    )
    .join("")}</div>`;
}

function workWidened() {
  return `${tb("Juvantage OS — Loops")}
<div class="desk-body">${navWidened("work")}
<main class="main split">
  <aside class="loop-list">
    <div class="loop on">${pills()}<strong>Q3 pilot pack — Maya</strong><span class="meta">reply owed · 22h</span></div>
    <div class="loop"><span class="pill soon">Soon</span><strong>Thu standup</strong><span class="meta">calendar</span></div>
    <div class="loop dim"><em>2 screen notes hidden</em></div>
  </aside>
  <section class="detail">${pills()}<h2>Q3 pilot pack</h2><button class="link" type="button">Context used ▾</button>${draftBlock()}</section>
</main></div>`;
}

function workInbox() {
  return `${tb("Juvantage — Inbox")}${topTabs("inbox")}
<div class="inbox-split">
  <div class="threads">
    <h3>Owes reply</h3>
    <div class="thread on">${pills()}<strong>Maya · pilot pack</strong></div>
    <div class="thread"><span class="pill soon">Soon</span><strong>Investor Q3</strong></div>
    <h3>Calendar</h3>
    <div class="thread"><span class="pill soon">Soon</span><strong>Confirm standup</strong></div>
  </div>
  <div class="compose"><h2>Reply: Maya</h2><p class="meta">Router 92% · gmail</p>${draftBlock(true)}</div>
</div>`;
}

function workHero() {
  return `${tb("Juvantage OS")}
<div class="hero-wrap">
  <p class="meta center">Next to close</p>
  <div class="hero-card">${pills()}<h2>Q3 pilot pack — Maya</h2>${draftBlock(true)}</div>
  <p class="meta center"><u>4 more in queue</u> · Google linked · Settings</p>
</div>`;
}

function workSheetPrimary() {
  return `${tb("Juvantage — System")}
<div class="desk-body">${navClose("settings")}
<main class="main narrow">
  <h1>Desktop is for system pages</h1>
  <p class="meta">Mail/calendar/voice close on the <strong>340×560 quick sheet</strong> (menu bar agent). Linked: Gmail demo, Calendar demo, Brain SSE, episodic eye, voice fn, audit API.</p>
  <div class="callout">All obligation UX → open teal circle. This window: Connect, Synced feed, Privacy, Metrics, Audit.</div>
</main></div>`;
}

function workVertical() {
  return `${tb("Close loop")}
<div class="flow">
  <ul class="vflow">
    <li class="done"><span>1</span><div><strong>Google linked</strong><p class="meta">20 mail · 18 events synced</p></div></li>
    <li class="done"><span>2</span><div><strong>Found obligation</strong><p class="meta">Maya · reply owed</p></div></li>
    <li class="active"><span>3</span><div><strong>Draft ready</strong>${draftBlock(true)}</div></li>
    <li><span>4</span><div><strong>Approve &amp; verify</strong><p class="meta">Grant burns once · loop done</p><button class="btn primary" type="button">Approve &amp; send</button></div></li>
  </ul>
</div>`;
}

function workRail() {
  return `${tb("Juvantage OS")}
<div class="rail-body">${iconRail("work")}
<main class="main compose">${pills()}<h2>Maya · Q3 pilot pack</h2>${draftBlock(true)}</main>
<aside class="ctx-rail"><h3>Context</h3>
<dl><dt>Thread</dt><dd>Re: pilot timeline</dd><dt>Snippet</dt><dd>…confirm Thursday?</dd><dt>Ambient</dt><dd>Mail.app 12m</dd><dt>Audit</dt><dd>propose · pending</dd></dl>
<h3>Services</h3><p class="meta">Gmail ✓ Calendar ✓ SSE ✓ Fuse ✓</p></aside></div>`;
}

function workHub() {
  return `${tb("Juvantage OS — Home")}
<div class="hub-grid">
  <article class="hub-card hot"><h2>Mail</h2><p class="big">3</p><p class="meta">urgent replies · demo inbox</p><button class="btn primary" type="button">Open queue</button></article>
  <article class="hub-card"><h2>Calendar</h2><p class="big">2</p><p class="meta">confirmations</p></article>
  <article class="hub-card"><h2>Screen</h2><p class="big">1</p><p class="meta">episodic · local close</p></article>
  <article class="hub-card"><h2>Voice</h2><p class="meta">hold fn · draft</p></article>
  <article class="hub-card wide"><h2>System</h2><p class="meta">Connect · Privacy · Audit · Metrics · Tray · Sign-in</p></article>
</div>
<div class="hub-footer"><strong>Selected:</strong> Maya pilot pack — tap card to draft → approve</div>`;
}

function renderWork(layoutId) {
  switch (layoutId) {
    case "01-widened-sheet":
      return workWidened();
    case "02-inbox-command":
      return workInbox();
    case "03-one-hero":
      return workHero();
    case "04-sheet-primary":
      return workSheetPrimary();
    case "05-vertical-flow":
      return workVertical();
    case "06-command-rail":
      return workRail();
    case "07-hub-home":
      return workHub();
    default:
      return workWidened();
  }
}

function wrapPage(layoutId, active, title, inner) {
  if (layoutId === "02-inbox-command") {
    return `${tb(title)}${topTabs(active)}<main class="main pad">${inner}</main>`;
  }
  if (layoutId === "06-command-rail") {
    return `${tb(title)}<div class="rail-body">${iconRail(active)}<main class="main pad">${inner}</main><aside class="ctx-rail thin"><p class="meta">Services online</p></aside></div>`;
  }
  if (layoutId === "07-hub-home") {
    return `${tb(title)}<main class="main pad">${inner}</main>`;
  }
  if (layoutId === "04-sheet-primary") {
    return `${tb(title)}<div class="desk-body">${navClose(active)}<main class="main pad">${inner}</main></div>`;
  }
  const nav = layoutId === "01-widened-sheet" ? navWidened(active) : navClose(active);
  return `${tb(title)}<div class="desk-body">${nav}<main class="main pad">${inner}</main></div>`;
}

export function renderScreen(layoutId, screen) {
  const id = screen.id;
  if (id === "08-work-home") return renderWork(layoutId);

  if (id === "25-sign-in") {
    return `${tb("Juvantage OS — Desktop")}
<div class="signin"><div class="signin-card"><p class="eyebrow">25 · Sign-in</p><h1>Welcome</h1><p class="meta">Brain JWT · shell cannot forge grants</p>
<label class="lbl">Email<input readonly value="john@juvantage.com" /></label>
<label class="lbl">Password<input readonly type="password" value="••••" /></label>
<button class="btn primary block" type="button">Sign in</button></div></div>`;
  }

  if (id === "16-connect") {
    return wrapPage(
      layoutId,
      "connect",
      "Connect",
      `<h1>16 · Google hands</h1>
      <div class="conn on"><strong>Gmail</strong><span class="ok">demo connected</span><button class="btn" type="button">Sync</button></div>
      <div class="conn on"><strong>Calendar</strong><span class="ok">connected</span></div>
      <button class="btn primary" type="button">Send test to close</button>
      <p class="meta">Scopes: read + send on approve · encrypt tokens at rest</p>`,
    );
  }

  if (id === "01-agent-idle" || id === "02-agent-nudge") {
    const badge = id === "02-agent-nudge" ? `<span class="abadge">1</span>` : "";
    return `<div class="solo"><div class="menubar">Juvantage OS · File · Edit</div>
    <div class="agent ${id === "02-agent-nudge" ? "nudge" : ""}">${badge}</div>
    <p class="solo-note">01–02 · Float 112×128 · Lottie Jos · click → sheet</p></div>`;
  }

  if (id === "03-sheet-empty") {
    return `${tb("Quick sheet")}<div class="sheet"><h2>All clear</h2><p class="meta">No open loops</p><button class="btn primary block" type="button">Find unfinished</button><button class="btn block" type="button">Open Desktop</button></div>`;
  }
  if (id === "05-sheet-draft") {
    return `${tb("Quick sheet")}<div class="sheet">${pills()}<h2>Maya · pilot</h2>${draftBlock(true)}<button class="btn block" type="button">Open Desktop</button></div>`;
  }
  if (id === "06-sheet-closed") {
    return `${tb("Quick sheet")}<div class="sheet"><div class="toast">Sent · verified closed</div><p class="meta">Next: Thu standup</p>${draftBlock(true)}</div>`;
  }
  if (id === "sheet-screen") {
    return `${tb("Quick sheet")}<div class="sheet"><span class="pill soon">Screen</span><h2>npm test integration</h2><p class="meta">Fuse · no Gmail</p><button class="btn primary block" type="button">Approve locally</button></div>`;
  }
  if (id === "sheet-voice") {
    return `${tb("Quick sheet")}<div class="sheet"><span class="pill soon">Voice</span><h2>Email investors Q3</h2><textarea readonly>Draft from hold-fn…</textarea><button class="btn primary block" type="button">Approve &amp; close</button></div>`;
  }

  if (id === "07-bridge") {
    return `${tb("07 · Bridge")}
<div class="bridge"><div class="mini-sheet"><p class="meta">Sheet</p><strong>Maya pilot</strong></div>
<div class="arrow">same loopId →</div>
<div class="mini-desk"><p class="meta">Desktop Loops</p><strong selected>highlighted draft</strong></div></div>`;
  }

  if (id === "11-evidence") {
    return wrapPage(
      layoutId,
      "work",
      "Evidence",
      `<h2>11 · Context pack</h2><section class="evidence"><dl><dt>Source</dt><dd>gmail</dd><dt>Thread</dt><dd>Re: pilot</dd><dt>Session</dt><dd>—</dd><dt>Fingerprint</dt><dd>abc…</dd></dl></section>${draftBlock(true)}`,
    );
  }
  if (id === "12-context") {
    return wrapPage(
      layoutId,
      "context",
      "Context",
      `<h1>12 · Last 4 hours</h1><ul class="timeline"><li><time>2:10</time> Mail · 18m</li><li><time>1:40</time> Xcode · 6m</li><li><time>12:55</time> Calendar · 4m</li></ul><button class="btn" type="button">See more</button>`,
    );
  }
  if (id === "14-synced") {
    return wrapPage(
      layoutId,
      "inbox",
      "Synced",
      `<h1>14–15 · Raw sync store</h1><div class="two-col"><section><h3>Mail threads</h3><ul><li>Maya pilot</li><li>Investor</li></ul></section><section><h3>Calendar</h3><ul><li>Thu standup</li></ul></section></div>`,
    );
  }
  if (id === "17-settings") {
    return wrapPage(
      layoutId,
      "settings",
      "Settings",
      `<h1>17–18 · General &amp; Quiet</h1><div class="row-set"><span>Launch at login</span><span class="ok">On</span></div><div class="row-set"><span>Default quiet band</span><span>Normal</span></div>`,
    );
  }
  if (id === "19-privacy") {
    return wrapPage(
      layoutId,
      "settings",
      "Privacy",
      `<h1>19 · Privacy</h1><div class="row-set"><span>Eyes off idle ≥90s</span><span class="ok">On</span></div><div class="row-set"><span>Purge raw ≤24h</span><span class="ok">On</span></div><div class="row-set"><span>Blocklist</span><button class="btn" type="button">Edit</button></div>`,
    );
  }
  if (id === "21-audit") {
    return wrapPage(
      layoutId,
      "settings",
      "Audit",
      `<h1>21–22 · Audit log</h1><table class="audit"><tr><th>When</th><th>Event</th></tr><tr><td>now</td><td>propose mail</td></tr><tr><td>−1m</td><td>approve-send</td></tr><tr><td>−1m</td><td>verify done</td></tr></table><p class="meta">Disclosure: draft left device on approve only</p>`,
    );
  }
  if (id === "23-tray") {
    return `<div class="tray-wrap"><div class="menubar slim">􀣺 Juvantage</div><div class="tray"><p>Show agent</p><p>Quick sheet</p><p>Open Desktop</p><hr /><p>Quit</p></div></div>`;
  }

  return `<div class="placeholder">Screen ${id}</div>`;
}