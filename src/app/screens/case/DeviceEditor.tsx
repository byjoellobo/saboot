import { useEffect, useState } from "react";
import { istStamp } from "../../../engine/util/format";
import { newId } from "../../../engine/util/crypto";
import { RELATION_BOXES, SOURCE_BOXES, type SourceKind } from "../../../sakshya/certificate/schedule";
import { clockOffsetSeconds, describeClock } from "../../../sakshya/devices/describe";
import { GUIDE_ORDER, GUIDES } from "../../../sakshya/devices/guides";
import { checkEid, checkImei, checkMac, checkSerial, type IdCheck } from "../../../sakshya/devices/validate";
import { emptyRelation, type Device, type DeviceIdentifier, type DeviceProfile, type IdentifierType } from "../../../sakshya/model";
import { Check, Notice, SelectField, TextField } from "../../components/ui";
import { DeviceGuidePanel } from "./DeviceGuidePanel";

const ID_TYPES: readonly { value: IdentifierType; label: string }[] = [
  { value: "IMEI", label: "IMEI" },
  { value: "EID", label: "EID (eSIM)" },
  { value: "MAC", label: "MAC address" },
  { value: "Cloud ID", label: "Cloud ID" },
  { value: "UIN", label: "UIN" },
  { value: "UID", label: "UID" },
  { value: "Other", label: "Other" },
];

function idCheck(id: DeviceIdentifier): IdCheck | null {
  if (!id.value.trim()) return null;
  if (id.type === "IMEI") return checkImei(id.value);
  if (id.type === "MAC") return checkMac(id.value);
  if (id.type === "EID") return checkEid(id.value);
  return null;
}

function asMessage(check: IdCheck | null) {
  return check && check.message ? { severity: check.severity, text: check.message } : null;
}

export function blankDevice(profile: DeviceProfile): Device {
  const guide = GUIDES[profile];
  return {
    id: newId("dev-"),
    profile,
    sourceKind: guide.sourceKind,
    otherKindText: "",
    nickname: "",
    makeModel: "",
    color: "",
    serial: "",
    identifiers: guide.identifierSlots.map((s) => ({ type: s.type, value: "", note: s.note })),
    otherInfo: "",
    relation: emptyRelation(),
    clock: null,
  };
}

export interface DeviceEditorProps {
  readonly initial: Device | null;
  readonly onSave: (d: Device) => void;
  readonly onCancel: () => void;
}

export function DeviceEditor({ initial, onSave, onCancel }: DeviceEditorProps) {
  const [device, setDevice] = useState<Device | null>(initial);
  const [dirty, setDirty] = useState(false);

  // Warn before closing the tab with unsaved device details.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const cancel = () => {
    if (dirty && !window.confirm("Discard the device details you entered?")) return;
    onCancel();
  };
  const [markedAt, setMarkedAt] = useState<Date | null>(null);
  const [shown, setShown] = useState("");
  const [clockError, setClockError] = useState<string | null>(null);

  if (!device) {
    return (
      <>
        <h2>What kind of device did the records come from?</h2>
        <div className="profiles">
          {GUIDE_ORDER.map((p) => (
            <button key={p} type="button" className="profile" aria-pressed={false} onClick={() => setDevice(blankDevice(p))}>
              {GUIDES[p].title}
            </button>
          ))}
        </div>
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
      </>
    );
  }

  const set = (patch: Partial<Device>) => {
    setDevice({ ...device, ...patch });
    setDirty(true);
  };
  const setId = (i: number, patch: Partial<DeviceIdentifier>) =>
    set({ identifiers: device.identifiers.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const serial = checkSerial(device.serial);
  const guide = GUIDES[device.profile];

  const recordClock = () => {
    if (!markedAt) return;
    try {
      const offset = clockOffsetSeconds(shown, markedAt);
      set({ clock: { deviceShows: shown.length === 16 ? `${shown}:00` : shown, actualAt: markedAt.toISOString(), offsetSeconds: offset } });
      setClockError(null);
    } catch (e) {
      setClockError(e instanceof Error ? e.message : "Enter the date and time the device showed.");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDirty(false);
        onSave({
          ...device,
          serial: device.serial.trim(),
          identifiers: device.identifiers.map((x) => {
            const check = idCheck(x);
            return { ...x, value: check && check.severity !== "error" ? check.normalized : x.value.trim() };
          }),
        });
      }}
    >
      <h2>{initial ? "Edit device" : `New device: ${guide.title}`}</h2>
      <DeviceGuidePanel guide={guide} />

      <TextField label="A name you will recognise" value={device.nickname} onChange={(v) => set({ nickname: v })} placeholder="e.g. My phone, Shop CCTV recorder" />

      <SelectField<SourceKind>
        label="Tick box on the certificate"
        value={device.sourceKind}
        onChange={(v) => set({ sourceKind: v })}
        options={SOURCE_BOXES.map((b) => ({ value: b.key, label: b.label }))}
        hint="The certificate offers these boxes: Computer / Storage Media, DVR, Mobile, Flash Drive, CD/DVD, Server, Cloud, Other."
      />
      {device.sourceKind === "other" && (
        <TextField label="Other: what is it?" value={device.otherKindText} onChange={(v) => set({ otherKindText: v })} />
      )}

      <div className="row">
        <TextField label="Make & Model" value={device.makeModel} onChange={(v) => set({ makeModel: v })} placeholder="e.g. Samsung Galaxy A54 5G (SM-A546E)" />
        <TextField label="Colour" value={device.color} onChange={(v) => set({ color: v })} hint="Write what you see; no screen shows it." />
      </div>
      <TextField
        label="Serial number"
        value={device.serial}
        onChange={(v) => set({ serial: v })}
        mono
        message={device.serial ? asMessage(serial) : null}
        hint="If the label and the screen differ, write both and say where each came from."
      />

      <fieldset>
        <legend>IMEI / UIN / UID / MAC / Cloud ID (as applicable)</legend>
        {device.identifiers.map((x, i) => {
          const check = idCheck(x);
          return (
            <div key={i}>
              <div className="id-row">
                <SelectField<IdentifierType> label="Type" value={x.type} onChange={(v) => setId(i, { type: v })} options={ID_TYPES} />
                <TextField
                  label="Value"
                  value={x.value}
                  onChange={(v) => setId(i, { value: v })}
                  mono
                  inputMode={x.type === "IMEI" || x.type === "EID" ? "numeric" : "text"}
                />
                <TextField label="Note" value={x.note} onChange={(v) => setId(i, { note: v })} placeholder="e.g. SIM 1, Wi-Fi" />
                <button
                  type="button"
                  className="btn link"
                  aria-label={`Remove identifier ${i + 1}`}
                  onClick={() => set({ identifiers: device.identifiers.filter((_, j) => j !== i) })}
                >
                  Remove
                </button>
              </div>
              {check && check.message && (
                <p className={`small`} style={{ color: check.severity === "ok" ? "var(--ok)" : check.severity === "error" ? "var(--tape)" : "#8a4b00", marginTop: "-0.4rem" }}>
                  {check.message}
                </p>
              )}
            </div>
          );
        })}
        <button type="button" className="btn secondary" onClick={() => set({ identifiers: [...device.identifiers, { type: "Other", value: "", note: "" }] })}>
          Add another identifier
        </button>
        <p className="small">Leave empty rows blank; they are not printed. Never enter passwords, PINs or Aadhaar numbers here.</p>
      </fieldset>

      <fieldset>
        <legend>The device or record source is (Part A). Tick only what is true: you sign this.</legend>
        <div className="checks">
          {RELATION_BOXES.map((b) => (
            <Check key={b.key} label={`${b.label} by me`} checked={device.relation[b.key]} onChange={(v) => set({ relation: { ...device.relation, [b.key]: v } })} />
          ))}
        </div>
      </fieldset>

      <TextField
        label="Any other relevant information about the device"
        value={device.otherInfo}
        onChange={(v) => set({ otherInfo: v })}
        multiline
        hint="e.g. operating system version, who uses it, whether it was repaired or reset, where it is kept."
      />

      <fieldset>
        <legend>Clock check {device.sourceKind === "dvr" ? "(important for CCTV)" : "(optional)"}</legend>
        <p className="small">
          Device clocks drift. Look at the clock on the device's screen and press the button at the moment you read it. Then type exactly
          what it showed. Do not change the device's clock. Taking a photo of the device screen next to an accurate clock also helps.
        </p>
        <div className="actions">
          <button type="button" className="btn secondary" onClick={() => setMarkedAt(new Date())}>
            I am reading the device clock now
          </button>
        </div>
        {markedAt && (
          <div className="row">
            <div className="field">
              <label htmlFor="clock-shown">What the device showed at {istStamp(markedAt)}</label>
              <input id="clock-shown" type="datetime-local" step={1} value={shown} onChange={(e) => setShown(e.target.value)} />
            </div>
            <button type="button" className="btn" onClick={recordClock} disabled={!shown}>
              Save clock check
            </button>
          </div>
        )}
        {clockError && <p className="small" style={{ color: "var(--tape)" }}>{clockError}</p>}
        {device.clock && <Notice tone="ok">{describeClock(device.clock, istStamp)}</Notice>}
      </fieldset>

      <div className="actions">
        <button type="submit" className="btn">
          Save device
        </button>
        <button type="button" className="btn secondary" onClick={cancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
