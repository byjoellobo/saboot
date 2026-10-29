import type { VerifyItem } from "../../engine/verify/verify-link";
import type { EvidenceRecord } from "../model";

/** The subset of each record that goes into a verify QR code. */
export function verifyItems(records: readonly EvidenceRecord[]): VerifyItem[] {
  return records.map((r) => ({ label: r.label, name: r.fileName, size: r.size, sha256: r.hashes.sha256 }));
}
