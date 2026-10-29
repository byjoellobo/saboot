// Encodes a list of expected file hashes into a URL fragment for QR codes.
//
// The fragment (#...) is never sent to a server, so the verify page can run
// fully offline and nothing about the case leaks through server logs.
//
// Binary layout (before raw-deflate + base64url):
//   u8  version (=1)
//   str caseRef          (u8 length + UTF-8, <= 60 bytes)
//   u16 count            (little-endian)
//   per item: str label (<= 16 bytes), str name (<= 40 bytes),
//             uleb128 size, 32 bytes SHA-256
import { deflateSync, inflateSync } from "fflate";

export const LINK_VERSION = 1;
const PREFIX = `v${LINK_VERSION}.`;
const MAX_ENCODED = 8 * 1024;
const MAX_ITEMS = 2000;

export interface VerifyItem {
  readonly label: string;
  readonly name: string;
  readonly size: number;
  readonly sha256: string;
}

export interface VerifyPayload {
  readonly caseRef: string;
  readonly items: readonly VerifyItem[];
}

export class VerifyLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerifyLinkError";
  }
}

const enc = new TextEncoder();

/** Truncate to at most `max` UTF-8 bytes without splitting a character. */
export function truncateUtf8(text: string, max: number): string {
  if (enc.encode(text).length <= max) return text;
  let out = "";
  for (const ch of text) {
    if (enc.encode(out + ch + "…").length > max) break;
    out += ch;
  }
  return out + "…";
}

class Writer {
  private readonly bytes: number[] = [];
  u8(v: number) {
    this.bytes.push(v & 0xff);
  }
  u16(v: number) {
    this.u8(v);
    this.u8(v >> 8);
  }
  str(text: string, max: number) {
    const b = enc.encode(truncateUtf8(text, max));
    this.u8(b.length);
    for (const x of b) this.bytes.push(x);
  }
  uleb(v: number) {
    if (!Number.isSafeInteger(v) || v < 0) throw new VerifyLinkError(`Invalid size ${v}`);
    let n = v;
    do {
      let byte = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) byte |= 0x80;
      this.u8(byte);
    } while (n > 0);
  }
  raw(b: Uint8Array) {
    for (const x of b) this.bytes.push(x);
  }
  done(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/**
 * Remove control and bidirectional-override characters from text that came
 * from a link, so a crafted name cannot visually disguise itself.
 */
export function cleanLinkText(text: string): string {
  return text.replace(/[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
}

class Reader {
  private at = 0;
  constructor(private readonly b: Uint8Array) {}
  private need(n: number) {
    if (this.at + n > this.b.length) throw new VerifyLinkError("Link data is truncated");
  }
  u8(): number {
    this.need(1);
    return this.b[this.at++] as number;
  }
  u16(): number {
    return this.u8() | (this.u8() << 8);
  }
  str(): string {
    const len = this.u8();
    this.need(len);
    const s = new TextDecoder().decode(this.b.subarray(this.at, this.at + len));
    this.at += len;
    return cleanLinkText(s);
  }
  uleb(): number {
    let result = 0;
    let scale = 1;
    for (let i = 0; i < 8; i++) {
      const byte = this.u8();
      result += (byte & 0x7f) * scale;
      if (!(byte & 0x80)) {
        if (!Number.isSafeInteger(result)) break;
        return result;
      }
      scale *= 128;
    }
    throw new VerifyLinkError("Size field is invalid");
  }
  raw(n: number): Uint8Array {
    this.need(n);
    const out = this.b.subarray(this.at, this.at + n);
    this.at += n;
    return out;
  }
  get remaining() {
    return this.b.length - this.at;
  }
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new VerifyLinkError(`Not a SHA-256 value: ${hex.slice(0, 16)}…`);
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new VerifyLinkError("Link contains invalid characters");
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodePayload(payload: VerifyPayload): string {
  if (payload.items.length > MAX_ITEMS) throw new VerifyLinkError("Too many items for one link");
  const w = new Writer();
  w.u8(LINK_VERSION);
  w.str(payload.caseRef, 60);
  w.u16(payload.items.length);
  for (const item of payload.items) {
    w.str(item.label, 16);
    w.str(item.name, 40);
    w.uleb(item.size);
    w.raw(hexToBytes(item.sha256));
  }
  return PREFIX + toBase64Url(deflateSync(w.done(), { level: 9 }));
}

export function decodePayload(fragment: string): VerifyPayload {
  const text = fragment.replace(/^#/, "");
  if (!text.startsWith(PREFIX)) throw new VerifyLinkError("This link was not made by a compatible version of Sakshya Kit");
  const body = text.slice(PREFIX.length);
  if (body.length > MAX_ENCODED) throw new VerifyLinkError("Link is too long");
  let bytes: Uint8Array;
  try {
    bytes = inflateSync(fromBase64Url(body));
  } catch (err) {
    if (err instanceof VerifyLinkError) throw err;
    throw new VerifyLinkError("Link data is damaged (could not decompress)");
  }
  const r = new Reader(bytes);
  if (r.u8() !== LINK_VERSION) throw new VerifyLinkError("Unsupported link version");
  const caseRef = r.str();
  const count = r.u16();
  if (count > MAX_ITEMS) throw new VerifyLinkError("Too many items in link");
  const items: VerifyItem[] = [];
  for (let i = 0; i < count; i++) {
    const label = r.str();
    const name = r.str();
    const size = r.uleb();
    items.push({ label, name, size, sha256: bytesToHex(r.raw(32)) });
  }
  if (r.remaining !== 0) throw new VerifyLinkError("Link has unexpected trailing data");
  return { caseRef, items };
}

export function buildVerifyUrl(base: string, payload: VerifyPayload): string {
  return `${base.replace(/#.*$/, "")}#${encodePayload(payload)}`;
}

/**
 * Split items into groups whose URLs stay under `maxUrlLength`, so each QR
 * code stays small enough to scan from a printed page (and photocopies).
 */
export function chunkForQr(
  base: string,
  caseRef: string,
  items: readonly VerifyItem[],
  maxUrlLength = 700,
): VerifyItem[][] {
  const groups: VerifyItem[][] = [];
  let current: VerifyItem[] = [];
  for (const item of items) {
    const trial = [...current, item];
    if (current.length > 0 && buildVerifyUrl(base, { caseRef, items: trial }).length > maxUrlLength) {
      groups.push(current);
      current = [item];
    } else {
      current = trial;
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}
