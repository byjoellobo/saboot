import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { checkCase, hasBlockingIssues } from "../../src/sakshya/certificate/checks";
import { buildCertificatePdf } from "../../src/sakshya/certificate/certificate-pdf";
import { clockOffsetSeconds, describeClock, describeIdentifiers } from "../../src/sakshya/devices/describe";
import { istStamp } from "../../src/engine/util/format";
import { dvr, nodeFontLoader, phone, sampleCase } from "./fixtures";

const OUT = process.env.SABOOT_PDF_OUT;

describe("certificate bundle PDF", () => {
  it("builds a multi-device bundle that pdf-lib can re-open", async () => {
    const c = await sampleCase();
    const bytes = await buildCertificatePdf(c, {
      loader: nodeFontLoader,
      verifyBaseUrl: "https://sakshya.example/verify.html",
      generatedAt: new Date("2026-10-29T04:00:00Z"),
      appVersion: "0.1.0",
      includeBlankPartB: true,
    });
    expect(bytes.length).toBeGreaterThan(10_000);
    const doc = await PDFDocument.load(bytes);
    // guidance + 2 devices x (A + B) + blank B + hash report + worksheet + custody
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(9);
    expect(doc.getTitle()).toContain("SC 1234/2026");
    if (OUT) {
      mkdirSync(OUT, { recursive: true });
      writeFileSync(resolve(OUT, "certificate.pdf"), bytes);
    }
  });
});

describe("readiness checks", () => {
  it("passes the sample case with no blocking errors", async () => {
    const issues = checkCase(await sampleCase());
    expect(hasBlockingIssues(issues)).toBe(false);
  });

  it("blocks records without a device and empty algorithm choice", async () => {
    const c = await sampleCase();
    const broken = {
      ...c,
      algorithms: { sha256: false, sha1: false, md5: false },
      records: c.records.map((r) => (r.id === "r3" ? { ...r, deviceId: null } : r)),
    };
    const issues = checkCase(broken);
    expect(hasBlockingIssues(issues)).toBe(true);
    expect(issues.map((i) => i.message).join("\n")).toMatch(/not linked to a device/);
    expect(issues.map((i) => i.message).join("\n")).toMatch(/at least one hash algorithm/);
  });

  it("warns about bad identifiers, missing manner and missing clock check", async () => {
    const c = await sampleCase();
    const devices = [
      {
        ...phone,
        identifiers: [
          { type: "IMEI" as const, value: "490154203237519", note: "" },
          { type: "MAC" as const, value: "DA:A1:19:00:00:01", note: "" },
        ],
      },
      { ...dvr, clock: null, relation: { owned: false, maintained: false, managed: false, operated: false } },
    ];
    const issues = checkCase({ ...c, devices, records: c.records.map((r) => ({ ...r, manner: "" })), party: { ...c.party, name: "" } });
    const text = issues.map((i) => i.message).join("\n");
    expect(text).toMatch(/Luhn/);
    expect(text).toMatch(/randomised/);
    expect(text).toMatch(/clock check/);
    expect(text).toMatch(/Owned \/ Maintained/);
    expect(text).toMatch(/s\.63\(4\)\(a\)/);
    expect(text).toMatch(/Your name/);
  });
});

describe("device descriptions", () => {
  it("lists identifiers with notes", () => {
    expect(describeIdentifiers(phone)).toBe(
      "IMEI (SIM 1): 490154203237518; MAC (Wi-Fi hardware address): 3C:5A:B4:01:23:45; Cloud ID: +91 00000 00004 (WhatsApp)",
    );
  });

  it("computes and describes a recorder clock offset", () => {
    const actual = new Date("2026-10-28T08:32:10.000Z"); // 14:02:10 IST
    expect(clockOffsetSeconds("2026-10-28T14:05:30", actual)).toBe(200);
    expect(clockOffsetSeconds("2026-10-28T14:00", actual)).toBe(-130);
    expect(() => clockOffsetSeconds("not a time", actual)).toThrow();
    const text = describeClock(dvr.clock ?? { deviceShows: "", actualAt: "", offsetSeconds: 0 }, istStamp);
    expect(text).toContain("3 min 20 s ahead of actual IST");
    expect(describeClock({ deviceShows: "2026-10-28T14:02:10", actualAt: actual.toISOString(), offsetSeconds: 0 }, istStamp)).toContain(
      "matching actual time",
    );
  });
});
