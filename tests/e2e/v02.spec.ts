import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

function sha256(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

async function acceptFirstRun(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Before you start" });
  await dialog.getByLabel("I understand these limits").check();
  await dialog.getByRole("button", { name: "Continue" }).click();
}

test("demo case: synthetic files hash, and every output downloads", async ({ page }) => {
  await page.goto("/");
  await acceptFirstRun(page);
  await page.getByRole("button", { name: "Try a demo case" }).click();

  // Zip, its chat text, the photo inside it, and the screenshot.
  await expect(page.locator(".record-list .stamp")).toHaveCount(4);
  await expect(page.locator(".record-head .name", { hasText: "WhatsApp Chat with Ravi (demo).zip" })).toBeVisible();

  await page
    .getByRole("link", { name: /Generate/ })
    .first()
    .click();
  const certificate = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate certificate bundle (PDF)" }).click();
  expect(
    readFileSync(await (await certificate).path())
      .subarray(0, 5)
      .toString(),
  ).toBe("%PDF-");

  const transcript = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate transcript (PDF)" }).click();
  expect(
    readFileSync(await (await transcript).path())
      .subarray(0, 5)
      .toString(),
  ).toBe("%PDF-");

  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  const first = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download hash lists" }).click();
  const sums = await first;
  await expect.poll(() => downloads.length).toBeGreaterThanOrEqual(2);
  expect(downloads.some((n) => n.endsWith(".SHA256SUMS"))).toBe(true);
  expect(downloads.some((n) => n.endsWith(".csv"))).toBe(true);
  const sumsText = readFileSync(await sums.path(), "utf8");
  expect(sumsText.trim().split("\n").length).toBeGreaterThanOrEqual(3);
  expect(sumsText).toMatch(/^[0-9a-f]{64} {2}WhatsApp Chat with Ravi \(demo\)\.zip$/m);
});

test("check page: load a SHA256SUMS list and check one WhatsApp message", async ({ page }, info) => {
  const evidence = new TextEncoder().encode("synthetic evidence file for the check page");
  const evidencePath = info.outputPath("evidence.bin");
  writeFileSync(evidencePath, evidence);
  const sumsPath = info.outputPath("case.SHA256SUMS");
  writeFileSync(sumsPath, `${sha256(evidence)}  evidence.bin\n`);

  const chat = "01/02/24, 10:00 - Asha: first\n01/02/24, 10:01 - Ravi: second message\n";
  const chatPath = info.outputPath("_chat.txt");
  writeFileSync(chatPath, chat);
  const start = Buffer.byteLength("01/02/24, 10:00 - Asha: first\n");
  const end = Buffer.byteLength(chat);

  await page.goto("/verify.html");
  const list = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Load a hash list or case backup" }).click();
  await (await list).setFiles(sumsPath);
  await expect(page.getByText(/come from the hash list "case.SHA256SUMS"/)).toBeVisible();

  const files = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Choose files to check/ }).click();
  await (await files).setFiles(evidencePath);
  await expect(page.getByText("Matches #1")).toBeVisible();

  await page.getByLabel("Chat file").setInputFiles(chatPath);
  await page.getByLabel("Start byte").fill(String(start));
  await page.getByLabel("End byte").fill(String(end));
  await page.getByLabel("SHA-256 printed in the transcript (optional)").fill(sha256(chat.slice(start)));
  await page.getByRole("button", { name: "Check this message" }).click();
  await expect(page.getByText("Matches the transcript")).toBeVisible();
  await expect(page.locator(".message-preview")).toContainText("Ravi: second message");
});
