// Machine-readable hash lists for experts and opposing counsel.
//
//   SHA256SUMS  works with `sha256sum -c SHA256SUMS` (Linux, macOS with
//               coreutils, Git Bash) after the files are placed in one folder
//               (zip entries: after extracting the zip there).
//   CSV         one row per record with every field of the hash report.
import { istStamp } from "../../engine/util/format";
import type { CaseFile, EvidenceRecord } from "../model";
import { deviceTitle } from "../devices/describe";

function included(c: CaseFile): EvidenceRecord[] {
  return c.records.filter((r) => r.includeInCertificate);
}

/** Path the file will have on disk: inside-zip path for zip entries, else the file name. */
function diskName(r: EvidenceRecord): string {
  return (r.zipPath ?? r.fileName).replace(/[\r\n]+/g, " ");
}

/**
 * GNU coreutils format: "<hex>  <name>". Names containing a backslash are
 * written in the escaped form GNU tools expect (leading "\" and "\\").
 */
export function sha256sums(c: CaseFile): string {
  return included(c)
    .map((r) => {
      const name = diskName(r);
      return name.includes("\\") ? `\\${r.hashes.sha256}  ${name.replace(/\\/g, "\\\\")}` : `${r.hashes.sha256}  ${name}`;
    })
    .join("\n")
    .concat("\n");
}

/**
 * Spreadsheet programs run cells that start with = + - @ (and tab/CR) as
 * formulas. File names come from users and archives, so neutralise them.
 */
export function csvCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const HEADER = [
  "Record",
  "File name",
  "Path inside archive",
  "Inside record",
  "Device",
  "Kind",
  "Size (bytes)",
  "MD5",
  "SHA-1",
  "SHA-256",
  "File modified (as reported)",
  "Hashed at (IST)",
  "Zip CRC32 check",
  "Description",
  "Manner of production",
];

export function hashCsv(c: CaseFile): string {
  const rows = included(c).map((r) => {
    const parent = r.parentId ? c.records.find((p) => p.id === r.parentId) : undefined;
    const device = c.devices.find((d) => d.id === r.deviceId);
    return [
      r.label,
      r.fileName,
      r.zipPath,
      parent ? parent.label : null,
      device ? deviceTitle(device) : null,
      r.kind,
      r.size,
      r.hashes.md5,
      r.hashes.sha1,
      r.hashes.sha256,
      r.zipModified
        ? `${r.zipModified.replace("T", " ")} (zip, device local time)`
        : r.lastModified
          ? istStamp(new Date(r.lastModified))
          : null,
      istStamp(new Date(r.hashedAt)),
      r.crcOk === null ? null : r.crcOk ? "matches" : "MISMATCH",
      r.description,
      r.manner,
    ];
  });
  // UTF-8 BOM so Excel opens Indian-language text correctly; CRLF per RFC 4180.
  return "\uFEFF" + [HEADER, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** Parse a SHA256SUMS file (GNU or BSD style) into hash/name pairs. Invalid lines are skipped. */
export function parseSha256sums(text: string): { sha256: string; name: string }[] {
  const out: { sha256: string; name: string }[] = [];
  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const gnu = line.match(/^\\?([0-9a-fA-F]{64}) [ *](.+)$/);
    const bsd = line.match(/^SHA256 \((.+)\) = ([0-9a-fA-F]{64})$/);
    if (gnu?.[1] && gnu[2]) out.push({ sha256: gnu[1].toLowerCase(), name: gnu[2] });
    else if (bsd?.[1] && bsd[2]) out.push({ sha256: bsd[2].toLowerCase(), name: bsd[1] });
  }
  return out;
}
