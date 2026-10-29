import { describe, expect, it } from "vitest";
import { checkCase } from "../../src/sakshya/certificate/checks";
import { cleanLinkText, decodePayload, encodePayload } from "../../src/engine/verify/verify-link";
import { MAX_CHAT_BYTES, parseChat } from "../../src/sakshya/whatsapp/parse";
import { sampleCase } from "./fixtures";

const enc = (s: string) => new TextEncoder().encode(s);
const NNBSP = "\u202F";

describe("parser fixes from review", () => {
  it("flags an iOS message that swallowed a header-shaped line (mixed terminators)", () => {
    const text = `[05/03/24, 9:00:00${NNBSP}AM] Alice: hello\r\n[05/03/24, 9:01:00${NNBSP}AM] Bob: I admit it\n[05/03/24, 9:02:00${NNBSP}AM] Alice: ok\r\n`;
    const chat = parseChat(enc(text));
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[1]?.flags.join(" ")).toMatch(/shaped like another message/);
    expect(chat.warnings.join(" ")).toMatch(/1 message\(s\) contain a line/);
  });

  it("treats Android group-name changes containing ': ' as system notices", () => {
    const text = [
      `01/02/24, 10:00 - Asha: hi`,
      `01/02/24, 10:01 - Priya changed the group name to Trip: Goa`,
      `01/02/24, 10:02 - Asha: ok`,
      "",
    ].join("\n");
    const chat = parseChat(enc(text));
    expect(chat.messages[1]?.kind).toBe("system");
    expect(chat.messages[1]?.author).toBeNull();
  });

  it("reads attachments in Android exports that use CRLF line endings", () => {
    const text = `15/01/24, 10:30 am - Asha: IMG-20240115-WA0003.jpg (file attached)\r\nRent receipt\r\n15/01/24, 10:31 am - Ravi: ok\r\n`;
    const chat = parseChat(enc(text));
    expect(chat.messages[0]?.kind).toBe("attachment");
    expect(chat.messages[0]?.attachment).toBe("IMG-20240115-WA0003.jpg");
    expect(chat.messages[0]?.body).toBe("IMG-20240115-WA0003.jpg (file attached)\nRent receipt");
  });

  it("lets the user override an ambiguous date order, and warns when unsure", () => {
    const text = ["03/04/24, 10:00 - A: x", "04/03/24, 10:00 - B: y", ""].join("\n");
    const auto = parseChat(enc(text));
    expect(auto.warnings.join(" ")).toMatch(/day\/month order of dates could not be confirmed/);
    const forced = parseChat(enc(text), { dateOrder: "MDY" });
    expect(forced.dateOrder).toBe("MDY");
    expect(forced.dateOrderReason).toMatch(/set by the user/);
    expect(forced.messages[0]?.localTime).toBe("2024-03-04T10:00:00");
  });

  it("flags sentence-like Android sender names", () => {
    const lines = Array.from({ length: 8 }, (_, i) => `01/02/24, 10:0${i} - Asha: message ${i}`);
    lines.push("01/02/24, 10:09 - Ravi said that the deposit will be: never");
    const chat = parseChat(enc(`${lines.join("\n")}\n`));
    const last = chat.messages[chat.messages.length - 1];
    expect(last?.flags.join(" ")).toMatch(/only message from this sender|looks like a sentence/);
  });

  it("rejects chat files larger than any real export", () => {
    const fake = { length: MAX_CHAT_BYTES + 1 } as unknown as Uint8Array;
    expect(() => parseChat(fake)).toThrow(/too large/);
  });
});

describe("verify link text cleaning", () => {
  it("strips bidi overrides and control characters from names", () => {
    expect(cleanLinkText("invoice\u202Egpj.exe")).toBe("invoicegpj.exe");
    expect(cleanLinkText("a\u0000b\u200Fc")).toBe("abc");
    const encoded = encodePayload({ caseRef: "Case\u202E1", items: [{ label: "R-1", name: "x\u2066y", size: 1, sha256: "a".repeat(64) }] });
    const decoded = decodePayload(encoded);
    expect(decoded.caseRef).toBe("Case1");
    expect(decoded.items[0]?.name).toBe("xy");
  });
});

describe("readiness checks", () => {
  it("warns when a manner-of-production template still has [blanks]", async () => {
    const c = await sampleCase();
    const withBlanks = { ...c, records: c.records.map((r) => ({ ...r, manner: "Exported on [date] from WhatsApp" })) };
    expect(
      checkCase(withBlanks)
        .map((i) => i.message)
        .join("\n"),
    ).toMatch(/\[brackets\]/);
  });
});
