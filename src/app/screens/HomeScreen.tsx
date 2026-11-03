import { useEffect, useRef, useState } from "react";
import type { CaseFile } from "../../sakshya/model";
import { HeroArt } from "../components/HeroArt";
import { Icon } from "../components/icons";
import { Notice } from "../components/ui";
import { navigate } from "../router";
import { importBackup } from "../services/backup";
import { createDemoCase, demoFiles } from "../services/demo";
import { caseDisplayName, newCase, withEvent } from "../state/case-ops";
import { deleteCase, listCases, saveCase } from "../state/db";
import { usePersisted } from "../state/persistence";
import { queueFilesForCase } from "../state/use-ingest";

const changed = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

function caseSummary(c: CaseFile): string {
  const records = `${c.records.length} record${c.records.length === 1 ? "" : "s"}`;
  const devices = `${c.devices.length} device${c.devices.length === 1 ? "" : "s"}`;
  return `${records}, ${devices}. Changed ${changed.format(new Date(c.updatedAt))}`;
}

export function HomeScreen() {
  const [cases, setCases] = useState<CaseFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const persisted = usePersisted();

  const refresh = () =>
    listCases().then(setCases, (e: unknown) => setError(e instanceof Error ? e.message : "Could not read saved cases."));

  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    const c = await withEvent(newCase(), { action: "case-created", actor: "Case owner", summary: "Case file created in Saboot" });
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

  const remove = async (c: CaseFile) => {
    const sure = window.confirm(
      `Delete "${caseDisplayName(c)}" from this device? This cannot be undone. Download a backup first if you may need it. Your original files are not affected.`,
    );
    if (!sure) return;
    await deleteCase(c.id);
    await refresh();
  };

  return (
    <>
      <section className="sheet" aria-labelledby="home-title">
        <div className="hero">
          <div>
            <h1 id="home-title">Prepare electronic evidence for court</h1>
            <p className="lede">
              Saboot hashes your WhatsApp chats, screenshots, call recordings and CCTV footage on this device, guides you to the phone's or
              recorder's IMEI, serial number or MAC address, and drafts the certificate that section 63(4) of the Bharatiya Sakshya
              Adhiniyam asks for.
            </p>
            <div className="actions">
              <button type="button" className="btn" onClick={create}>
                Start a new case
              </button>
              <button type="button" className="btn secondary" onClick={() => void tryDemo()}>
                Try a demo case
              </button>
              <button type="button" className="btn link" onClick={() => restoreInput.current?.click()}>
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
          </div>
          <div className="hero-art">
            <HeroArt />
          </div>
        </div>

        <ol className="steps" aria-label="How it works">
          <li>
            <strong>Add your files</strong>
            <p>WhatsApp exports, screenshots, recordings and CCTV files are hashed here, on this device. Nothing is uploaded.</p>
          </li>
          <li>
            <strong>Record the device</strong>
            <p>Step-by-step guides help you find the IMEI, serial number or MAC address, and catch typing mistakes.</p>
          </li>
          <li>
            <strong>Generate the certificate</strong>
            <p>Part A filled in, a Part B draft for the expert, the hash report with QR codes, and a WhatsApp transcript.</p>
          </li>
        </ol>

        <ul className="facts">
          <li>
            <Icon name="lock" size={18} />
            Files never leave this device
          </li>
          <li>
            <Icon name="offline" size={18} />
            Works without internet once installed
          </li>
          <li>
            <Icon name="source" size={18} />
            Open source (AGPL-3.0)
          </li>
          <li>
            <Icon name="info" size={18} />
            Not legal advice; Part B is signed by an expert
          </li>
        </ul>
      </section>

      <section className="sheet" aria-labelledby="cases-title">
        <h2 id="cases-title">Your cases on this device</h2>
        {persisted === false && (
          <Notice tone="quiet">
            This browser may clear saved cases when the device is low on space. Download a backup from each case's Generate step to keep a
            copy.
          </Notice>
        )}
        {cases === null && <p className="small">Loading…</p>}
        {cases?.length === 0 && <p>No cases yet. Start one above, or try the demo case to see every document Saboot makes.</p>}
        {cases && cases.length > 0 && (
          <ul className="case-list">
            {cases.map((c) => (
              <li key={c.id} className="case-row">
                <span>
                  <a className="case-title" href={`#/case/${encodeURIComponent(c.id)}/records`}>
                    {caseDisplayName(c)}
                  </a>
                  <span className="meta">{caseSummary(c)}</span>
                </span>
                <span className="row-actions">
                  <a
                    className="btn secondary"
                    href={`#/case/${encodeURIComponent(c.id)}/records`}
                    aria-label={`Open ${caseDisplayName(c)}`}
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    className="btn link danger-link"
                    aria-label={`Delete ${caseDisplayName(c)}`}
                    onClick={() => void remove(c)}
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
