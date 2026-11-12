// Dev helper: viewport screenshots of each section at a width, plus horizontal-overflow scan 320–1440.
// Usage: node tests/shots.mjs <url> <outdir> [width ...]
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
const require = createRequire(path.join(os.homedir(), ".veon", "tools", "noop.js"));
const { chromium } = require("playwright");
const [url, out, ...ws] = process.argv.slice(2);
const widths = ws.length ? ws.map(Number) : [1440, 390];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 768 ? 844 : 900 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(600);
  const ids = await page.$$eval("main > section, footer", (els) => els.map((e) => e.id || e.tagName.toLowerCase()));
  for (const id of ids) {
    const loc = id === "footer" ? page.locator("footer") : page.locator(`#${id}`);
    await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(700);
    await loc.screenshot({ path: path.join(out, `${w}-${id}.png`) }).catch((e) => console.log("shot fail", id, e.message));
  }
  await page.close();
}
for (const w of [320, 375, 390, 768, 1024, 1280, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 800 } });
  await page.goto(url, { waitUntil: "networkidle" });
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll("body *").forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width && (b.right > vw + 1 || b.left < -1) && getComputedStyle(el).position !== "fixed" && !el.closest(".visually-hidden,.future-link__note,.skip-link,details:not([open]) > :not(summary)")) bad.push(`${el.tagName}.${el.className} ${Math.round(b.left)}..${Math.round(b.right)}`);
    });
    return { sw: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 8) };
  });
  console.log(w, "scrollWidth", r.sw, "viewport", r.vw, r.sw > r.vw ? "OVERFLOW" : "ok", r.bad.length ? r.bad.join(" | ") : "");
  await page.close();
}
await browser.close();
