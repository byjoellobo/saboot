import { useEffect } from "react";
import type { CaseFile } from "../../sakshya/model";
import { Notice } from "../components/ui";
import { href, type Step } from "../router";
import { caseDisplayName } from "../state/case-ops";
import { useCase } from "../state/use-case";
import { useIngest } from "../state/use-ingest";
import { DetailsStep } from "./case/DetailsStep";
import { DevicesStep } from "./case/DevicesStep";
import { GenerateStep } from "./case/GenerateStep";
import { LogStep } from "./case/LogStep";
import { RecordsStep } from "./case/RecordsStep";

const TABS: readonly { step: Step; title: string; done: (c: CaseFile) => boolean }[] = [
  { step: "details", title: "Your details", done: (c) => Boolean(c.party.name.trim() && c.party.address.trim()) },
  { step: "records", title: "Records", done: (c) => c.records.length > 0 },
  { step: "devices", title: "Devices", done: (c) => c.devices.length > 0 && c.records.every((r) => !r.includeInCertificate || r.deviceId) },
  { step: "generate", title: "Generate", done: (c) => c.custody.some((e) => e.action === "certificate-generated") },
  { step: "log", title: "Custody log", done: () => false },
];

export function CaseScreen({ id, step }: { id: string; step: Step }) {
  const handle = useCase(id);
  const ingest = useIngest(id, handle);
  const { caseFile, loading, error, saveError } = handle;
  const stepTitle = TABS.find((t) => t.step === step)?.title ?? "";

  // Tell assistive technology where we are after each step change.
  useEffect(() => {
    if (!caseFile) return;
    document.title = `${stepTitle}: ${caseDisplayName(caseFile)} (Sakshya Kit)`;
    document.getElementById("step-title")?.focus({ preventScroll: true });
    document.querySelector(".index-tab[aria-current='step']")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [step, loading]);

  if (loading) {
    return (
      <section className="sheet">
        <p>Opening the case…</p>
      </section>
    );
  }
  if (error || !caseFile) {
    return (
      <section className="sheet">
        <Notice tone="warn">{error ?? "This case could not be opened."}</Notice>
        <a href="#/">Back to your cases</a>
      </section>
    );
  }

  return (
    <div className="case-file">
      <nav className="index-tabs" aria-label="Case steps">
        {TABS.map((t, i) => (
          <a key={t.step} className="index-tab" href={href({ name: "case", id, step: t.step })} aria-current={t.step === step ? "step" : undefined}>
            {t.step !== "log" && <span className="num">{i + 1}</span>}
            <span>{t.title}</span>
            {t.step === "records" && ingest.jobs.length > 0 && <span className="small">(hashing {ingest.jobs.length})</span>}
            {t.done(caseFile) && (
              <span className="tick">
                ✓<span className="visually-hidden"> done</span>
              </span>
            )}
          </a>
        ))}
      </nav>
      <section className="sheet" aria-labelledby="step-title">
        {saveError && (
          <Notice tone="warn" title="Not saved">
            {saveError}
          </Notice>
        )}
        <p className="small" style={{ marginBottom: "0.3rem" }}>
          {caseDisplayName(caseFile)}
        </p>
        {step === "details" && <DetailsStep handle={handle} caseFile={caseFile} />}
        {step === "records" && <RecordsStep handle={handle} caseFile={caseFile} ingest={ingest} />}
        {step === "devices" && <DevicesStep handle={handle} caseFile={caseFile} />}
        {step === "generate" && <GenerateStep handle={handle} caseFile={caseFile} />}
        {step === "log" && <LogStep caseFile={caseFile} />}
      </section>
    </div>
  );
}
