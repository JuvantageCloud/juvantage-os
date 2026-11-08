/** Standalone HTML for OS Google OAuth popup (matches apps/desktop global.css tokens). */

const PAGE_SHELL = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Juvantage OS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0b1220;
      background: #e3ddd2;
      box-shadow: inset 0 2px 24px rgba(11, 18, 32, 0.08);
    }
    .scene {
      width: min(440px, 100%);
      padding: 6px;
      border-radius: 12px;
      background: #ebe6dc;
      border: 1px solid rgba(11, 18, 32, 0.1);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.65),
        0 16px 40px rgba(11, 18, 32, 0.16);
    }
    .card {
      background: #fff;
      border-radius: 8px;
      border: 1px solid rgba(11, 18, 32, 0.08);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      overflow: hidden;
      text-align: center;
    }
    .card-head {
      padding: 1.5rem 1.75rem 0.25rem;
    }
    .mark {
      width: 54px;
      height: 54px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      box-shadow:
        inset 0 2px 0 rgba(255, 255, 255, 0.55),
        0 4px 10px rgba(11, 18, 32, 0.12);
    }
    .mark.ok { background: #d8ebe8; color: #0d7a6f; border: 1px solid rgba(13, 122, 111, 0.2); }
    .mark.err { background: #fde8e4; color: #c45c26; border: 1px solid rgba(196, 92, 38, 0.25); }
    .eyebrow {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(11, 18, 32, 0.42);
      margin-bottom: 0.35rem;
    }
    h1 {
      font-size: 1.38rem;
      font-weight: 500;
      letter-spacing: -0.02em;
      margin-bottom: 0.45rem;
    }
    .lead {
      font-size: 0.92rem;
      line-height: 1.5;
      color: rgba(11, 18, 32, 0.68);
      padding: 0 0.5rem 1rem;
    }
    .chip-tray {
      margin: 0 1.25rem 1.1rem;
      padding: 0.65rem;
      border-radius: 8px;
      background: #f4f1ea;
      border: 1px solid rgba(11, 18, 32, 0.08);
      box-shadow: inset 0 2px 6px rgba(11, 18, 32, 0.05);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      justify-content: center;
    }
    .chip {
      font-size: 0.74rem;
      padding: 0.32rem 0.62rem;
      border-radius: 999px;
      background: #fff;
      border: 1px solid rgba(11, 18, 32, 0.1);
      color: #1c2433;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
    }
    .fine {
      font-size: 0.78rem;
      line-height: 1.45;
      color: rgba(11, 18, 32, 0.55);
      padding: 0.95rem 1.5rem 1.1rem;
      background: #f4f1ea;
      border-top: 1px solid rgba(11, 18, 32, 0.08);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
    }
    .close-hint {
      margin-top: 0.55rem;
      font-size: 0.72rem;
      color: rgba(11, 18, 32, 0.38);
    }
  </style>
</head>
<body>${body}</body>
</html>`;

const CHECK_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const X_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

export function osGoogleOAuthSuccessHtml(): string {
  return PAGE_SHELL(`
  <div class="scene">
  <main class="card" role="status">
    <div class="card-head">
      <div class="mark ok">${CHECK_SVG}</div>
      <p class="eyebrow">Juvantage OS</p>
      <h1>You’re connected</h1>
      <p class="lead">Gmail and Calendar are linked. Close this tab and return to the desktop — your inbox is syncing now.</p>
    </div>
    <div class="chip-tray" aria-label="Connected services">
      <div class="chips">
        <span class="chip">Gmail read</span>
        <span class="chip">Gmail send · Approve only</span>
        <span class="chip">Calendar</span>
      </div>
    </div>
    <p class="fine">Tokens encrypted at rest. Nothing sends until you tap <strong>Approve</strong> on a draft.<br />
    <span class="close-hint" id="hint">Closing in a few seconds…</span></p>
  </main>
  </div>
  <script>
    (function () {
      var s = 4;
      var el = document.getElementById("hint");
      var t = setInterval(function () {
        s -= 1;
        if (el) el.textContent = s > 0 ? "Closing in " + s + "…" : "You can close this tab.";
        if (s <= 0) { clearInterval(t); try { window.close(); } catch (e) {} }
      }, 1000);
    })();
  </script>`);
}

export function osGoogleOAuthErrorHtml(message: string): string {
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return PAGE_SHELL(`
  <div class="scene">
  <main class="card" role="alert">
    <div class="card-head">
      <div class="mark err">${X_SVG}</div>
      <p class="eyebrow">Juvantage OS</p>
      <h1>Connection cancelled</h1>
      <p class="lead">${safe}</p>
    </div>
    <p class="fine">Close this window and try <strong>Connect Google</strong> again from the desktop.</p>
  </main>
  </div>`);
}
