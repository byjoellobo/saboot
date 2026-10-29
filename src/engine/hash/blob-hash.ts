import type { Digests, HasherModule } from "./wasm-hasher";

/** Anything with Blob's slice/size contract (File, Blob, or a test double). */
export interface BlobLike {
  readonly size: number;
  slice(start?: number, end?: number): { arrayBuffer(): Promise<ArrayBuffer> };
}

export interface ProgressReport {
  readonly done: number;
  readonly total: number;
}

export interface HashOptions {
  /** Bytes read per step. 8 MiB keeps memory flat even for multi-GB files. */
  readonly chunkSize?: number;
  readonly onProgress?: (p: ProgressReport) => void;
  /** Returns true when the caller wants to stop. Checked between chunks. */
  readonly isCancelled?: () => boolean;
}

export const DEFAULT_CHUNK = 8 * 1024 * 1024;

export class HashCancelledError extends Error {
  constructor() {
    super("Hashing was cancelled");
    this.name = "HashCancelledError";
  }
}

/**
 * Stream a Blob/File through the Rust hasher in fixed-size chunks.
 * Memory use stays at roughly one chunk regardless of file size.
 */
export async function hashBlob(mod: HasherModule, blob: BlobLike, opts: HashOptions = {}): Promise<Digests> {
  const chunk = opts.chunkSize ?? DEFAULT_CHUNK;
  const h = mod.create();
  try {
    for (let offset = 0; offset < blob.size; offset += chunk) {
      if (opts.isCancelled?.()) throw new HashCancelledError();
      const end = Math.min(blob.size, offset + chunk);
      const buf = await blob.slice(offset, end).arrayBuffer();
      h.update(new Uint8Array(buf));
      opts.onProgress?.({ done: end, total: blob.size });
    }
    const digests = h.finish();
    if (digests.size !== blob.size) {
      throw new Error(`Read ${digests.size} bytes but the file reports ${blob.size}; was it modified while hashing?`);
    }
    return digests;
  } catch (err) {
    h.discard();
    throw err;
  }
}
