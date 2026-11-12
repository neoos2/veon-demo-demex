// E2E checks of the key scenarios of ux/demo-home.md (no test runner dependency: Playwright from ~/.veon/tools).
// Usage: node tests/e2e.mjs <url> [shots-dir]
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(path.join(process.env.VEON_TOOLS_DIR || path.join(os.homedir(), ".veon", "tools"), "noop.js"));
const { chromium } = require("playwright");
const url = process.argv[2] || process.env.DEMO_URL || "http://localhost:4321/";
const shots = process.argv[3];
if (shots) fs.mkdirSync(shots, { recursive: true });
let failed = 0;
const ok = (cond, name) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); if (!cond) failed++; };
const exe = process.env.CHROME_PATH || (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

// Desktop 1440
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  ok(await page.locator("h1").count() === 1, "one H1");
  await page.waitForTimeout(1100);
  ok(await page.$$eval(".vin__cell", (c) => c.length === 17 && c.every((e) => getComputedStyle(e).opacity === "1" && getComputedStyle(e).animationName === "none")), "17 cells settled, assembly not replayable");
  await page.setViewportSize({ width: 1440, height: 6000 });
  await page.waitForTimeout(100);
  ok(await page.$$eval(".vin__cell", (c) => c.every((e) => getComputedStyle(e).opacity === "1")), "cells stay after a full-page resize");
  await page.setViewportSize({ width: 1440, height: 900 });
  ok((await page.locator("h1").innerText()).includes("17 знаками VIN"), "H1 text from veon-concept");
  const ids = await page.$$eval("main > section", (s) => s.map((e) => e.id).join(","));
  ok(ids === "hero,vin,catalog,terms,wholesale,about,faq,contacts", `sections order: ${ids}`);
  ok(await page.locator('meta[name="robots"][content="noindex"]').count() === 1, "noindex");
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  ok(!hrefs.some((h) => /demex\.com\.ua(?!$)/.test(h.replace(/^mailto:[^?]+/, "")) && !h.startsWith("mailto:")), "no links to the current site");
  ok(!hrefs.some((h) => h === "#" || h === ""), "no empty links");
  const fold = await page.locator("[data-vin-send]").first().boundingBox();
  const vp1280 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await vp1280.goto(url, { waitUntil: "networkidle" });
  const b1280 = await vp1280.locator(".hero__send").boundingBox();
  ok(b1280 && b1280.y + b1280.height <= 800, "primary action visible at 1280x800");
  await vp1280.close();
  ok(Boolean(fold), "send button present");

  // Scenario 1: VIN typed into the 17 cells, letter template carries it
  const input = page.locator("#vin-input");
  await input.click();
  await input.pressSequentially("wvwzzz1kz8w0O0001");
  const v = await input.inputValue();
  ok(v === "WVWZZZ1KZ8W00001", `VIN cleaned (uppercase, O removed): ${v}`);
  ok((await page.locator("[data-vin-error]").innerText()).includes("I, O і Q"), "error text for I/O/Q");
  await input.pressSequentially("7");
  ok(await page.locator("[data-vin-count]").innerText() === "17", "counter 17 / 17");
  const cell1 = await page.locator(".vin__cell [data-cell]").first().innerText();
  ok(cell1 === "W", "cell 1 mirrors the input");
  const href = await page.locator(".hero__send").getAttribute("href");
  ok(href.startsWith("mailto:zakaz@demex.com.ua") && decodeURIComponent(href).includes("VIN: WVWZZZ1KZ8W000017"), "mailto contains the VIN");
  if (shots) await page.locator("#hero").screenshot({ path: path.join(shots, "1440-hero-typed.png") });
  await input.fill("WVW");
  await input.dispatchEvent("input");
  await page.locator(".hero__send").click();
  ok((await page.locator("[data-vin-error]").innerText()).includes("17 знаків"), "short VIN blocks the letter with a message");

  // Scenario 2: search is an inactive FutureLink with hint
  const search = page.locator(".header__search .future-link");
  ok(await search.getAttribute("aria-disabled") === "true" && !(await search.getAttribute("href")), "search is FutureLink");
  await search.hover();
  await page.waitForTimeout(300);
  ok(await page.locator(".header__search .future-link__note").evaluate((n) => getComputedStyle(n).opacity === "1"), "search hint on hover");

  // Catalog tabs
  await page.locator("#tab-make").click();
  ok(await page.locator("#panel-make").isVisible() && !(await page.locator("#panel-cat").isVisible()), "tab «За маркою авто» switches panel");
  ok(await page.locator("#panel-make .make").count() === 17, "17 make tiles");
  await page.locator("#tab-make").press("ArrowLeft");
  ok(await page.locator("#panel-cat").isVisible(), "arrow keys switch tabs");
  await page.locator("#tab-make").click();
  if (shots) { await page.locator("#catalog").scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await page.locator("#catalog").screenshot({ path: path.join(shots, "1440-catalog-makes.png") }); }

  // FAQ accordion
  const first = page.locator(".faq__item").first();
  await first.locator("summary").click();
  ok(await first.evaluate((d) => d.open), "FAQ opens");

  // anchors
  await page.locator('.header__nav a[href="#wholesale"]').click();
  await page.waitForTimeout(900);
  const top = await page.locator("#wholesale").evaluate((e) => e.getBoundingClientRect().top);
  ok(top >= 60 && top < 120, `anchor lands below sticky header (${Math.round(top)}px)`);
  ok(errors.length === 0, `no page errors ${errors.join("; ")}`);
  await page.close();
}

// Phone 390
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(url, { waitUntil: "networkidle" });
  const bar = page.locator(".mbar");
  ok(await page.locator("[data-vin-bar]").getAttribute("href") === "#vin", "bar VIN anchor is #vin without JS");
  ok(await page.locator("#vin-input").getAttribute("placeholder") === "17 знаків VIN", "neutral placeholder");
  ok(await bar.isVisible(), "phone bar visible");
  const call = await page.locator(".mbar a[href^='tel:']").getAttribute("href");
  ok(call === "tel:+380951663090", "bar call → tel:");
  const send = await page.locator(".hero__send").boundingBox();
  ok(send && send.y + send.height <= 844 - 64, "VIN button above the bar on the first screen");
  await page.locator("summary.menu__toggle").click();
  ok(await page.locator(".menu__panel").isVisible(), "burger opens");
  await page.locator('.menu__anchors a[href="#contacts"]').click();
  ok(!(await page.locator("details.menu").evaluate((d) => d.open)), "menu closes after anchor");
  await page.waitForTimeout(800);
  await page.locator("[data-vin-bar]").click();
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => document.activeElement?.id === "vin-input"), "bar «Надіслати VIN» focuses the field");
  for (const w of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= w, `no horizontal scroll at ${w}px (${sw})`);
  }
  await page.close();
}

// Reduced motion and no JS
{
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const op = await page.locator(".vin__cell").nth(16).evaluate((e) => getComputedStyle(e).opacity);
  ok(op === "1", "reduced motion: cells in place");
  await ctx.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p2 = await nojs.newPage();
  await p2.goto(url, { waitUntil: "load" });
  ok(await p2.locator("#vin-input").isVisible(), "no JS: VIN input visible");
  ok(await p2.locator("#panel-make").isVisible(), "no JS: both catalog panels visible");
  const termsOp = await p2.locator(".term").first().evaluate((e) => getComputedStyle(e).opacity);
  ok(termsOp === "1", "no JS: revealed content visible");
  await nojs.close();
}

await browser.close();
console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);
