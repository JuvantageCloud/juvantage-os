#!/usr/bin/env node
/** Point this clone at .githooks (strips Cursor co-author trailers on commit). */
import { chmodSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = path.join(root, ".githooks", "commit-msg");
if (!existsSync(hook)) process.exit(0);
try {
  chmodSync(hook, 0o755);
  execSync("git config core.hooksPath .githooks", { cwd: root, stdio: "pipe" });
} catch {
  /* not a git checkout or git unavailable */
}