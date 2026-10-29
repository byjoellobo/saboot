import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

const NNBSP = "\u202F";

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function makeFixtures(dir: (name: string) => string) {
  const photo = new Uint8Array(3 * 1024 * 1024 + 123);
  for (let i = 0; i < photo.length; i++) photo[i] = (i * 2654435761) >>> 24;
  const chat = strToU8(
    [
      `15/10/26, 9:30${NNBSP}pm - Messages and calls are end-to-end encrypted. Tap to learn more.`,
      `15/10/26, 9:31${NNBSP}pm - Asha Rao: When will you return the deposit of ₹60,000?`,
      `15/10/26, 9:35${NNBSP}pm - Ravi Kumar: ಮುಂದಿನ ತಿಂಗಳು. Painting charges will be deducted.`,
      `15/10/26, 9:36${NNBSP}pm - Ravi Kumar: IMG-20261015-WA0003.jpg (file attached)`,
      "",
    ].join("\n"),
  );
  const image = new Uint8Array(50_000).map((_, i) => (i * 31) % 251);
  const zip = zipSync({ "WhatsApp Chat with Ravi Kumar.txt": chat, "IMG-20261015-WA0003.jpg": [image, { level: 0 }] });
  const photoPath = dir("Screenshot_20261015-221530.jpg");
  const zipPath = dir("WhatsApp Chat with Ravi Kumar.zip");
  writeFileSync(photoPath, photo);
  writeFileSync(zipPath, zip);
  return { photo, photoPath, zip, zipPath, chat };
}

async function acceptFirstRun(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Before you start" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("I understand these limits").check();
  await dialog.getByRole("button", { name: "Continue" }).click();
  await expect(dialog).toBeHidden();
}

test("hash files, record a device and generate the certificate and transcript", async ({ page }, info) => {
  const fx = makeFixtures((n) => info.outputPath(n));
  await page.goto("/");
  await acceptFirstRun(page);

  await page.getByRole("button", { name: "Start a new case" }).click();
  await page.getByLabel("Court").fill("Court of Small Causes, Bengaluru");
  await page.getByLabel("Case number").fill("SC 1234/2026");
  await page.getByLabel("Your full name").fill("Asha Rao");
  await page.getByLabel("Residing or employed at").fill("Indiranagar, Bengaluru");
  await page.getByRole("link", { name: "Next: add records" }).click();

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Add files/ }).click();
  await (await chooser).setFiles([fx.photoPath, fx.zipPath]);

  // Every file gets a stamp; the zip yields itself plus two entries.
  await expect(page.locator(".record-list .stamp")).toHaveCount(4);
  await expect(page.getByText(sha256(fx.photo))).toBeVisible();
  await expect(page.getByText(sha256(fx.zip))).toBeVisible();
  await expect(page.getByText(sha256(fx.chat))).toBeVisible();

  await page.getByRole("link", { name: "Next: record the devices" }).click();
  await page.getByRole("button", { name: /Android phone/ }).click();
  await page.getByLabel("A name you will recognise").fill("Asha's phone");
  await page.getByLabel("Make & Model", { exact: true }).fill("Samsung Galaxy A54 5G");
  await page.getByLabel("Serial number", { exact: true }).fill("R5CW12ABCDE");
  await page.getByLabel("Value", { exact: true }).first().fill("490154203237519");
  await expect(page.getByText(/Luhn check failed/)).toBeVisible();
  await page.getByLabel("Value", { exact: true }).first().fill("490154203237518");
  await expect(page.getByText(/Valid IMEI/)).toBeVisible();
  await page.getByLabel("Owned by me").check();
  await page.getByRole("button", { name: "Save device" }).click();
  await expect(page.getByText("Asha's phone")).toBeVisible();

  await page.getByRole("link", { name: "Next: check and generate" }).click();
  const certDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate certificate bundle (PDF)" }).click();
  const cert = await certDownload;
  const certBytes = readFileSync(await cert.path());
  expect(cert.suggestedFilename()).toMatch(/certificate\.pdf$/);
  expect(certBytes.subarray(0, 5).toString()).toBe("%PDF-");
  await expect(page.getByText("Optional: add an RFC 3161 timestamp")).toBeVisible();

  const transcriptDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate transcript (PDF)" }).click();
  const transcript = await transcriptDownload;
  expect(
    readFileSync(await transcript.path())
      .subarray(0, 5)
      .toString(),
  ).toBe("%PDF-");

  await page.getByRole("link", { name: "Custody log" }).click();
  await expect(page.getByText(/entries link to each other correctly/)).toBeVisible();
  await expect(page.getByText(/Generated certificate bundle/)).toBeVisible();
});

test("the check page confirms a matching file and rejects a changed one", async ({ page }, info) => {
  const fx = makeFixtures((n) => info.outputPath(n));
  await page.goto("/");
  await acceptFirstRun(page);
  await page.getByRole("button", { name: "Start a new case" }).click();
  await page.getByRole("link", { name: "Next: add records" }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Add files/ }).click();
  await (await chooser).setFiles([fx.photoPath]);
  await expect(page.getByText(sha256(fx.photo))).toBeVisible();
  await page.getByRole("link", { name: "Next: record the devices" }).click();
  await page.getByRole("button", { name: /Android phone/ }).click();
  await page.getByLabel("Make & Model", { exact: true }).fill("Test phone");
  await page.getByRole("button", { name: "Save device" }).click();
  await page.getByRole("link", { name: "Next: check and generate" }).click();

  const tryLink = page.getByRole("link", { name: "Try it" });
  const href = await tryLink.getAttribute("href");
  expect(href).toContain("verify.html#v1.");
  await page.goto(href ?? "");
  await expect(page.getByRole("heading", { name: "Check a file against a hash report" })).toBeVisible();

  const changedPath = info.outputPath("changed.jpg");
  const changed = Uint8Array.from(fx.photo);
  changed[1000] = (changed[1000] ?? 0) ^ 1;
  writeFileSync(changedPath, changed);

  const chooser2 = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Choose files to check/ }).click();
  await (await chooser2).setFiles([fx.photoPath, changedPath]);
  await expect(page.getByText("Matches R-1")).toBeVisible();
  await expect(page.getByText("Different file")).toBeVisible();
});

test("works offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("link", { name: "Sakshya Kit" })).toBeVisible();
  await page.goto("/verify.html");
  await expect(page.getByRole("heading", { name: "Check a file against a hash report" })).toBeVisible();
  await context.setOffline(false);
});
