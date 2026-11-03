/* global document, window */
// Captures the README screenshots and sample PDFs from the demo case
// (synthetic data only). Usage:
//   npx vite build && npx vite preview --port 4791
//   node scripts/screenshots.mjs [outDir]
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, devices } from "@playwright/test";

const out = resolve(process.argv[2] ?? "docs/images");
const base = process.env.SABOOT_URL ?? "http://localhost:4791/";
mkdirSync(out, { recursive: true });

const hideBanner = (page) => page.evaluate(() => document.querySelector(".banner")?.remove());

async function acceptFirstRun(page) {
  await page.goto(base);
  await page.getByLabel("I understand these limits").check();
  await page.getByRole("button", { name: "Continue" }).click();
}

async function openDemo(page) {
  await page.getByRole("button", { name: "Try a demo case" }).click();
  await page.locator(".record-list .stamp").nth(3).waitFor();
  // Let the one-off HASHED stamp animation finish.
  await page.waitForTimeout(700);
}

async function goToStep(page, name, heading) {
  await page.getByRole("link", { name }).first().click();
  await page.getByRole("heading", { level: 1, name: heading }).waitFor();
  await page.waitForTimeout(200);
}

const browser = await chromium.launch();

// Desktop
const desk = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, acceptDownloads: true });
const page = await desk.newPage();
await acceptFirstRun(page);
await hideBanner(page);
await page.screenshot({ path: `${out}/home.png` });
await openDemo(page);
await hideBanner(page);
await page.screenshot({ path: `${out}/records.png` });

await goToStep(page, /Devices/, "Devices");
await page.getByRole("button", { name: "Add a device" }).click();
await page.getByRole("button", { name: /CCTV/ }).click();
await page
  .getByText(/Record the recorder's clock/)
  .first()
  .click();
await page.screenshot({ path: `${out}/device-guide.png` });
await page.getByRole("button", { name: "Cancel" }).last().click();

await goToStep(page, /Generate/, "Check and generate");
const certificate = page.waitForEvent("download");
await page.getByRole("button", { name: "Generate certificate bundle (PDF)" }).click();
await (await certificate).saveAs(`${out}/demo-certificate.pdf`);
const transcript = page.waitForEvent("download");
await page.getByRole("button", { name: "Generate transcript (PDF)" }).click();
await (await transcript).saveAs(`${out}/demo-transcript.pdf`);
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: `${out}/generate.png` });

const link = await page.getByRole("link", { name: "Try it" }).getAttribute("href");
await page.goto(new URL(link ?? "verify.html", base).toString());
await page.screenshot({ path: `${out}/verify.png` });
await desk.close();

// Phone
const phone = await browser.newContext({ ...devices["Pixel 7"] });
const p2 = await phone.newPage();
await acceptFirstRun(p2);
await openDemo(p2);
await hideBanner(p2);
await p2.screenshot({ path: `${out}/phone-records.png`, fullPage: true });
await phone.close();

await browser.close();
console.log(`screenshots written to ${out}`);
