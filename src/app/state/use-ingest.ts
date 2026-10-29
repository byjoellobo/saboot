import { useCallback, useRef, useState } from "react";
import { HashCancelled, sharedPool, type JobProgress } from "../../engine/hash/hash-pool";
import type { EvidenceRecord } from "../../sakshya/model";
import { announce } from "../components/Announcer";
import { ingestFile } from "../services/ingest";
import { nextLabels, touch, withEvent } from "./case-ops";
import { deleteChatBytes, saveChatBytes } from "./db";
import type { CaseHandle } from "./use-case";

export interface IngestJob {
  readonly key: number;
  readonly name: string;
  readonly size: number;
  readonly progress: JobProgress | null;
}

export interface IngestState {
  readonly jobs: readonly IngestJob[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  /** Record ids added in this session (their stamp animates once). */
  readonly fresh: ReadonlySet<string>;
  addFiles: (files: File[]) => void;
  clearWarnings: () => void;
  clearErrors: () => void;
}

/**
 * Hashing state for one open case. It lives in CaseScreen, so moving between
 * steps while large files hash does not lose progress, warnings or errors.
 */
export function useIngest(caseId: string, handle: CaseHandle): IngestState {
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const nextKey = useRef(1);

  const addFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        const key = nextKey.current++;
        setJobs((js) => [...js, { key, name: file.name, size: file.size, progress: null }]);
        announce(`Hashing ${file.name}`);
        const onProgress = (p: JobProgress) => setJobs((js) => js.map((j) => (j.key === key ? { ...j, progress: p } : j)));
        // Device and actor are decided when hashing finishes, from the latest case.
        ingestFile(file, sharedPool(), { actor: "", defaultDeviceId: null }, onProgress)
          .then(async (out) => {
            // Store chat text first: a record must never exist without its text.
            for (const ch of out.chats) await saveChatBytes(caseId, ch.recordId, ch.bytes);
            let labelled: EvidenceRecord[] = [];
            const saved = await handle.update(async (cur) => {
              const { labels, nextLabel } = nextLabels(cur, out.records.length);
              const onlyDevice = cur.devices.length === 1 ? (cur.devices[0]?.id ?? null) : null;
              labelled = out.records.map((r, i) => ({ ...r, label: labels[i] ?? r.label, deviceId: r.deviceId ?? onlyDevice }));
              const actor = cur.party.name.trim() || "Case owner";
              let next = touch(cur, { records: [...cur.records, ...labelled], nextLabel });
              for (const e of out.events) next = await withEvent(next, { ...e, actor, summary: `${labelled[0]?.label ?? ""}: ${e.summary}` });
              return next;
            });
            if (!saved) {
              for (const ch of out.chats) await deleteChatBytes(ch.recordId);
              throw new Error("it was hashed but could not be saved on this device");
            }
            setFresh((s) => new Set([...s, ...labelled.map((r) => r.id)]));
            announce(`${file.name} hashed as ${labelled[0]?.label ?? "a new record"}`);
            if (out.warnings.length) setWarnings((w) => [...w, ...out.warnings.map((x) => `${file.name}: ${x}`)]);
          })
          .catch((err: unknown) => {
            if (err instanceof HashCancelled) return;
            const text = `${file.name}: ${err instanceof Error ? err.message : "could not be read"}`;
            setErrors((e) => [...e, text]);
            announce(text);
          })
          .finally(() => setJobs((js) => js.filter((j) => j.key !== key)));
      }
    },
    [caseId, handle],
  );

  return {
    jobs,
    warnings,
    errors,
    fresh,
    addFiles,
    clearWarnings: () => setWarnings([]),
    clearErrors: () => setErrors([]),
  };
}
