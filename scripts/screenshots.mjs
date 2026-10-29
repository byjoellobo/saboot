/* global document */
// Captures the README screenshots from the demo case (synthetic data only).
// Usage: npx vite build && npx vite preview --port 4791, then
//        node scripts/screenshots.mjs [outDir]
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, devices } from "@playwright/test";

const out = resolve(process.argv[2] ?? "docs/images");
const base = process.env.SAKSHYA_URL ?? "http://localhost:4791/";
mkdirSync(out, { recursive: true });

async function start(context) {
  const page = await context.newPage();
  await page.goto(base);
  await page.getByLabel("I understand these limits").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Try a demo case" }).click();
  await page.locator(".record-list .stamp").nth(3).waitFor();
  return page;
}

const browser = await chromium.launch();

// Desktop
const desk = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, acceptDownloads: true });
const page = await start(desk);
await page.evaluate(() => document.querySelector(".banner")?.remove());
await page.screenshot({ path: `${out}/records.png` });
await page
  .getByRole("link", { name: /Devices/ })
  .first()
  .click();
await page.getByRole("button", { name: "Add a device" }).click();
await page.getByRole("button", { name: /CCTV/ }).click();
await page
  .getByText(/Record the recorder's clock/)
  .first()
  .click();
await page.screenshot({ path: `${out}/device-guide.png` });
await page.getByRole("button", { name: "Cancel" }).last().click();
await page
  .getByRole("link", { name: /Generate/ })
  .first()
  .click();
const certificate = page.waitForEvent("download");
await page.getByRole("button", { name: "Generate certificate bundle (PDF)" }).click();
await (await certificate).saveAs(`${out}/demo-certificate.pdf`);
const transcript = page.waitForEvent("download");
await page.getByRole("button", { name: "Generate transcript (PDF)" }).click();
await (await transcript).saveAs(`${out}/demo-transcript.pdf`);
await page.screenshot({ path: `${out}/generate.png` });
const link = await page.getByRole("link", { name: "Try it" }).getAttribute("href");
await page.goto(new URL(link ?? "verify.html", base).toString());
await page.screenshot({ path: `${out}/verify.png` });
await desk.close();

// Phone
const phone = await browser.newContext({ ...devices["Pixel 7"] });
const p2 = await start(phone);
await p2.evaluate(() => document.querySelector(".banner")?.remove());
await p2.screenshot({ path: `${out}/phone-records.png` });
await phone.close();

await browser.close();
console.log(`screenshots written to ${out}`);
