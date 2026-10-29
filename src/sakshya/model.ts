import type { CustodyEvent } from "../engine/custody/custody-log";
import type { RelationKey, SourceKind } from "./certificate/schedule";

/** Which step-by-step guide to show when recording a device. */
export type DeviceProfile =
  | "android"
  | "iphone"
  | "windows"
  | "mac"
  | "cctv"
  | "usb"
  | "disc"
  | "server"
  | "cloud"
  | "other";

export type IdentifierType = "IMEI" | "MAC" | "Cloud ID" | "UIN" | "UID" | "EID" | "Other";

export interface DeviceIdentifier {
  readonly type: IdentifierType;
  readonly value: string;
  /** e.g. "SIM slot 1", "Wi-Fi", "Ethernet (LAN)". */
  readonly note: string;
}

/** DVR/phone clocks drift. We record the gap so footage times can be read correctly. */
export interface ClockCheck {
  /** What the device itself showed, as typed by the user ("YYYY-MM-DDTHH:MM:SS"). */
  readonly deviceShows: string;
  /** Real IST at the same moment (ISO instant, from this device). */
  readonly actualAt: string;
  /** deviceShows minus actual, in seconds. Positive = device runs fast. */
  readonly offsetSeconds: number;
}

export interface Device {
  readonly id: string;
  readonly profile: DeviceProfile;
  readonly sourceKind: SourceKind;
  readonly otherKindText: string;
  readonly nickname: string;
  readonly makeModel: string;
  readonly color: string;
  readonly serial: string;
  readonly identifiers: readonly DeviceIdentifier[];
  readonly otherInfo: string;
  readonly relation: Readonly<Record<RelationKey, boolean>>;
  readonly clock: ClockCheck | null;
}

export type RecordKind =
  | "whatsapp-export"
  | "chat-text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "archive"
  | "other";

export interface RecordHashes {
  readonly md5: string;
  readonly sha1: string;
  readonly sha256: string;
}

export interface EvidenceRecord {
  readonly id: string;
  /** Short exhibit-style label used in every document, e.g. "R-3". */
  readonly label: string;
  readonly deviceId: string | null;
  readonly kind: RecordKind;
  readonly fileName: string;
  readonly mimeType: string;
  readonly size: number;
  /** File system modified time as reported by the browser (ISO), if any. */
  readonly lastModified: string | null;
  readonly hashes: RecordHashes;
  readonly hashedAt: string;
  /** Set when this record is a file inside an uploaded zip. */
  readonly parentId: string | null;
  readonly zipPath: string | null;
  readonly zipModified: string | null;
  readonly crcOk: boolean | null;
  readonly description: string;
  /** s.63(4)(a): "describing the manner in which it was produced". */
  readonly manner: string;
  readonly includeInCertificate: boolean;
}

export interface Person {
  readonly name: string;
  /** Free text so users can write "son of", "daughter of", "spouse of". */
  readonly relationOf: "son" | "daughter" | "spouse" | "";
  readonly relativeName: string;
  readonly address: string;
  readonly place: string;
}

export interface ExpertDraft extends Person {
  readonly designation: string;
}

export interface AlgorithmChoice {
  readonly sha256: boolean;
  readonly sha1: boolean;
  readonly md5: boolean;
}

export interface CaseFile {
  readonly id: string;
  readonly schemaVersion: 1;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly title: string;
  readonly court: string;
  readonly caseNumber: string;
  readonly party: Person;
  readonly expert: ExpertDraft;
  readonly devices: readonly Device[];
  readonly records: readonly EvidenceRecord[];
  readonly algorithms: AlgorithmChoice;
  readonly custody: readonly CustodyEvent[];
  readonly nextLabel: number;
}

export const EMPTY_PERSON: Person = { name: "", relationOf: "", relativeName: "", address: "", place: "" };

export function emptyRelation(): Record<RelationKey, boolean> {
  return { owned: false, maintained: false, managed: false, operated: false };
}

export function relationPhrase(p: Pick<Person, "relationOf">): string {
  switch (p.relationOf) {
    case "son":
      return "Son";
    case "daughter":
      return "Daughter";
    case "spouse":
      return "Spouse";
    default:
      return "Son/daughter/spouse";
  }
}

export function recordsForDevice(c: CaseFile, deviceId: string): EvidenceRecord[] {
  return c.records.filter((r) => r.deviceId === deviceId && r.includeInCertificate);
}

export function kindFromFile(name: string, mime: string): RecordKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".zip")) return "archive";
  if (lower.endsWith(".txt")) return "chat-text";
  if (mime.startsWith("image/") || /\.(jpe?g|png|webp|heic|gif|bmp)$/.test(lower)) return "image";
  if (mime.startsWith("audio/") || /\.(opus|ogg|m4a|mp3|aac|amr|wav|3gp)$/.test(lower)) return "audio";
  if (mime.startsWith("video/") || /\.(mp4|mov|mkv|avi|dav|264|h264|h265|asf|3gp)$/.test(lower)) return "video";
  if (/\.(pdf|docx?|xlsx?|pptx?|vcf|csv)$/.test(lower)) return "document";
  return "other";
}
