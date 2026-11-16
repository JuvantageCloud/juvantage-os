#!/usr/bin/env node
/**
 * Renders each #screen in gallery.html to PNG at native Mac size.
 * Requires: npx playwright install chromium (one-time)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = path.join(root, "assets/ui-exploration");

const styles = fs
  .readdirSync(base, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
  .map((d) => d.name);

async function run() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error(
      "Install Playwright first:\n  npm install -D playwright\n  npx playwright install chromium",
    );
    process.exit(1);
  }

  const browser = await chromium.launch();
  for (const styleDir of styles) {
    const gallery = path.join(base, styleDir, "gallery.html");
  const imgDir = path.join(base, styleDir, "images");
    if (!fs.existsSync(gallery)) continue;
    const page = await browser.newPage();
    await page.goto(`file://${gallery}`, { waitUntil: "networkidle" });
    const ids = await page.$$eval("[data-export]", (els) =>
      els.map((el) => el.getAttribute("data-export")),
    );
    for (const id of ids) {
      const el = page.locator(`#${id}`);
      const box = await el.boundingBox();
      if (!box) continue;
      const out = path.join(imgDir, `${id}.png`);
      await el.screenshot({ path: out });
      console.log("wrote", path.relative(root, out), `${Math.round(box.width)}×${Math.round(box.height)}`);
    }
    await page.close();
  }
  await browser.close();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});