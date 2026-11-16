#!/usr/bin/env node
/**
 * Kill stale Vite + API listeners on 5173/3001, then start dev:os once.
 * Use this instead of running `npm run dev:os` again when you see "Port 5173 is already in use".
 */
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: "utf8" }).trim();
    return out ? out.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function killPort(port) {
  for (const pid of pidsOnPort(port)) {
    try {
      execSync(`kill ${pid}`, { stdio: "ignore" });
    } catch {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      } catch {
        /* ignore */
      }
    }
  }
}

console.log("Stopping anything on 5173 (UI) and 3001 (Brain)…");
killPort(5173);
killPort(3001);

const child = spawn("npm", ["run", "dev:os"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));