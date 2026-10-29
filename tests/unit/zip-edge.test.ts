import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { hashZipEntries, listZip } from "../../src/engine/zip/zip-reader";
import { kindFromFile, relationPhrase } from "../../src/sakshya/model";
import { loadHasher, nodeDigest } from "./helpers";

/** Hand-build a one-entry stored zip that uses ZIP64 fields, as >4 GB CCTV exports do. */
function zip64(name: string, data: Uint8Array): Uint8Array {
  const nameBytes = strToU8(name);
  const out: number[] = [];
  const u16 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff);
  const u32 = (v: number) => out.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  const u64 = (v: number) => {
    u32(v >>> 0);
    u32(Math.floor(v / 2 ** 32));
  };
  // CRC32 of data (simple bitwise implementation, test-only)
  let crc = 0xffffffff;
  for (const b of data) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  crc = (crc ^ 0xffffffff) >>> 0;

  // Local header
  u32(0x04034b50);
  u16(45);
  u16(0);
  u16(0); // stored
  u16(0);
  u16(0x21);
  u32(crc);
  u32(0xffffffff);
  u32(0xffffffff);
  u16(nameBytes.length);
  u16(20);
  out.push(...nameBytes);
  u16(0x0001);
  u16(16);
  u64(data.length);
  u64(data.length);
  out.push(...data);

  // Central directory
  const cdStart = out.length;
  u32(0x02014b50);
  u16(45);
  u16(45);
  u16(0);
  u16(0);
  u16(0);
  u16(0x21);
  u32(crc);
  u32(0xffffffff);
  u32(0xffffffff);
  u16(nameBytes.length);
  u16(28);
  u16(0);
  u16(0);
  u16(0);
  u32(0);
  u32(0xffffffff);
  out.push(...nameBytes);
  u16(0x0001);
  u16(24);
  u64(data.length);
  u64(data.length);
  u64(0);
  const cdSize = out.length - cdStart;

  // ZIP64 end of central directory record + locator + classic EOCD
  const z64At = out.length;
  u32(0x06064b50);
  u64(44);
  u16(45);
  u16(45);
  u32(0);
  u32(0);
  u64(1);
  u64(1);
  u64(cdSize);
  u64(cdStart);
  u32(0x07064b50);
  u32(0);
  u64(z64At);
  u32(1);
  u32(0x06054b50);
  u16(0xffff);
  u16(0xffff);
  u16(0xffff);
  u16(0xffff);
  u32(0xffffffff);
  u32(0xffffffff);
  u16(0);
  return Uint8Array.from(out);
}

describe("zip reader edge cases", () => {
  it("reads ZIP64 sizes and offsets", async () => {
    const data = strToU8("CCTV footage stand-in ".repeat(100));
    const zip = zip64("ch02_20261012.mp4", data);
    const [entry] = await listZip(new Blob([zip as BlobPart]));
    expect(entry?.path).toBe("ch02_20261012.mp4");
    expect(entry?.size).toBe(data.length);
    const mod = await loadHasher();
    const [result] = await hashZipEntries(mod, new Blob([zip as BlobPart]));
    expect(result?.digests?.sha256).toBe(nodeDigest("sha256", data));
    expect(result?.crcOk).toBe(true);
  });

  it("reports encrypted and unsupported entries without failing the archive", async () => {
    const zip = zipSync({ "a.txt": [strToU8("secret"), { level: 0 }], "b.txt": [strToU8("plain"), { level: 0 }] });
    const entries = await listZip(new Blob([zip as BlobPart]));
    const mutated = zip.slice();
    const view = new DataView(mutated.buffer);
    // Find each central directory header and patch flags/method.
    let at = mutated.length - 22;
    const cdOffset = view.getUint32(at + 16, true);
    at = cdOffset;
    for (const e of entries) {
      if (e.path === "a.txt") view.setUint16(at + 8, 0x0001, true); // encrypted
      if (e.path === "b.txt") view.setUint16(at + 10, 12, true); // bzip2: unsupported
      at += 46 + view.getUint16(at + 28, true) + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    }
    const mod = await loadHasher();
    const results = await hashZipEntries(mod, new Blob([mutated as BlobPart]));
    expect(results.find((r) => r.entry.path === "a.txt")?.error).toMatch(/password/);
    expect(results.find((r) => r.entry.path === "b.txt")?.error).toMatch(/method 12/);
  });

  it("refuses to keep an entry larger than the limit", async () => {
    const zip = zipSync({ "_chat.txt": strToU8("x".repeat(5000)) });
    const mod = await loadHasher();
    const [r] = await hashZipEntries(mod, new Blob([zip as BlobPart]), { keep: () => true, keepLimit: 1000 });
    expect(r?.error).toMatch(/limit/);
  });
});

describe("model helpers", () => {
  it("classifies files by name and type", () => {
    expect(kindFromFile("chat.zip", "")).toBe("archive");
    expect(kindFromFile("_chat.txt", "")).toBe("chat-text");
    expect(kindFromFile("IMG-1.jpg", "")).toBe("image");
    expect(kindFromFile("PTT-20240101-WA0001.opus", "")).toBe("audio");
    expect(kindFromFile("ch01.dav", "")).toBe("video");
    expect(kindFromFile("x.bin", "video/mp4")).toBe("video");
    expect(kindFromFile("contact.vcf", "")).toBe("document");
    expect(kindFromFile("blob.bin", "")).toBe("other");
  });

  it("phrases relations for the certificate", () => {
    expect(relationPhrase({ relationOf: "daughter" })).toBe("Daughter");
    expect(relationPhrase({ relationOf: "son" })).toBe("Son");
    expect(relationPhrase({ relationOf: "spouse" })).toBe("Spouse");
    expect(relationPhrase({ relationOf: "" })).toBe("Son/daughter/spouse");
  });
});
