import { useEffect, useRef, useState } from "react";
import type { CaseFile } from "../../sakshya/model";
import { caseDisplayName, newCase, withEvent } from "../state/case-ops";
import { deleteCase, listCases, saveCase } from "../state/db";
import { navigate } from "../router";
import { Notice, Stamp } from "../components/ui";
import { importBackup } from "../services/backup";
import { createDemoCase, demoFiles } from "../services/demo";
import { queueFilesForCase } from "../state/use-ingest";

export function HomeScreen() {
  const [cases, setCases] = useState<CaseFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);

  const refresh = () =>
    listCases().then(setCases, (e: unknown) => setError(e instanceof Error ? e.message : "Could not read saved cases."));

  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    const c = await withEvent(newCase(), { action: "case-created", actor: "Case owner", summary: "Case file created in Sakshya Kit" });
    await saveCase(c);
    navigate({ name: "case", id: c.id, step: "details" });
  };

  const tryDemo = async () => {
    try {
      const c = await createDemoCase();
      queueFilesForCase(c.id, demoFiles());
      navigate({ name: "case", id: c.id, step: "records" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the demo case.");
    }
  };

  const restore = async (file: File) => {
    try {
      const c = await importBackup(file);
      await refresh();
      navigate({ name: "case", id: c.id, step: "records" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import that backup.");
    }
  };

  return (
    <>
      <section className="sheet">
        <h1>Prepare electronic evidence for court</h1>
        <p className="lede">
          Add a WhatsApp chat export, screenshots, call recordings or CCTV footage. Sakshya Kit hashes every file on this device, helps you
          find the device's IMEI, serial or MAC address, and drafts the section 63(4) certificate with a hash report and a QR code anyone
          can use to check the files.
        </p>
        <div className="actions">
          <button type="button" className="btn" onClick={create}>
            Start a new case
          </button>
          <button type="button" className="btn secondary" onClick={() => void tryDemo()}>
            Try a demo case
          </button>
          <button type="button" className="btn secondary" onClick={() => restoreInput.current?.click()}>
            Restore a backup
          </button>
          <input
            ref={restoreInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void restore(f);
              e.target.value = "";
            }}
          />
        </div>
        {error && <Notice tone="warn">{error}</Notice>}
      </section>

      <section className="sheet">
        <h2>Your cases on this device</h2>
        {cases === null && <p className="small">Loading…</p>}
        {cases?.length === 0 && <p>No cases yet. Start one above; it is saved only in this browser on this device.</p>}
        {cases && cases.length > 0 && (
          <ul className="case-list">
            {cases.map((c) => (
              <li key={c.id}>
                <span>
                  <a href={`#/case/${encodeURIComponent(c.id)}/records`}>{caseDisplayName(c)}</a>
                  <br />
                  <span className="small">
                    {c.records.length} record{c.records.length === 1 ? "" : "s"}, {c.devices.length} device
                    {c.devices.length === 1 ? "" : "s"}. Last changed {new Date(c.updatedAt).toLocaleString("en-IN")}
                  </span>
                </span>
                <span>
                  {c.records.slice(0, 4).map((r) => (
                    <span key={r.id} style={{ marginRight: "0.4rem" }}>
                      <Stamp>{r.label}</Stamp>
                    </span>
                  ))}
                  <button
                    type="button"
                    className="btn link"
                    aria-label={`Delete ${caseDisplayName(c)}`}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete "${caseDisplayName(c)}" from this device? This cannot be undone. Download a backup first if you may need it. Your original files are not affected.`,
                        )
                      )
                        return;
                      await deleteCase(c.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
