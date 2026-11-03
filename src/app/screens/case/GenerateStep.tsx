import { useEffect, useMemo, useState } from "react";
import { buildVerifyUrl, chunkForQr } from "../../../engine/verify/verify-link";
import { checkCase, hasBlockingIssues } from "../../../sakshya/certificate/checks";
import { verifyItems } from "../../../sakshya/certificate/verify-items";
import { hashCsv, sha256sums } from "../../../sakshya/certificate/hash-list";
import type { ExpertDraft } from "../../../sakshya/model";
import { announce } from "../../components/Announcer";
import { Icon } from "../../components/icons";
import { Check, Notice, Progress, SelectField, Stamp, TextField } from "../../components/ui";
import { QrSvg } from "../../components/QrSvg";
import { touch, withEvent } from "../../state/case-ops";
import { usePersisted } from "../../state/persistence";
import { getSetting, setSetting } from "../../state/db";
import { exportBackup } from "../../services/backup";
import { downloadBytes } from "../../services/download";
import type { GeneratedPdf } from "../../services/generate";

// PDF building (pdf-lib, fonts) loads only when the user generates something.
const pdfServices = () => import("../../services/generate");
import { DEFAULT_TSA_URL, timestampPdf } from "../../services/timestamp";
import type { StepProps } from "./DetailsStep";

function defaultVerifyUrl(): string {
  return new URL("verify.html", window.location.href.split("#")[0]).toString();
}

function parseHttpUrl(url: string): URL | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

function isPublicUrl(url: string): boolean {
  const u = parseHttpUrl(url);
  if (!u || u.protocol !== "https:") return false;
  return !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[::1\]|.*\.local$)/.test(u.hostname);
}

type DateOrderChoice = "" | "DMY" | "MDY" | "YMD";
const DATE_ORDERS: readonly { value: DateOrderChoice; label: string }[] = [
  { value: "", label: "Detect automatically" },
  { value: "DMY", label: "Day/month/year" },
  { value: "MDY", label: "Month/day/year" },
  { value: "YMD", label: "Year/month/day" },
];

const RELATIONS = [
  { value: "", label: "Choose" },
  { value: "son", label: "Son of" },
  { value: "daughter", label: "Daughter of" },
  { value: "spouse", label: "Spouse of" },
] as const;

export function GenerateStep({ handle, caseFile: c }: StepProps) {
  const issues = useMemo(() => checkCase(c), [c]);
  const blocked = hasBlockingIssues(issues);
  const [verifyUrl, setVerifyUrl] = useState(defaultVerifyUrl());
  const [blankPartB, setBlankPartB] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastPdf, setLastPdf] = useState<GeneratedPdf | null>(null);
  const [transcriptProgress, setTranscriptProgress] = useState<{ done: number; total: number } | null>(null);
  const [ranges, setRanges] = useState<Record<string, { from: string; to: string; order: DateOrderChoice }>>({});
  const [result, setResult] = useState<{ action: string; tone: "ok" | "warn"; text: string } | null>(null);
  const persisted = usePersisted();
  const urlOk = parseHttpUrl(verifyUrl) !== null;
  const actor = c.party.name.trim() || "Case owner";

  useEffect(() => {
    let typed = false;
    const input = document.getElementById("verify-url-field");
    const mark = () => {
      typed = true;
    };
    input?.addEventListener("input", mark);
    void getSetting("verifyBaseUrl", defaultVerifyUrl()).then((saved) => {
      if (!typed) setVerifyUrl(saved);
    });
    return () => input?.removeEventListener("input", mark);
  }, []);

  const setExpert = (patch: Partial<ExpertDraft>) => handle.set((cur) => touch(cur, { expert: { ...cur.expert, ...patch } }));
  const setAlg = (key: "sha256" | "sha1" | "md5", v: boolean) =>
    handle.set((cur) => touch(cur, { algorithms: { ...cur.algorithms, [key]: v } }));

  const run = async (label: string, task: () => Promise<string>) => {
    setBusy(label);
    setResult(null);
    try {
      const message = await task();
      setResult({ action: label, tone: "ok", text: message });
      announce(message);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong while generating.";
      setResult({ action: label, tone: "warn", text: message });
      announce(message);
    } finally {
      setBusy(null);
      setTranscriptProgress(null);
    }
  };

  const makeCertificate = () =>
    run("certificate", async () => {
      await setSetting("verifyBaseUrl", verifyUrl);
      const pdf = await (await pdfServices()).generateCertificate(c, verifyUrl, blankPartB);
      downloadBytes(pdf.bytes, pdf.fileName);
      setLastPdf(pdf);
      await handle.update((cur) =>
        withEvent(cur, {
          action: "certificate-generated",
          actor,
          summary: `Generated certificate bundle ${pdf.fileName}`,
          details: { sha256: pdf.sha256, bytes: pdf.bytes.length, records: cur.records.filter((r) => r.includeInCertificate).length },
        }),
      );
      return `Downloaded ${pdf.fileName}. Check your Downloads folder.`;
    });

  const addTimestamp = () =>
    run("timestamp", async () => {
      if (!lastPdf) throw new Error("Generate the certificate bundle first.");
      const out = await timestampPdf(lastPdf.bytes);
      const fileName = lastPdf.fileName.replace(/\.pdf$/i, " (timestamped).pdf");
      downloadBytes(out.bytes, fileName);
      await handle.update((cur) =>
        withEvent(cur, {
          action: "timestamp-obtained",
          actor,
          summary: `Trusted timestamp added to ${lastPdf.fileName}`,
          details: { tsa: out.tsaUrl, tsaTimeUtc: out.tsaTime.toISOString(), sha256: out.sha256, originalSha256: lastPdf.sha256 },
        }),
      );
      return `Downloaded ${fileName} with an RFC 3161 timestamp from ${new URL(out.tsaUrl).host}.`;
    });

  const makeTranscript = (recordId: string) =>
    run(`transcript-${recordId}`, async () => {
      const range = ranges[recordId] ?? { from: "", to: "", order: "" };
      const pdf = await (
        await pdfServices()
      ).generateTranscript(c, recordId, { from: range.from, to: range.to, dateOrder: range.order || undefined }, (doneCount, total) =>
        setTranscriptProgress({ done: doneCount, total }),
      );
      downloadBytes(pdf.bytes, pdf.fileName);
      const rec = c.records.find((r) => r.id === recordId);
      await handle.update((cur) =>
        withEvent(cur, {
          action: "transcript-generated",
          actor,
          summary:
            `Generated WhatsApp transcript of ${rec?.label ?? ""} ${range.from || range.to ? `(${range.from || "start"} to ${range.to || "end"})` : ""}`.trim(),
          details: { sha256: pdf.sha256, bytes: pdf.bytes.length },
        }),
      );
      return `Downloaded ${pdf.fileName}.`;
    });

  const makeBackup = () =>
    run("backup", async () => {
      const bytes = await exportBackup(c);
      downloadBytes(bytes, `${(c.caseNumber || c.title || "case").replace(/[^\w.-]+/g, "_")}.sakshya-backup.json`, "application/json");
      await handle.update((cur) =>
        withEvent(cur, { action: "bundle-exported", actor, summary: "Downloaded a case backup (JSON)", details: { bytes: bytes.length } }),
      );
      return "Downloaded the case backup.";
    });

  const fileStem = (c.caseNumber || c.title || "case").replace(/[^\w.-]+/g, "_");
  const makeHashLists = () =>
    run("hash-lists", async () => {
      downloadBytes(new TextEncoder().encode(sha256sums(c)), `${fileStem}.SHA256SUMS`, "text/plain");
      downloadBytes(new TextEncoder().encode(hashCsv(c)), `${fileStem} hash report.csv`, "text/csv");
      await handle.update((cur) =>
        withEvent(cur, {
          action: "bundle-exported",
          actor,
          summary: "Downloaded hash lists (SHA256SUMS and CSV)",
          details: { records: cur.records.filter((r) => r.includeInCertificate).length },
        }),
      );
      return "Downloaded the SHA256SUMS file and the CSV hash report.";
    });

  const chats = c.records.filter((r) => r.kind === "chat-text");
  const qrGroups = useMemo(
    () =>
      chunkForQr(verifyUrl, c.caseNumber || c.title || "Case", verifyItems(c.records.filter((r) => r.includeInCertificate && r.deviceId))),
    [verifyUrl, c],
  );
  const firstQr = qrGroups[0] ? buildVerifyUrl(verifyUrl, { caseRef: c.caseNumber || c.title || "Case", items: qrGroups[0] }) : null;

  const outcome = (action: string) =>
    result && result.action === action ? (
      <Notice tone={result.tone} level={2}>
        {result.text}
      </Notice>
    ) : null;

  return (
    <>
      <h1 id="step-title" tabIndex={-1}>
        Check and generate
      </h1>
      <p>
        Every document is made here, on this device, from the records and devices in this case. Generate again whenever something changes.
      </p>

      <section className="panel" aria-labelledby="checks-title">
        <h2 id="checks-title" style={{ marginTop: 0 }}>
          Before you generate
        </h2>
        {issues.length === 0 ? (
          <Notice tone="ok">
            This checker found nothing missing. That does not mean the certificate is correct: have your advocate review it.
          </Notice>
        ) : (
          <ul className="issues">
            {issues.map((i, n) => (
              <li key={n} className={i.severity}>
                <Icon name={i.severity === "error" ? "cross" : "alert"} size={18} />
                <span>
                  <strong>{i.severity === "error" ? "Needed: " : "Check: "}</strong>
                  {i.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="output" aria-labelledby="bundle-title">
        <h2 id="bundle-title">Certificate bundle</h2>
        <p>
          One PDF with a guidance page, Part A filled in for each device, a watermarked Part B draft for the expert, a blank Part B, the
          hash report (Annexure H) with QR codes, an expert's worksheet and the custody log.
        </p>

        <fieldset>
          <legend>Hash values to declare on the certificate</legend>
          <div className="checks">
            <Check label="SHA256 (recommended)" checked={c.algorithms.sha256} onChange={(v) => setAlg("sha256", v)} />
            <Check label="SHA1" checked={c.algorithms.sha1} onChange={(v) => setAlg("sha1", v)} />
            <Check label="MD5" checked={c.algorithms.md5} onChange={(v) => setAlg("md5", v)} />
          </div>
          <p className="small">SHA-256 is the strongest of the three. All three are always printed in the hash report.</p>
        </fieldset>

        <details>
          <summary>
            <strong>Expert's details for the Part B draft (optional)</strong>
          </summary>
          <p className="small">
            Fill this only if you already know who will examine the records. Otherwise the draft leaves blanks for the expert. Who may sign
            Part B is still an open question of law; ask your advocate.
          </p>
          <TextField label="Expert's name" value={c.expert.name} onChange={(v) => setExpert({ name: v })} />
          <div className="row">
            <SelectField label="Relation" value={c.expert.relationOf} onChange={(v) => setExpert({ relationOf: v })} options={RELATIONS} />
            <TextField label="Name of parent or spouse" value={c.expert.relativeName} onChange={(v) => setExpert({ relativeName: v })} />
          </div>
          <TextField label="Designation" value={c.expert.designation} onChange={(v) => setExpert({ designation: v })} />
          <TextField label="Residing or employed at" value={c.expert.address} onChange={(v) => setExpert({ address: v })} multiline />
          <TextField label="Place" value={c.expert.place} onChange={(v) => setExpert({ place: v })} />
        </details>

        <TextField
          id="verify-url-field"
          label="Address of the file-check page (used in the QR codes)"
          value={verifyUrl}
          onChange={setVerifyUrl}
          mono
          type="url"
          message={
            !urlOk
              ? { severity: "error", text: "Enter a web address starting with https://" }
              : isPublicUrl(verifyUrl)
                ? null
                : {
                    severity: "warning",
                    text: "Other people's phones can only open this if it is a public https:// address where Saboot is hosted.",
                  }
          }
        />
        <Check label="Include a blank Part B for the expert to fill by hand" checked={blankPartB} onChange={setBlankPartB} />
        <div className="actions">
          <button type="button" className="btn" disabled={blocked || !urlOk || busy !== null} onClick={() => void makeCertificate()}>
            <Icon name="download" size={18} />
            {busy === "certificate" ? "Generating…" : "Generate certificate bundle (PDF)"}
          </button>
          {blocked && <span className="small">Fix the items marked "Needed" above first.</span>}
        </div>
        {outcome("certificate")}

        {firstQr && urlOk && (
          <div className="qr-row">
            <QrSvg text={firstQr} size={128} title="QR code to check the files" />
            <p className="small" style={{ maxWidth: "42ch", margin: 0 }}>
              This QR code is printed on the certificate. Scanning it opens a page that checks a file against the hash values on the
              scanning device, without uploading it. <a href={firstQr}>Try it</a>.
              {qrGroups.length > 1 && ` The hash report has ${qrGroups.length} QR codes, one for each group of records.`}
            </p>
          </div>
        )}

        {lastPdf && (
          <Notice title="Optional: add an RFC 3161 timestamp">
            <p>
              A Time Stamping Authority (TSA) can sign the PDF's hash together with the current time, as evidence that this exact document
              existed by then. This uses the internet for a moment: only the PDF's hash is sent, never the PDF, but the service will see
              your IP address and the time. It is a free third-party service ({new URL(DEFAULT_TSA_URL).host}), not a government or
              accredited one; ask your advocate whether a timestamp helps in your case.
            </p>
            <button type="button" className="btn secondary" disabled={busy !== null} onClick={() => void addTimestamp()}>
              {busy === "timestamp"
                ? "Contacting the timestamp service…"
                : `Send the PDF's hash to ${new URL(DEFAULT_TSA_URL).host} for a timestamp`}
            </button>
          </Notice>
        )}
        {outcome("timestamp")}
      </section>

      {chats.length > 0 && (
        <section className="output" aria-labelledby="transcripts-title">
          <h2 id="transcripts-title">WhatsApp transcripts</h2>
          <p>
            A page-numbered transcript with every message's own hash and byte position, so any single message can be checked against the
            original export. You can limit it to a period.
          </p>
          {chats.map((r) => {
            const range = ranges[r.id] ?? { from: "", to: "", order: "" as DateOrderChoice };
            const setRange = (patch: Partial<typeof range>) => setRanges({ ...ranges, [r.id]: { ...range, ...patch } });
            return (
              <div key={r.id} className="record">
                <div className="record-head">
                  <Stamp>{r.label}</Stamp>
                  <span className="name">{r.zipPath ?? r.fileName}</span>
                  <span />
                </div>
                <div className="row" style={{ marginTop: "0.6rem" }}>
                  <TextField label="From (optional)" type="date" value={range.from} onChange={(v) => setRange({ from: v })} />
                  <TextField label="To (optional)" type="date" value={range.to} onChange={(v) => setRange({ to: v })} />
                  <SelectField<DateOrderChoice>
                    label="Date order in the chat"
                    value={range.order}
                    onChange={(v) => setRange({ order: v })}
                    options={DATE_ORDERS}
                    hint="Change only if the transcript shows dates the wrong way round."
                  />
                </div>
                <div className="actions" style={{ marginTop: 0 }}>
                  <button type="button" className="btn" disabled={busy !== null} onClick={() => void makeTranscript(r.id)}>
                    <Icon name="download" size={18} />
                    {busy === `transcript-${r.id}` ? "Building…" : "Generate transcript (PDF)"}
                  </button>
                </div>
                {busy === `transcript-${r.id}` && transcriptProgress && (
                  <Progress done={transcriptProgress.done} total={transcriptProgress.total} label="Building transcript" />
                )}
                {outcome(`transcript-${r.id}`)}
              </div>
            );
          })}
        </section>
      )}

      <section className="output" aria-labelledby="lists-title">
        <h2 id="lists-title">Hash lists for experts</h2>
        <p>
          A <code>SHA256SUMS</code> file lets an expert check every file in one command (<code>sha256sum -c</code>), and a CSV opens in any
          spreadsheet. Both list the records included on the certificate.
        </p>
        <div className="actions">
          <button type="button" className="btn secondary" disabled={busy !== null} onClick={() => void makeHashLists()}>
            <Icon name="download" size={18} />
            Download hash lists
          </button>
        </div>
        {outcome("hash-lists")}
      </section>

      <section className="output" aria-labelledby="backup-title">
        <h2 id="backup-title">Backup</h2>
        <p>
          Cases live only in this browser. Download a backup to keep the case details, hashes, custody log and chat text safe, or to move
          them to another device. Your media files are not inside the backup; keep the originals.
        </p>
        {persisted === false && (
          <Notice tone="quiet">This browser may clear saved cases when the device is low on space, so keep a backup of this case.</Notice>
        )}
        <div className="actions">
          <button type="button" className="btn secondary" disabled={busy !== null} onClick={() => void makeBackup()}>
            <Icon name="download" size={18} />
            Download case backup
          </button>
        </div>
        {outcome("backup")}
      </section>
    </>
  );
}
