import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HasherModule } from "../../src/engine/hash/wasm-hasher";

let cached: Promise<HasherModule> | null = null;

/** Load the real Rust-built wasm, exactly as the browser worker does. */
export function loadHasher(): Promise<HasherModule> {
  cached ??= HasherModule.load(readFileSync(resolve(import.meta.dirname, "../../src/engine/hash/saboot_hash.wasm")));
  return cached;
}

export function nodeDigest(alg: "md5" | "sha1" | "sha256", data: Uint8Array | string): string {
  return createHash(alg).update(data).digest("hex");
}

export function pseudoRandomBytes(length: number, seed = 1): Uint8Array {
  const out = new Uint8Array(length);
  let x = seed >>> 0 || 1;
  for (let i = 0; i < length; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    out[i] = x & 0xff;
  }
  return out;
}
