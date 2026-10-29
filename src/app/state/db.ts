// Local storage in IndexedDB. Nothing here is ever sent anywhere.
//   cases:    CaseFile objects (metadata, hashes, custody log; never file contents)
//   chats:    raw bytes of WhatsApp chat .txt files, keyed by record id, so
//             transcripts can be regenerated without re-adding the export
//   settings: small key/value preferences
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CaseFile } from "../../sakshya/model";

interface SakshyaDB extends DBSchema {
  cases: { key: string; value: CaseFile };
  chats: { key: string; value: { recordId: string; caseId: string; bytes: Uint8Array } ; indexes: { byCase: string } };
  settings: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<SakshyaDB>> | null = null;

function db(): Promise<IDBPDatabase<SakshyaDB>> {
  if (!dbPromise) {
    const opening = openDB<SakshyaDB>("sakshya-kit", 1, {
      upgrade(database) {
        database.createObjectStore("cases", { keyPath: "id" });
        const chats = database.createObjectStore("chats", { keyPath: "recordId" });
        chats.createIndex("byCase", "caseId");
        database.createObjectStore("settings");
      },
      terminated() {
        dbPromise = null;
      },
    });
    // Do not cache a failed open (e.g. a private window that blocks storage).
    opening.catch(() => {
      dbPromise = null;
    });
    dbPromise = opening;
  }
  return dbPromise;
}

/** Store an imported case and its chat texts in one transaction. */
export async function saveImportedCase(c: CaseFile, chats: readonly { recordId: string; bytes: Uint8Array }[]): Promise<void> {
  const d = await db();
  const tx = d.transaction(["cases", "chats"], "readwrite");
  await tx.objectStore("cases").put(c);
  for (const ch of chats) await tx.objectStore("chats").put({ recordId: ch.recordId, caseId: c.id, bytes: ch.bytes });
  await tx.done;
}

export async function listCases(): Promise<CaseFile[]> {
  const all = await (await db()).getAll("cases");
  return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getCase(id: string): Promise<CaseFile | undefined> {
  return (await db()).get("cases", id);
}

export async function saveCase(c: CaseFile): Promise<void> {
  await (await db()).put("cases", c);
}

export async function deleteCase(id: string): Promise<void> {
  const d = await db();
  const tx = d.transaction(["cases", "chats"], "readwrite");
  await tx.objectStore("cases").delete(id);
  const keys = await tx.objectStore("chats").index("byCase").getAllKeys(id);
  for (const k of keys) await tx.objectStore("chats").delete(k);
  await tx.done;
}

export async function saveChatBytes(caseId: string, recordId: string, bytes: Uint8Array): Promise<void> {
  await (await db()).put("chats", { recordId, caseId, bytes });
}

export async function getChatBytes(recordId: string): Promise<Uint8Array | undefined> {
  return (await (await db()).get("chats", recordId))?.bytes;
}

export async function deleteChatBytes(recordId: string): Promise<void> {
  await (await db()).delete("chats", recordId);
}

export async function listChatBytes(caseId: string): Promise<{ recordId: string; bytes: Uint8Array }[]> {
  return (await (await db()).getAllFromIndex("chats", "byCase", caseId)).map(({ recordId, bytes }) => ({ recordId, bytes }));
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const v = await (await db()).get("settings", key);
  return v === undefined ? fallback : (v as T);
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await (await db()).put("settings", value, key);
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
