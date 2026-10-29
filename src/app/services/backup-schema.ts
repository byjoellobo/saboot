// Schema for case backups. Backups are files the user may receive from
// elsewhere, so they are validated strictly before anything is stored.
import { z } from "zod";

const hex = (len: number) => z.string().regex(new RegExp(`^[0-9a-f]{${len}}$`));
const text = (max = 4000) => z.string().max(max);

const person = z.object({
  name: text(300),
  relationOf: z.enum(["son", "daughter", "spouse", ""]),
  relativeName: text(300),
  address: text(1000),
  place: text(200),
});

const device = z.object({
  id: text(80),
  profile: z.enum(["android", "iphone", "windows", "mac", "cctv", "usb", "disc", "server", "cloud", "other"]),
  sourceKind: z.enum(["computer", "dvr", "mobile", "flash", "cd", "server", "cloud", "other"]),
  otherKindText: text(300),
  nickname: text(200),
  makeModel: text(300),
  color: text(100),
  serial: text(200),
  identifiers: z
    .array(z.object({ type: z.enum(["IMEI", "MAC", "Cloud ID", "UIN", "UID", "EID", "Other"]), value: text(300), note: text(200) }))
    .max(30),
  otherInfo: text(4000),
  relation: z.object({ owned: z.boolean(), maintained: z.boolean(), managed: z.boolean(), operated: z.boolean() }),
  clock: z.object({ deviceShows: text(40), actualAt: text(40), offsetSeconds: z.number().int() }).nullable(),
});

const record = z.object({
  id: text(80),
  label: text(20),
  deviceId: text(80).nullable(),
  kind: z.enum(["whatsapp-export", "chat-text", "image", "audio", "video", "document", "archive", "other"]),
  fileName: text(1000),
  mimeType: text(200),
  size: z.number().int().nonnegative(),
  lastModified: text(40).nullable(),
  hashes: z.object({ md5: hex(32), sha1: hex(40), sha256: hex(64) }),
  hashedAt: text(40),
  parentId: text(80).nullable(),
  zipPath: text(2000).nullable(),
  zipModified: text(40).nullable(),
  crcOk: z.boolean().nullable(),
  description: text(4000),
  manner: text(4000),
  includeInCertificate: z.boolean(),
});

const custodyEvent = z.object({
  seq: z.number().int().positive(),
  at: text(40),
  action: z.enum([
    "case-created",
    "record-added",
    "record-hashed",
    "record-removed",
    "device-recorded",
    "device-updated",
    "transcript-generated",
    "certificate-generated",
    "timestamp-obtained",
    "bundle-exported",
    "note",
  ]),
  actor: text(300),
  summary: text(2000),
  details: z.record(z.string(), z.union([z.string().max(4000), z.number(), z.boolean()])),
  prevHash: hex(64),
  hash: hex(64),
});

export const caseSchema = z.object({
  id: text(80),
  schemaVersion: z.literal(1),
  createdAt: text(40),
  updatedAt: text(40),
  title: text(500),
  court: text(500),
  caseNumber: text(200),
  party: person,
  expert: person.extend({ designation: text(300) }),
  devices: z.array(device).max(100),
  records: z.array(record).max(20_000),
  algorithms: z.object({ sha256: z.boolean(), sha1: z.boolean(), md5: z.boolean() }),
  custody: z.array(custodyEvent).max(100_000),
  nextLabel: z.number().int().positive(),
});

export const backupSchema = z.object({
  format: z.literal("sakshya-kit-backup"),
  version: z.literal(1),
  exportedAt: text(40),
  appVersion: text(40),
  caseFile: caseSchema,
  chats: z.array(z.object({ recordId: text(80), base64: z.string().max(400_000_000) })).max(200),
});

export type Backup = z.infer<typeof backupSchema>;
