#!/usr/bin/env node
/**
 * Ensures the Electron binary exists. npm's extract-zip can fail silently
 * on some macOS setups; fall back to system `unzip` from the electron cache.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const os = require("node:os");

const electronRoot = path.dirname(require.resolve("electron/package.json"));
const dist = path.join(electronRoot, "dist");
const binary = path.join(dist, "Electron.app/Contents/MacOS/Electron");
const pathTxt = path.join(electronRoot, "path.txt");
const version = require(path.join(electronRoot, "package.json")).version;

if (fs.existsSync(binary)) {
  fs.writeFileSync(pathTxt, "Electron.app/Contents/MacOS/Electron");
  process.exit(0);
}

const cacheRoot = path.join(os.homedir(), "Library/Caches/electron");
const zipName = `electron-v${version}-darwin-${process.arch}.zip`;

function findZip(dir) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      const nested = findZip(full);
      if (nested) return nested;
    } else if (entry === zipName) {
      return full;
    }
  }
  return null;
}

const zip = findZip(cacheRoot);
if (!zip) {
  console.warn(
    `[ensure-electron] Missing binary and no cache zip (${zipName}). Run: npm rebuild electron`,
  );
  process.exit(0);
}

fs.mkdirSync(dist, { recursive: true });
console.log(`[ensure-electron] Extracting ${zip}`);
execFileSync("unzip", ["-o", "-q", zip, "-d", dist], { stdio: "inherit" });
fs.writeFileSync(pathTxt, "Electron.app/Contents/MacOS/Electron");
if (!fs.existsSync(binary)) {
  console.error("[ensure-electron] Extract finished but binary still missing");
  process.exit(1);
}
console.log("[ensure-electron] OK");
