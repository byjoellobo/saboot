// Case backups: one JSON file holding the case (hashes, devices, custody log)
// and the WhatsApp chat text needed for transcripts. Media files are NOT in
// the backup; the user keeps the originals.
import { verifyChain } from "../../engine/custody/custody-log";
import { newId, sha256Hex } from "../../engine/util/crypto";
import type { CaseFile, EvidenceRecord } from "../../sakshya/model";
import { listChatBytes, saveImportedCase } from "../state/db";
import { APP_VERSION } from "../version";
import { backupSchema, type Backup } from "./backup-schema";

const MAX_BACKUP_BYTES = 200 * 1024 * 1024;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) bin += String.fromCharCode(...bytes.subarray(i, i + step));
  return btoa(bin);
}

function fromBase64(text: string): Uint8Array {
  let bin: string;
  try {
    bin = atob(text);
  } catch {
    throw new Error("This backup's chat text is damaged (invalid base64).");
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** What we write. Same shape the importer validates with `backupSchema`. */
interface ExportedBackup extends Omit<Backup, "caseFile"> {
  readonly caseFile: CaseFile;
}

export async function exportBackup(c: CaseFile): Promise<Uint8Array> {
  const chats = await listChatBytes(c.id);
  const backup: ExportedBackup = {
    format: "sakshya-kit-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    caseFile: c,
    chats: chats.map((ch) => ({ recordId: ch.recordId, base64: toBase64(ch.bytes) })),
  };
  return new TextEncoder().encode(JSON.stringify(backup, null, 1));
}

/** Give the case and every record fresh ids, so a restored copy never shares storage with an existing case. */
function remapIds(c: CaseFile): { caseFile: CaseFile; idMap: ReadonlyMap<string, string> } {
  const idMap = new Map(c.records.map((r) => [r.id, newId("rec-")] as const));
  const records: EvidenceRecord[] = c.records.map((r) => ({
    ...r,
    id: idMap.get(r.id) ?? r.id,
    parentId: r.parentId ? (idMap.get(r.parentId) ?? null) : null,
  }));
  return { caseFile: { ...c, id: newId("case-"), records }, idMap };
}

/** Validate a backup completely, then store it in one transaction. Returns the stored case. */
export async function importBackup(file: File): Promise<CaseFile> {
  if (file.size > MAX_BACKUP_BYTES) throw new Error("This file is too large to be a Sakshya Kit backup.");
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error("This is not a Sakshya Kit backup (it is not valid JSON).");
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(`This backup could not be read: ${first ? `${first.path.join(".")}: ${first.message}` : "unknown format"}.`);
  }
  const backup = parsed.data;
  const chain = await verifyChain(backup.caseFile.custody);
  if (!chain.ok) {
    throw new Error(`The custody log in this backup is not consistent (entry ${chain.brokenAt}: ${chain.reason}), so it was not imported.`);
  }

  const original: CaseFile = backup.caseFile;
  const { caseFile, idMap } = remapIds(original);

  // Every chat text must still be exactly the bytes whose hash the case records.
  const chats: { recordId: string; bytes: Uint8Array }[] = [];
  for (const ch of backup.chats) {
    const record = original.records.find((r) => r.id === ch.recordId);
    const newRecordId = idMap.get(ch.recordId);
    if (!record || !newRecordId) continue;
    const bytes = fromBase64(ch.base64);
    if (bytes.length !== record.size || (await sha256Hex(bytes)) !== record.hashes.sha256) {
      throw new Error(
        `The chat text for ${record.label} in this backup does not match its recorded SHA-256, so the backup was not imported.`,
      );
    }
    chats.push({ recordId: newRecordId, bytes });
  }

  await saveImportedCase(caseFile, chats);
  return caseFile;
}
