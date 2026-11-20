const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
  shell,
  globalShortcut,
  powerMonitor,
  clipboard,
} = require("electron");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const execFileAsync = promisify(execFile);

const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";

/** @type {BrowserWindow | null} */
let agentWindow = null;
/** @type {BrowserWindow | null} */
let sheetWindow = null;
/** @type {BrowserWindow | null} */
let desktopWindow = null;
/** @type {Tray | null} */
let tray = null;
/** Quit flag — skip relaunch when user is exiting. */
let isQuitting = false;
/** @type {ReturnType<typeof setInterval> | null} */
let agentWatchdog = null;

function rendererUrl(hash) {
  const base = isDev ? DEV_URL : `file://${path.join(__dirname, "../dist/index.html")}`;
  if (isDev) return `${base}/#/${hash}`;
  return `${base}#/${hash}`;
}

function tealTrayIcon() {
  const iconPath = path.join(__dirname, "tray-icon.png");
  const img = nativeImage.createFromPath(iconPath);
  return img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 18, height: 18 });
}

function createAgentWindow() {
  const display = screen.getPrimaryDisplay().workArea;
  const width = 112;
  const height = 128;
  const x = Math.round(display.x + display.width - width - 28);
  const y = Math.round(display.y + display.height - height - 36);

  agentWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  agentWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  agentWindow.setAlwaysOnTop(true, "floating");
  agentWindow.loadURL(rendererUrl("agent"));
  agentWindow.once("ready-to-show", () => agentWindow?.showInactive());
  agentWindow.on("closed", () => {
    agentWindow = null;
    // Phase 6: agent must come back unless we're quitting.
    if (!isQuitting) {
      setTimeout(() => ensureAgentWindow("closed"), 350);
    }
  });
  agentWindow.webContents.on("render-process-gone", (_e, details) => {
    console.error("[os] agent render-process-gone", details?.reason, details?.exitCode);
    if (!isQuitting) {
      try {
        agentWindow?.destroy();
      } catch {
        /* ignore */
      }
      agentWindow = null;
      setTimeout(() => ensureAgentWindow("render-gone"), 500);
    }
  });
}

function ensureAgentWindow(reason = "watchdog") {
  if (isQuitting) return;
  if (agentWindow && !agentWindow.isDestroyed()) {
    if (!agentWindow.isVisible()) agentWindow.showInactive();
    return;
  }
  console.log(`[os] relaunch agent (${reason})`);
  createAgentWindow();
}

function createSheetWindow() {
  sheetWindow = new BrowserWindow({
    width: 340,
    height: 560,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  sheetWindow.setAlwaysOnTop(true, "floating");
  sheetWindow.loadURL(rendererUrl("sheet"));
  sheetWindow.on("blur", () => {
    // Keep open if user is interacting; hide only when empty click-away later
  });
  sheetWindow.on("closed", () => {
    sheetWindow = null;
  });
}

function createDesktopWindow() {
  desktopWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 720,
    minHeight: 480,
    show: false,
    title: "Juvantage OS",
    backgroundColor: "#FCFBF7",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  desktopWindow.loadURL(rendererUrl("desktop"));
  desktopWindow.on("closed", () => {
    desktopWindow = null;
  });
}

function positionSheetNearAgent() {
  if (!sheetWindow) return;
  const display = screen.getPrimaryDisplay().workArea;
  let ax = display.x + display.width - 112 - 28;
  let ay = display.y + display.height - 128 - 36;
  if (agentWindow && !agentWindow.isDestroyed()) {
    const b = agentWindow.getBounds();
    ax = b.x;
    ay = b.y;
  }
  const sw = 340;
  const sh = 560;
  let x = Math.round(ax + 112 - sw);
  let y = Math.round(ay - sh - 12);
  x = Math.max(display.x + 12, Math.min(x, display.x + display.width - sw - 12));
  y = Math.max(display.y + 12, Math.min(y, display.y + display.height - sh - 12));
  sheetWindow.setBounds({ x, y, width: sw, height: sh });
}

function toggleQuickSheet() {
  if (!sheetWindow || sheetWindow.isDestroyed()) createSheetWindow();
  if (sheetWindow.isVisible()) {
    sheetWindow.hide();
    return;
  }
  positionSheetNearAgent();
  sheetWindow.show();
  sheetWindow.focus();
}

function showDesktop(loopId) {
  if (!desktopWindow || desktopWindow.isDestroyed()) createDesktopWindow();
  const hash =
    typeof loopId === "string" && loopId
      ? `desktop?loopId=${encodeURIComponent(loopId)}`
      : "desktop";
  desktopWindow.loadURL(rendererUrl(hash));
  if (sheetWindow?.isVisible()) sheetWindow.hide();
  desktopWindow.show();
  desktopWindow.focus();
}

function undockToSolo() {
  if (desktopWindow && !desktopWindow.isDestroyed()) desktopWindow.hide();
  if (!agentWindow || agentWindow.isDestroyed()) createAgentWindow();
  else agentWindow.show();
}

function createTray() {
  tray = new Tray(tealTrayIcon());
  tray.setToolTip("Juvantage OS");
  const menu = Menu.buildFromTemplate([
    {
      label: "Show Agent",
      click: () => {
        if (!agentWindow || agentWindow.isDestroyed()) createAgentWindow();
        else agentWindow.show();
      },
    },
    {
      label: "Quick Sheet",
      click: () => toggleQuickSheet(),
    },
    {
      label: "Open Desktop",
      click: () => showDesktop(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", () => toggleQuickSheet());
}

function wireIpc() {
  ipcMain.handle("os:toggle-sheet", () => {
    toggleQuickSheet();
    return { ok: true };
  });
  ipcMain.handle("os:open-desktop", (_e, loopId) => {
    showDesktop(loopId);
    return { ok: true };
  });
  ipcMain.handle("os:undock", () => {
    undockToSolo();
    return { ok: true };
  });
  ipcMain.handle("os:close-sheet", () => {
    sheetWindow?.hide();
    return { ok: true };
  });
  ipcMain.handle("os:context-closed", (event) => {
    if (agentWindow && !agentWindow.isDestroyed() && event.sender !== agentWindow.webContents) {
      agentWindow.webContents.send("os:context-closed");
    }
    return { ok: true };
  });
  ipcMain.handle("os:stub-action", (_e, action) => {
    console.log(`[os stub] ${action}`);
    return { ok: true, action, stub: true };
  });
  ipcMain.handle("os:open-external", async (_e, url) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return { ok: false, error: "invalid url" };
    }
    await shell.openExternal(url);
    return { ok: true };
  });
  ipcMain.handle("os:ambient-sample", async () => {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    let appName = "Unknown";
    let title = null;
    if (process.platform === "darwin") {
      try {
        const { stdout } = await execFileAsync("osascript", [
          "-e",
          `tell application "System Events"
  set frontApp to name of first application process whose frontmost is true
  set frontTitle to ""
  try
    set frontTitle to name of first window of application process frontApp
  end try
  return frontApp & linefeed & frontTitle
end tell`,
        ]);
        const parts = stdout.trim().split(/\r?\n/);
        appName = parts[0]?.trim() || appName;
        const t = parts.slice(1).join(" ").trim();
        title = t.length > 0 ? t.slice(0, 240) : null;
      } catch {
        /* Accessibility permission may be required */
      }
    }
    return { ok: true, idleSeconds, app: appName, title, url: null };
  });
  ipcMain.handle("os:clip-context", async () => {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    let appName = "Unknown";
    if (process.platform === "darwin") {
      try {
        const { stdout } = await execFileAsync("osascript", [
          "-e",
          'tell application "System Events" to get name of first process whose frontmost is true',
        ]);
        appName = stdout.trim() || appName;
      } catch {
        /* ignore */
      }
    }
    const clip = clipboard.readText().trim().slice(0, 240);
    return {
      ok: true,
      idleSeconds,
      app: appName,
      title: clip || `Clipped while in ${appName}`,
      summary: clip ? `Clipboard: ${clip}` : "Clip hotkey — mark current context as a loop",
    };
  });
}

function registerShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+L", () => {
    BrowserWindow.getAllWindows().forEach((w) => {
      if (!w.isDestroyed()) w.webContents.send("os:clip-hotkey");
    });
    toggleQuickSheet();
  });
}

app.whenReady().then(() => {
  if (process.platform === "darwin") {
    app.dock?.hide();
  }
  wireIpc();
  registerShortcuts();
  createTray();
  createAgentWindow();
  createSheetWindow();
  createDesktopWindow();
  // Phase 6 dogfood: keep Solo agent alive across crashes/closes.
  if (agentWatchdog) clearInterval(agentWatchdog);
  agentWatchdog = setInterval(() => ensureAgentWindow("watchdog"), 15_000);
});

app.on("window-all-closed", () => {
  // Keep process alive for tray + Solo agent (do not quit).
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (agentWatchdog) {
    clearInterval(agentWatchdog);
    agentWatchdog = null;
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  agentWindow = null;
  sheetWindow = null;
  desktopWindow = null;
});

app.on("child-process-gone", (_e, details) => {
  console.error("[os] child-process-gone", details?.type, details?.reason);
  if (!isQuitting) setTimeout(() => ensureAgentWindow("child-gone"), 600);
});
