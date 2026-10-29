// WhatsApp chat export parser that keeps exact byte ranges.
//
// Every message ("record") is the exact byte slice of the export file from its
// first byte up to the first byte of the next record, line terminator
// included. The slices plus any preamble add up to the whole file, which the
// parser asserts, so per-message SHA-256 values can be reproduced by anyone
// with the original file and a hex editor.
//
// iOS ends each record with CRLF and uses bare LF inside multi-line messages,
// so record boundaries are exact. Android uses LF everywhere, so boundaries
// come from header matching, and a message body that imitates a header cannot
// be told apart from a real message. That limitation is reported.
import { sha256Hex } from "../../engine/util/crypto";
import * as P from "./patterns";

export type Platform = "android" | "ios";
export type DateOrder = "DMY" | "MDY" | "YMD";
export type MessageKind =
  | "text"
  | "system"
  | "attachment"
  | "media-omitted"
  | "deleted"
  | "view-once"
  | "location"
  | "poll"
  | "call"
  | "pending"
  | "empty";

export interface ChatMessage {
  /** 1-based position in the export. */
  readonly index: number;
  /** Byte range [byteStart, byteEnd) in the export file, terminator included. */
  readonly byteStart: number;
  readonly byteEnd: number;
  /** Timestamp exactly as written in the file. */
  readonly timestampText: string;
  /** Local wall-clock time "YYYY-MM-DDTHH:MM:SS" (no timezone in the export), or null if unparseable. */
  readonly localTime: string | null;
  readonly authorRaw: string | null;
  /** Author with invisible formatting marks removed; null for system notices. */
  readonly author: string | null;
  /** Body for display: invisible marks and the "edited" marker removed. */
  readonly body: string;
  readonly kind: MessageKind;
  readonly edited: boolean;
  readonly attachment: string | null;
  readonly flags: readonly string[];
  readonly sha256: string;
}

export interface ParsedChat {
  readonly platform: Platform;
  readonly dateOrder: DateOrder;
  readonly dateOrderReason: string;
  readonly boundaryMethod: "crlf-records" | "header-lines";
  readonly totalBytes: number;
  readonly preambleBytes: number;
  readonly messages: readonly ChatMessage[];
  readonly participants: readonly { readonly name: string; readonly count: number }[];
  readonly warnings: readonly string[];
  readonly limitations: readonly string[];
}

export class ChatParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatParseError";
  }
}

interface Line {
  readonly start: number;
  readonly contentEnd: number;
  readonly end: number;
  readonly crlf: boolean;
  readonly text: string;
}

const decoder = new TextDecoder("utf-8");

function splitLines(bytes: Uint8Array, from: number): Line[] {
  const lines: Line[] = [];
  let start = from;
  for (let i = from; i < bytes.length; i++) {
    if (bytes[i] !== 0x0a) continue;
    const crlf = i > start && bytes[i - 1] === 0x0d;
    const contentEnd = crlf ? i - 1 : i;
    lines.push({ start, contentEnd, end: i + 1, crlf, text: decoder.decode(bytes.subarray(start, contentEnd)) });
    start = i + 1;
  }
  if (start < bytes.length) {
    lines.push({ start, contentEnd: bytes.length, end: bytes.length, crlf: false, text: decoder.decode(bytes.subarray(start)) });
  }
  return lines;
}

interface Header {
  readonly match: RegExpMatchArray;
  readonly d1: string;
  readonly d2: string;
  readonly d3: string;
  readonly time: string;
  readonly ampm: string | null;
}

function readHeader(text: string, platform: Platform): Header | null {
  const m = text.match(platform === "ios" ? P.IOS_HEADER : P.ANDROID_HEADER);
  const g = m?.groups;
  if (!m || !g || !g.d1 || !g.d2 || !g.d3 || !g.time) return null;
  return { match: m, d1: g.d1, d2: g.d2, d3: g.d3, time: g.time, ampm: g.ampm ?? null };
}

function detectPlatform(lines: readonly Line[]): Platform {
  for (const l of lines.slice(0, 50)) {
    if (!l.text.trim()) continue;
    if (P.IOS_HEADER.test(l.text)) return "ios";
    if (P.ANDROID_HEADER.test(l.text)) return "android";
  }
  throw new ChatParseError(
    "This does not look like a WhatsApp chat export: no line starts with a WhatsApp date and time. " +
      "Use WhatsApp > open the chat > More > Export chat, and add the .zip or .txt it produces.",
  );
}

// ------------------------------------------------------------ date order

function inferDateOrder(headers: readonly Header[]): { order: DateOrder; reason: string; conflict: boolean } {
  if (headers.some((h) => h.d1.length === 4)) return { order: "YMD", reason: "year written first (4 digits)", conflict: false };
  const firstBig = headers.some((h) => Number(h.d1) > 12);
  const secondBig = headers.some((h) => Number(h.d2) > 12);
  if (firstBig && secondBig) {
    return { order: "DMY", reason: "dates in this file are written inconsistently; assumed day/month", conflict: true };
  }
  if (firstBig) return { order: "DMY", reason: "a first number above 12 can only be a day", conflict: false };
  if (secondBig) return { order: "MDY", reason: "a second number above 12 can only be a day", conflict: false };
  // Chronology: messages are mostly in order, so the right order has fewer backward jumps.
  // Skip the first record: the encryption notice is often dated later than what follows.
  const backward = (order: DateOrder) => {
    let count = 0;
    let prev = "";
    headers.slice(1).forEach((h) => {
      const key = dateKey(h, order);
      if (prev && key < prev) count++;
      prev = key;
    });
    return count;
  };
  const dmy = backward("DMY");
  const mdy = backward("MDY");
  if (mdy < dmy) return { order: "MDY", reason: "month/day order keeps the messages in time order", conflict: false };
  if (dmy < mdy) return { order: "DMY", reason: "day/month order keeps the messages in time order", conflict: false };
  return {
    order: "DMY",
    reason: "ambiguous in this file (all numbers 12 or below); assumed day/month, the usual Indian setting",
    conflict: true,
  };
}

function fullYear(y: string): number {
  const n = Number(y);
  if (y.length <= 2) return 2000 + n;
  if (n > 2400) return n - 543; // Thai Buddhist Era
  return n;
}

function ymd(h: Header, order: DateOrder): { y: number; m: number; d: number } {
  switch (order) {
    case "YMD":
      return { y: fullYear(h.d1), m: Number(h.d2), d: Number(h.d3) };
    case "MDY":
      return { y: fullYear(h.d3), m: Number(h.d1), d: Number(h.d2) };
    case "DMY":
      return { y: fullYear(h.d3), m: Number(h.d2), d: Number(h.d1) };
  }
}

function dateKey(h: Header, order: DateOrder): string {
  const { y, m, d } = ymd(h, order);
  return `${y}`.padStart(4, "0") + `${m}`.padStart(2, "0") + `${d}`.padStart(2, "0") + h.time.padStart(8, "0");
}

function localTime(h: Header, order: DateOrder): string | null {
  const { y, m, d } = ymd(h, order);
  const parts = h.time.split(/[:.]/).map(Number);
  let hour = parts[0] ?? 0;
  const minute = parts[1] ?? 0;
  const second = parts[2] ?? 0;
  if (h.ampm) {
    const pm = /^[Pp]/.test(h.ampm);
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(m)}-${p(d)}T${p(hour)}:${p(minute)}:${p(second)}`;
}

// ------------------------------------------------------------ bodies

export function cleanText(text: string): string {
  return text.replace(P.INVISIBLE, "").replace(/[\u00A0\u202F]/g, " ");
}

interface Classified {
  readonly kind: MessageKind;
  readonly attachment: string | null;
  readonly edited: boolean;
  readonly body: string;
}

function classifyBody(rawBody: string, platform: Platform, lineStartsWithLrm: boolean): Classified {
  // Display and classification use LF line breaks; hashes still cover the original bytes.
  const unified = rawBody.replace(/\r\n/g, "\n");
  const editedMatch = P.EDITED_SUFFIX.test(unified);
  const body = editedMatch ? unified.replace(P.EDITED_SUFFIX, "") : unified;
  const firstLine = (body.split("\n")[0] ?? "").replace(/\r$/, "");
  const display = cleanText(body);
  const base = { edited: editedMatch, body: display };

  if (body.length === 0) return { ...base, kind: "empty", attachment: null };
  if (platform === "android") {
    const att = firstLine.match(P.ANDROID_ATTACHED);
    if (att?.groups?.file) return { ...base, kind: "attachment", attachment: att.groups.file };
    if (P.ANDROID_MEDIA_OMITTED.test(firstLine)) return { ...base, kind: "media-omitted", attachment: null };
  } else {
    const att = firstLine.match(P.IOS_ATTACHED);
    if (att?.groups?.file) return { ...base, kind: "attachment", attachment: att.groups.file.trim() };
    if (P.IOS_OMITTED.test(firstLine)) return { ...base, kind: "media-omitted", attachment: null };
  }
  if (P.DELETED.test(body)) return { ...base, kind: "deleted", attachment: null };
  if (P.VIEW_ONCE.test(body)) return { ...base, kind: "view-once", attachment: null };
  if (P.LOCATION.test(firstLine)) return { ...base, kind: "location", attachment: null };
  if (P.POLL.test(firstLine)) return { ...base, kind: "poll", attachment: null };
  if (P.CALL.test(body)) return { ...base, kind: "call", attachment: null };
  if (P.PENDING.test(body)) return { ...base, kind: "pending", attachment: null };
  // iOS system notices: body starts with LRM but the line itself does not.
  if (platform === "ios" && !lineStartsWithLrm && body.startsWith("\u200E")) return { ...base, kind: "system", attachment: null };
  return { ...base, kind: "text", attachment: null };
}

function splitAuthor(rest: string, platform: Platform): { authorRaw: string | null; body: string; flags: string[] } {
  const m = rest.match(P.AUTHOR_SPLIT);
  const author = m?.groups?.author;
  if (!m || author === undefined) return { authorRaw: null, body: rest, flags: [] };
  const body = rest.slice(m[0].length);
  if (platform === "android") {
    const looksSystem = /["“”]/.test(author) || author.length > 60 || (P.SYSTEM_PHRASES.test(author) && !/^\+?[\d\s]+$/.test(author));
    if (looksSystem) return { authorRaw: null, body: rest, flags: ["system notice containing ': '"] };
  }
  return { authorRaw: author, body, flags: [] };
}

// ------------------------------------------------------------ main

interface Draft {
  readonly first: Line;
  readonly lines: Line[];
  readonly header: Header;
  /** iOS only: continuation lines that look like a message header (possible merged message). */
  headerLike: number;
}

export interface ParseOptions {
  /** Override the inferred day/month order (e.g. after the user checks a date on the phone). */
  readonly dateOrder?: DateOrder;
}

/** Parse an export. Hashes are filled by `hashChat`; until then sha256 is "". */
/** Larger than any real chat export text; protects the browser from hostile input. */
export const MAX_CHAT_BYTES = 128 * 1024 * 1024;

export function parseChat(bytes: Uint8Array, options: ParseOptions = {}): ParsedChat {
  if (bytes.length > MAX_CHAT_BYTES) throw new ChatParseError("This chat file is too large to be a WhatsApp export.");
  const warnings: string[] = [];
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    warnings.push("The file is not valid UTF-8. Damaged characters are shown as �; hashes still cover the original bytes.");
  }
  const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  const lines = splitLines(bytes, bom);
  const platform = detectPlatform(lines);
  const crlfCount = lines.filter((l) => l.crlf).length;
  const boundaryMethod = platform === "ios" && crlfCount > 0 ? "crlf-records" : "header-lines";
  if (platform === "ios" && crlfCount === 0) {
    warnings.push("This iOS export has no CRLF line endings, so it was probably converted by another program. Message boundaries were found by matching headers instead.");
  }

  const drafts: Draft[] = [];
  let preambleEnd = bom;
  let prevEndedRecord = true;
  for (const line of lines) {
    const header = prevEndedRecord ? readHeader(line.text, platform) : null;
    if (header) {
      drafts.push({ first: line, lines: [line], header, headerLike: 0 });
    } else if (drafts.length > 0) {
      const current = drafts[drafts.length - 1] as Draft;
      current.lines.push(line);
      if (boundaryMethod === "crlf-records" && readHeader(line.text, platform)) current.headerLike++;
    } else {
      preambleEnd = line.end;
    }
    prevEndedRecord = boundaryMethod === "crlf-records" ? line.crlf : true;
  }
  if (drafts.length === 0) throw new ChatParseError("No messages were found in this file.");
  if (preambleEnd > bom) warnings.push(`${preambleEnd - bom} bytes before the first message were not recognised as a message.`);

  const inferred = inferDateOrder(drafts.map((d) => d.header));
  const order = options.dateOrder ?? inferred.order;
  const reason = options.dateOrder ? `set by the user (detected: ${inferred.reason})` : inferred.reason;
  if (inferred.conflict && !options.dateOrder) {
    warnings.push(`The day/month order of dates could not be confirmed (${inferred.reason}). Check one message's date on the phone.`);
  }
  const merged = drafts.filter((d) => d.headerLike > 0).length;
  if (merged > 0) {
    warnings.push(
      `${merged} message(s) contain a line that looks like a separate message but is not separated the usual iOS way. They are kept as one message and marked "check".`,
    );
  }
  const authorCounts = new Map<string, number>();
  let prevTime: string | null = null;

  const messages: ChatMessage[] = drafts.map((d, i) => {
    const next = drafts[i + 1];
    const byteStart = d.first.start;
    const byteEnd = next ? next.first.start : bytes.length;
    const last = d.lines[d.lines.length - 1] as Line;
    const recordText = decoder.decode(bytes.subarray(byteStart, last.contentEnd));
    const headerText = d.header.match[0];
    const rest = recordText.slice(headerText.length);
    const split = splitAuthor(rest, platform);
    const lineStartsWithLrm = d.first.text.startsWith("\u200E");
    const classified = split.authorRaw === null && platform === "android"
      ? { kind: "system" as const, attachment: null, edited: false, body: cleanText(rest) }
      : classifyBody(split.body, platform, lineStartsWithLrm);
    const isSystem = classified.kind === "system";
    const author = split.authorRaw !== null && !isSystem ? cleanText(split.authorRaw).trim() : null;
    if (author) authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);

    const time = localTime(d.header, order);
    const flags = [...split.flags];
    if (d.headerLike > 0) flags.push("contains a line shaped like another message; check on the phone");
    if (!time) flags.push("date/time could not be read");
    if (i > 1 && time && prevTime && time < prevTime) flags.push("earlier than the previous message");
    if (time) prevTime = time;

    return {
      index: i + 1,
      byteStart,
      byteEnd,
      timestampText: cleanText(headerText).replace(/^\[|\]\s*$|\s*[-–]\s*$/g, "").trim(),
      localTime: time,
      authorRaw: isSystem ? null : split.authorRaw,
      author,
      body: classified.body,
      kind: classified.kind,
      edited: classified.edited,
      attachment: classified.attachment,
      flags,
      sha256: "",
    };
  });

  // Each record must start at the beginning of a line, in increasing order.
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const atLineStart = m.byteStart === bom || bytes[m.byteStart - 1] === 0x0a;
    if (!atLineStart || (prev && m.byteStart <= prev.byteStart)) {
      throw new ChatParseError(`Internal check failed: message ${m.index} does not start at a line start.`);
    }
  });
  // Coverage check: preamble + every record slice must equal the file exactly.
  const covered = messages.reduce((sum, m) => sum + (m.byteEnd - m.byteStart), preambleEnd);
  if (covered !== bytes.length || messages[0]?.byteStart !== preambleEnd) {
    throw new ChatParseError(`Internal check failed: records cover ${covered} of ${bytes.length} bytes.`);
  }

  // Senders seen only once, or with sentence-like names, may be header-shaped
  // body lines or unrecognised system notices: flag them, never hide them.
  const participants = [...authorCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const flagged = messages.map((m) => {
    if (platform !== "android" || !m.author) return m;
    const extra: string[] = [];
    if (authorCounts.get(m.author) === 1 && messages.length > 5) extra.push("only message from this sender");
    if (m.author.split(/\s+/).length > 5) extra.push("sender name looks like a sentence; may be a system notice");
    return extra.length ? { ...m, flags: [...m.flags, ...extra] } : m;
  });

  const limitations = [
    "Times are the phone's local time as written in the export; the export does not record a time zone.",
    "Disappearing and view-once messages, and messages deleted before export, are not in the export.",
    "Each message hash identifies this particular export file. Exporting the same chat again can produce different bytes.",
  ];
  if (boundaryMethod === "header-lines") {
    limitations.unshift(
      "Message boundaries were found by matching date/time headers. A message that itself contains a line shaped like a WhatsApp header cannot be told apart from a separate message, so authorship of such lines should be checked against the phone.",
    );
  }

  return {
    platform,
    dateOrder: order,
    dateOrderReason: reason,
    boundaryMethod,
    totalBytes: bytes.length,
    preambleBytes: preambleEnd,
    messages: flagged,
    participants,
    warnings,
    limitations,
  };
}

/** Fill in each message's SHA-256 over its exact byte range. */
export async function hashChat(bytes: Uint8Array, chat: ParsedChat): Promise<ParsedChat> {
  const messages: ChatMessage[] = [];
  for (const m of chat.messages) {
    messages.push({ ...m, sha256: await sha256Hex(bytes.subarray(m.byteStart, m.byteEnd)) });
  }
  return { ...chat, messages };
}

/** Name of the chat text file inside a WhatsApp export zip. */
export function isChatTextName(path: string): boolean {
  const name = path.split("/").pop() ?? path;
  return name === "_chat.txt" || /\.txt$/i.test(name);
}
