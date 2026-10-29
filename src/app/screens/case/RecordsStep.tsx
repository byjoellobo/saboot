import { useState } from "react";
import { shortSize } from "../../../engine/util/format";
import type { EvidenceRecord } from "../../../sakshya/model";
import { DropZone, Notice, Progress } from "../../components/ui";
import { href } from "../../router";
import { removeRecord, updateRecord, withEvent } from "../../state/case-ops";
import { deleteChatBytes } from "../../state/db";
import type { IngestState } from "../../state/use-ingest";
import type { StepProps } from "./DetailsStep";
import { RecordItem } from "./RecordItem";

const CHILD_PREVIEW = 6;

export function RecordsStep({ handle, caseFile: c, ingest }: StepProps & { ingest: IngestState }) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const { jobs, warnings, errors, fresh } = ingest;

  const change = (id: string, patch: Partial<EvidenceRecord>) => {
    const record = c.records.find((r) => r.id === id);
    // Device links and inclusion decide what the certificate says, so they are logged.
    if (record && ("deviceId" in patch || "includeInCertificate" in patch)) {
      const device = c.devices.find((d) => d.id === patch.deviceId);
      const summary =
        "deviceId" in patch
          ? `${record.label} linked to device: ${device ? device.nickname || device.makeModel : "none"}`
          : `${record.label} ${patch.includeInCertificate ? "included in" : "left out of"} the certificate`;
      void handle.update(async (cur) =>
        withEvent(updateRecord(cur, id, patch), { action: "note", actor: cur.party.name.trim() || "Case owner", summary }),
      );
      return;
    }
    handle.set((cur) => updateRecord(cur, id, patch));
  };

  const remove = async (record: EvidenceRecord) => {
    const children = c.records.filter((r) => r.parentId === record.id).length;
    const note = children ? ` and the ${children} files listed inside it` : "";
    if (!window.confirm(`Remove ${record.label} (${record.fileName})${note} from this case? Your original file is not touched.`)) return;
    let removed: EvidenceRecord[] = [];
    const saved = await handle.update(async (cur) => {
      const out = removeRecord(cur, record.id);
      removed = out.removed;
      return withEvent(out.next, {
        action: "record-removed",
        actor: cur.party.name.trim() || "Case owner",
        summary: `Removed ${record.label} ${record.fileName}${note}`,
        details: { sha256: record.hashes.sha256 },
      });
    });
    // Only drop stored chat text once the case without the record is saved.
    if (saved) for (const r of removed) await deleteChatBytes(r.id);
  };

  const topLevel = c.records.filter((r) => !r.parentId);

  return (
    <>
      <h1 id="step-title" tabIndex={-1}>
        Records
      </h1>
      <p>
        Add the exact files you will file in court. Each one is read on this device and hashed: a hash is a short code worked out from every
        bit of the file, so any change to the file changes it. Large CCTV files can take a few minutes; you can move to other steps while they
        hash.
      </p>
      <Notice title="Hash the copy you will file" level={2}>
        <p>
          Re-exporting a chat, forwarding a photo on WhatsApp, or editing or compressing a file changes its hash. Add the copies you will
          actually give to the court (for example, files copied off the phone by cable, or the export saved on this phone), and file exactly
          those copies.
        </p>
      </Notice>

      <DropZone
        onFiles={ingest.addFiles}
        title="Add files"
        detail="WhatsApp export (.zip or .txt), screenshots, recordings, CCTV exports. Drop them here or tap to choose."
      />

      {jobs.map((j) => (
        <div key={j.key}>
          <span className="small">
            Hashing {j.name} ({shortSize(j.size)})
            {j.progress?.phase === "entries" ? ", now the files inside the zip" : ""}
          </span>
          <Progress done={j.progress?.done ?? 0} total={j.progress?.total ?? j.size} label={`Hashing ${j.name}`} />
        </div>
      ))}

      {errors.length > 0 && (
        <Notice tone="warn" title="Some files could not be added" level={2}>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button type="button" className="btn link" onClick={ingest.clearErrors}>
            Dismiss
          </button>
        </Notice>
      )}
      {warnings.length > 0 && (
        <Notice tone="warn" title="Please check" level={2}>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <button type="button" className="btn link" onClick={ingest.clearWarnings}>
            Dismiss
          </button>
        </Notice>
      )}

      {topLevel.length === 0 && jobs.length === 0 && <p className="small">No records yet. Add the first file above.</p>}

      <ul className="record-list">
        {topLevel.map((r) => {
          const children = c.records.filter((x) => x.parentId === r.id);
          const showAll = expanded.has(r.id) || children.length <= CHILD_PREVIEW;
          const visible = showAll
            ? children
            : children.filter((x) => x.kind === "chat-text").concat(children.filter((x) => x.kind !== "chat-text").slice(0, 3));
          return (
            <li key={r.id} style={{ listStyle: "none" }}>
              <ul className="record-list">
                <RecordItem record={r} caseFile={c} fresh={fresh.has(r.id)} onChange={(p) => change(r.id, p)} onRemove={() => void remove(r)} />
                {visible.map((x) => (
                  <RecordItem key={x.id} record={x} caseFile={c} fresh={fresh.has(x.id)} child onChange={(p) => change(x.id, p)} />
                ))}
              </ul>
              {!showAll && (
                <button type="button" className="btn link" style={{ marginLeft: "2.5rem" }} onClick={() => setExpanded((s) => new Set([...s, r.id]))}>
                  Show all {children.length} files inside {r.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {topLevel.length > 0 && (
        <div className="actions">
          <a className="btn" href={href({ name: "case", id: c.id, step: "devices" })}>
            Next: record the devices
          </a>
        </div>
      )}
    </>
  );
}
