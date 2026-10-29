// Turns files the user adds into hashed EvidenceRecords.
//   - A WhatsApp export zip becomes one record for the zip, plus one record
//     per file inside it, with the chat text parsed and kept for transcripts.
//   - A bare .txt that parses as a WhatsApp chat is kept for transcripts too.
//   - Anything else is hashed as a single record.
import type { NewCustodyEvent } from "../../engine/custody/custody-log";
import type { HashPool, JobProgress } from "../../engine/hash/hash-pool";
import type { Digests } from "../../engine/hash/wasm-hasher";
import { newId, sha256Hex } from "../../engine/util/crypto";
import { looksLikeZip } from "../../engine/zip/zip-reader";
import { kindFromFile, type EvidenceRecord, type RecordKind } from "../../sakshya/model";
import { isChatTextName, parseChat } from "../../sakshya/whatsapp/parse";

/** Above this many media files inside a zip, only the zip and chat text go on the certificate by default. */
const MEDIA_LIST_LIMIT = 25;

export interface IngestContext {
  readonly defaultDeviceId: string | null;
  readonly actor: string;
}

export interface IngestOutcome {
  /** Records without labels; the caller assigns R-numbers in order. */
  readonly records: EvidenceRecord[];
  readonly chats: { recordId: string; bytes: Uint8Array }[];
  readonly events: NewCustodyEvent[];
  readonly warnings: string[];
}

function baseRecord(
  file: { name: string; type: string; size: number; lastModified: number | null },
  digests: Digests,
  kind: RecordKind,
  ctx: IngestContext,
): EvidenceRecord {
  return {
    id: newId("rec-"),
    label: "",
    deviceId: ctx.defaultDeviceId,
    kind,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: digests.size,
    lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    hashes: { md5: digests.md5, sha1: digests.sha1, sha256: digests.sha256 },
    hashedAt: new Date().toISOString(),
    parentId: null,
    zipPath: null,
    zipModified: null,
    crcOk: null,
    description: "",
    manner: "",
    includeInCertificate: true,
  };
}

function hashedEvent(r: EvidenceRecord, actor: string, extra = ""): NewCustodyEvent {
  return {
    action: "record-hashed",
    actor,
    summary: `Added and hashed ${r.fileName}${extra}`,
    details: { file: r.fileName, size: r.size, sha256: r.hashes.sha256, sha1: r.hashes.sha1, md5: r.hashes.md5 },
  };
}

function isChat(bytes: Uint8Array): boolean {
  try {
    return parseChat(bytes).messages.length > 0;
  } catch {
    return false;
  }
}

async function ingestZip(file: File, pool: HashPool, ctx: IngestContext, onProgress: (p: JobProgress) => void): Promise<IngestOutcome> {
  const job = pool.hashZip(file, [".txt"], onProgress);
  const outcome = await job.promise;
  const warnings: string[] = [];
  const chats: { recordId: string; bytes: Uint8Array }[] = [];

  // A damaged entry (CRC mismatch) is never used as the chat text.
  const chatEntryPaths = new Set(
    outcome.entries
      .filter((e) => e.bytes && e.crcOk !== false && isChatTextName(e.entry.path) && isChat(e.bytes))
      .map((e) => e.entry.path),
  );
  const isWhatsApp = chatEntryPaths.size > 0;
  const parent = baseRecord(
    { name: file.name, type: file.type || "application/zip", size: file.size, lastModified: file.lastModified },
    outcome.container,
    isWhatsApp ? "whatsapp-export" : "archive",
    ctx,
  );

  const hashed = outcome.entries.filter((e) => e.digests);
  const mediaCount = hashed.filter((e) => !chatEntryPaths.has(e.entry.path)).length;
  const children: EvidenceRecord[] = hashed.map((e) => {
    const digests = e.digests as Digests;
    const name = e.entry.path.split("/").pop() || e.entry.path;
    const isChatText = chatEntryPaths.has(e.entry.path);
    const rec: EvidenceRecord = {
      ...baseRecord({ name, type: "", size: digests.size, lastModified: null }, digests, isChatText ? "chat-text" : kindFromFile(name, ""), ctx),
      parentId: parent.id,
      zipPath: e.entry.path,
      zipModified: e.entry.modified,
      crcOk: e.crcOk,
      description: isChatText ? `Chat text inside ${file.name}` : "",
      manner: `Contained in ${file.name}.`,
      includeInCertificate: e.crcOk !== false && (isChatText || mediaCount <= MEDIA_LIST_LIMIT),
    };
    if (isChatText && e.bytes) chats.push({ recordId: rec.id, bytes: e.bytes });
    return rec;
  });

  for (const e of outcome.entries) {
    if (e.error) warnings.push(`${e.entry.path}: ${e.error}`);
    else if (e.crcOk === false) warnings.push(`${e.entry.path}: the zip's stored checksum does not match the data. The archive may be damaged.`);
  }
  if (mediaCount > MEDIA_LIST_LIMIT) {
    warnings.push(
      `${mediaCount} files are inside ${file.name}. Only the zip and the chat text are listed on the certificate by default; every file still appears in the transcript with its own hash. You can include more files in Records.`,
    );
  }

  const events: NewCustodyEvent[] = [
    hashedEvent(parent, ctx.actor, isWhatsApp ? " (WhatsApp chat export)" : ""),
    {
      action: "record-hashed",
      actor: ctx.actor,
      summary: `Hashed ${children.length} files inside ${file.name}${warnings.length ? ` (${warnings.length} warnings)` : ""}`,
      details: { container: file.name, files: children.length, crcMismatches: hashed.filter((e) => e.crcOk === false).length },
    },
  ];
  return { records: [parent, ...children], chats, events, warnings };
}

async function ingestPlain(file: File, pool: HashPool, ctx: IngestContext, onProgress: (p: JobProgress) => void): Promise<IngestOutcome> {
  const digests = await pool.hashFile(file, onProgress).promise;
  let kind = kindFromFile(file.name, file.type);
  const chats: { recordId: string; bytes: Uint8Array }[] = [];
  let bytes: Uint8Array | null = null;
  if (kind === "chat-text" && file.size < 128 * 1024 * 1024) {
    bytes = new Uint8Array(await file.arrayBuffer());
    // The kept text must be exactly the bytes that were hashed.
    if (bytes.length !== digests.size || (await sha256Hex(bytes)) !== digests.sha256) {
      throw new Error("the file changed while it was being read; add it again");
    }
    if (!isChat(bytes)) kind = "document";
  } else if (kind === "chat-text") {
    kind = "document";
  }
  const rec = baseRecord({ name: file.name, type: file.type, size: file.size, lastModified: file.lastModified }, digests, kind, ctx);
  if (kind === "chat-text" && bytes) chats.push({ recordId: rec.id, bytes });
  return { records: [rec], chats, events: [hashedEvent(rec, ctx.actor)], warnings: [] };
}

export async function ingestFile(file: File, pool: HashPool, ctx: IngestContext, onProgress: (p: JobProgress) => void): Promise<IngestOutcome> {
  // Only unpack files named .zip. Word/Excel/APK files are zips inside, but
  // they are single documents and must stay single records.
  if (/\.zip$/i.test(file.name) && (await looksLikeZip(file))) return ingestZip(file, pool, ctx, onProgress);
  return ingestPlain(file, pool, ctx, onProgress);
}
