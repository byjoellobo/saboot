import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { appendEvent, type CustodyEvent } from "../../src/engine/custody/custody-log";
import type { FontLoader } from "../../src/engine/pdf/fonts";
import type { CaseFile, Device, EvidenceRecord } from "../../src/sakshya/model";
import { emptyRelation } from "../../src/sakshya/model";

export const nodeFontLoader: FontLoader = async (file) =>
  new Uint8Array(await readFile(resolve(import.meta.dirname, "../../public/fonts", file)));

export const phone: Device = {
  id: "dev-phone",
  profile: "android",
  sourceKind: "mobile",
  otherKindText: "",
  nickname: "Asha's phone",
  makeModel: "Samsung Galaxy A54 5G (SM-A546E)",
  color: "Awesome Graphite",
  serial: "R5CW12ABCDE",
  identifiers: [
    { type: "IMEI", value: "490154203237518", note: "SIM 1" },
    { type: "MAC", value: "3C:5A:B4:01:23:45", note: "Wi-Fi hardware address" },
    { type: "Cloud ID", value: "+91 00000 00004 (WhatsApp)", note: "" },
  ],
  otherInfo: "Android 15, One UI 7. Screen lock enabled. In my continuous possession since purchase in March 2024.",
  relation: { ...emptyRelation(), owned: true, operated: true },
  clock: null,
};

export const dvr: Device = {
  id: "dev-dvr",
  profile: "cctv",
  sourceKind: "dvr",
  otherKindText: "",
  nickname: "Shop CCTV recorder",
  makeModel: "CP Plus CP-UVR-0401E1-IC",
  color: "Black",
  serial: "6J0A1B2PAZ12345",
  identifiers: [{ type: "MAC", value: "E0:50:8B:12:34:56", note: "LAN" }],
  otherInfo: "4-channel recorder; footage of camera 2 (front door) exported by USB backup.",
  relation: { ...emptyRelation(), owned: true, maintained: true },
  clock: { deviceShows: "2026-10-28T14:05:30", actualAt: "2026-10-28T08:32:10.000Z", offsetSeconds: 200 },
};

function rec(partial: Partial<EvidenceRecord> & Pick<EvidenceRecord, "id" | "label" | "fileName">): EvidenceRecord {
  return {
    deviceId: phone.id,
    kind: "image",
    mimeType: "image/jpeg",
    size: 123_456,
    lastModified: "2026-10-20T05:00:00.000Z",
    hashes: {
      md5: "900150983cd24fb0d6963f7d28e17f72",
      sha1: "a9993e364706816aba3e25717850c26c9cd0d89d",
      sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    },
    hashedAt: "2026-10-29T03:30:00.000Z",
    parentId: null,
    zipPath: null,
    zipModified: null,
    crcOk: null,
    description: "",
    manner: "",
    includeInCertificate: true,
    ...partial,
  };
}

export const records: EvidenceRecord[] = [
  rec({
    id: "r1",
    label: "R-1",
    kind: "whatsapp-export",
    fileName: "WhatsApp Chat with Ravi Kumar.zip",
    mimeType: "application/zip",
    size: 18_234_567,
    description: "WhatsApp chat between Asha Rao and Ravi Kumar (landlord), with media",
    manner: "Exported on 28/10/2026 from WhatsApp on the phone: chat > More > Export chat > Include media; copied to laptop by USB cable.",
  }),
  rec({
    id: "r2",
    label: "R-2",
    kind: "chat-text",
    fileName: "WhatsApp Chat with Ravi Kumar.txt",
    mimeType: "text/plain",
    size: 45_120,
    parentId: "r1",
    zipPath: "WhatsApp Chat with Ravi Kumar.txt",
    zipModified: "2026-10-28T19:02:44",
    crcOk: true,
    description: "Chat text inside R-1. ರವಿ ಕುಮಾರ್ ಅವರೊಂದಿಗೆ ಸಂಭಾಷಣೆ (ಕನ್ನಡ). राजेश का संदेश.",
    manner: "Contained in R-1.",
  }),
  rec({
    id: "r3",
    label: "R-3",
    fileName: "Screenshot_20261015-221530_WhatsApp.jpg",
    description: "Screenshot of deposit refusal message 👍",
    manner: "Screenshot taken on the phone on 15/10/2026; copied by USB cable.",
  }),
  rec({
    id: "r4",
    label: "R-4",
    deviceId: dvr.id,
    kind: "video",
    fileName: "ch02_20261012_101500_102500.mp4",
    mimeType: "video/mp4",
    size: 4_812_345_678,
    description: "CCTV camera 2, 12/10/2026 10:15 to 10:25 (recorder time)",
    manner: "Exported from the recorder's local menu: Backup > USB > MP4 on 28/10/2026.",
  }),
];

export async function sampleCase(): Promise<CaseFile> {
  let custody: CustodyEvent[] = [];
  custody = await appendEvent(
    custody,
    { action: "case-created", actor: "Asha Rao", summary: "Case file created" },
    new Date("2026-10-29T03:00:00Z"),
  );
  custody = await appendEvent(
    custody,
    {
      action: "record-hashed",
      actor: "Asha Rao",
      summary: "Hashed R-1 WhatsApp Chat with Ravi Kumar.zip",
      details: { sha256: records[0]?.hashes.sha256 ?? "", size: 18_234_567 },
    },
    new Date("2026-10-29T03:30:00Z"),
  );
  return {
    id: "case-1",
    schemaVersion: 1,
    createdAt: "2026-10-29T03:00:00Z",
    updatedAt: "2026-10-29T03:30:00Z",
    title: "Asha Rao v. Ravi Kumar (security deposit)",
    court: "Court of Small Causes, Bengaluru",
    caseNumber: "SC 1234/2026",
    party: {
      name: "Asha Rao",
      relationOf: "daughter",
      relativeName: "K. Venkatesh Rao",
      address: "No. 12, 4th Cross, Indiranagar, Bengaluru 560038",
      place: "Bengaluru",
    },
    expert: { name: "", relationOf: "", relativeName: "", address: "", place: "", designation: "" },
    devices: [phone, dvr],
    records,
    algorithms: { sha256: true, sha1: false, md5: true },
    custody,
    nextLabel: 5,
  };
}
