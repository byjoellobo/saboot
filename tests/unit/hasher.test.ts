import { describe, expect, it } from "vitest";
import { hashBlob, HashCancelledError } from "../../src/engine/hash/blob-hash";
import { decodeDigests, toHex } from "../../src/engine/hash/wasm-hasher";
import { loadHasher, nodeDigest, pseudoRandomBytes } from "./helpers";

describe("Rust wasm hasher", () => {
  it("matches Node's crypto for known strings", async () => {
    const mod = await loadHasher();
    for (const text of ["", "abc", "The quick brown fox jumps over the lazy dog", "साक्ष्य ಸಾಕ್ಷ್ಯ"]) {
      const bytes = new TextEncoder().encode(text);
      const d = mod.hashBytes(bytes);
      expect(d.md5).toBe(nodeDigest("md5", bytes));
      expect(d.sha1).toBe(nodeDigest("sha1", bytes));
      expect(d.sha256).toBe(nodeDigest("sha256", bytes));
      expect(d.size).toBe(bytes.length);
    }
  });

  it("produces the CRC32 used by zip files", async () => {
    const mod = await loadHasher();
    expect(mod.hashBytes(new TextEncoder().encode("abc")).crc32).toBe("352441c2");
  });

  it("streams a Blob in chunks and reports progress", async () => {
    const mod = await loadHasher();
    const data = pseudoRandomBytes(3 * 1024 * 1024 + 17, 7);
    const progress: number[] = [];
    const d = await hashBlob(mod, new Blob([data as BlobPart]), {
      chunkSize: 1024 * 1024,
      onProgress: (p) => progress.push(p.done),
    });
    expect(d.sha256).toBe(nodeDigest("sha256", data));
    expect(d.md5).toBe(nodeDigest("md5", data));
    expect(progress).toEqual([1048576, 2097152, 3145728, data.length]);
  });

  it("handles an empty file", async () => {
    const mod = await loadHasher();
    const d = await hashBlob(mod, new Blob([]));
    expect(d.sha256).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(d.size).toBe(0);
  });

  it("stops when cancelled", async () => {
    const mod = await loadHasher();
    let calls = 0;
    await expect(
      hashBlob(mod, new Blob([pseudoRandomBytes(4096) as BlobPart]), {
        chunkSize: 1024,
        isCancelled: () => ++calls > 2,
      }),
    ).rejects.toBeInstanceOf(HashCancelledError);
  });

  it("detects a file whose size changes while reading", async () => {
    const mod = await loadHasher();
    const liar = {
      size: 10,
      slice: () => ({ arrayBuffer: async () => new Uint8Array(4).buffer }),
    };
    await expect(hashBlob(mod, liar, { chunkSize: 100 })).rejects.toThrow(/modified while hashing/);
  });

  it("rejects use after finish", async () => {
    const mod = await loadHasher();
    const h = mod.create();
    h.finish();
    expect(() => h.update(new Uint8Array(1))).toThrow(/already finished/);
    h.discard();
  });

  it("validates digest layout length", () => {
    expect(() => decodeDigests(new Uint8Array(10))).toThrow(/Expected 80/);
    expect(toHex(Uint8Array.from([0, 15, 255]))).toBe("000fff");
  });
});
