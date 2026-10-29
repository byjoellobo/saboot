// Builds the list of expected hash values for the check page from a file the
// viewer chooses, when they have no QR link: a SHA256SUMS file or a Sakshya
// Kit case backup.
import type { VerifyItem } from "../engine/verify/verify-link";
import { cleanLinkText } from "../engine/verify/verify-link";
import { backupSchema } from "../app/services/backup-schema";
import { parseSha256sums } from "../sakshya/certificate/hash-list";

export interface ExpectedList {
  /** Where the list came from, shown to the viewer. */
  readonly source: string;
  readonly caseRef: string;
  readonly items: readonly VerifyItem[];
}

const MAX_LIST_BYTES = 50 * 1024 * 1024;

/** Size -1 means "unknown" (SHA256SUMS files do not record sizes). */
export const UNKNOWN_SIZE = -1;

export async function readExpectedList(file: File): Promise<ExpectedList> {
  if (file.size > MAX_LIST_BYTES) throw new Error("This file is too large to be a hash list.");
  const text = await file.text();
  if (/^\s*\{/.test(text)) {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error("This file looks like JSON but could not be read.");
    }
    const parsed = backupSchema.safeParse(raw);
    if (!parsed.success) throw new Error("This JSON file is not a Sakshya Kit case backup.");
    const c = parsed.data.caseFile;
    const items = c.records
      .filter((r) => r.includeInCertificate)
      .map((r) => ({ label: cleanLinkText(r.label), name: cleanLinkText(r.zipPath ?? r.fileName), size: r.size, sha256: r.hashes.sha256 }));
    if (items.length === 0) throw new Error("This backup lists no records.");
    const caseRef =
      [c.caseNumber, c.court, c.title]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ") || "Untitled case";
    return { source: `case backup "${file.name}"`, caseRef: cleanLinkText(caseRef), items };
  }
  const sums = parseSha256sums(text);
  if (sums.length === 0) throw new Error("No SHA-256 lines were found. Choose a SHA256SUMS file or a Sakshya Kit backup.");
  return {
    source: `hash list "${file.name}"`,
    caseRef: file.name,
    items: sums.map((s, i) => ({ label: `#${i + 1}`, name: cleanLinkText(s.name), size: UNKNOWN_SIZE, sha256: s.sha256 })),
  };
}
