import type { ZipEntryInfo } from "../zip/zip-reader";
import type { Digests } from "./wasm-hasher";

/** Messages the page sends to a hash worker. */
export type WorkerRequest =
  | { readonly kind: "file"; readonly id: number; readonly blob: Blob }
  | { readonly kind: "zip"; readonly id: number; readonly blob: Blob; readonly keepSuffixes: readonly string[] }
  | { readonly kind: "cancel"; readonly id: number };

export interface ZipEntryOutcome {
  readonly entry: ZipEntryInfo;
  readonly digests: Digests | null;
  readonly crcOk: boolean | null;
  readonly error: string | null;
  readonly bytes: Uint8Array | null;
}

export interface ZipOutcome {
  readonly container: Digests;
  readonly entries: readonly ZipEntryOutcome[];
}

/** Messages a hash worker sends back. */
export type WorkerResponse =
  | { readonly kind: "progress"; readonly id: number; readonly phase: "file" | "entries"; readonly done: number; readonly total: number }
  | { readonly kind: "file-done"; readonly id: number; readonly digests: Digests }
  | { readonly kind: "zip-done"; readonly id: number; readonly result: ZipOutcome }
  | { readonly kind: "error"; readonly id: number; readonly message: string; readonly cancelled: boolean };
