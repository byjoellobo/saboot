// Thin, dependency-free bridge to the Rust hasher (crates/sakshya-hash).
// Works in browsers, workers and Node (tests) because it only needs the raw
// wasm bytes or a compiled WebAssembly.Module.

export const ABI_VERSION = 1;
const DIGEST_LEN = 80;

export interface Digests {
  readonly md5: string;
  readonly sha1: string;
  readonly sha256: string;
  /** CRC32 as 8 lowercase hex chars; used to check zip entries. */
  readonly crc32: string;
  readonly size: number;
}

interface HasherExports {
  readonly memory: WebAssembly.Memory;
  sk_abi_version(): number;
  sk_digest_len(): number;
  sk_alloc(len: number): number;
  sk_free(ptr: number, len: number): void;
  sk_hasher_new(): number;
  sk_hasher_update(h: number, ptr: number, len: number): void;
  sk_hasher_finish(h: number, out: number): void;
  sk_hasher_free(h: number): void;
}

const HEX: readonly string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += HEX[b];
  return out;
}

export class HasherModule {
  private readonly ex: HasherExports;
  private scratchPtr = 0;
  private scratchLen = 0;

  private constructor(ex: HasherExports) {
    this.ex = ex;
  }

  static async load(source: BufferSource | WebAssembly.Module): Promise<HasherModule> {
    const instance =
      source instanceof WebAssembly.Module
        ? await WebAssembly.instantiate(source, {})
        : (await WebAssembly.instantiate(source, {})).instance;
    const ex = instance.exports as unknown as HasherExports;
    const abi = ex.sk_abi_version();
    if (abi !== ABI_VERSION || ex.sk_digest_len() !== DIGEST_LEN) {
      throw new Error(`Hasher ABI mismatch: wasm reports v${abi}, app expects v${ABI_VERSION}`);
    }
    return new HasherModule(ex);
  }

  /** Start a new streaming hash. Call `update` any number of times, then `finish`. */
  create(): StreamingHash {
    return new StreamingHash(this, this.ex.sk_hasher_new());
  }

  /** One-shot convenience for small buffers. */
  hashBytes(bytes: Uint8Array): Digests {
    const h = this.create();
    h.update(bytes);
    return h.finish();
  }

  /** @internal copy `bytes` into wasm memory and feed hasher `h`. */
  feed(h: number, bytes: Uint8Array): void {
    if (bytes.length === 0) return;
    const ptr = this.ensureScratch(bytes.length);
    // The memory buffer can be replaced when wasm memory grows, so take a fresh view.
    new Uint8Array(this.ex.memory.buffer, ptr, bytes.length).set(bytes);
    this.ex.sk_hasher_update(h, ptr, bytes.length);
  }

  /** @internal */
  finish(h: number): Digests {
    const out = this.ex.sk_alloc(DIGEST_LEN);
    try {
      this.ex.sk_hasher_finish(h, out);
      const raw = new Uint8Array(this.ex.memory.buffer, out, DIGEST_LEN).slice();
      return decodeDigests(raw);
    } finally {
      this.ex.sk_free(out, DIGEST_LEN);
    }
  }

  /** @internal */
  discard(h: number): void {
    this.ex.sk_hasher_free(h);
  }

  private ensureScratch(len: number): number {
    if (len <= this.scratchLen) return this.scratchPtr;
    if (this.scratchPtr) this.ex.sk_free(this.scratchPtr, this.scratchLen);
    this.scratchPtr = this.ex.sk_alloc(len);
    this.scratchLen = len;
    return this.scratchPtr;
  }
}

export class StreamingHash {
  private handle: number;
  private readonly mod: HasherModule;

  constructor(mod: HasherModule, handle: number) {
    this.mod = mod;
    this.handle = handle;
  }

  update(bytes: Uint8Array): void {
    this.assertLive();
    this.mod.feed(this.handle, bytes);
  }

  finish(): Digests {
    this.assertLive();
    const handle = this.handle;
    // Clear first: finish() frees the hasher even if decoding later throws.
    this.handle = 0;
    return this.mod.finish(handle);
  }

  discard(): void {
    if (this.handle) this.mod.discard(this.handle);
    this.handle = 0;
  }

  private assertLive(): void {
    if (!this.handle) throw new Error("Hash already finished or discarded");
  }
}

export function decodeDigests(raw: Uint8Array): Digests {
  if (raw.length !== DIGEST_LEN) throw new Error(`Expected ${DIGEST_LEN} digest bytes, got ${raw.length}`);
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const size = view.getBigUint64(72, false);
  if (size > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("File too large to represent safely");
  return {
    md5: toHex(raw.subarray(0, 16)),
    sha1: toHex(raw.subarray(16, 36)),
    sha256: toHex(raw.subarray(36, 68)),
    crc32: view.getUint32(68, false).toString(16).padStart(8, "0"),
    size: Number(size),
  };
}
