// A small pool of hash workers. Each worker handles one job at a time; extra
// jobs queue. Several files hash in parallel, each streamed in 8 MiB chunks.
import type { WorkerRequest, WorkerResponse, ZipOutcome } from "./protocol";
import type { Digests } from "./wasm-hasher";

export interface JobProgress {
  readonly phase: "file" | "entries";
  readonly done: number;
  readonly total: number;
}

export interface HashJob<T> {
  readonly promise: Promise<T>;
  cancel(): void;
}

type Pending = {
  readonly request: Exclude<WorkerRequest, { kind: "cancel" }>;
  readonly onProgress?: (p: JobProgress) => void;
  readonly resolve: (value: Digests | ZipOutcome) => void;
  readonly reject: (err: Error) => void;
};

export class HashCancelled extends Error {
  constructor() {
    super("Hashing was cancelled");
    this.name = "HashCancelled";
  }
}

function defaultSize(): number {
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 2 : 2;
  return Math.max(1, Math.min(4, cores - 1));
}

export class HashPool {
  private readonly workers: Worker[] = [];
  private readonly busy = new Map<Worker, Pending>();
  private readonly queue: Pending[] = [];
  private nextId = 1;

  constructor(
    private readonly makeWorker: () => Worker = () =>
      new Worker(new URL("./hash.worker.ts", import.meta.url), { type: "module" }),
    private readonly size: number = defaultSize(),
  ) {}

  hashFile(blob: Blob, onProgress?: (p: JobProgress) => void): HashJob<Digests> {
    return this.submit<Digests>({ kind: "file", id: this.nextId++, blob }, onProgress);
  }

  hashZip(blob: Blob, keepSuffixes: readonly string[], onProgress?: (p: JobProgress) => void): HashJob<ZipOutcome> {
    return this.submit<ZipOutcome>({ kind: "zip", id: this.nextId++, blob, keepSuffixes }, onProgress);
  }

  dispose(): void {
    for (const w of this.workers) w.terminate();
    this.workers.length = 0;
    for (const p of [...this.busy.values(), ...this.queue]) p.reject(new HashCancelled());
    this.busy.clear();
    this.queue.length = 0;
  }

  private submit<T>(request: Pending["request"], onProgress?: (p: JobProgress) => void): HashJob<T> {
    let pending: Pending | undefined;
    const promise = new Promise<T>((resolve, reject) => {
      pending = { request, onProgress, resolve: resolve as Pending["resolve"], reject };
    });
    this.queue.push(pending as Pending);
    this.pump();
    return {
      promise,
      cancel: () => this.cancel(request.id),
    };
  }

  private cancel(id: number): void {
    const queued = this.queue.findIndex((p) => p.request.id === id);
    if (queued >= 0) {
      const [p] = this.queue.splice(queued, 1);
      p?.reject(new HashCancelled());
      return;
    }
    for (const [worker, p] of this.busy) {
      if (p.request.id === id) worker.postMessage({ kind: "cancel", id } satisfies WorkerRequest);
    }
  }

  private idleWorker(): Worker | null {
    const idle = this.workers.find((w) => !this.busy.has(w));
    if (idle) return idle;
    if (this.workers.length >= this.size) return null;
    const w = this.makeWorker();
    w.onmessage = (e: MessageEvent<WorkerResponse>) => this.onMessage(w, e.data);
    w.onerror = (e) => this.onCrash(w, e.message || "Hash worker crashed");
    w.onmessageerror = () => this.onCrash(w, "Hash worker sent a message that could not be read");
    this.workers.push(w);
    return w;
  }

  private pump(): void {
    while (this.queue.length > 0) {
      const w = this.idleWorker();
      if (!w) return;
      const job = this.queue.shift() as Pending;
      this.busy.set(w, job);
      w.postMessage(job.request);
    }
  }

  private onMessage(w: Worker, msg: WorkerResponse): void {
    const job = this.busy.get(w);
    if (!job || job.request.id !== msg.id) return;
    switch (msg.kind) {
      case "progress":
        job.onProgress?.({ phase: msg.phase, done: msg.done, total: msg.total });
        return;
      case "file-done":
        this.busy.delete(w);
        job.resolve(msg.digests);
        break;
      case "zip-done":
        this.busy.delete(w);
        job.resolve(msg.result);
        break;
      case "error":
        this.busy.delete(w);
        job.reject(msg.cancelled ? new HashCancelled() : new Error(msg.message));
        break;
    }
    this.pump();
  }

  private onCrash(w: Worker, message: string): void {
    const job = this.busy.get(w);
    this.busy.delete(w);
    w.terminate();
    const index = this.workers.indexOf(w);
    if (index >= 0) this.workers.splice(index, 1);
    job?.reject(new Error(message));
    this.pump();
  }
}

let shared: HashPool | null = null;
export function sharedPool(): HashPool {
  shared ??= new HashPool();
  return shared;
}
