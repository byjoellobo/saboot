import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { appendEvent, GENESIS, headHash, verifyChain, type CustodyEvent } from "../../src/engine/custody/custody-log";
import { canonicalJson } from "../../src/engine/util/crypto";
import { formatBytes, groupHex, istDate, istStamp, istTime, shortSize } from "../../src/engine/util/format";
import {
  buildVerifyUrl,
  chunkForQr,
  decodePayload,
  encodePayload,
  truncateUtf8,
  VerifyLinkError,
  type VerifyItem,
} from "../../src/engine/verify/verify-link";

const SHA = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

async function sampleLog(): Promise<CustodyEvent[]> {
  let log: CustodyEvent[] = [];
  log = await appendEvent(log, { action: "case-created", actor: "Asha", summary: "Case opened" }, new Date("2026-10-29T03:00:00Z"));
  log = await appendEvent(
    log,
    { action: "record-hashed", actor: "Asha", summary: "Hashed chat.zip", details: { sha256: SHA, size: 3 } },
    new Date("2026-10-29T03:05:00Z"),
  );
  return log;
}

describe("custody log", () => {
  it("chains each event to the previous one", async () => {
    const log = await sampleLog();
    expect(log[0]?.prevHash).toBe(GENESIS);
    expect(log[1]?.prevHash).toBe(log[0]?.hash);
    expect(headHash(log)).toBe(log[1]?.hash);
    expect(await verifyChain(log)).toEqual({ ok: true, brokenAt: null, reason: null });
  });

  it("does not mutate the input log", async () => {
    const log = await sampleLog();
    const copy = [...log];
    await appendEvent(log, { action: "note", actor: "Asha", summary: "x" });
    expect(log).toEqual(copy);
  });

  it("detects an edited entry", async () => {
    const log = await sampleLog();
    const tampered = [log[0] as CustodyEvent, { ...(log[1] as CustodyEvent), summary: "Hashed other.zip" }];
    const check = await verifyChain(tampered);
    expect(check.ok).toBe(false);
    expect(check.brokenAt).toBe(2);
  });

  it("detects a deleted entry", async () => {
    const log = await sampleLog();
    const check = await verifyChain([log[1] as CustodyEvent]);
    expect(check.ok).toBe(false);
  });

  it("names an unnamed actor and uses genesis for empty logs", async () => {
    const log = await appendEvent([], { action: "note", actor: "  ", summary: "x" });
    expect(log[0]?.actor).toBe("Unnamed user");
    expect(headHash([])).toBe(GENESIS);
  });

  it("canonical JSON sorts keys and drops undefined", () => {
    expect(canonicalJson({ b: 1, a: { d: undefined, c: [2, { z: 1, y: 2 }] } })).toBe('{"a":{"c":[2,{"y":2,"z":1}]},"b":1}');
  });
});

describe("verify link", () => {
  const items: VerifyItem[] = [
    { label: "A-1", name: "WhatsApp Chat with Ravi.zip", size: 1_234_567, sha256: SHA },
    { label: "A-2", name: "ಸ್ಕ್ರೀನ್\u200Cಶಾಟ್ 2024.png", size: 5_000_000_000, sha256: "0".repeat(64) },
  ];

  it("round-trips a payload", () => {
    const encoded = encodePayload({ caseRef: "OS 123/2026, City Civil Court", items });
    expect(encoded.startsWith("v1.")).toBe(true);
    const decoded = decodePayload(`#${encoded}`);
    expect(decoded.caseRef).toBe("OS 123/2026, City Civil Court");
    expect(decoded.items[0]).toEqual(items[0]);
    // Long names are shortened to 40 UTF-8 bytes; hashes and sizes are exact.
    expect(decoded.items[1]).toEqual({ ...items[1], name: truncateUtf8(items[1]?.name ?? "", 40) });
  });

  it("truncates long names without splitting characters", () => {
    const long = "ಸಾಕ್ಷ್ಯ".repeat(20);
    const t = truncateUtf8(long, 40);
    expect(new TextEncoder().encode(t).length).toBeLessThanOrEqual(40);
    expect(t.endsWith("…")).toBe(true);
    expect(truncateUtf8("short", 40)).toBe("short");
  });

  it("builds a URL with the payload in the fragment only", () => {
    const url = buildVerifyUrl("https://example.org/verify.html#old", { caseRef: "X", items });
    expect(url.startsWith("https://example.org/verify.html#v1.")).toBe(true);
    expect(url.split("#")).toHaveLength(2);
  });

  it("rejects bad input", () => {
    expect(() => decodePayload("#v2.abc")).toThrow(VerifyLinkError);
    expect(() => decodePayload("#v1.***")).toThrow(/invalid characters/);
    expect(() => decodePayload("#v1.AAAA")).toThrow(VerifyLinkError);
    expect(() => encodePayload({ caseRef: "x", items: [{ label: "a", name: "b", size: 1, sha256: "xyz" }] })).toThrow(/SHA-256/);
    expect(() => encodePayload({ caseRef: "x", items: [{ label: "a", name: "b", size: -1, sha256: SHA }] })).toThrow(/Invalid size/);
  });

  it("splits many items into scannable QR groups", () => {
    const many: VerifyItem[] = Array.from({ length: 25 }, (_, i) => ({
      label: `A-${i + 1}`,
      name: `VID-20240115-WA${String(i).padStart(4, "0")}.mp4`,
      size: 1000 * (i + 1),
      sha256: createHash("sha256").update(String(i)).digest("hex"),
    }));
    const groups = chunkForQr("https://example.org/verify.html", "Case", many, 700);
    expect(groups.length).toBeGreaterThan(1);
    expect(groups.flat()).toEqual(many);
    for (const g of groups) {
      expect(buildVerifyUrl("https://example.org/verify.html", { caseRef: "Case", items: g }).length).toBeLessThanOrEqual(700);
    }
  });
});

describe("formatting", () => {
  it("formats IST date and time in the Schedule's format", () => {
    const d = new Date("2026-10-29T20:35:09Z");
    expect(istDate(d)).toBe("30/10/2026");
    expect(istTime(d)).toBe("02:05:09");
    expect(istStamp(d)).toBe("30/10/2026 02:05:09 IST");
  });

  it("formats sizes and hex", () => {
    expect(formatBytes(512)).toBe("512 bytes");
    expect(formatBytes(1_234_567)).toBe("12,34,567 bytes (1.18 MB)");
    expect(shortSize(5_000_000_000)).toBe("4.7 GB");
    expect(shortSize(10)).toBe("10 B");
    expect(groupHex("abcdef0123456789", 4)).toBe("abcd ef01 2345 6789");
  });
});
