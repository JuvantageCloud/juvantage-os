#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_SCREENS, MAC } from "./lib/layout-mac-sizes.mjs";
import { LAYOUT_IDS, renderScreen } from "./lib/layout-render.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "assets/ui-layout-exploration");

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function galleryCss() {
  return `
    * { box-sizing: border-box; }
    body { margin: 0; font: 13px/1.45 system-ui, -apple-system, sans-serif; color: #e8eaed; background: #0f1117; }
    .top { position: sticky; top: 0; z-index: 3; padding: 20px 28px; background: #141820; border-bottom: 1px solid rgba(255,255,255,.08); }
    .top h1 { margin: 0 0 6px; font-size: 1.4rem; }
    .top p { margin: 0; color: #9aa0a6; max-width: 72ch; line-height: 1.5; }
    .stack { max-width: 1080px; margin: 0 auto; padding: 28px 16px 96px; display: flex; flex-direction: column; gap: 56px; }
    figcaption { margin-top: 10px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; font-weight: 700; color: #9aa0a6; }
    figcaption code { font-weight: 500; }
    .mac { background: #181b24; border: 1px solid rgba(255,255,255,.1); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.35); flex-shrink: 0; font-size: 12px; color: #e8eaed; }
    .mac.desktop, .mac.bridge { width: ${MAC.desktop.w}px; height: ${MAC.desktop.h}px; }
    .mac.sheet { width: ${MAC.sheet.w}px; height: ${MAC.sheet.h}px; margin: 0 auto; }
    .mac.solo { width: ${MAC.solo.w}px; height: ${MAC.solo.h}px; }
    .mac.tray { width: ${MAC.tray.w}px; height: ${MAC.tray.h}px; margin: 0 auto; }
    @media (max-width: 1020px) { .mac.desktop, .mac.solo, .mac.bridge { transform: scale(0.92); transform-origin: top left; margin-bottom: -40px; } }
    .titlebar { height: 36px; display: flex; align-items: center; gap: 10px; padding: 0 12px; border-bottom: 1px solid rgba(255,255,255,.08); background: #1c1f28; font-weight: 600; font-size: 12px; }
    .win-title { flex: 1; text-align: center; }
    .win-actions { color: #9aa0a6; font-size: 11px; }
    .traffic i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-right: 4px; }
    .traffic .r { background: #ff5f57; } .traffic .y { background: #febc2e; } .traffic .g { background: #28c840; }
    .desk-body { display: grid; grid-template-columns: 168px 1fr; height: calc(100% - 36px); }
    .desk-nav { background: #141820; border-right: 1px solid rgba(255,255,255,.08); padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item { border: none; background: transparent; color: #ccc; text-align: left; padding: 8px; border-radius: 8px; font: inherit; width: 100%; cursor: default; }
    .nav-item.on { background: #252a36; color: #6ee7d8; }
    .nav-label { display: block; font-weight: 700; font-size: 12px; }
    .nav-sub { display: block; font-size: 10px; color: #888; }
    .nav-sep { height: 1px; background: rgba(255,255,255,.08); margin: 6px 4px; border: none; }
    .main { background: #181b24; overflow: auto; }
    .main.pad { padding: 18px 20px; }
    .main.split { display: grid; grid-template-columns: 1fr 1.15fr; gap: 12px; padding: 14px; height: calc(100% - 36px); }
    .loop-list { display: flex; flex-direction: column; gap: 8px; }
    .loop { border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 10px; }
    .loop.on { border-color: #6ee7d8; background: rgba(110,231,216,.08); }
    .loop.dim { border-style: dashed; color: #888; }
    .meta { color: #9aa0a6; font-size: 11px; }
    .pill { font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 3px 7px; border-radius: 999px; margin-right: 4px; display: inline-block; }
    .pill.warn { background: #f87171; color: #fff; }
    .pill.soon { background: rgba(110,231,216,.2); color: #6ee7d8; }
    .lbl { display: block; font-size: 10px; font-weight: 700; margin-top: 8px; }
    input, textarea { width: 100%; margin-top: 4px; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; background: #0f1117; color: #eee; padding: 8px; font: inherit; }
    textarea { min-height: 80px; resize: none; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .btn { border: 1px solid rgba(255,255,255,.15); background: transparent; color: #eee; padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 11px; cursor: default; }
    .btn.primary { background: #6ee7d8; color: #0b1220; border-color: #6ee7d8; }
    .btn.block { width: 100%; margin-top: 8px; }
    .top-tabs { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,.08); background: #141820; }
    .top-tabs button { border: none; background: transparent; color: #888; padding: 6px 10px; border-radius: 6px; font-weight: 600; cursor: default; }
    .top-tabs button.on { background: #252a36; color: #6ee7d8; }
    .top-tabs .spacer { flex: 1; }
    .inbox-split { display: grid; grid-template-columns: 300px 1fr; height: calc(100% - 72px); }
    .threads { border-right: 1px solid rgba(255,255,255,.08); padding: 12px; overflow: auto; }
    .threads h3 { font-size: 10px; text-transform: uppercase; color: #888; margin: 12px 0 6px; }
    .thread { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
    .thread.on { background: rgba(110,231,216,.06); margin: 0 -12px; padding-left: 12px; }
    .compose { padding: 16px; }
    .hero-wrap { height: calc(100% - 36px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .hero-card { width: min(520px, 100%); border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 18px; background: #1c1f28; }
    .center { text-align: center; }
    .callout { border: 1px dashed #6ee7d8; border-radius: 10px; padding: 12px; margin-top: 12px; color: #6ee7d8; }
    .flow { padding: 20px; height: calc(100% - 36px); overflow: auto; }
    .vflow { list-style: none; margin: 0; padding: 0; }
    .vflow li { display: grid; grid-template-columns: 32px 1fr; gap: 12px; margin-bottom: 16px; }
    .vflow li span { width: 28px; height: 28px; border-radius: 50%; background: #333; display: grid; place-items: center; font-weight: 800; }
    .vflow li.active span { background: #6ee7d8; color: #0b1220; }
    .vflow li.done span { background: #333; color: #888; }
    .rail-body { display: grid; grid-template-columns: 52px 1fr 220px; height: calc(100% - 36px); }
    .icon-rail { background: #141820; border-right: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; gap: 8px; padding: 10px 6px; align-items: center; }
    .ir { width: 36px; height: 36px; border: none; border-radius: 8px; background: transparent; color: #aaa; font-size: 16px; cursor: default; }
    .ir.on { background: #252a36; color: #6ee7d8; }
    .ctx-rail { border-left: 1px solid rgba(255,255,255,.08); padding: 14px; font-size: 11px; overflow: auto; }
    .ctx-rail dl { display: grid; grid-template-columns: 64px 1fr; gap: 4px; }
    .ctx-rail dt { color: #888; }
    .compose { overflow: auto; padding: 16px; }
    .hub-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 20px; height: calc(100% - 80px); }
    .hub-card { border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 16px; }
    .hub-card.hot { border-color: #6ee7d8; }
    .hub-card.wide { grid-column: span 3; }
    .hub-card .big { font-size: 2rem; font-weight: 800; margin: 4px 0; }
    .hub-footer { padding: 12px 20px; border-top: 1px solid rgba(255,255,255,.08); font-size: 12px; }
    .signin { height: calc(100% - 36px); display: grid; place-items: center; }
    .signin-card { width: 320px; padding: 20px; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; background: #1c1f28; }
    .eyebrow { font-size: 10px; font-weight: 800; color: #6ee7d8; text-transform: uppercase; }
    .conn { border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 12px; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
    .conn.on { border-color: #6ee7d8; }
    .ok { color: #6ee7d8; font-weight: 700; font-size: 11px; }
    .sheet { padding: 14px; height: calc(100% - 36px); display: flex; flex-direction: column; gap: 6px; overflow: auto; }
    .toast { background: rgba(110,231,216,.15); color: #6ee7d8; padding: 10px; border-radius: 8px; font-weight: 700; text-align: center; }
    .solo { height: 100%; background: linear-gradient(160deg,#3a4a48,#1a2220); position: relative; }
    .menubar { position: absolute; top: 0; left: 0; right: 0; height: 24px; background: rgba(0,0,0,.2); font-size: 11px; padding: 4px 10px; }
    .menubar.slim { position: relative; }
    .agent { position: absolute; right: 40px; bottom: 50px; width: 72px; height: 80px; border-radius: 18px; background: #0d7a6f; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
    .agent.nudge { animation: bob 1.2s ease infinite; }
    .abadge { position: absolute; top: -6px; right: -6px; background: #f87171; color: #fff; width: 20px; height: 20px; border-radius: 50%; font-size: 11px; font-weight: 800; display: grid; place-items: center; }
    @keyframes bob { 50% { transform: translateY(-8px); } }
    .solo-note { position: absolute; left: 20px; bottom: 20px; font-size: 11px; color: rgba(255,255,255,.5); max-width: 260px; }
    .bridge { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; padding: 40px; height: calc(100% - 36px); }
    .mini-sheet, .mini-desk { border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 20px; min-height: 200px; }
    .arrow { color: #6ee7d8; font-weight: 800; }
    .timeline { list-style: none; padding: 0; }
    .timeline li { display: grid; grid-template-columns: 48px 1fr; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .row-set { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
    .evidence { background: rgba(110,231,216,.08); padding: 12px; border-radius: 8px; }
    .evidence dl { display: grid; grid-template-columns: 90px 1fr; gap: 4px; font-size: 11px; }
    .audit { width: 100%; border-collapse: collapse; font-size: 11px; }
    .audit th, .audit td { border-bottom: 1px solid rgba(255,255,255,.08); text-align: left; padding: 6px; }
    .tray-wrap { height: 100%; background: linear-gradient(160deg,#3a4a48,#222); padding-top: 8px; }
    .tray { width: 220px; margin: 0 auto; background: rgba(30,30,30,.95); border-radius: 10px; padding: 6px; color: #fff; }
    .tray p { margin: 0; padding: 8px 10px; border-radius: 6px; }
    .tray hr { border: none; border-top: 1px solid rgba(255,255,255,.15); margin: 4px 0; }
    .link { background: none; border: none; color: #6ee7d8; font: inherit; padding: 0; text-align: left; cursor: default; }
    h1, h2, h3 { margin: 0 0 8px; }
  `;
}

function buildGallery(layout) {
  const figures = APP_SCREENS.map((s) => {
    const html = renderScreen(layout.id, s);
    return `  <figure>
    <div class="mac ${s.kind}" id="${s.id}" data-export="${s.id}">
      ${html}
    </div>
    <figcaption>
      <span>UI map ${s.map ?? "—"} · ${esc(s.title)}</span>
      <code>${s.w}×${s.h} · ${s.id}.png</code>
    </figcaption>
  </figure>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(layout.name)} — layout pack</title>
  <style>${galleryCss()}</style>
</head>
<body>
  <header class="top">
    <h1>${esc(layout.name)}</h1>
    <p>${esc(layout.blurb)} Full product map: sign-in, agent, sheet (mail/voice/screen), bridge, work, evidence, context, synced, connectors, settings, privacy, audit, tray. <strong>Neutral chrome</strong> — layout only. Export: <code>npm run ui:layout:png</code></p>
  </header>
  <main class="stack">
${figures}
  </main>
</body>
</html>`;
}

function buildHub() {
  const cards = LAYOUT_IDS.map(
    (l) => `    <a class="card" href="./${l.id}/gallery.html">
      <span class="tag">Layout</span>
      <h2>${esc(l.name)}</h2>
      <p>${esc(l.blurb)}</p>
      <span class="go">18 screens →</span>
    </a>`,
  ).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>7 layout packs</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0b1220;color:#eee;padding:32px 24px 60px}
h1{margin:0 0 10px}
.lede{color:#9aa0a6;max-width:60ch;line-height:1.5}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:24px;max-width:1100px}
.card{display:block;padding:18px 20px;border:1px solid #333;border-radius:14px;text-decoration:none;color:inherit;background:#141a28}
.card:hover{border-color:#6ee7d8}
.tag{font-size:10px;font-weight:800;color:#6ee7d8;text-transform:uppercase}
.go{color:#6ee7d8;font-size:12px;font-weight:700}
</style></head><body>
<h1>7 layout packs (not themes)</h1>
<p class="lede">Same services plugged in everywhere: Gmail, Calendar, episodic fuse, voice, SSE, audit, privacy quartet. Pick a <strong>structure</strong> via <code>PICKER.md</code>.</p>
<div class="grid">${cards}</div>
</body></html>`;
}

function main() {
  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(path.join(outRoot, "index.html"), buildHub());
  for (const layout of LAYOUT_IDS) {
    const dir = path.join(outRoot, layout.id);
    const imgDir = path.join(dir, "images");
    fs.mkdirSync(imgDir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "LAYOUT.md"),
      `# ${layout.name}\n\n${layout.blurb}\n\nSee \`gallery.html\` · images via \`npm run ui:layout:png\`.\n`,
    );
    fs.writeFileSync(path.join(dir, "gallery.html"), buildGallery(layout));
  }
  console.log(`Built ${LAYOUT_IDS.length} layout packs at assets/ui-layout-exploration/`);
}

main();