// Minimal, defensive ZIP reader built for hashing evidence archives.
//
// It reads the central directory (at the end of the file) instead of
// streaming local headers. That copes with Android/Java zips that use data
// descriptors, supports ZIP64 (> 4 GB), and lets us stream each entry's bytes
// through the hasher without holding the archive in memory.
import { Inflate } from "fflate";
import type { BlobLike, ProgressReport } from "../hash/blob-hash";
import { HashCancelledError } from "../hash/blob-hash";
import type { Digests, HasherModule } from "../hash/wasm-hasher";

const SIG_EOCD = 0x06054b50;
const SIG_ZIP64_LOCATOR = 0x07064b50;
const SIG_ZIP64_EOCD = 0x06064b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

const MAX_COMMENT = 0xffff;
const EOCD_MIN = 22;
const MAX_ENTRIES = 200_000;
const READ_CHUNK = 4 * 1024 * 1024;
/** Compressed bytes handed to the inflater at a time, so a bomb is caught early. */
const INFLATE_SLICE = 64 * 1024;
/** Deflate cannot expand data by more than about 1032:1. */
const MAX_DEFLATE_RATIO = 1032;
const MAX_DIRECTORY_BYTES = 64 * 1024 * 1024;
const CENTRAL_HEADER_MAX = 46 + 3 * 0xffff;

export class ZipFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipFormatError";
  }
}

export interface ZipEntryInfo {
  readonly path: string;
  readonly method: number;
  readonly flags: number;
  readonly compressedSize: number;
  readonly size: number;
  readonly crc32: string;
  readonly localHeaderOffset: number;
  /** DOS timestamp of the zipping device, no timezone: "YYYY-MM-DDTHH:MM:SS". */
  readonly modified: string | null;
  readonly isDirectory: boolean;
  readonly encrypted: boolean;
}

export interface ZipEntryResult {
  readonly entry: ZipEntryInfo;
  readonly digests: Digests | null;
  /** True when the CRC32 we computed equals the CRC stored in the zip. */
  readonly crcOk: boolean | null;
  readonly error: string | null;
  /** Raw bytes, only for entries the caller asked to keep (e.g. the chat .txt). */
  readonly bytes: Uint8Array | null;
}

export interface ReadZipOptions {
  /** Return the decompressed bytes for entries matching this predicate. */
  readonly keep?: (entry: ZipEntryInfo) => boolean;
  /** Upper bound on kept bytes per entry (default 128 MiB). */
  readonly keepLimit?: number;
  /** Upper bound on kept bytes across all entries (default 256 MiB). */
  readonly keepTotal?: number;
  readonly onProgress?: (p: ProgressReport) => void;
  readonly isCancelled?: () => boolean;
}

async function readRange(blob: BlobLike, start: number, end: number): Promise<Uint8Array> {
  if (start < 0 || end > blob.size || start > end) {
    throw new ZipFormatError(`Range ${start}-${end} lies outside the ${blob.size}-byte file`);
  }
  return new Uint8Array(await blob.slice(start, end).arrayBuffer());
}

function u64(view: DataView, at: number): number {
  const v = view.getBigUint64(at, true);
  if (v > BigInt(Number.MAX_SAFE_INTEGER)) throw new ZipFormatError("ZIP64 value too large");
  return Number(v);
}

interface Directory {
  readonly count: number;
  readonly offset: number;
  readonly size: number;
}

async function findDirectory(blob: BlobLike): Promise<Directory> {
  if (blob.size < EOCD_MIN) throw new ZipFormatError("File is too small to be a zip archive");
  const tailStart = Math.max(0, blob.size - (EOCD_MIN + MAX_COMMENT));
  const tail = await readRange(blob, tailStart, blob.size);
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);

  let eocd = -1;
  for (let i = tail.length - EOCD_MIN; i >= 0; i--) {
    if (view.getUint32(i, true) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipFormatError("No end-of-central-directory record; this is not a complete zip");

  let count = view.getUint16(eocd + 10, true);
  let size = view.getUint32(eocd + 12, true);
  let offset = view.getUint32(eocd + 16, true);

  const needs64 = count === 0xffff || size === 0xffffffff || offset === 0xffffffff;
  const locatorAt = eocd - 20;
  if (needs64 || (locatorAt >= 0 && view.getUint32(locatorAt, true) === SIG_ZIP64_LOCATOR)) {
    if (locatorAt < 0 || view.getUint32(locatorAt, true) !== SIG_ZIP64_LOCATOR) {
      throw new ZipFormatError("ZIP64 archive is missing its locator record");
    }
    const recOffset = u64(view, locatorAt + 8);
    const rec = await readRange(blob, recOffset, Math.min(blob.size, recOffset + 56));
    const rv = new DataView(rec.buffer, rec.byteOffset, rec.byteLength);
    if (rec.length < 56 || rv.getUint32(0, true) !== SIG_ZIP64_EOCD) {
      throw new ZipFormatError("ZIP64 end record is damaged");
    }
    count = u64(rv, 32);
    size = u64(rv, 40);
    offset = u64(rv, 48);
  }

  if (count > MAX_ENTRIES) throw new ZipFormatError(`Archive lists ${count} entries; refusing more than ${MAX_ENTRIES}`);
  if (offset + size > blob.size) throw new ZipFormatError("Central directory points outside the file");
  if (size > MAX_DIRECTORY_BYTES || size > Math.max(1, count) * CENTRAL_HEADER_MAX) {
    throw new ZipFormatError("Central directory is larger than its entries could need");
  }
  return { count, offset, size };
}

function decodeName(bytes: Uint8Array, utf8Flag: boolean): string {
  if (utf8Flag) return new TextDecoder("utf-8").decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // Legacy zips use CP437; latin1 is a close, lossless-enough fallback for display.
    return new TextDecoder("latin1").decode(bytes);
  }
}

export function dosDateTime(time: number, date: number): string | null {
  const year = 1980 + (date >> 9);
  const month = (date >> 5) & 0x0f;
  const day = date & 0x1f;
  const hour = time >> 11;
  const minute = (time >> 5) & 0x3f;
  const second = (time & 0x1f) * 2;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${year}-${p(month)}-${p(day)}T${p(hour)}:${p(minute)}:${p(second)}`;
}

function parseZip64Extra(
  extra: Uint8Array,
  wants: { size: boolean; compressed: boolean; offset: boolean },
): { size?: number; compressed?: number; offset?: number } {
  const view = new DataView(extra.buffer, extra.byteOffset, extra.byteLength);
  for (let at = 0; at + 4 <= extra.length; ) {
    const id = view.getUint16(at, true);
    const len = view.getUint16(at + 2, true);
    const body = at + 4;
    if (body + len > extra.length) break;
    if (id === 0x0001) {
      const out: { size?: number; compressed?: number; offset?: number } = {};
      let p = body;
      if (wants.size && p + 8 <= body + len) {
        out.size = u64(view, p);
        p += 8;
      }
      if (wants.compressed && p + 8 <= body + len) {
        out.compressed = u64(view, p);
        p += 8;
      }
      if (wants.offset && p + 8 <= body + len) {
        out.offset = u64(view, p);
      }
      return out;
    }
    at = body + len;
  }
  return {};
}

/** List every entry in the archive's central directory. */
export async function listZip(blob: BlobLike): Promise<ZipEntryInfo[]> {
  const dir = await findDirectory(blob);
  const cd = await readRange(blob, dir.offset, dir.offset + dir.size);
  const view = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
  const entries: ZipEntryInfo[] = [];

  let at = 0;
  for (let i = 0; i < dir.count; i++) {
    if (at + 46 > cd.length || view.getUint32(at, true) !== SIG_CENTRAL) {
      throw new ZipFormatError(`Central directory entry ${i + 1} is damaged`);
    }
    const flags = view.getUint16(at + 8, true);
    const method = view.getUint16(at + 10, true);
    const time = view.getUint16(at + 12, true);
    const date = view.getUint16(at + 14, true);
    const crc = view.getUint32(at + 16, true);
    let compressedSize = view.getUint32(at + 20, true);
    let size = view.getUint32(at + 24, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    let localHeaderOffset = view.getUint32(at + 42, true);
    const nameStart = at + 46;
    const extraStart = nameStart + nameLen;
    const next = extraStart + extraLen + commentLen;
    if (next > cd.length) throw new ZipFormatError(`Central directory entry ${i + 1} overruns the directory`);

    const z64 = parseZip64Extra(cd.subarray(extraStart, extraStart + extraLen), {
      size: size === 0xffffffff,
      compressed: compressedSize === 0xffffffff,
      offset: localHeaderOffset === 0xffffffff,
    });
    size = z64.size ?? size;
    compressedSize = z64.compressed ?? compressedSize;
    localHeaderOffset = z64.offset ?? localHeaderOffset;

    if (method === 8 && size > compressedSize * MAX_DEFLATE_RATIO + 1024) {
      throw new ZipFormatError(`Entry ${i + 1} claims an impossible compression ratio`);
    }
    const path = decodeName(cd.subarray(nameStart, extraStart), (flags & 0x0800) !== 0);
    entries.push({
      path,
      method,
      flags,
      compressedSize,
      size,
      crc32: crc.toString(16).padStart(8, "0"),
      localHeaderOffset,
      modified: dosDateTime(time, date),
      isDirectory: path.endsWith("/"),
      encrypted: (flags & 0x0001) !== 0,
    });
    at = next;
  }
  // Two entries pointing at the same data would hash (and inflate) it twice.
  const offsets = new Set<number>();
  for (const e of entries) {
    if (e.isDirectory) continue;
    if (offsets.has(e.localHeaderOffset)) throw new ZipFormatError("Two entries share the same data; the archive is malformed");
    offsets.add(e.localHeaderOffset);
  }
  return entries;
}

async function dataStart(blob: BlobLike, entry: ZipEntryInfo): Promise<number> {
  const head = await readRange(blob, entry.localHeaderOffset, Math.min(blob.size, entry.localHeaderOffset + 30));
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
  if (head.length < 30 || view.getUint32(0, true) !== SIG_LOCAL) {
    throw new ZipFormatError(`Local header for "${entry.path}" is damaged`);
  }
  const start = entry.localHeaderOffset + 30 + view.getUint16(26, true) + view.getUint16(28, true);
  if (start + entry.compressedSize > blob.size) {
    throw new ZipFormatError(`Data for "${entry.path}" runs past the end of the file`);
  }
  return start;
}

class KeptBytes {
  private readonly parts: Uint8Array[] = [];
  private length = 0;
  constructor(
    private readonly limit: number,
    private readonly budget: { remaining: number },
  ) {}
  push(chunk: Uint8Array): void {
    this.length += chunk.length;
    this.budget.remaining -= chunk.length;
    if (this.length > this.limit) throw new ZipFormatError(`Entry is larger than the ${this.limit}-byte limit`);
    if (this.budget.remaining < 0) throw new ZipFormatError("Too much text to keep from this archive");
    this.parts.push(chunk.slice());
  }
  join(): Uint8Array {
    const out = new Uint8Array(this.length);
    let at = 0;
    for (const p of this.parts) {
      out.set(p, at);
      at += p.length;
    }
    return out;
  }
}

async function hashEntry(
  mod: HasherModule,
  blob: BlobLike,
  entry: ZipEntryInfo,
  kept: KeptBytes | null,
  tick: (bytes: number) => void,
  isCancelled: () => boolean,
): Promise<Digests> {
  if (entry.method !== 0 && entry.method !== 8) {
    throw new ZipFormatError(`Compression method ${entry.method} is not supported`);
  }
  const start = await dataStart(blob, entry);
  const h = mod.create();
  let produced = 0;
  // Zip-bomb guard: never inflate more than the directory says, plus slack.
  // (listZip already rejected sizes beyond deflate's maximum ratio.)
  const ceiling = entry.size + 1024;
  const sink = (chunk: Uint8Array) => {
    produced += chunk.length;
    if (produced > ceiling) throw new ZipFormatError(`"${entry.path}" inflates beyond its declared size`);
    h.update(chunk);
    kept?.push(chunk);
  };
  const inflater = entry.method === 8 ? new Inflate((chunk) => sink(chunk)) : null;
  try {
    const end = start + entry.compressedSize;
    if (entry.compressedSize === 0 && inflater) inflater.push(new Uint8Array(0), true);
    for (let at = start; at < end; at += READ_CHUNK) {
      if (isCancelled()) throw new HashCancelledError();
      const stop = Math.min(end, at + READ_CHUNK);
      const raw = await readRange(blob, at, stop);
      if (inflater) {
        // Small slices: the size check in sink() runs before much can be inflated.
        for (let s = 0; s < raw.length; s += INFLATE_SLICE) {
          const piece = raw.subarray(s, Math.min(raw.length, s + INFLATE_SLICE));
          inflater.push(piece, stop === end && s + INFLATE_SLICE >= raw.length);
        }
      } else {
        sink(raw);
      }
      tick(stop - at);
    }
    return h.finish();
  } catch (err) {
    h.discard();
    throw err;
  }
}

/**
 * Hash every file inside a zip. Damaged or unsupported entries are reported
 * individually instead of failing the whole archive.
 */
export async function hashZipEntries(
  mod: HasherModule,
  blob: BlobLike,
  opts: ReadZipOptions = {},
): Promise<ZipEntryResult[]> {
  const entries = await listZip(blob);
  const total = entries.reduce((sum, e) => sum + (e.isDirectory ? 0 : e.compressedSize), 0);
  let done = 0;
  const tick = (bytes: number) => {
    done += bytes;
    opts.onProgress?.({ done, total });
  };
  const isCancelled = opts.isCancelled ?? (() => false);
  const results: ZipEntryResult[] = [];
  const keepBudget = { remaining: opts.keepTotal ?? 256 * 1024 * 1024 };

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (entry.encrypted) {
      results.push({ entry, digests: null, crcOk: null, error: "Entry is password-protected", bytes: null });
      continue;
    }
    const kept = opts.keep?.(entry) ? new KeptBytes(opts.keepLimit ?? 128 * 1024 * 1024, keepBudget) : null;
    try {
      const digests = await hashEntry(mod, blob, entry, kept, tick, isCancelled);
      results.push({
        entry,
        digests,
        crcOk: digests.crc32 === entry.crc32 && digests.size === entry.size,
        error: null,
        bytes: kept ? kept.join() : null,
      });
    } catch (err) {
      if (err instanceof HashCancelledError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      results.push({ entry, digests: null, crcOk: null, error: message, bytes: null });
    }
  }
  return results;
}

/** Quick signature check without reading the whole file. */
export async function looksLikeZip(blob: BlobLike): Promise<boolean> {
  if (blob.size < 4) return false;
  const head = await readRange(blob, 0, 4);
  return head[0] === 0x50 && head[1] === 0x4b && (head[2] === 0x03 || head[2] === 0x05) && (head[3] === 0x04 || head[3] === 0x06);
}
