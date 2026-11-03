/// <reference lib="webworker" />
// Dedicated worker: owns one instance of the Rust hasher and processes one
// job at a time so the UI thread never blocks, even on multi-GB CCTV files.
import wasmUrl from "./saboot_hash.wasm?url";
import { hashBlob, HashCancelledError } from "./blob-hash";
import type { WorkerRequest, WorkerResponse, ZipEntryOutcome } from "./protocol";
import { HasherModule } from "./wasm-hasher";
import { hashZipEntries } from "../zip/zip-reader";

declare const self: DedicatedWorkerGlobalScope;

let modulePromise: Promise<HasherModule> | null = null;
const cancelled = new Set<number>();

function loadModule(): Promise<HasherModule> {
  if (!modulePromise) {
    modulePromise = fetch(wasmUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load hasher (${r.status})`);
        return r.arrayBuffer();
      })
      .then((buf) => HasherModule.load(buf));
    modulePromise.catch(() => {
      modulePromise = null;
    });
  }
  return modulePromise;
}

function post(msg: WorkerResponse, transfer: Transferable[] = []): void {
  self.postMessage(msg, transfer);
}

function throttle(id: number, phase: "file" | "entries") {
  let last = 0;
  return (p: { done: number; total: number }) => {
    const now = performance.now();
    if (now - last > 100 || p.done === p.total) {
      last = now;
      post({ kind: "progress", id, phase, done: p.done, total: p.total });
    }
  };
}

async function handle(req: Exclude<WorkerRequest, { kind: "cancel" }>): Promise<void> {
  const isCancelled = () => cancelled.has(req.id);
  try {
    const mod = await loadModule();
    if (req.kind === "file") {
      const digests = await hashBlob(mod, req.blob, { onProgress: throttle(req.id, "file"), isCancelled });
      post({ kind: "file-done", id: req.id, digests });
      return;
    }
    // Zip: hash the archive as one record, then every entry inside it.
    const container = await hashBlob(mod, req.blob, { onProgress: throttle(req.id, "file"), isCancelled });
    const suffixes = req.keepSuffixes.map((s) => s.toLowerCase());
    const results = await hashZipEntries(mod, req.blob, {
      keep: (e) => suffixes.some((s) => e.path.toLowerCase().endsWith(s)),
      onProgress: throttle(req.id, "entries"),
      isCancelled,
    });
    const entries: ZipEntryOutcome[] = results.map((r) => ({ ...r }));
    const transfer = entries.flatMap((e) => (e.bytes ? [e.bytes.buffer as ArrayBuffer] : []));
    post({ kind: "zip-done", id: req.id, result: { container, entries } }, transfer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ kind: "error", id: req.id, message, cancelled: err instanceof HashCancelledError });
  } finally {
    cancelled.delete(req.id);
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (req.kind === "cancel") {
    cancelled.add(req.id);
    return;
  }
  void handle(req);
};
