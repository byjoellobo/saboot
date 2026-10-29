import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { dosDateTime, hashZipEntries, listZip, looksLikeZip, ZipFormatError } from "../../src/engine/zip/zip-reader";
import { loadHasher, nodeDigest, pseudoRandomBytes } from "./helpers";

function makeZip(): { zip: Uint8Array; chat: Uint8Array; photo: Uint8Array } {
  const chat = strToU8("15/01/24, 10:30 am - Asha: Hello\n15/01/24, 10:31 am - Ravi: Hi\n");
  const photo = pseudoRandomBytes(200_000, 3);
  const zip = zipSync(
    {
      "WhatsApp Chat with Ravi.txt": [chat, { level: 6 }],
      "IMG-20240115-WA0003.jpg": [photo, { level: 0 }],
      "media/": new Uint8Array(0),
    },
    { mtime: new Date(2024, 0, 15, 10, 32, 4) },
  );
  return { zip, chat, photo };
}

describe("zip reader", () => {
  it("lists entries from the central directory", async () => {
    const { zip } = makeZip();
    const entries = await listZip(new Blob([zip as BlobPart]));
    expect(entries.map((e) => e.path).sort()).toEqual(["IMG-20240115-WA0003.jpg", "WhatsApp Chat with Ravi.txt", "media/"]);
    const img = entries.find((e) => e.path.startsWith("IMG"));
    expect(img?.method).toBe(0);
    expect(img?.size).toBe(200_000);
    expect(img?.modified).toBe("2024-01-15T10:32:04");
    expect(entries.find((e) => e.path === "media/")?.isDirectory).toBe(true);
  });

  it("hashes each entry (stored and deflated) and checks CRC", async () => {
    const mod = await loadHasher();
    const { zip, chat, photo } = makeZip();
    const results = await hashZipEntries(mod, new Blob([zip as BlobPart]), { keep: (e) => e.path.endsWith(".txt") });
    const byName = Object.fromEntries(results.map((r) => [r.entry.path, r]));
    expect(byName["WhatsApp Chat with Ravi.txt"]?.digests?.sha256).toBe(nodeDigest("sha256", chat));
    expect(byName["WhatsApp Chat with Ravi.txt"]?.bytes).toEqual(chat);
    expect(byName["WhatsApp Chat with Ravi.txt"]?.crcOk).toBe(true);
    expect(byName["IMG-20240115-WA0003.jpg"]?.digests?.sha256).toBe(nodeDigest("sha256", photo));
    expect(byName["IMG-20240115-WA0003.jpg"]?.bytes).toBeNull();
    expect(results.some((r) => r.entry.isDirectory)).toBe(false);
  });

  it("flags a corrupted entry without failing the archive", async () => {
    const mod = await loadHasher();
    const { zip } = makeZip();
    const broken = zip.slice();
    // Flip a byte inside the stored photo's data region.
    const entries = await listZip(new Blob([zip as BlobPart]));
    const img = entries.find((e) => e.path.startsWith("IMG"));
    const at = (img?.localHeaderOffset ?? 0) + 30 + "IMG-20240115-WA0003.jpg".length + 100;
    broken[at] = (broken[at] ?? 0) ^ 0xff;
    const results = await hashZipEntries(mod, new Blob([broken as BlobPart]));
    const imgResult = results.find((r) => r.entry.path.startsWith("IMG"));
    expect(imgResult?.crcOk).toBe(false);
    expect(results.find((r) => r.entry.path.endsWith(".txt"))?.crcOk).toBe(true);
  });

  it("rejects files that are not zips", async () => {
    await expect(listZip(new Blob([strToU8("definitely not a zip archive at all")]))).rejects.toBeInstanceOf(ZipFormatError);
    await expect(listZip(new Blob([strToU8("tiny")]))).rejects.toThrow(/too small/);
    expect(await looksLikeZip(new Blob([strToU8("hello")]))).toBe(false);
    expect(await looksLikeZip(new Blob([makeZip().zip as BlobPart]))).toBe(true);
  });

  it("rejects a truncated archive", async () => {
    const { zip } = makeZip();
    await expect(listZip(new Blob([zip.slice(0, zip.length - 30) as BlobPart]))).rejects.toBeInstanceOf(ZipFormatError);
  });

  it("decodes DOS timestamps and rejects impossible ones", () => {
    expect(dosDateTime((10 << 11) | (32 << 5) | 2, ((2024 - 1980) << 9) | (1 << 5) | 15)).toBe("2024-01-15T10:32:04");
    expect(dosDateTime(0, 0)).toBeNull();
  });
});
