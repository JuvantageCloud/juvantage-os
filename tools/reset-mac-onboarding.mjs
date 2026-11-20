#!/usr/bin/env node
/**
 * Reset macOS first-run hub (UserDefaults key juv_os_onboarding_v1).
 * Works even before the app has created the domain (uses write, not delete).
 */
import { spawnSync } from "node:child_process";

const domain = "com.juvantage.os.mac";
const key = "juv_os_onboarding_v1";

const r = spawnSync(
  "defaults",
  ["write", domain, key, "-bool", "false"],
  { encoding: "utf8" },
);

if (r.status === 0) {
  console.log(`Reset ${domain} ${key} → false. Quit & re-run JuvantageOSMac in Xcode.`);
} else {
  console.error(r.stderr || r.stdout || "defaults write failed");
  process.exit(r.status ?? 1);
}