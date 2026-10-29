// Pure, immutable operations on a CaseFile. Every change that matters for
// evidence handling also appends to the hash-chained custody log.
import { appendEvent, type NewCustodyEvent } from "../../engine/custody/custody-log";
import { newId } from "../../engine/util/crypto";
import type { CaseFile, Device, EvidenceRecord } from "../../sakshya/model";
import { EMPTY_PERSON } from "../../sakshya/model";

export function newCase(now: Date = new Date()): CaseFile {
  const at = now.toISOString();
  return {
    id: newId("case-"),
    schemaVersion: 1,
    createdAt: at,
    updatedAt: at,
    title: "",
    court: "",
    caseNumber: "",
    party: EMPTY_PERSON,
    expert: { ...EMPTY_PERSON, designation: "" },
    devices: [],
    records: [],
    algorithms: { sha256: true, sha1: false, md5: false },
    custody: [],
    nextLabel: 1,
  };
}

export async function withEvent(c: CaseFile, event: NewCustodyEvent, now: Date = new Date()): Promise<CaseFile> {
  return { ...c, custody: await appendEvent(c.custody, event, now), updatedAt: now.toISOString() };
}

export function touch(c: CaseFile, patch: Partial<CaseFile>): CaseFile {
  return { ...c, ...patch, updatedAt: new Date().toISOString() };
}

export function upsertDevice(c: CaseFile, device: Device): CaseFile {
  const exists = c.devices.some((d) => d.id === device.id);
  return touch(c, { devices: exists ? c.devices.map((d) => (d.id === device.id ? device : d)) : [...c.devices, device] });
}

export function removeDevice(c: CaseFile, id: string): CaseFile {
  return touch(c, {
    devices: c.devices.filter((d) => d.id !== id),
    records: c.records.map((r) => (r.deviceId === id ? { ...r, deviceId: null } : r)),
  });
}

export function updateRecord(c: CaseFile, id: string, patch: Partial<EvidenceRecord>): CaseFile {
  return touch(c, { records: c.records.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
}

/** Removing a record also removes the files that came out of it (zip entries). */
export function removeRecord(c: CaseFile, id: string): { next: CaseFile; removed: EvidenceRecord[] } {
  const removed = c.records.filter((r) => r.id === id || r.parentId === id);
  const ids = new Set(removed.map((r) => r.id));
  return { next: touch(c, { records: c.records.filter((r) => !ids.has(r.id)) }), removed };
}

export function nextLabels(c: CaseFile, count: number): { labels: string[]; nextLabel: number } {
  const labels = Array.from({ length: count }, (_, i) => `R-${c.nextLabel + i}`);
  return { labels, nextLabel: c.nextLabel + count };
}

export function caseDisplayName(c: CaseFile): string {
  return c.title.trim() || c.caseNumber.trim() || "Untitled case";
}
