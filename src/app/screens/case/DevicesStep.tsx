import { useState } from "react";
import { deviceTitle, describeIdentifiers } from "../../../sakshya/devices/describe";
import type { Device } from "../../../sakshya/model";
import { Stamp } from "../../components/ui";
import { href } from "../../router";
import { removeDevice, updateRecord, upsertDevice, withEvent } from "../../state/case-ops";
import type { StepProps } from "./DetailsStep";
import { DeviceEditor } from "./DeviceEditor";

export function DevicesStep({ handle, caseFile: c }: StepProps) {
  const [editing, setEditing] = useState<Device | "new" | null>(c.devices.length === 0 ? "new" : null);
  const unassigned = c.records.filter((r) => r.includeInCertificate && !r.deviceId);

  const save = async (d: Device) => {
    const isNew = !c.devices.some((x) => x.id === d.id);
    await handle.update(async (cur) => {
      let next = upsertDevice(cur, d);
      // A first device collects every record that has no device yet.
      if (isNew && cur.devices.length === 0) {
        for (const r of next.records) if (!r.deviceId) next = updateRecord(next, r.id, { deviceId: d.id });
      }
      return withEvent(next, {
        action: isNew ? "device-recorded" : "device-updated",
        actor: cur.party.name.trim() || "Case owner",
        summary: `${isNew ? "Recorded" : "Updated"} device: ${deviceTitle(d)}`,
        details: { makeModel: d.makeModel, serial: d.serial, identifiers: describeIdentifiers(d) },
      });
    });
    setEditing(null);
  };

  if (editing) {
    return (
      <>
        <h1 id="step-title" tabIndex={-1}>
          Devices
        </h1>
        <DeviceEditor initial={editing === "new" ? null : editing} onSave={(d) => void save(d)} onCancel={() => setEditing(null)} />
      </>
    );
  }

  return (
    <>
      <h1 id="step-title" tabIndex={-1}>
        Devices
      </h1>
      <p>
        The certificate names the device or source each record came from: its make and model, colour, serial number and identifiers such as
        IMEI or MAC address. Records from different devices get separate certificates.
      </p>

      {c.devices.map((d) => {
        const recs = c.records.filter((r) => r.deviceId === d.id);
        return (
          <div key={d.id} className="record">
            <div className="record-head">
              <span className="name">{deviceTitle(d)}</span>
              <button type="button" className="btn link" onClick={() => setEditing(d)} aria-label={`Edit ${deviceTitle(d)}`}>
                Edit
              </button>
              <button
                type="button"
                className="btn link"
                aria-label={`Remove ${deviceTitle(d)}`}
                onClick={() => {
                  if (window.confirm(`Remove ${deviceTitle(d)}? Its records will need another device.`))
                    void handle.update((cur) => removeDevice(cur, d.id));
                }}
              >
                Remove
              </button>
            </div>
            <div className="record-meta">
              {[d.makeModel, d.serial && `Serial ${d.serial}`, describeIdentifiers(d)].filter(Boolean).join(". ") || "No details yet"}
            </div>
            <div style={{ marginTop: "0.4rem" }}>
              {recs.map((r) => (
                <span key={r.id} style={{ marginRight: "0.4rem" }}>
                  <Stamp>{r.label}</Stamp>
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {unassigned.length > 0 && c.devices.length > 0 && (
        <div className="notice warn">
          <h3>Records without a device</h3>
          {unassigned.map((r) => (
            <div key={r.id} className="row" style={{ alignItems: "center" }}>
              <span>
                <Stamp>{r.label}</Stamp> {r.zipPath ?? r.fileName}
              </span>
              <select
                aria-label={`Device for ${r.label}`}
                value=""
                onChange={(e) => e.target.value && void handle.update((cur) => updateRecord(cur, r.id, { deviceId: e.target.value }))}
              >
                <option value="">Choose a device</option>
                {c.devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {deviceTitle(d)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="actions">
        <button type="button" className="btn secondary" onClick={() => setEditing("new")}>
          Add a device
        </button>
        <a className="btn" href={href({ name: "case", id: c.id, step: "generate" })}>
          Next: check and generate
        </a>
      </div>
    </>
  );
}
