// Builds the certificate bundle PDF:
//   1. Guidance page (remove before filing)
//   2. For each device: PART A (pre-filled) and PART B (watermarked draft)
//   3. Optional blank PART B for the expert to complete by hand
//   4. Annexure H: Hash Report (with verify QR codes)
//   5. Expert's verification worksheet
//   6. Annexure C: custody log
import { verifyChain } from "../../engine/custody/custody-log";
import type { FontLoader } from "../../engine/pdf/fonts";
import { A4, FILL, INK, MUTED, PdfWriter, WARN, type Span } from "../../engine/pdf/writer";
import { formatBytes, istStamp } from "../../engine/util/format";
import { buildVerifyUrl, chunkForQr } from "../../engine/verify/verify-link";
import { verifyItems } from "./verify-items";
import { deviceTitle, describeClock, describeIdentifiers } from "../devices/describe";
import type { CaseFile, Device, EvidenceRecord, Person } from "../model";
import * as S from "./schedule";

export interface CertificateOptions {
  readonly loader: FontLoader;
  readonly verifyBaseUrl: string;
  readonly generatedAt: Date;
  readonly appVersion: string;
  readonly includeBlankPartB: boolean;
}

const BODY = 9.6;

function fill(value: string, blank = 28): Span {
  const v = value.trim();
  return v ? { text: v, style: "sansBold", color: FILL } : { text: "_".repeat(blank), color: MUTED };
}

function plain(text: string): Span {
  return { text };
}

function caseRef(c: CaseFile): string {
  return (
    [c.caseNumber, c.court, c.title]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ") || "Untitled case"
  );
}

function includedRecords(c: CaseFile): EvidenceRecord[] {
  return c.records.filter((r) => r.includeInCertificate && r.deviceId);
}

function devicesInUse(c: CaseFile): Device[] {
  const recs = includedRecords(c);
  return c.devices.filter((d) => recs.some((r) => r.deviceId === d.id));
}

function otherInfoText(device: Device, records: readonly EvidenceRecord[], when: (d: Date) => string): string {
  const parts = [device.otherInfo.trim()];
  if (device.clock) parts.push(describeClock(device.clock, when));
  const labels = records.map((r) => r.label).join(", ");
  parts.push(
    `Electronic records produced from this source: ${labels}. Each record, the manner in which it was produced, its size and hash values are set out in the enclosed Hash Report (Annexure H).`,
  );
  return parts.filter(Boolean).join(" ");
}

async function caption(w: PdfWriter, c: CaseFile): Promise<void> {
  const lines = [c.court, c.caseNumber ? `Case No.: ${c.caseNumber}` : "", c.title].map((s) => s.trim()).filter(Boolean);
  for (const line of lines) await w.paragraph([{ text: line, style: "sansBold" }], 10, { align: "center", after: 1 });
  if (lines.length) w.spacer(6);
}

async function scheduleHeading(w: PdfWriter, part: "A" | "B"): Promise<void> {
  await w.paragraph([{ text: S.SCHEDULE_HEADING, style: "sansBold" }], 12, { align: "center", after: 1 });
  await w.paragraph([plain(S.SCHEDULE_SUBHEADING)], 9, { align: "center", after: 4 });
  await w.paragraph([{ text: S.CERTIFICATE_TITLE, style: "sansBold" }], 11, { align: "center", after: 4 });
  await w.paragraph([{ text: part === "A" ? S.PART_A_TITLE : S.PART_B_TITLE, style: "sansBold" }], 10.5, { align: "center", after: 0 });
  await w.paragraph([plain(part === "A" ? S.PART_A_SUBTITLE : S.PART_B_SUBTITLE)], 9, { align: "center", after: 8 });
}

async function deponent(w: PdfWriter, p: Person): Promise<void> {
  await w.paragraph(
    [
      plain(`${S.DEPONENT_LINE.i} `),
      fill(p.name),
      plain(` ${S.DEPONENT_LINE.name} `),
      fill(p.relativeName),
      plain(` ${S.DEPONENT_LINE.residing} `),
      fill(p.address, 36),
      plain(` ${S.DEPONENT_LINE.affirm}`),
    ],
    BODY,
  );
}

async function deviceBlock(w: PdfWriter, device: Device | null, records: readonly EvidenceRecord[], partIntro: string): Promise<void> {
  await w.paragraph([plain(partIntro)], BODY);
  await w.checkboxes(
    S.SOURCE_BOXES.map((b) => ({ label: b.label, checked: device?.sourceKind === b.key })),
    BODY,
    8,
  );
  await w.paragraph([plain(`${S.DEVICE_FIELDS.other} `), fill(device?.sourceKind === "other" ? device.otherKindText : "", 40)], BODY);
  await w.paragraph(
    [
      plain(`${S.DEVICE_FIELDS.makeModel} `),
      fill(device?.makeModel ?? ""),
      plain(`    ${S.DEVICE_FIELDS.color} `),
      fill(device?.color ?? "", 14),
    ],
    BODY,
  );
  await w.paragraph([plain(`${S.DEVICE_FIELDS.serial} `), fill(device?.serial ?? "")], BODY);
  await w.paragraph(
    [
      plain(`${S.DEVICE_FIELDS.identifiers} `),
      fill(device ? describeIdentifiers(device) : "", 36),
      plain(` ${S.DEVICE_FIELDS.identifiersSuffix}`),
    ],
    BODY,
  );
  await w.paragraph(
    [
      plain(`${S.DEVICE_FIELDS.otherInfo} `),
      fill(device ? otherInfoText(device, records, istStamp) : "", 40),
      plain(` ${S.DEVICE_FIELDS.otherInfoSuffix}`),
    ],
    BODY,
  );
}

async function hashBlock(w: PdfWriter, c: CaseFile, records: readonly EvidenceRecord[] | null): Promise<void> {
  const value = records ? "as stated against each record in the table below and in the enclosed Hash Report (Annexure H)" : "";
  await w.paragraph([plain(`${S.HASH_LINE.before} `), fill(value, 40), plain(`, ${S.HASH_LINE.after}`)], BODY);
  const algs = records ? c.algorithms : { sha1: false, sha256: false, md5: false };
  await w.checkboxes(
    S.HASH_BOXES.map((b) => ({
      label: b.key === "other" ? `${b.label} ____________ ${S.HASH_OTHER_SUFFIX}` : b.label,
      checked: b.key === "other" ? false : algs[b.key],
    })),
    BODY,
    8,
  );
  if (records && records.length > 0) {
    const rows = records.map((r) => {
      const hashLines: Span[] = [];
      if (c.algorithms.sha256) hashLines.push({ text: `SHA256: ${r.hashes.sha256}\n`, style: "mono" });
      if (c.algorithms.sha1) hashLines.push({ text: `SHA1: ${r.hashes.sha1}\n`, style: "mono" });
      if (c.algorithms.md5) hashLines.push({ text: `MD5: ${r.hashes.md5}`, style: "mono" });
      return [
        [{ spans: [{ text: r.label, style: "sansBold" as const }], size: 8 }],
        [{ spans: [plain(r.zipPath ?? r.fileName)], size: 7.5 }],
        [{ spans: [plain(new Intl.NumberFormat("en-IN").format(r.size))], size: 7.5, align: "right" as const }],
        [{ spans: hashLines, size: 6.3 }],
      ];
    });
    await w.table(
      [
        { header: "Record", width: 0.08 },
        { header: "File", width: 0.23 },
        { header: "Size (bytes)", width: 0.12 },
        { header: "Hash value/s", width: 0.57 },
      ],
      rows,
    );
  }
  await w.paragraph([plain(S.HASH_REPORT_NOTE)], BODY);
}

async function signatureBlock(w: PdfWriter, captionText: string, person: Person, designation?: string): Promise<void> {
  w.ensure(110);
  w.spacer(34);
  const right = A4[0] - w.margin.right;
  const lineStart = right - 210;
  w.page.drawLine({ start: { x: lineStart, y: w.y }, end: { x: right, y: w.y }, thickness: 0.7, color: INK });
  w.spacer(12);
  await w.textAt(captionText, lineStart, w.y, 8.5);
  const nameLine = [person.name.trim(), designation?.trim()].filter(Boolean).join(", ");
  if (nameLine) {
    w.spacer(12);
    await w.textAt(nameLine, lineStart, w.y, 8.5, "sansBold", FILL);
  }
  w.spacer(10);
  await w.paragraph([plain(`${S.DATE_LINE} `), fill("", 16)], BODY, { after: 2 });
  await w.paragraph([plain(`${S.TIME_LINE.before} `), fill("", 10), plain(` ${S.TIME_LINE.after}`)], BODY, { after: 2 });
  await w.paragraph([plain(`${S.PLACE_LINE} `), fill(person.place, 20)], BODY);
}

async function partA(
  w: PdfWriter,
  c: CaseFile,
  device: Device,
  records: readonly EvidenceRecord[],
  opts: CertificateOptions,
): Promise<void> {
  w.newPage();
  await qrCorner(w, c, records, opts);
  await caption(w, c);
  await scheduleHeading(w, "A");
  await deponent(w, c.party);
  await deviceBlock(w, device, records, S.PART_A_SOURCE_INTRO);
  await w.paragraph([plain(S.PART_A_LAWFUL_CONTROL)], BODY);
  await w.checkboxes(
    S.RELATION_BOXES.map((b) => ({ label: b.label, checked: device.relation[b.key] })),
    BODY,
    8,
  );
  await w.paragraph([plain(S.RELATION_SUFFIX)], BODY);
  await hashBlock(w, c, records);
  await signatureBlock(w, S.SIGNATURE_CAPTION_A, c.party);
}

async function partBDraft(w: PdfWriter, c: CaseFile, device: Device, records: readonly EvidenceRecord[]): Promise<void> {
  w.newPage();
  const firstPage = w.pageIndex;
  await w.paragraph(
    [
      {
        text:
          "DRAFT, NOT AN EXPERT OPINION. The party prepared this draft with Saboot, a software tool, for the expert's convenience. " +
          "The expert must independently examine the device or records and recompute every hash value. This draft is not for " +
          "signature: the expert signs the blank PART B in this bundle, or their own clean copy, after verifying everything.",
        style: "sansBold",
        color: WARN,
      },
    ],
    8.2,
  );
  w.rule(WARN);
  await caption(w, c);
  await scheduleHeading(w, "B");
  await deponent(w, c.expert);
  await deviceBlock(w, device, records, S.PART_B_SOURCE_INTRO);
  await hashBlock(w, c, records);
  await signatureBlock(w, S.SIGNATURE_CAPTION_B, c.expert, c.expert.designation);
  await w.markPages(firstPage, w.pageIndex, "DRAFT FOR EXPERT REVIEW", "DRAFT PART B: not an expert opinion and not for signature");
}

async function partBBlank(w: PdfWriter, c: CaseFile): Promise<void> {
  w.newPage();
  await caption(w, c);
  await scheduleHeading(w, "B");
  await deponent(w, { name: "", relationOf: "", relativeName: "", address: "", place: "" });
  await deviceBlock(w, null, [], S.PART_B_SOURCE_INTRO);
  await hashBlock(w, c, null);
  await signatureBlock(w, S.SIGNATURE_CAPTION_B, { name: "", relationOf: "", relativeName: "", address: "", place: "" });
}

async function qrCorner(w: PdfWriter, c: CaseFile, records: readonly EvidenceRecord[], opts: CertificateOptions): Promise<void> {
  const groups = chunkForQr(opts.verifyBaseUrl, caseRef(c), verifyItems(records));
  const first = groups[0];
  if (!first) return;
  const size = 62;
  const x = A4[0] - w.margin.right - size;
  const top = A4[1] - 22;
  w.drawQr(buildVerifyUrl(opts.verifyBaseUrl, { caseRef: caseRef(c), items: first }), x, top, size);
  const note =
    groups.length > 1 ? `Verify ${first[0]?.label}–${first[first.length - 1]?.label}; more in Annexure H` : "Scan to verify files";
  await w.textAt(note, x - 2, top - size - 7, 5.5, "sans", MUTED);
}

async function guidance(w: PdfWriter, c: CaseFile, opts: CertificateOptions): Promise<void> {
  const recs = includedRecords(c);
  await w.paragraph([{ text: "READ THIS FIRST  (guidance page: remove before filing)", style: "sansBold", color: WARN }], 12);
  await w.paragraph(
    [plain(`Prepared for: ${caseRef(c)}. Generated on ${istStamp(opts.generatedAt)} with Saboot ${opts.appVersion}.`)],
    BODY,
  );
  w.rule();
  const bullets: string[] = [
    'Saboot is a software tool. It is not a lawyer and it is not the "expert" referred to in section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023. Nothing in this bundle is legal advice. Have a practising advocate review every page before it is filed.',
    "PART A is for you, the person in charge of the device. Check every filled value (shown in blue) against the device, then sign in ink and write the date and the time (IST, 24-hour) at which you sign.",
    "PART B must be completed and signed by an expert. The pre-filled PART B is only a draft to save the expert time: the expert must independently examine the records and recompute each hash value. A blank PART B and a worksheet are included for this.",
    "Who can sign PART B is not settled. On 22 May 2026 the Supreme Court (Pune Bar Association v. Union of India, W.P.(C) No. 599 of 2026) kept this question of law open. It observed that, besides an Examiner of Electronic Evidence notified under section 79A of the IT Act, 2000, a person may possibly sign if the court is satisfied, on unimpeachable material, of their special skill and expertise in computer science and cyber forensics. Ask your advocate whom to approach.",
    "File exactly the files listed in the Hash Report. Re-exporting a chat, forwarding a photo on WhatsApp, renaming inside a zip, compressing or editing a file produces a different hash value. Keep the originals unchanged and copy them by cable, not by messaging apps.",
    "The Hash Report (Annexure H) must be enclosed with the certificate. Anyone can check a file against it by scanning a QR code (the check runs in their browser; nothing is uploaded) or with standard tools listed in the Hash Report.",
    "The custody log (Annexure C) is a record you kept on your own device. Each entry is chained to the previous one by its SHA-256 value, so later edits are detectable, but it is still your own record, not an independent one.",
  ];
  for (const b of bullets) await w.paragraph([plain(`•  ${b}`)], BODY, { indent: 4 });
  w.rule();
  await w.paragraph([{ text: "What is in this bundle", style: "sansBold" }], 10);
  const devices = devicesInUse(c);
  const items = [
    ...devices.flatMap((d) => [`Certificate PART A and draft PART B for: ${deviceTitle(d)}`]),
    ...(opts.includeBlankPartB ? ["Blank PART B for the expert to complete by hand"] : []),
    `Annexure H: Hash Report for ${recs.length} record${recs.length === 1 ? "" : "s"}`,
    "Expert's verification worksheet",
    "Annexure C: custody log",
  ];
  for (const i of items) await w.paragraph([plain(`–  ${i}`)], BODY, { indent: 8, after: 2 });
}

async function hashReport(w: PdfWriter, c: CaseFile, opts: CertificateOptions): Promise<void> {
  w.newPage();
  await w.heading("ANNEXURE H: HASH REPORT", 13, "center");
  await w.paragraph([plain("(enclosed with the certificate under section 63(4)(c) of the Bharatiya Sakshya Adhiniyam, 2023)")], 8.5, {
    align: "center",
  });
  await w.paragraph(
    [
      plain(
        `Each record below was read in full on the party's own device and hashed with MD5, SHA-1 and SHA-256 in a single pass ` +
          `(Saboot ${opts.appVersion}; Rust md-5/sha1/sha2 implementations compiled to WebAssembly). A hash value changes completely ` +
          `if even one bit of the file changes. Sizes are exact byte counts. "Modified" times are as reported by the operating system or ` +
          `stored inside the zip and may reflect copying rather than creation.`,
      ),
    ],
    8.6,
  );
  await w.paragraph(
    [
      { text: "Independent check: ", style: "sansBold" },
      plain("Windows: "),
      { text: "certutil -hashfile <file> SHA256", style: "mono" },
      plain("   macOS: "),
      { text: "shasum -a 256 <file>", style: "mono" },
      plain("   Linux: "),
      { text: "sha256sum <file>", style: "mono" },
      plain(`   Browser (offline, nothing uploaded): ${opts.verifyBaseUrl.replace(/#.*$/, "")}`),
    ],
    8,
  );
  w.rule();

  for (const device of devicesInUse(c)) {
    const recs = includedRecords(c).filter((r) => r.deviceId === device.id);
    await w.heading(`Records from: ${deviceTitle(device)}`, 10.5);
    const groups = chunkForQr(opts.verifyBaseUrl, caseRef(c), verifyItems(recs));
    for (const group of groups) {
      w.ensure(110);
      const top = w.y;
      const size = 88;
      w.drawQr(buildVerifyUrl(opts.verifyBaseUrl, { caseRef: caseRef(c), items: group }), w.margin.left, top, size);
      const labels = group.map((g) => g.label).join(", ");
      const textX = w.margin.left + size + 10;
      await w.textAt(`Scan to check records ${labels}`, textX, top - 14, 9, "sansBold");
      await w.textAt(
        "Opens a page that hashes the file on the scanning device. Files are never uploaded.",
        textX,
        top - 27,
        7.5,
        "sans",
        MUTED,
      );
      w.y = top - size - 6;
      for (const r of recs.filter((x) => group.some((g) => g.label === x.label))) {
        const parent = r.parentId ? c.records.find((p) => p.id === r.parentId) : null;
        const kv: [string, Span[]][] = [
          ["File name", [plain(r.fileName)]],
          ...(r.zipPath
            ? ([["Inside archive", [plain(`${r.zipPath}${parent ? ` (in ${parent.label}, ${parent.fileName})` : ""}`)]]] as [
                string,
                Span[],
              ][])
            : []),
          ["Description", [plain(r.description || "-")]],
          ["Manner of production", [plain(r.manner || "-")]],
          ["Size", [plain(formatBytes(r.size))]],
          [
            "Modified (as reported)",
            [
              plain(
                r.zipModified
                  ? `${r.zipModified.replace("T", " ")} (zip entry time, device local time)`
                  : r.lastModified
                    ? istStamp(new Date(r.lastModified))
                    : "-",
              ),
            ],
          ],
          ["MD5", [{ text: r.hashes.md5, style: "mono" }]],
          ["SHA-1", [{ text: r.hashes.sha1, style: "mono" }]],
          ["SHA-256", [{ text: r.hashes.sha256, style: "mono" }]],
          ["Hashed at", [plain(istStamp(new Date(r.hashedAt)))]],
          ...(r.crcOk === null
            ? []
            : ([
                [
                  "Zip integrity",
                  [plain(r.crcOk ? "CRC32 stored in the zip matches the extracted data" : "CRC32 MISMATCH: archive may be damaged")],
                ],
              ] as [string, Span[]][])),
        ];
        await w.table(
          [
            { header: r.label, width: 0.24 },
            { header: r.kind === "whatsapp-export" ? "WhatsApp chat export" : r.kind.replace("-", " "), width: 0.76 },
          ],
          kv.map(([k, v]) => [[{ spans: [{ text: k, color: MUTED }], size: 7.6 }], [{ spans: v, size: 7.6 }]]),
        );
      }
    }
  }
}

async function expertWorksheet(w: PdfWriter, c: CaseFile): Promise<void> {
  w.newPage();
  await w.heading("EXPERT'S VERIFICATION WORKSHEET", 12, "center");
  await w.paragraph(
    [
      plain(
        "Optional aid for the expert completing PART B. Recompute each value with your own tools from the records produced, write it in the blank column, and mark whether it matches the value stated by the party.",
      ),
    ],
    8.6,
  );
  const rows = includedRecords(c).map((r) => [
    [{ spans: [{ text: r.label, style: "sansBold" as const }], size: 7.6 }],
    [{ spans: [plain(r.zipPath ?? r.fileName)], size: 7.2 }],
    [{ spans: [{ text: r.hashes.sha256, style: "mono" as const }], size: 6.4 }],
    [{ spans: [{ text: "\n\n", color: MUTED }], size: 8 }],
    [{ spans: [plain("Y / N")], size: 7.6, align: "center" as const }],
  ]);
  await w.table(
    [
      { header: "Record", width: 0.08 },
      { header: "File", width: 0.2 },
      { header: "SHA-256 stated by party", width: 0.3 },
      { header: "SHA-256 computed by expert (tool used)", width: 0.32 },
      { header: "Match", width: 0.1 },
    ],
    rows,
  );
  await w.paragraph([plain("Expert's name and signature: ______________________________    Date: ____________")], 9);
}

async function custodyAnnex(w: PdfWriter, c: CaseFile): Promise<void> {
  w.newPage();
  await w.heading("ANNEXURE C: RECORD OF HANDLING (CUSTODY LOG)", 12, "center");
  const check = await verifyChain(c.custody);
  await w.paragraph(
    [
      plain(
        "Kept by the party on their own device. Each entry stores the SHA-256 of the previous entry, so editing or deleting an earlier entry breaks every later link. Times are from this device's clock, shown in IST. ",
      ),
      check.ok
        ? { text: `Chain check: all ${c.custody.length} entries link correctly.`, style: "sansBold" }
        : { text: `Chain check FAILED at entry ${check.brokenAt}: ${check.reason}.`, style: "sansBold", color: WARN },
    ],
    8.6,
  );
  await w.table(
    [
      { header: "#", width: 0.05 },
      { header: "Time (IST)", width: 0.16 },
      { header: "By", width: 0.12 },
      { header: "What happened", width: 0.4 },
      { header: "Entry SHA-256", width: 0.27 },
    ],
    c.custody.map((e) => [
      [{ spans: [plain(String(e.seq))], size: 7.4 }],
      [{ spans: [plain(istStamp(new Date(e.at)))], size: 7.2 }],
      [{ spans: [plain(e.actor)], size: 7.2 }],
      [
        { spans: [plain(e.summary)], size: 7.4 },
        ...(Object.keys(e.details).length
          ? [
              {
                spans: [
                  {
                    text: Object.entries(e.details)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("\n"),
                    color: MUTED,
                    style: "mono" as const,
                  },
                ],
                size: 5.8,
              },
            ]
          : []),
      ],
      [{ spans: [{ text: e.hash, style: "mono" }], size: 5.8 }],
    ]),
    { zebra: true },
  );
}

/** Build the full certificate bundle. Call `checkCase` first and refuse on errors. */
export async function buildCertificatePdf(c: CaseFile, opts: CertificateOptions): Promise<Uint8Array> {
  const w = await PdfWriter.create({
    loader: opts.loader,
    title: `Section 63(4) BSA certificate bundle: ${caseRef(c)}`,
    subject:
      "Certificate under section 63(4)(c), Bharatiya Sakshya Adhiniyam, 2023, with Hash Report (draft prepared with Saboot; not legal advice)",
    keywords: ["BSA", "section 63", "electronic evidence", "hash report"],
    createdAt: opts.generatedAt,
  });
  await guidance(w, c, opts);
  for (const device of devicesInUse(c)) {
    const recs = includedRecords(c).filter((r) => r.deviceId === device.id);
    await partA(w, c, device, recs, opts);
    await partBDraft(w, c, device, recs);
  }
  if (opts.includeBlankPartB) await partBBlank(w, c);
  await hashReport(w, c, opts);
  await expertWorksheet(w, c);
  await custodyAnnex(w, c);
  const stamp = istStamp(opts.generatedAt);
  const ref = (c.caseNumber.trim() || c.title.trim() || "Untitled case").slice(0, 40);
  return w.finish((n, total) => ({
    left: `${ref} · Draft prepared with Saboot ${opts.appVersion} on ${stamp} · not legal advice`,
    right: `Page ${n} of ${total}`,
  }));
}
