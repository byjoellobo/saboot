// Readiness checks shown before generating documents. Errors block
// generation; warnings are shown but the user may proceed (blank fields are
// printed as lines to fill by hand).
import type { CaseFile, Device } from "../model";
import { checkEid, checkImei, checkMac, checkSerial } from "../devices/validate";
import { deviceTitle } from "../devices/describe";

export interface Issue {
  readonly severity: "error" | "warning";
  readonly where: "case" | "party" | "device" | "record";
  readonly refId: string | null;
  readonly message: string;
}

function deviceIssues(d: Device): Issue[] {
  const name = deviceTitle(d);
  const out: Issue[] = [];
  const warn = (message: string) => out.push({ severity: "warning", where: "device", refId: d.id, message: `${name}: ${message}` });
  if (!d.makeModel.trim()) warn("Make & Model is empty.");
  if (d.sourceKind === "other" && !d.otherKindText.trim()) warn("You ticked 'Other' but did not say what the source is.");
  const serial = checkSerial(d.serial);
  if (serial.severity !== "ok") warn(serial.message);
  if (!d.identifiers.some((i) => i.value.trim()) && d.sourceKind !== "cd") {
    warn("No IMEI/UIN/UID/MAC/Cloud ID recorded. Add at least one where applicable.");
  }
  for (const id of d.identifiers) {
    if (!id.value.trim()) continue;
    const check = id.type === "IMEI" ? checkImei(id.value) : id.type === "MAC" ? checkMac(id.value) : id.type === "EID" ? checkEid(id.value) : null;
    if (check && check.severity !== "ok") warn(`${id.type} ${id.value}: ${check.message}`);
  }
  if (!Object.values(d.relation).some(Boolean)) warn("Part A asks whether the device is Owned / Maintained / Managed / Operated by you; none is ticked.");
  if (d.sourceKind === "dvr" && !d.clock) warn("For CCTV, record how far the recorder's clock differs from real time (clock check).");
  return out;
}

export function checkCase(c: CaseFile): Issue[] {
  const issues: Issue[] = [];
  const add = (i: Issue) => issues.push(i);

  if (!c.party.name.trim()) add({ severity: "warning", where: "party", refId: null, message: "Your name (the person signing Part A) is empty." });
  if (!c.party.address.trim()) add({ severity: "warning", where: "party", refId: null, message: "'Residing/employed at' is empty." });
  if (!c.algorithms.sha256 && !c.algorithms.sha1 && !c.algorithms.md5) {
    add({ severity: "error", where: "case", refId: null, message: "Choose at least one hash algorithm to declare (SHA-256 is recommended)." });
  }

  const included = c.records.filter((r) => r.includeInCertificate);
  if (included.length === 0) add({ severity: "error", where: "case", refId: null, message: "Add at least one electronic record and include it in the certificate." });

  for (const r of included) {
    if (!r.deviceId || !c.devices.some((d) => d.id === r.deviceId)) {
      add({ severity: "error", where: "record", refId: r.id, message: `${r.label} (${r.fileName}) is not linked to a device. Every record must name the device it came from.` });
    }
    if (!r.manner.trim()) {
      add({ severity: "warning", where: "record", refId: r.id, message: `${r.label}: describe how the record was produced (s.63(4)(a)).` });
    } else if (/\[[^\]]+\]/.test(r.manner)) {
      add({ severity: "warning", where: "record", refId: r.id, message: `${r.label}: "how it was produced" still has blanks in [brackets] to replace.` });
    }
    if (r.crcOk === false) {
      add({ severity: "warning", where: "record", refId: r.id, message: `${r.label}: the zip's own checksum does not match. The archive may be damaged; re-export before filing.` });
    }
  }

  const usedDevices = c.devices.filter((d) => included.some((r) => r.deviceId === d.id));
  for (const d of usedDevices) issues.push(...deviceIssues(d));
  return issues;
}

export function hasBlockingIssues(issues: readonly Issue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
