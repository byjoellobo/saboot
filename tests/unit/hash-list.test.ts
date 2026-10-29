import { describe, expect, it } from "vitest";
import { csvCell, hashCsv, parseSha256sums, sha256sums } from "../../src/sakshya/certificate/hash-list";
import { sampleCase } from "./fixtures";

describe("SHA256SUMS export", () => {
  it("lists included records in sha256sum -c format", async () => {
    const c = await sampleCase();
    const text = sha256sums(c);
    const lines = text.trimEnd().split("\n");
    expect(lines).toHaveLength(c.records.length);
    expect(lines[0]).toBe(`${c.records[0]?.hashes.sha256}  WhatsApp Chat with Ravi Kumar.zip`);
    expect(text.endsWith("\n")).toBe(true);
  });

  it("escapes backslashes the way GNU tools expect and skips excluded records", async () => {
    const c = await sampleCase();
    const odd = {
      ...c,
      records: c.records.map((r, i) => (i === 0 ? { ...r, fileName: "a\\b.zip" } : { ...r, includeInCertificate: i === 1 })),
    };
    const lines = sha256sums(odd).trimEnd().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(`\\${c.records[0]?.hashes.sha256}  a\\\\b.zip`);
  });

  it("round-trips through the parser, including BSD-style lines", () => {
    const hash = "ab".repeat(32);
    const parsed = parseSha256sums(
      `\uFEFF${hash}  one.mp4\r\n# comment\n${hash} *two.jpg\nSHA256 (three.txt) = ${hash.toUpperCase()}\nnot a line\n`,
    );
    expect(parsed).toEqual([
      { sha256: hash, name: "one.mp4" },
      { sha256: hash, name: "two.jpg" },
      { sha256: hash, name: "three.txt" },
    ]);
  });
});

describe("CSV hash report", () => {
  it("neutralises spreadsheet formulas and quotes special characters", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+91 00000")).toBe("'+91 00000");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell(-1)).toBe("-1");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(true)).toBe("true");
  });

  it("writes a header and one row per included record, with a BOM for Excel", async () => {
    const c = await sampleCase();
    const csv = hashCsv(c);
    expect(csv.startsWith("\uFEFFRecord,File name,")).toBe(true);
    const rows = csv.trimEnd().split("\r\n");
    expect(rows).toHaveLength(c.records.length + 1);
    expect(rows[2]).toContain("R-2");
    expect(rows[2]).toContain("matches");
    expect(rows[1]).toContain("Asha's phone");
  });
});
