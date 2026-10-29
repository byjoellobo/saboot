import { describe, expect, it } from "vitest";
import { ChatParseError, cleanText, hashChat, isChatTextName, parseChat } from "../../src/sakshya/whatsapp/parse";
import { nodeDigest } from "./helpers";

const NNBSP = "\u202F";
const LRM = "\u200E";
const enc = (s: string) => new TextEncoder().encode(s);

const ANDROID_IN = [
  `27/08/23, 9:30${NNBSP}pm - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.`,
  `27/08/23, 9:34${NNBSP}pm - Appa: வணக்கம்`,
  `27/08/23, 9:35${NNBSP}pm - Asha Rao: Deposit of ₹60,000 will be returned?`,
  `Please confirm by Friday.`,
  `27/08/23, 9:36${NNBSP}pm - Appa: IMG-20230827-WA0003.jpg (file attached)`,
  `27/08/23, 9:37${NNBSP}pm - Appa: <Media omitted>`,
  `27/08/23, 9:38${NNBSP}pm - Asha Rao: This message was deleted`,
  `27/08/23, 9:39${NNBSP}pm - Appa: okay noted <This message was edited>`,
  `27/08/23, 9:40${NNBSP}pm - You changed the subject from "Flat 4B" to "Flat: 4B deposit"`,
  `27/08/23, 9:41${NNBSP}pm - Appa: location: https://maps.google.com/?q=12.97,77.59`,
  `28/08/23, 10:02${NNBSP}am - Asha Rao: 2016-04-29 10:30:00 is not a header`,
  `28/08/23, 12:15${NNBSP}pm - Appa: Missed voice call`,
  "",
].join("\n");

const IOS = [
  `[28/07/24, 9:09:28${NNBSP}PM] Ravi Kumar: ${LRM}Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.`,
  `[28/07/24, 9:10:01${NNBSP}PM] Ravi Kumar: Hello\n[28/07/24, 9:10:05${NNBSP}PM] Asha: this second line imitates a header`,
  `${LRM}[28/07/24, 9:11:00${NNBSP}PM] Asha: ${LRM}<attached: 00000035-PHOTO-2024-07-28-21-11-00.jpg>`,
  `[28/07/24, 9:12:00${NNBSP}PM] \u202A+91${"\u00A0"}00000${"\u00A0"}00001\u202C: ${LRM}This message was deleted.`,
  `${LRM}[28/07/24, 9:13:00${NNBSP}PM] Asha: ${LRM}image omitted`,
  `[28/07/24, 9:14:00${NNBSP}PM] ~RZ:`,
  "",
].join("\r\n");

describe("Android export (en-IN, 12-hour, U+202F)", () => {
  const bytes = enc(ANDROID_IN);
  const chat = parseChat(bytes);

  it("detects platform, boundaries and day/month order", () => {
    expect(chat.platform).toBe("android");
    expect(chat.boundaryMethod).toBe("header-lines");
    expect(chat.dateOrder).toBe("DMY");
    expect(chat.dateOrderReason).toMatch(/above 12/);
    expect(chat.messages).toHaveLength(11);
    expect(chat.limitations[0]).toMatch(/cannot be told apart/);
  });

  it("classifies system notices and keeps them authorless", () => {
    const [enc0] = chat.messages;
    expect(enc0?.kind).toBe("system");
    expect(enc0?.author).toBeNull();
    const subject = chat.messages[7];
    expect(subject?.kind).toBe("system");
    expect(subject?.author).toBeNull();
    expect(subject?.flags).toContain("system notice containing ': '");
  });

  it("parses authors, multi-line bodies, attachments and markers", () => {
    const m = chat.messages;
    expect(m[1]?.author).toBe("Appa");
    expect(m[1]?.body).toBe("வணக்கம்");
    expect(m[2]?.body).toBe("Deposit of ₹60,000 will be returned?\nPlease confirm by Friday.");
    expect(m[3]?.kind).toBe("attachment");
    expect(m[3]?.attachment).toBe("IMG-20230827-WA0003.jpg");
    expect(m[4]?.kind).toBe("media-omitted");
    expect(m[5]?.kind).toBe("deleted");
    expect(m[6]?.edited).toBe(true);
    expect(m[6]?.body).toBe("okay noted");
    expect(m[8]?.kind).toBe("location");
    expect(m[9]?.body).toBe("2016-04-29 10:30:00 is not a header");
    expect(m[10]?.kind).toBe("call");
  });

  it("converts 12-hour times including noon", () => {
    expect(chat.messages[1]?.localTime).toBe("2023-08-27T21:34:00");
    expect(chat.messages[9]?.localTime).toBe("2023-08-28T10:02:00");
    expect(chat.messages[10]?.localTime).toBe("2023-08-28T12:15:00");
    expect(chat.messages[1]?.timestampText).toBe("27/08/23, 9:34 pm");
  });

  it("covers every byte exactly once and hashes each record's bytes", async () => {
    const hashed = await hashChat(bytes, chat);
    let at = 0;
    for (const m of hashed.messages) {
      expect(m.byteStart).toBe(at);
      at = m.byteEnd;
      expect(m.sha256).toBe(nodeDigest("sha256", bytes.subarray(m.byteStart, m.byteEnd)));
    }
    expect(at).toBe(bytes.length);
    // Record 3 is two lines: header line + continuation, terminators included.
    const third = hashed.messages[2];
    const text = new TextDecoder().decode(bytes.subarray(third?.byteStart, third?.byteEnd));
    expect(text.endsWith("Please confirm by Friday.\n")).toBe(true);
  });

  it("lists participants by message count", () => {
    expect(chat.participants.map((p) => p.name)).toEqual(["Appa", "Asha Rao"]);
  });
});

describe("iOS export (CRLF records, LRM marks)", () => {
  const bytes = enc(IOS);
  const chat = parseChat(bytes);

  it("splits on CRLF so header-shaped body lines stay inside the message", () => {
    expect(chat.platform).toBe("ios");
    expect(chat.boundaryMethod).toBe("crlf-records");
    expect(chat.messages).toHaveLength(6);
    expect(chat.messages[1]?.body).toContain("this second line imitates a header");
    expect(chat.limitations.some((l) => l.includes("cannot be told apart"))).toBe(false);
  });

  it("labels the iOS encryption notice as system even though it has a sender", () => {
    expect(chat.messages[0]?.kind).toBe("system");
    expect(chat.messages[0]?.author).toBeNull();
  });

  it("reads attachments, deleted, omitted and empty messages", () => {
    const m = chat.messages;
    expect(m[2]?.kind).toBe("attachment");
    expect(m[2]?.attachment).toBe("00000035-PHOTO-2024-07-28-21-11-00.jpg");
    expect(m[3]?.kind).toBe("deleted");
    expect(m[3]?.author).toBe("+91 00000 00001");
    expect(m[4]?.kind).toBe("media-omitted");
    expect(m[5]?.kind).toBe("empty");
    expect(m[5]?.author).toBe("~RZ");
    expect(m[0]?.localTime).toBe("2024-07-28T21:09:28");
  });

  it("falls back to header matching when CRLF was stripped", () => {
    const lf = parseChat(enc(IOS.replace(/\r\n/g, "\n")));
    expect(lf.boundaryMethod).toBe("header-lines");
    expect(lf.messages).toHaveLength(7);
    expect(lf.warnings.join(" ")).toMatch(/no CRLF/);
  });
});

describe("date order inference and edge cases", () => {
  it("detects month/day order from a second number above 12", () => {
    const chat = parseChat(enc(`7/31/23, 7:11${NNBSP}AM - +91 00000 00002: message text\n`));
    expect(chat.dateOrder).toBe("MDY");
    expect(chat.messages[0]?.localTime).toBe("2023-07-31T07:11:00");
  });

  it("uses chronology when every number is 12 or less", () => {
    const lines = ["1/2/24, 10:00 - A: x", "1/3/24, 10:00 - B: y", "1/4/24, 10:00 - A: z", "1/5/24, 10:00 - B: w"];
    const chat = parseChat(enc(lines.join("\n")));
    // Day-first would mean 1 Feb, 1 Mar ...; month-first 2 Jan, 3 Jan ... Both are in order, so DMY default.
    expect(chat.dateOrder).toBe("DMY");
    expect(chat.dateOrderReason).toMatch(/assumed day\/month/);
    const mdy = parseChat(enc(["5/1/24, 10:00 - A: x", "4/2/24, 10:00 - B: y", "4/3/24, 10:00 - A: z", "4/4/24, 10:00 - A: w"].join("\n")));
    // As DMY: 5 Jan, 4 Feb, 4 Mar, 4 Apr (in order). As MDY: 1 May, 2 Apr... (backwards). Expect DMY.
    expect(mdy.dateOrder).toBe("DMY");
  });

  it("handles 24-hour UK format with four-digit years, BOM and missing final newline", () => {
    const bytes = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...enc("24/03/2020, 13:41 - Max: IMG-20200324-WA0014.jpg (file attached)\n24/03/2020, 13:42 - Max: done"),
    ]);
    const chat = parseChat(bytes);
    expect(chat.preambleBytes).toBe(3);
    expect(chat.messages[0]?.localTime).toBe("2020-03-24T13:41:00");
    expect(chat.messages[1]?.byteEnd).toBe(bytes.length);
  });

  it("handles year-first dates and Thai Buddhist years", () => {
    expect(parseChat(enc("2024-01-15, 10:30 - A: hi\n")).dateOrder).toBe("YMD");
    const thai = parseChat(enc(`[25/3/2567 BE, 23:15:34] A: hi\r\n`));
    expect(thai.messages[0]?.localTime).toBe("2024-03-25T23:15:34");
  });

  it("flags a message dated earlier than the one before it", () => {
    const chat = parseChat(enc(["10/01/24, 10:00 - A: a", "10/01/24, 11:00 - B: b", "10/01/24, 09:00 - A: c"].join("\n")));
    expect(chat.messages[2]?.flags).toContain("earlier than the previous message");
  });

  it("rejects files that are not WhatsApp exports", () => {
    expect(() => parseChat(enc("hello world\nthis is not a chat"))).toThrow(ChatParseError);
  });

  it("warns about text before the first message and invalid UTF-8", () => {
    const bytes = new Uint8Array([...enc("garbage line\n"), 0xff, ...enc("\n10/01/24, 10:00 - A: a\n")]);
    const chat = parseChat(bytes);
    expect(chat.warnings.join(" ")).toMatch(/not valid UTF-8/);
    expect(chat.warnings.join(" ")).toMatch(/before the first message/);
    expect(chat.messages[0]?.byteStart).toBe(chat.preambleBytes);
  });

  it("recognises chat text file names and cleans invisible marks", () => {
    expect(isChatTextName("_chat.txt")).toBe(true);
    expect(isChatTextName("WhatsApp Chat with Ravi.txt")).toBe(true);
    expect(isChatTextName("IMG-1.jpg")).toBe(false);
    expect(cleanText(`\u202A+91\u00A000000\u202C`)).toBe("+91 00000");
  });
});
