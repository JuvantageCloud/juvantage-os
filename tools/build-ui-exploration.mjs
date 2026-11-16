#!/usr/bin/env node
/**
 * Builds 7 UI style packs — Mac-native pixel sizes, product-faithful wire UI.
 * Run: npm run ui:exploration
 * PNGs: npm run ui:exploration:png (requires playwright)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAC, screenBody } from "./ui-exploration-screens.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "assets/ui-exploration");

const STYLES = [
  {
    dir: "01-flagship-cream",
    name: "Flagship Cream",
    tagline: "Teal agent · cream canvas · serif calm",
    fontDisplay: '"Iowan Old Style", Palatino, Georgia, serif',
    fontUi: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    bg: "#e8ebe8",
    canvas: "#fcfbf7",
    ink: "#0b1220",
    muted: "rgba(11,18,32,.55)",
    hair: "rgba(11,18,32,.12)",
    card: "#ffffff",
    navBg: "#f3f2ed",
    accent: "#0d7a6f",
    accentSoft: "#e6f3f1",
    accentText: "#2d5a56",
    danger: "#c45c26",
    radius: "14px",
    radiusSm: "10px",
    shadow: "0 12px 40px rgba(11,18,32,.08)",
    agent: "#0d7a6f",
    wallpaper: "linear-gradient(160deg,#dfe8e6,#c5d4d1 45%,#b7c9c5)",
  },
  {
    dir: "02-linear-void",
    name: "Linear Void",
    tagline: "Dark focus · violet accent · crisp lists",
    fontDisplay: '"Inter", system-ui, sans-serif',
    fontUi: '"Inter", system-ui, sans-serif',
    bg: "#0c0c0f",
    canvas: "#141419",
    ink: "#ececf1",
    muted: "rgba(236,236,241,.55)",
    hair: "rgba(236,236,241,.1)",
    card: "#1c1c24",
    navBg: "#12121a",
    accent: "#8b7cf8",
    accentSoft: "rgba(139,124,248,.15)",
    accentText: "#c4b8ff",
    danger: "#f87171",
    radius: "10px",
    radiusSm: "8px",
    shadow: "0 16px 48px rgba(0,0,0,.45)",
    agent: "#8b7cf8",
    wallpaper: "linear-gradient(160deg,#1a1a22,#0c0c0f)",
  },
  {
    dir: "03-notion-warm",
    name: "Notion Warm",
    tagline: "Paper white · brown ink · soft blocks",
    fontDisplay: '"Source Serif 4", Georgia, serif',
    fontUi: '"Segoe UI", system-ui, sans-serif',
    bg: "#f5f2eb",
    canvas: "#fffdf8",
    ink: "#37352f",
    muted: "rgba(55,53,47,.6)",
    hair: "rgba(55,53,47,.09)",
    card: "#ffffff",
    navBg: "#f7f6f3",
    accent: "#c45c26",
    accentSoft: "#fde8dc",
    accentText: "#9a4118",
    danger: "#eb5757",
    radius: "6px",
    radiusSm: "4px",
    shadow: "0 1px 3px rgba(55,53,47,.12)",
    agent: "#0d7a6f",
    wallpaper: "linear-gradient(160deg,#f0ebe0,#e8dfd0)",
  },
  {
    dir: "04-brutalist-mono",
    name: "Brutalist Mono",
    tagline: "Black frame · mono type · zero decoration",
    fontDisplay: '"IBM Plex Mono", ui-monospace, monospace',
    fontUi: '"IBM Plex Mono", ui-monospace, monospace',
    bg: "#f0f0f0",
    canvas: "#ffffff",
    ink: "#000000",
    muted: "#444444",
    hair: "#000000",
    card: "#ffffff",
    navBg: "#fafafa",
    accent: "#000000",
    accentSoft: "#ffff00",
    accentText: "#000000",
    danger: "#ff0000",
    radius: "0px",
    radiusSm: "0px",
    shadow: "4px 4px 0 #000",
    agent: "#000000",
    wallpaper: "#e0e0e0",
  },
  {
    dir: "05-apple-vibrant",
    name: "Apple Vibrant",
    tagline: "Vibrancy · SF · native macOS",
    fontDisplay: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    fontUi: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    bg: "linear-gradient(145deg, #d8e8f8 0%, #e8e0f4 50%, #f5e6dc 100%)",
    canvas: "rgba(255,255,255,.92)",
    ink: "#1d1d1f",
    muted: "rgba(29,29,31,.55)",
    hair: "rgba(29,29,31,.12)",
    card: "rgba(255,255,255,.95)",
    navBg: "rgba(255,255,255,.6)",
    accent: "#0071e3",
    accentSoft: "rgba(0,113,227,.12)",
    accentText: "#0071e3",
    danger: "#ff3b30",
    radius: "16px",
    radiusSm: "12px",
    shadow: "0 8px 32px rgba(0,0,0,.12)",
    agent: "#0d7a6f",
    wallpaper: "linear-gradient(145deg,#d8e8f8,#e8e0f4,#f5e6dc)",
  },
  {
    dir: "06-stripe-indigo",
    name: "Stripe Indigo",
    tagline: "Indigo CTA · roomy type · trust",
    fontDisplay: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
    fontUi: 'system-ui, -apple-system, sans-serif',
    bg: "#f6f9fc",
    canvas: "#ffffff",
    ink: "#0a2540",
    muted: "#425466",
    hair: "#e6ebf1",
    card: "#ffffff",
    navBg: "#f6f9fc",
    accent: "#635bff",
    accentSoft: "#f2f0ff",
    accentText: "#4f46e5",
    danger: "#df1b41",
    radius: "12px",
    radiusSm: "8px",
    shadow: "0 15px 35px rgba(50,50,93,.1), 0 5px 15px rgba(0,0,0,.07)",
    agent: "#0d7a6f",
    wallpaper: "linear-gradient(160deg,#eef2f7,#f6f9fc)",
  },
  {
    dir: "07-jos-round",
    name: "Jos Round",
    tagline: "Rounded UI · teal Jos · friendly copy",
    fontDisplay: '"Nunito", "Segoe UI", sans-serif',
    fontUi: '"Nunito", "Segoe UI", sans-serif',
    bg: "#e8f6f4",
    canvas: "#fafeff",
    ink: "#134e4a",
    muted: "rgba(19,78,74,.65)",
    hair: "rgba(19,78,74,.12)",
    card: "#ffffff",
    navBg: "#ecfdf9",
    accent: "#14b8a6",
    accentSoft: "#ccfbf1",
    accentText: "#0f766e",
    danger: "#f97316",
    radius: "22px",
    radiusSm: "16px",
    shadow: "0 12px 0 rgba(19,78,74,.08)",
    agent: "#14b8a6",
    wallpaper: "linear-gradient(160deg,#ccfbf1,#e8f6f4)",
  },
];

const SCREENS = [
  { id: "01-sign-in", title: "25 · Sign in", kind: "desktop", ...MAC.desktop },
  { id: "02-onboarding-connect", title: "16 · Connect Google", kind: "desktop", ...MAC.desktop },
  { id: "03-agent-idle", title: "01 · Agent on Mac", kind: "solo", ...MAC.soloScene },
  { id: "04-agent-nudge", title: "02 · Agent nudge", kind: "solo", ...MAC.soloScene },
  { id: "05-quick-sheet-mail", title: "05 · Quick sheet mail", kind: "sheet", ...MAC.sheet },
  { id: "06-quick-sheet-episodic", title: "Screen note sheet", kind: "sheet", ...MAC.sheet },
  { id: "07-desktop-work", title: "08 · Work home (MVP)", kind: "desktop", ...MAC.desktop },
  { id: "08-evidence-drawer", title: "11 · Evidence drawer", kind: "desktop", ...MAC.desktop },
  { id: "09-connectors", title: "16 · Google linked", kind: "desktop", ...MAC.desktop },
  { id: "10-settings-privacy", title: "19 · Privacy", kind: "desktop", ...MAC.desktop },
  { id: "11-approve-success", title: "06 · Sheet closed", kind: "sheet", ...MAC.sheet },
  { id: "12-synced-inbox", title: "14–15 · Synced feed", kind: "desktop", ...MAC.desktop },
  { id: "13-tray-menu", title: "23 · Menu bar", kind: "tray", ...MAC.menuBar },
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function galleryCss(t) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;600;700&family=Nunito:wght@400;600;700;800&family=Source+Serif+4:opsz,wght@8..60,600&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${t.fontUi}; font-size: 13px; color: ${t.ink}; background: ${t.bg}; }
    .top { position: sticky; top: 0; z-index: 5; padding: 20px 28px; background: ${t.canvas}; border-bottom: 1px solid ${t.hair}; }
    .top h1 { margin: 0 0 6px; font-family: ${t.fontDisplay}; font-size: 1.5rem; }
    .top p { margin: 0; color: ${t.muted}; max-width: 70ch; line-height: 1.45; font-size: 0.9rem; }
    .stack { max-width: 1040px; margin: 0 auto; padding: 32px 20px 96px; display: flex; flex-direction: column; gap: 48px; }
    figure { margin: 0; }
    figcaption { margin-top: 12px; font-size: 0.8rem; font-weight: 700; color: ${t.muted}; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    figcaption code { font-size: 0.75rem; opacity: 0.85; }
    .mac-frame { background: ${t.card}; border: 1px solid ${t.hair}; border-radius: ${t.radius}; box-shadow: ${t.shadow}; overflow: hidden; flex-shrink: 0; font-size: 12px; }
    .mac-frame.desktop { width: ${MAC.desktop.w}px; height: ${MAC.desktop.h}px; }
    .mac-frame.sheet { width: ${MAC.sheet.w}px; height: ${MAC.sheet.h}px; margin: 0 auto; }
    .mac-frame.solo { width: ${MAC.soloScene.w}px; height: ${MAC.soloScene.h}px; }
    .mac-frame.tray { width: ${MAC.menuBar.w}px; height: ${MAC.menuBar.h}px; margin: 0 auto; }
    .mac-frame.desktop, .mac-frame.solo { max-width: 100%; transform-origin: top left; }
    @media (max-width: 1000px) {
      .mac-frame.desktop, .mac-frame.solo { transform: scale(calc(100vw / ${MAC.desktop.w + 40})); margin-bottom: -120px; }
    }
    .titlebar { height: 38px; display: flex; align-items: center; gap: 12px; padding: 0 14px; border-bottom: 1px solid ${t.hair}; background: ${t.card}; font-weight: 600; font-size: 12px; }
    .win-title { flex: 1; text-align: center; font-family: ${t.fontDisplay}; }
    .win-actions { font-size: 11px; color: ${t.muted}; }
    .traffic { display: flex; gap: 6px; }
    .traffic i { width: 10px; height: 10px; border-radius: 50%; display: block; }
    .traffic .r { background: #ff5f57; } .traffic .y { background: #febc2e; } .traffic .g { background: #28c840; }
    .desk-body { display: grid; grid-template-columns: 168px 1fr; height: calc(100% - 38px); min-height: 0; }
    .desk-nav { background: ${t.navBg}; border-right: 1px solid ${t.hair}; padding: 14px 10px; display: flex; flex-direction: column; gap: 4px; text-align: left; }
    .nav-item { border: none; background: transparent; border-radius: ${t.radiusSm}; padding: 8px 10px; cursor: default; color: ${t.ink}; font-family: inherit; width: 100%; text-align: left; }
    .nav-item.on { background: ${t.card}; box-shadow: 0 1px 0 ${t.hair}; color: ${t.accentText}; }
    .nav-label { display: block; font-weight: 700; font-size: 12px; }
    .nav-sub { display: block; font-size: 10px; color: ${t.muted}; margin-top: 2px; }
    .nav-sep { height: 1px; background: ${t.hair}; margin: 8px 4px; border: none; }
    .desk-main { padding: 18px 20px; overflow: auto; background: ${t.canvas}; }
    .desk-main h1, .desk-main h2 { font-family: ${t.fontDisplay}; margin: 0 0 8px; }
    .lede { color: ${t.muted}; line-height: 1.45; margin: 0 0 14px; font-size: 12px; }
    .fine { font-size: 10px; color: ${t.muted}; margin-top: 12px; }
    .muted { color: ${t.muted}; font-size: 11px; margin: 4px 0 0; }
    .btn { font-family: inherit; border-radius: ${t.radiusSm}; padding: 8px 12px; font-weight: 600; font-size: 11px; border: 1px solid ${t.hair}; background: ${t.card}; color: ${t.ink}; cursor: default; }
    .btn.primary, .btn.accent { background: ${t.accent}; color: #fff; border-color: ${t.accent}; }
    .btn.ghost { background: transparent; }
    .btn.block { width: 100%; }
    .btn.mini { padding: 4px 8px; font-size: 10px; }
    .status-strip { font-size: 11px; padding: 8px 12px; border-radius: ${t.radiusSm}; background: ${t.accentSoft}; margin-bottom: 12px; }
    .chips-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 14px; }
    .chip-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${t.muted}; margin-right: 4px; }
    .chip { border: 1px solid ${t.hair}; border-radius: 999px; padding: 4px 10px; font-size: 10px; font-weight: 700; background: ${t.card}; cursor: default; font-family: inherit; color: ${t.ink}; }
    .chip.on { background: ${t.accent}; color: #fff; border-color: ${t.accent}; }
    .work-split { display: grid; grid-template-columns: 1fr 1.15fr; gap: 14px; min-height: 360px; }
    .loop-list { display: flex; flex-direction: column; gap: 8px; }
    .loop-row { text-align: left; border: 1px solid ${t.hair}; border-radius: ${t.radiusSm}; padding: 10px; background: ${t.card}; font-family: inherit; cursor: default; width: 100%; color: ${t.ink}; }
    .loop-row.sel { border-color: ${t.accent}; background: ${t.accentSoft}; }
    .loop-row.muted { border-style: dashed; font-size: 11px; color: ${t.muted}; }
    .loop-meta { display: block; font-size: 10px; color: ${t.muted}; margin-top: 4px; }
    .detail-pane h2 { font-size: 1rem; margin-top: 4px; }
    .detail-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .pill { display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 8px; border-radius: 999px; margin-right: 6px; }
    .pill-warn { background: ${t.danger}; color: #fff; }
    .pill-soon { background: ${t.accentSoft}; color: ${t.accentText}; }
    .pill-quiet { border: 1px solid ${t.hair}; }
    input, textarea { width: 100%; border: 1px solid ${t.hair}; border-radius: ${t.radiusSm}; padding: 8px; font-family: inherit; font-size: 11px; background: ${t.card}; color: ${t.ink}; margin-top: 4px; }
    textarea { min-height: 88px; resize: none; line-height: 1.4; }
    textarea.tall { min-height: 200px; }
    .field-label { display: block; font-size: 10px; font-weight: 700; margin-top: 8px; }
    .conn-card { border: 1px solid ${t.hair}; border-radius: ${t.radius}; padding: 14px; margin-bottom: 10px; display: grid; gap: 8px; }
    .conn-card.on { border-color: ${t.accent}; }
    .state { font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .state.ok { color: ${t.accent}; }
    .state.off { color: ${t.muted}; }
    .row-btns { display: flex; gap: 8px; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${t.hair}; }
    .toggle.on { color: ${t.accent}; font-weight: 800; }
    .signin-body { display: grid; place-items: center; height: calc(100% - 38px); background: ${t.canvas}; }
    .signin-card { width: 320px; padding: 24px; border: 1px solid ${t.hair}; border-radius: ${t.radius}; background: ${t.card}; }
    .eyebrow { font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${t.accent}; margin: 0 0 8px; }
    .sheet-panel { padding: 14px; height: 100%; display: flex; flex-direction: column; gap: 6px; background: ${t.canvas}; overflow: auto; }
    .sheet-meta { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: ${t.muted}; }
    .sheet-title { font-family: ${t.fontDisplay}; font-size: 1rem; margin: 0; line-height: 1.3; }
    .tool-hint { font-size: 11px; color: ${t.muted}; margin: 0; line-height: 1.35; }
    .chip-src { font-size: 10px; font-weight: 700; color: ${t.accentText}; }
    .evidence-toggle { background: none; border: none; font-family: inherit; font-size: 11px; font-weight: 600; color: ${t.accentText}; text-align: left; padding: 6px 0; cursor: default; }
    .evidence-lines { margin: 0; font-size: 10px; display: flex; flex-direction: column; gap: 4px; background: ${t.accentSoft}; padding: 8px; border-radius: ${t.radiusSm}; }
    .evidence-lines div { display: grid; grid-template-columns: 72px 1fr; gap: 6px; }
    .evidence-lines dt { font-weight: 700; color: ${t.muted}; margin: 0; }
    .evidence-lines dd { margin: 0; }
    .evidence-panel { border: 1px solid ${t.hair}; border-radius: ${t.radiusSm}; padding: 12px; background: ${t.accentSoft}; margin-bottom: 12px; }
    .engine-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .engine-chips span { font-size: 9px; font-weight: 700; padding: 3px 6px; border-radius: 6px; background: ${t.hair}; opacity: 0.7; }
    .sheet-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; padding-top: 8px; }
    .toast { background: ${t.accentSoft}; color: ${t.accentText}; padding: 12px; border-radius: ${t.radiusSm}; font-weight: 800; text-align: center; }
    .toast.pulse { animation: glow 1.5s ease infinite; }
    @keyframes glow { 50% { box-shadow: 0 0 0 6px ${t.accentSoft}; } }
    .center { text-align: center; }
    .mac-wallpaper { background: ${t.wallpaper}; height: 100%; position: relative; }
    .menu-bar-mock { position: absolute; top: 0; left: 0; right: 0; height: 26px; background: rgba(0,0,0,.15); font-size: 11px; padding: 4px 12px; color: ${t.ink}; backdrop-filter: blur(8px); }
    .wall-hint { position: absolute; left: 20px; bottom: 20px; font-size: 11px; color: ${t.muted}; }
    .agent-float { position: absolute; right: 32px; bottom: 40px; width: 80px; height: 88px; border-radius: 20px; background: radial-gradient(circle at 50% 35%,#f7f3e8,${t.agent} 72%); border: 2px solid rgba(255,255,255,.45); box-shadow: 0 8px 24px rgba(0,0,0,.2); }
    .agent-float.mini { position: relative; right: auto; bottom: auto; margin: 12px auto; width: 56px; height: 60px; }
    .agent-float.nudge { animation: bob 1.2s ease infinite; }
    .agent-face { display: block; width: 32px; height: 24px; margin: 28px auto 0; border-radius: 40%; background: #f7f3e8; }
    .agent-float .badge { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: ${t.danger}; color: #fff; font-size: 11px; font-weight: 800; display: grid; place-items: center; }
    @keyframes bob { 50% { transform: translateY(-6px); } }
    .sheet-ghost { position: absolute; right: 28px; bottom: 140px; width: 200px; padding: 8px; font-size: 10px; border: 1px dashed ${t.hair}; border-radius: 12px; background: ${t.card}; opacity: 0.85; }
    .tray-scene { background: ${t.wallpaper}; height: 100%; padding-top: 8px; }
    .tray-menu { margin: 8px auto 0; width: 220px; background: rgba(40,40,40,.92); color: #fff; border-radius: 10px; padding: 6px; font-size: 12px; }
    .tray-menu p { margin: 0; padding: 8px 10px; border-radius: 6px; }
    .tray-menu hr { border: none; border-top: 1px solid rgba(255,255,255,.15); margin: 4px 0; }
    .inbox-split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .feed { margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; }
    .single-detail { max-width: 640px; }
  `;
}

function buildGallery(style) {
  const artboards = SCREENS.map(
    (s) => `  <figure>
    <div class="mac-frame ${s.kind}" id="${s.id}" data-export="${s.id}">
      ${screenBody(s, style)}
    </div>
    <figcaption>
      <span>${esc(s.title)}</span>
      <code>${s.w}×${s.h} pt · ${s.id}.png</code>
    </figcaption>
  </figure>`,
  ).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(style.name)} — Juvantage OS wire gallery</title>
  <style>${galleryCss(style)}</style>
</head>
<body>
  <header class="top">
    <h1>${esc(style.name)}</h1>
    <p>${esc(style.tagline)} · <strong>Mac sizes</strong> — Desktop ${MAC.desktop.w}×${MAC.desktop.h}, Quick sheet ${MAC.sheet.w}×${MAC.sheet.h}.
    Same flows as the running app (Work, Approve, Google, evidence). Run <code>npm run ui:exploration:png</code> to fill <code>images/*.png</code>.</p>
  </header>
  <main class="stack">
${artboards}
  </main>
</body>
</html>`;
}

function buildStyleMd(style) {
  return `# ${style.name}

${style.tagline}

## Mac artboard sizes

| Surface | Pixels |
|---------|--------|
| Desktop window | ${MAC.desktop.w}×${MAC.desktop.h} |
| Quick sheet | ${MAC.sheet.w}×${MAC.sheet.h} |
| Solo scene (agent) | ${MAC.soloScene.w}×${MAC.soloScene.h} |

## Files

- \`gallery.html\` — full product wire at native size (scroll if needed)
- \`images/*.png\` — export with \`npm run ui:exploration:png\`

## Product mapping

| Screen id | OS_UI_MAP |
|-----------|-----------|
| 07-desktop-work | Frame 08 Work home |
| 05-quick-sheet-mail | Frame 05 draft |
| 02-onboarding-connect | Frame 16 connect |
`;
}

function buildHub() {
  const cards = STYLES.map(
    (s) => `    <a class="card" href="./${s.dir}/gallery.html">
      <img class="cover" src="./${s.dir}/images/07-desktop-work.png" alt="" onerror="this.src='./${s.dir}/images/00-cover.jpg';this.onerror=null" />
      <div class="body">
        <h2>${esc(s.name)}</h2>
        <p>${esc(s.tagline)}</p>
        <span class="go">Open full wire gallery →</span>
      </div>
    </a>`,
  ).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Juvantage OS — UI style packs (Mac sizes)</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0b1220; color: #f5f5f5; }
    header { padding: 32px 28px 16px; max-width: 920px; line-height: 1.5; }
    h1 { margin: 0 0 8px; font-size: 1.75rem; }
    .lead { color: rgba(255,255,255,.65); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px 28px 60px; max-width: 1200px; }
    .card { display: block; background: #141a28; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; text-decoration: none; color: inherit; overflow: hidden; }
    .card:hover { border-color: rgba(255,255,255,.35); }
    .cover { width: 100%; aspect-ratio: 980/680; object-fit: cover; object-position: top; background: #222; display: block; }
    .body { padding: 16px 20px 20px; }
    .card h2 { margin: 0 0 6px; font-size: 1.1rem; }
    .card p { margin: 0 0 12px; font-size: 0.85rem; color: rgba(255,255,255,.6); }
    .go { font-size: 0.8rem; font-weight: 700; color: #6ee7d8; }
  </style>
</head>
<body>
  <header>
    <h1>Pick a UI direction</h1>
    <p class="lead">Seven styles · <strong>real Mac dimensions</strong> · full Work / sheet / connect / privacy wires.
    Thumbnails from <code>07-desktop-work.png</code> after PNG export. Mix packs via <code>PICKER.md</code>.</p>
  </header>
  <div class="grid">
${cards}
  </div>
</body>
</html>`;
}

function main() {
  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(path.join(outRoot, "index.html"), buildHub());

  for (const style of STYLES) {
    const dir = path.join(outRoot, style.dir);
    const imgDir = path.join(dir, "images");
    fs.mkdirSync(imgDir, { recursive: true });
    fs.writeFileSync(path.join(dir, "STYLE.md"), buildStyleMd(style));
    fs.writeFileSync(path.join(dir, "gallery.html"), buildGallery(style));
  }

  console.log(`Built ${STYLES.length} style packs (Mac-native wire galleries).`);
}

main();