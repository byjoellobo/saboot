// A demo case built from synthetic files, so people can see every output
// without using real evidence. The files go through the normal hashing and
// parsing pipeline. Nothing here belongs to a real person:
//   - names are invented and marked "(demo)"
//   - the IMEI is the well-known example number used in standards documents
//   - the MAC address is in 00:00:5E:00:53:xx, reserved for documentation (RFC 7042)
import { strToU8, zipSync } from "fflate";
import { newId } from "../../engine/util/crypto";
import type { CaseFile, Device } from "../../sakshya/model";
import { emptyRelation } from "../../sakshya/model";
import { newCase, touch, withEvent } from "../state/case-ops";
import { saveCase } from "../state/db";

const NNBSP = "\u202F";

function demoChat(): Uint8Array {
  const lines = [
    `01/10/26, 9:00${NNBSP}am - Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.`,
    `01/10/26, 9:02${NNBSP}am - Asha (demo): Good morning sir. I have vacated the flat today and handed over the keys to the watchman.`,
    `01/10/26, 9:05${NNBSP}am - Ravi (demo): Ok. I will check the flat and return the deposit.`,
    `05/10/26, 6:40${NNBSP}pm - Asha (demo): Sir, it has been 4 days. When will you return the deposit of ₹1,20,000?`,
    `05/10/26, 7:15${NNBSP}pm - Ravi (demo): Painting and cleaning charges will be deducted.`,
    `Wall painting ₹35,000`,
    `Deep cleaning ₹8,000`,
    `05/10/26, 7:16${NNBSP}pm - Ravi (demo): IMG-20261005-WA0004.jpg (file attached)`,
    `This is the condition you left it in`,
    `05/10/26, 7:20${NNBSP}pm - Asha (demo): ಸರ್, ಮನೆ ಬಿಟ್ಟಾಗ ಗೋಡೆಗಳು ಚೆನ್ನಾಗಿದ್ದವು. The photo you sent is from before I moved in.`,
    `05/10/26, 7:21${NNBSP}pm - Asha (demo): Please share the bills for painting and cleaning.`,
    `06/10/26, 10:02${NNBSP}am - Ravi (demo): This message was deleted`,
    `06/10/26, 10:05${NNBSP}am - Ravi (demo): I will send ₹77,000 by next week. That is final.`,
    `06/10/26, 10:06${NNBSP}am - Asha (demo): 🙏 I do not agree. I will take legal advice.`,
    "",
  ];
  return strToU8(lines.join("\n"));
}

/** A small, valid PNG (solid colour) so the "photo" really is an image file. */
function demoPng(): Uint8Array {
  // 1x1 pixel PNG, pale grey (generated with zlib; CRCs verified).
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
    0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
    0x78, 0xf1, 0xe2, 0x05, 0x00, 0x05, 0x74, 0x02, 0xb9, 0xd9, 0xc2, 0xc7, 0x65, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
}

export function demoFiles(): File[] {
  const chat = demoChat();
  const photo = demoPng();
  const zip = zipSync(
    { "WhatsApp Chat with Ravi (demo).txt": chat, "IMG-20261005-WA0004.jpg": [photo, { level: 0 }] },
    { mtime: new Date(2026, 9, 7, 18, 30, 0) },
  );
  const screenshot = demoPng();
  return [
    new File([zip as BlobPart], "WhatsApp Chat with Ravi (demo).zip", {
      type: "application/zip",
      lastModified: Date.UTC(2026, 9, 7, 13, 0),
    }),
    new File([screenshot as BlobPart], "Screenshot_20261006-100700_WhatsApp (demo).png", {
      type: "image/png",
      lastModified: Date.UTC(2026, 9, 6, 4, 37),
    }),
  ];
}

function demoDevice(): Device {
  return {
    id: newId("dev-"),
    profile: "android",
    sourceKind: "mobile",
    otherKindText: "",
    nickname: "Asha's phone (demo)",
    makeModel: "Example Phone X1 (demo)",
    color: "Blue",
    serial: "X1-2026-000184",
    identifiers: [
      { type: "IMEI", value: "490154203237518", note: "SIM 1, example number, not a real phone" },
      { type: "MAC", value: "00:00:5E:00:53:01", note: "Wi-Fi, documentation address, not a real device" },
    ],
    otherInfo: "Demo device for trying Saboot. Not a real phone.",
    relation: { ...emptyRelation(), owned: true, operated: true },
    clock: null,
  };
}

/** Create and store an empty demo case with party and device filled in. Files are added by the caller. */
export async function createDemoCase(): Promise<CaseFile> {
  const base = touch(newCase(), {
    title: "DEMO: Asha v. Ravi (security deposit). Not real evidence",
    court: "Demo Court, Bengaluru",
    caseNumber: "DEMO 1/2026",
    party: {
      name: "Asha (demo)",
      relationOf: "daughter",
      relativeName: "Example Parent (demo)",
      address: "Example Street, Bengaluru (demo address)",
      place: "Bengaluru",
    },
    devices: [demoDevice()],
  });
  const c = await withEvent(base, { action: "case-created", actor: "Asha (demo)", summary: "Demo case created with synthetic files" });
  await saveCase(c);
  return c;
}
