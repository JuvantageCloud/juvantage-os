#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = path.join(root, "assets/ui-layout-exploration");

const styles = fs
  .readdirSync(base, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
  .map((d) => d.name);

async function run() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("Run: npm install -D playwright && npx playwright install chromium");
    process.exit(1);
  }
  const browser = await chromium.launch();
  for (const styleDir of styles) {
    const gallery = path.join(base, styleDir, "gallery.html");
    const imgDir = path.join(base, styleDir, "images");
    if (!fs.existsSync(gallery)) continue;
    fs.mkdirSync(imgDir, { recursive: true });
    const page = await browser.newPage();
    await page.goto(`file://${gallery}`, { waitUntil: "networkidle" });
    const ids = await page.$$eval("[data-export]", (els) =>
      els.map((el) => el.getAttribute("data-export")),
    );
    for (const id of ids) {
      const el = page.locator(`#${id}`);
      await el.screenshot({ path: path.join(imgDir, `${id}.png`) });
      console.log(styleDir, id);
    }
    await page.close();
  }
  await browser.close();
  console.log("Layout PNG export done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});