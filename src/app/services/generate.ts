// Builds PDFs in the browser and records each one in the custody log.
import { browserFontLoader } from "../../engine/pdf/fonts";
import { sha256Hex } from "../../engine/util/crypto";
import { buildCertificatePdf } from "../../sakshya/certificate/certificate-pdf";
import type { CaseFile, EvidenceRecord } from "../../sakshya/model";
import { hashChat, parseChat, type DateOrder } from "../../sakshya/whatsapp/parse";
import { buildTranscriptPdf, type FileRef } from "../../sakshya/whatsapp/transcript-pdf";
import { getChatBytes } from "../state/db";
import { APP_VERSION } from "../version";

export interface GeneratedPdf {
  readonly fileName: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
}

const loader = browserFontLoader(import.meta.env.BASE_URL);

function safeName(text: string): string {
  return (
    text
      .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "case"
  );
}

function caseRef(c: CaseFile): string {
  return (
    [c.caseNumber, c.court, c.title]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ") || "Untitled case"
  );
}

export async function generateCertificate(c: CaseFile, verifyBaseUrl: string, includeBlankPartB: boolean): Promise<GeneratedPdf> {
  const bytes = await buildCertificatePdf(c, {
    loader,
    verifyBaseUrl,
    generatedAt: new Date(),
    appVersion: APP_VERSION,
    includeBlankPartB,
  });
  return { fileName: `${safeName(c.caseNumber || c.title)} - BSA 63(4) certificate.pdf`, bytes, sha256: await sha256Hex(bytes) };
}

function ref(r: EvidenceRecord): FileRef {
  return { label: r.label, name: r.zipPath ?? r.fileName, size: r.size, sha256: r.hashes.sha256 };
}

export async function generateTranscript(
  c: CaseFile,
  recordId: string,
  range: { from?: string; to?: string; dateOrder?: DateOrder },
  onProgress?: (done: number, total: number) => void,
): Promise<GeneratedPdf> {
  const record = c.records.find((r) => r.id === recordId);
  if (!record) throw new Error("That chat record no longer exists.");
  const bytes = await getChatBytes(recordId);
  if (!bytes) throw new Error("The chat text for this record is not stored on this device. Add the WhatsApp export again.");
  // The transcript prints the record's hash, so the stored bytes must still be exactly those bytes.
  if (bytes.length !== record.size || (await sha256Hex(bytes)) !== record.hashes.sha256) {
    throw new Error(
      `The stored chat text no longer matches the SHA-256 recorded for ${record.label}. Add the original WhatsApp export again.`,
    );
  }
  const chat = await hashChat(bytes, parseChat(bytes, { dateOrder: range.dateOrder }));
  const parent = record.parentId ? (c.records.find((r) => r.id === record.parentId) ?? null) : null;
  // Messages name attachments by file name only; if two files share a name, mark it ambiguous.
  const attachments = new Map<string, FileRef | null>();
  for (const r of c.records) {
    if (!r.parentId || r.parentId !== record.parentId || r.id === record.id) continue;
    attachments.set(r.fileName, attachments.has(r.fileName) ? null : ref(r));
  }
  const pdf = await buildTranscriptPdf({
    loader,
    caseRef: caseRef(c),
    chat,
    chatFile: ref(record),
    container: parent ? ref(parent) : null,
    attachments,
    from: range.from || undefined,
    to: range.to || undefined,
    generatedAt: new Date(),
    appVersion: APP_VERSION,
    onProgress,
  });
  return { fileName: `${safeName(record.label)} WhatsApp transcript.pdf`, bytes: pdf, sha256: await sha256Hex(pdf) };
}
