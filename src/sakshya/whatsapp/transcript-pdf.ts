// Paginated, per-message-hashed transcript of a WhatsApp export.
import type { FontLoader } from "../../engine/pdf/fonts";
import { MUTED, PdfWriter, WARN, type Block, type Row, type Span } from "../../engine/pdf/writer";
import { formatBytes, istStamp } from "../../engine/util/format";
import type { ChatMessage, MessageKind, ParsedChat } from "./parse";

export interface FileRef {
  readonly label: string;
  readonly name: string;
  readonly size: number;
  readonly sha256: string;
}

export interface TranscriptOptions {
  readonly loader: FontLoader;
  readonly caseRef: string;
  readonly chat: ParsedChat;
  /** The chat .txt record the byte offsets refer to. */
  readonly chatFile: FileRef;
  /** The zip it came from, if any. */
  readonly container: FileRef | null;
  /** Files inside the export, by file name, so attachments can show their own hash. null = ambiguous name. */
  readonly attachments: ReadonlyMap<string, FileRef | null>;
  /** Optional local-time window, "YYYY-MM-DD" or full "YYYY-MM-DDTHH:MM:SS". */
  readonly from?: string;
  readonly to?: string;
  readonly generatedAt: Date;
  readonly appVersion: string;
  readonly onProgress?: (done: number, total: number) => void;
}

const KIND_LABEL: Readonly<Record<MessageKind, string | null>> = {
  text: null,
  system: "System notice (not written by a participant)",
  attachment: null,
  "media-omitted": "Media not included in this export",
  deleted: "Deleted message",
  "view-once": "View-once media (not exported)",
  location: "Location shared",
  poll: "Poll",
  call: "Call record",
  pending: "Message not yet received on this phone",
  empty: "Empty message",
};

export function selectMessages(chat: ParsedChat, from?: string, to?: string): ChatMessage[] {
  if (!from && !to) return [...chat.messages];
  const lo = from ?? "";
  // A bare date for "to" should include that whole day.
  const hi = to ? (to.length === 10 ? `${to}T23:59:59` : to) : "￿";
  return chat.messages.filter((m) => m.localTime !== null && m.localTime >= lo && m.localTime <= hi);
}

function messageRow(m: ChatMessage, opts: TranscriptOptions): Row {
  const kind = KIND_LABEL[m.kind];
  const blocks: Block[] = [];
  if (kind) blocks.push({ spans: [{ text: `[${kind}]`, color: MUTED }], size: 7 });
  if (m.body.trim()) blocks.push({ spans: [{ text: m.body }], size: 8.4 });
  if (m.attachment) {
    const file = opts.attachments.get(m.attachment);
    blocks.push({
      spans: file
        ? [{ text: `Attachment ${file.label}: ${file.name}, ${formatBytes(file.size)}\nSHA-256 ${file.sha256}`, style: "mono" }]
        : file === null
          ? [{ text: `More than one file in the export is named "${m.attachment}"; check which one this message refers to.`, color: WARN }]
          : [{ text: `Attachment named "${m.attachment}" is not in the export provided.`, color: WARN }],
      size: 6,
    });
  }
  const notes: Span[] = [];
  if (m.edited) notes.push({ text: "Edited by sender. " });
  for (const f of m.flags) notes.push({ text: `Check: ${f}. `, color: WARN });
  if (notes.length) blocks.push({ spans: notes, size: 6.8 });
  blocks.push({
    spans: [{ text: `bytes ${m.byteStart}–${m.byteEnd} · SHA-256 ${m.sha256}`, style: "mono", color: MUTED }],
    size: 5.6,
  });

  const sender: Span[] = m.author
    ? [{ text: m.author, style: "sansBold" }]
    : [{ text: m.kind === "system" ? "(system)" : "-", color: MUTED }];
  return [
    [{ spans: [{ text: String(m.index) }], size: 7.4 }],
    [
      { spans: [{ text: m.timestampText }], size: 7.4 },
      ...(m.localTime ? [{ spans: [{ text: m.localTime.replace("T", " "), color: MUTED }], size: 6 }] : []),
    ],
    [{ spans: sender, size: 7.6 }],
    blocks,
  ];
}

async function summary(w: PdfWriter, opts: TranscriptOptions, shown: readonly ChatMessage[]): Promise<void> {
  const { chat } = opts;
  await w.heading("TRANSCRIPT OF WHATSAPP CHAT EXPORT", 13, "center");
  await w.paragraph([{ text: opts.caseRef }], 9, { align: "center" });
  const first = chat.messages.find((m) => m.localTime)?.localTime;
  const last = [...chat.messages].reverse().find((m) => m.localTime)?.localTime;
  const undated = opts.from || opts.to ? chat.messages.filter((m) => m.localTime === null).length : 0;
  const rows: [string, Span[]][] = [
    ["Chat file", [{ text: `${opts.chatFile.label}: ${opts.chatFile.name}` }]],
    ["Chat file size", [{ text: formatBytes(opts.chatFile.size) }]],
    ["Chat file SHA-256", [{ text: opts.chatFile.sha256, style: "mono" }]],
    ...(opts.container
      ? ([
          ["Export archive", [{ text: `${opts.container.label}: ${opts.container.name}, ${formatBytes(opts.container.size)}` }]],
          ["Archive SHA-256", [{ text: opts.container.sha256, style: "mono" }]],
        ] as [string, Span[]][])
      : []),
    ["Exported from", [{ text: chat.platform === "ios" ? "WhatsApp on iPhone (iOS format)" : "WhatsApp on Android (Android format)" }]],
    [
      "Messages",
      [
        {
          text:
            `${chat.messages.length} in the export; ${shown.length} shown in this transcript` +
            (opts.from || opts.to ? ` (local time ${opts.from ?? "start"} to ${opts.to ?? "end"})` : "") +
            (undated ? `; ${undated} message(s) with unreadable times were left out` : ""),
        },
      ],
    ],
    ["Period covered", [{ text: first && last ? `${first.replace("T", " ")} to ${last.replace("T", " ")} (phone's local time)` : "-" }]],
    ["Participants", [{ text: chat.participants.map((p) => `${p.name} (${p.count})`).join(", ") || "-" }]],
    [
      "Date order used",
      [
        {
          text: `${chat.dateOrder === "DMY" ? "day/month/year" : chat.dateOrder === "MDY" ? "month/day/year" : "year/month/day"}: ${chat.dateOrderReason}`,
        },
      ],
    ],
    [
      "Message boundaries",
      [{ text: chat.boundaryMethod === "crlf-records" ? "exact (iOS record terminators)" : "by date/time header lines (see limitations)" }],
    ],
    ["Generated", [{ text: `${istStamp(opts.generatedAt)} with Sakshya Kit ${opts.appVersion}` }]],
  ];
  await w.table(
    [
      { header: "Item", width: 0.22 },
      { header: "Value", width: 0.78 },
    ],
    rows.map(([k, v]) => [[{ spans: [{ text: k, color: MUTED }], size: 7.8 }], [{ spans: v, size: 7.8 }]]),
  );

  await w.paragraph([{ text: "How each message can be checked", style: "sansBold" }], 9.5, { after: 2 });
  await w.paragraph(
    [
      {
        text:
          "Every message below shows a byte range [start–end) in the chat file and the SHA-256 of exactly those bytes, including the line ending. " +
          `In the full export the ranges run back to back from byte ${chat.preambleBytes} to byte ${chat.totalBytes} (the end of the file)` +
          (chat.preambleBytes > 0 ? `; the first ${chat.preambleBytes} bytes are not part of any message` : "") +
          (shown.length < chat.messages.length
            ? `. This transcript is an excerpt: it shows ${shown.length} of ${chat.messages.length} messages, so the ranges shown have gaps where messages were left out`
            : "") +
          ". To check one message, hash that slice of the original chat file, for example: ",
      },
      {
        text: "python -c \"import hashlib;b=open('_chat.txt','rb').read();print(hashlib.sha256(b[START:END]).hexdigest())\"",
        style: "mono",
      },
    ],
    8,
  );
  await w.paragraph([{ text: "Limitations", style: "sansBold" }], 9.5, { after: 2 });
  for (const l of [...chat.limitations, ...chat.warnings]) await w.paragraph([{ text: `•  ${l}` }], 7.8, { indent: 4, after: 2 });
  await w.paragraph(
    [
      {
        text: "Characters that cannot be printed (such as emoji) are shown as their Unicode code point, e.g. [U+1F44D]. Hashes always cover the original characters.",
        color: MUTED,
      },
    ],
    7.4,
  );
  w.spacer(4);
}

const BATCH = 150;

export async function buildTranscriptPdf(opts: TranscriptOptions): Promise<Uint8Array> {
  const shown = selectMessages(opts.chat, opts.from, opts.to);
  const w = await PdfWriter.create({
    loader: opts.loader,
    title: `WhatsApp transcript ${opts.chatFile.label}: ${opts.chatFile.name}`,
    subject: `Per-message hashed transcript of ${opts.chatFile.name} (SHA-256 ${opts.chatFile.sha256})`,
    keywords: ["WhatsApp", "transcript", "SHA-256", "BSA section 63"],
    createdAt: opts.generatedAt,
  });
  await summary(w, opts, shown);

  const columns = [
    { header: "#", width: 0.06 },
    { header: "Date, time (as written)", width: 0.15 },
    { header: "Sender", width: 0.15 },
    { header: "Message, attachments and message hash", width: 0.64 },
  ];
  if (shown.length === 0) {
    await w.paragraph([{ text: "No messages fall within the selected period.", color: WARN }], 9);
  }
  for (let i = 0; i < shown.length; i += BATCH) {
    const rows = shown.slice(i, i + BATCH).map((m) => messageRow(m, opts));
    await w.table(columns, rows, { zebra: true, header: i === 0 });
    opts.onProgress?.(Math.min(shown.length, i + BATCH), shown.length);
    // Let the page repaint between batches on very long chats.
    await new Promise((r) => setTimeout(r, 0));
  }

  const short = `${opts.chatFile.sha256.slice(0, 16)}…`;
  return w.finish((n, total) => ({
    left: `Transcript of ${opts.chatFile.label} (chat file SHA-256 ${short}) · Sakshya Kit ${opts.appVersion} · not legal advice`,
    right: `Page ${n} of ${total}`,
  }));
}
