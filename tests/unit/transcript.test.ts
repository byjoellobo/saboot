import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { hashChat, parseChat } from "../../src/sakshya/whatsapp/parse";
import { buildTranscriptPdf, selectMessages, type FileRef } from "../../src/sakshya/whatsapp/transcript-pdf";
import { nodeFontLoader } from "./fixtures";
import { nodeDigest } from "./helpers";

const OUT = process.env.SAKSHYA_PDF_OUT;
const NNBSP = "\u202F";

function syntheticChat(count: number): string {
  const senders = ["Asha Rao", "Ravi Kumar (Landlord)", "+91 00000 00003"];
  const bodies = [
    "Hello sir, when will the deposit be returned?",
    "ಠೇವಣಿ ಹಣ ಯಾವಾಗ ವಾಪಸ್ ಕೊಡುತ್ತೀರಿ?",
    "मैं अगले हफ्ते पैसे भेज दूंगा 👍",
    "IMG-20240115-WA0003.jpg (file attached)",
    "Painting charges ₹12,500 will be deducted.\nCleaning charges ₹3,000.\nBalance will be sent by NEFT.",
    "<Media omitted>",
    "A".repeat(700),
  ];
  const lines: string[] = [`01/01/24, 9:00${NNBSP}am - Messages and calls are end-to-end encrypted. Tap to learn more.`];
  for (let i = 0; i < count; i++) {
    const day = 1 + Math.floor(i / 60);
    const minute = i % 60;
    const date = `${String(((day - 1) % 28) + 1).padStart(2, "0")}/${String(1 + Math.floor((day - 1) / 28)).padStart(2, "0")}/24`;
    lines.push(`${date}, 10:${String(minute).padStart(2, "0")}${NNBSP}am - ${senders[i % 3]}: ${bodies[i % bodies.length]}`);
  }
  return `${lines.join("\n")}\n`;
}

async function build(text: string, extra: { from?: string; to?: string } = {}) {
  const bytes = new TextEncoder().encode(text);
  const chat = await hashChat(bytes, parseChat(bytes));
  const chatFile: FileRef = { label: "R-2", name: "WhatsApp Chat with Ravi Kumar.txt", size: bytes.length, sha256: nodeDigest("sha256", bytes) };
  const attachments = new Map<string, FileRef>([
    ["IMG-20240115-WA0003.jpg", { label: "R-5", name: "IMG-20240115-WA0003.jpg", size: 245_001, sha256: "ab".repeat(32) }],
  ]);
  const progress: number[] = [];
  const pdf = await buildTranscriptPdf({
    loader: nodeFontLoader,
    caseRef: "SC 1234/2026, Court of Small Causes, Bengaluru",
    chat,
    chatFile,
    container: { label: "R-1", name: "WhatsApp Chat with Ravi Kumar.zip", size: 18_234_567, sha256: "cd".repeat(32) },
    attachments,
    generatedAt: new Date("2026-10-29T04:00:00Z"),
    appVersion: "0.1.0",
    onProgress: (done) => progress.push(done),
    ...extra,
  });
  return { pdf, chat, progress };
}

describe("WhatsApp transcript PDF", () => {
  it("renders a long multi-script chat across many pages", async () => {
    const started = Date.now();
    const { pdf, chat, progress } = await build(syntheticChat(2000));
    const doc = await PDFDocument.load(pdf);
    expect(chat.messages).toHaveLength(2001);
    expect(doc.getPageCount()).toBeGreaterThan(50);
    expect(progress[progress.length - 1]).toBe(2001);
    expect(Date.now() - started).toBeLessThan(60_000);
    if (OUT) {
      mkdirSync(OUT, { recursive: true });
      writeFileSync(resolve(OUT, "transcript.pdf"), pdf);
    }
  });

  it("limits the transcript to a local-time window", async () => {
    const text = syntheticChat(200);
    const bytes = new TextEncoder().encode(text);
    const chat = parseChat(bytes);
    const window = selectMessages(chat, "2024-01-02", "2024-01-02");
    expect(window.length).toBe(60);
    expect(window.every((m) => m.localTime?.startsWith("2024-01-02"))).toBe(true);
    expect(selectMessages(chat).length).toBe(chat.messages.length);
    const { pdf } = await build(text, { from: "2030-01-01" });
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
