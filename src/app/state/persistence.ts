import { useEffect, useState } from "react";
import { requestPersistence } from "./db";

let asked: Promise<boolean> | null = null;

/**
 * Whether the browser has promised to keep this site's data under storage
 * pressure. Asked once per page load; null while the answer is pending.
 */
export function usePersisted(): boolean | null {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => {
    asked ??= requestPersistence().catch(() => false);
    let live = true;
    void asked.then((v) => live && setPersisted(v));
    return () => {
      live = false;
    };
  }, []);
  return persisted;
}
