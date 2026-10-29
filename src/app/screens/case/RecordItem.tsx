import { useState } from "react";
import { formatBytes, istStamp, shortSize } from "../../../engine/util/format";
import type { CaseFile, EvidenceRecord, RecordKind } from "../../../sakshya/model";
import { Check, HashedStamp, HashLines, Stamp, TextField } from "../../components/ui";

const KIND_NAMES: Readonly<Record<RecordKind, string>> = {
  "whatsapp-export": "WhatsApp export",
  "chat-text": "Chat text",
  image: "Image",
  audio: "Audio",
  video: "Video",
  document: "Document",
  archive: "Zip archive",
  other: "File",
};

/**
 * Starting sentences with [bracketed] blanks. They never state facts the tool
 * cannot know: the user must replace every bracket with what really happened.
 */
function mannerTemplate(kind: RecordKind): string | null {
  switch (kind) {
    case "whatsapp-export":
      return "Exported on [date] from WhatsApp on [which phone] using the chat's Export chat option ([with / without] media), then [how it was copied, e.g. copied to a laptop by USB cable], without any changes.";
    case "image":
      return "Screenshot taken on [which phone] on [date], then [how it was copied], without editing, cropping or forwarding.";
    case "audio":
      return "Recorded on [which device] using [which app] on [date], then [how it was copied], without editing.";
    case "video":
      return "Exported from [which recorder or phone] on [date] using [which menu or app], in its original format, then [how it was copied], without editing.";
    default:
      return null;
  }
}

export interface RecordItemProps {
  readonly record: EvidenceRecord;
  readonly caseFile: CaseFile;
  readonly fresh: boolean;
  readonly child?: boolean;
  readonly onChange: (patch: Partial<EvidenceRecord>) => void;
  readonly onRemove?: () => void;
}

export function RecordItem({ record: r, caseFile: c, fresh, child = false, onChange, onRemove }: RecordItemProps) {
  const [open, setOpen] = useState(false);
  const template = mannerTemplate(r.kind);
  const hasBlanks = /\[[^\]]+\]/.test(r.manner);
  const device = c.devices.find((d) => d.id === r.deviceId);

  return (
    <li className={child ? "record child" : "record"}>
      <div className="record-head">
        <Stamp>{r.label}</Stamp>
        <span className="name">{r.zipPath ?? r.fileName}</span>
        <HashedStamp fresh={fresh} />
      </div>
      <div className="record-meta">
        {KIND_NAMES[r.kind]}, {shortSize(r.size)}
        {r.crcOk === false && <span className="pill warn"> zip checksum mismatch</span>}
        {!r.includeInCertificate && <span className="pill"> not on certificate</span>}
        {!r.deviceId && r.includeInCertificate && <span className="pill warn"> no device yet</span>}
        {device && <> · from {device.nickname || device.makeModel}</>}
      </div>
      <div className="hash" style={{ gridTemplateColumns: "5.2rem 1fr auto" }}>
        <span className="alg">SHA-256</span>
        <span className="value">{r.hashes.sha256}</span>
        <button type="button" className="btn link" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? "Close" : "Open"} details of ${r.label}`}>
          {open ? "Close" : "Details"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: "0.6rem" }}>
          <HashLines hashes={r.hashes} of={r.label} />
          <p className="small">
            {formatBytes(r.size)}. Hashed {istStamp(new Date(r.hashedAt))}.
            {r.zipModified && ` Time stored in the zip: ${r.zipModified.replace("T", " ")} (device local time).`}
            {!r.zipModified && r.lastModified && ` File modified time reported by this device: ${istStamp(new Date(r.lastModified))}.`}
          </p>
          <div className="row">
            <div className="field">
              <label htmlFor={`dev-${r.id}`}>Device it came from</label>
              <select id={`dev-${r.id}`} value={r.deviceId ?? ""} onChange={(e) => onChange({ deviceId: e.target.value || null })}>
                <option value="">Not set</option>
                {c.devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nickname || d.makeModel || "Unnamed device"}
                  </option>
                ))}
              </select>
              <span className="hint">
                Missing? Add it under <a href={`#/case/${encodeURIComponent(c.id)}/devices`}>Devices</a>.
              </span>
            </div>
          </div>
          <TextField
            label="What this record shows"
            value={r.description}
            onChange={(v) => onChange({ description: v })}
            placeholder="e.g. Landlord refusing to return the deposit, 15/10/2026"
            multiline
          />
          <TextField
            label="How it was produced (section 63(4)(a))"
            value={r.manner}
            onChange={(v) => onChange({ manner: v })}
            hint="Say how the file was created and copied, in your own words. This goes into the certificate you sign, so write only what is true."
            message={hasBlanks ? { severity: "warning", text: "Replace every part in [brackets] with what actually happened." } : null}
            multiline
          />
          {template && !r.manner && (
            <button type="button" className="btn link" onClick={() => onChange({ manner: template })}>
              Start from a template with blanks to fill
            </button>
          )}
          <Check
            label="List this record on the certificate and hash report"
            checked={r.includeInCertificate}
            onChange={(v) => onChange({ includeInCertificate: v })}
          />
          {onRemove && (
            <div className="actions">
              <button type="button" className="btn danger" onClick={onRemove} aria-label={`Remove ${r.label} from this case`}>
                Remove {r.label} from this case
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
