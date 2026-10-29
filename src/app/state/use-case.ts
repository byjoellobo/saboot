import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseFile } from "../../sakshya/model";
import { getCase, saveCase } from "./db";

export type CaseUpdater = (c: CaseFile) => CaseFile | Promise<CaseFile>;

export interface CaseHandle {
  readonly caseFile: CaseFile | null;
  readonly loading: boolean;
  readonly error: string | null;
  /** Set when saving to this device's storage failed; cleared by the next successful save. */
  readonly saveError: string | null;
  /** Synchronous edit (form fields). Applied immediately; saved shortly after. */
  set: (fn: (c: CaseFile) => CaseFile) => void;
  /** Queued edit that may be async (hashing results, custody events). Saved before resolving. */
  update: (fn: CaseUpdater) => Promise<CaseFile | null>;
}

const SAVE_DELAY_MS = 300;

function message(e: unknown): string {
  const text = e instanceof Error ? e.message : String(e);
  return `Changes could not be saved on this device (${text}). Download a backup from the Generate step so nothing is lost.`;
}

/**
 * Holds one case in memory and persists it to IndexedDB.
 * - `set` updates React state synchronously, so typing never drops characters,
 *   and schedules a debounced save of the latest state.
 * - `update` runs through a queue against the latest state, so several files
 *   finishing their hashing at once cannot overwrite each other.
 * Saves always write the latest in-memory state, in order.
 */
export function useCase(id: string): CaseHandle {
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const latest = useRef<CaseFile | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(() => {
    const run = queue.current.then(async () => {
      const snapshot = latest.current;
      if (!snapshot) return;
      await saveCase(snapshot);
      setSaveError(null);
    });
    queue.current = run.catch((e: unknown) => setSaveError(message(e)));
    return run;
  }, []);

  const flush = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    void persist().catch(() => undefined);
  }, [persist]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    getCase(id)
      .then((c) => {
        if (!live) return;
        latest.current = c ?? null;
        setCaseFile(c ?? null);
        setError(c ? null : "This case was not found on this device.");
      })
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Could not open the case."))
      .finally(() => live && setLoading(false));
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      live = false;
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [id, flush]);

  const set = useCallback(
    (fn: (c: CaseFile) => CaseFile) => {
      const current = latest.current;
      if (!current) return;
      const next = fn(current);
      if (next === current) return;
      latest.current = next;
      setCaseFile(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        void persist().catch(() => undefined);
      }, SAVE_DELAY_MS);
    },
    [persist],
  );

  const update = useCallback(
    (fn: CaseUpdater) => {
      const run = queue.current.then(async () => {
        const current = latest.current;
        if (!current) return null;
        const next = await fn(current);
        if (next !== current) {
          latest.current = next;
          setCaseFile(next);
          await saveCase(next);
          setSaveError(null);
        }
        return next;
      });
      queue.current = run.catch((e: unknown) => setSaveError(message(e)));
      // Failures are reported through saveError; callers get null and can skip follow-up work.
      return run.catch(() => null);
    },
    [],
  );

  return { caseFile, loading, error, saveError, set, update };
}
