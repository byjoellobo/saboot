// Append-only custody log. Each event stores the SHA-256 of the previous
// event, so editing or deleting an earlier entry breaks every later hash.
// This makes the log tamper-evident, not tamper-proof: it is still a record
// kept by the person preparing the evidence, and is labelled that way.
import { canonicalJson, sha256Hex } from "../util/crypto";

export const GENESIS = "0".repeat(64);

export type CustodyAction =
  | "case-created"
  | "record-added"
  | "record-hashed"
  | "record-removed"
  | "device-recorded"
  | "device-updated"
  | "transcript-generated"
  | "certificate-generated"
  | "timestamp-obtained"
  | "bundle-exported"
  | "note";

export interface CustodyEvent {
  readonly seq: number;
  /** ISO-8601 UTC instant from this device's clock. */
  readonly at: string;
  readonly action: CustodyAction;
  readonly actor: string;
  readonly summary: string;
  readonly details: Readonly<Record<string, string | number | boolean>>;
  readonly prevHash: string;
  readonly hash: string;
}

export interface NewCustodyEvent {
  readonly action: CustodyAction;
  readonly actor: string;
  readonly summary: string;
  readonly details?: Readonly<Record<string, string | number | boolean>>;
}

function body(e: Omit<CustodyEvent, "hash">): string {
  return canonicalJson({
    seq: e.seq,
    at: e.at,
    action: e.action,
    actor: e.actor,
    summary: e.summary,
    details: e.details,
    prevHash: e.prevHash,
  });
}

export async function hashEvent(e: Omit<CustodyEvent, "hash">): Promise<string> {
  return sha256Hex(body(e));
}

/** Returns a NEW log with the event appended; the input is not modified. */
export async function appendEvent(log: readonly CustodyEvent[], input: NewCustodyEvent, now: Date = new Date()): Promise<CustodyEvent[]> {
  const prev = log[log.length - 1];
  const draft = {
    seq: (prev?.seq ?? 0) + 1,
    at: now.toISOString(),
    action: input.action,
    actor: input.actor.trim() || "Unnamed user",
    summary: input.summary,
    details: { ...(input.details ?? {}) },
    prevHash: prev?.hash ?? GENESIS,
  };
  return [...log, { ...draft, hash: await hashEvent(draft) }];
}

export interface ChainCheck {
  readonly ok: boolean;
  /** seq of the first event that fails, if any. */
  readonly brokenAt: number | null;
  readonly reason: string | null;
}

export async function verifyChain(log: readonly CustodyEvent[]): Promise<ChainCheck> {
  let prevHash = GENESIS;
  for (let i = 0; i < log.length; i++) {
    const e = log[i] as CustodyEvent;
    if (e.seq !== i + 1) return { ok: false, brokenAt: e.seq, reason: "Sequence numbers are not continuous" };
    if (e.prevHash !== prevHash) return { ok: false, brokenAt: e.seq, reason: "Link to the previous entry does not match" };
    const { hash, ...rest } = e;
    if ((await hashEvent(rest)) !== hash)
      return { ok: false, brokenAt: e.seq, reason: "Entry contents were changed after it was recorded" };
    prevHash = hash;
  }
  return { ok: true, brokenAt: null, reason: null };
}

export function headHash(log: readonly CustodyEvent[]): string {
  return log[log.length - 1]?.hash ?? GENESIS;
}
