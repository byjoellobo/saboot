// Standalone page opened from the QR codes on a certificate. It compares
// files on the viewer's own device with the hash values in the link. The
// expected values travel in the URL fragment (#...), which browsers never
// send to a server, and files are hashed locally.
import { useMemo, useRef, useState } from "react";
import { HashCancelled, sharedPool } from "../engine/hash/hash-pool";
import type { Digests } from "../engine/hash/wasm-hasher";
import { formatBytes, groupHex, shortSize } from "../engine/util/format";
import { decodePayload } from "../engine/verify/verify-link";
import { DropZone, Notice, Progress, Stamp, TextField } from "../app/components/ui";
import { readExpectedList, UNKNOWN_SIZE, type ExpectedList } from "./expected-list";
import { MessageCheck } from "./MessageCheck";

type Outcome =
  | { readonly kind: "match"; readonly label: string; readonly name: string }
  | { readonly kind: "manual-match" }
  | { readonly kind: "same-size"; readonly label: string; readonly name: string }
  | { readonly kind: "no-match" };

interface Checked {
  readonly key: number;
  readonly name: string;
  readonly size: number;
  readonly progress: { done: number; total: number } | null;
  readonly digests: Digests | null;
  readonly outcome: Outcome | null;
  readonly error: string | null;
}

function readPayload(): { payload: ExpectedList | null; error: string | null } {
  const hash = window.location.hash;
  if (!hash || hash === "#") return { payload: null, error: null };
  try {
    const decoded = decodePayload(hash);
    return { payload: { source: "link", caseRef: decoded.caseRef, items: decoded.items }, error: null };
  } catch (e) {
    return { payload: null, error: e instanceof Error ? e.message : "The link could not be read." };
  }
}

function judge(d: Digests, payload: ExpectedList | null, manual: string): Outcome {
  const want = manual.trim().toLowerCase().replace(/\s+/g, "");
  if (want && [d.sha256, d.sha1, d.md5].includes(want)) return { kind: "manual-match" };
  const hit = payload?.items.find((i) => i.sha256 === d.sha256);
  if (hit) return { kind: "match", label: hit.label, name: hit.name };
  const sameSize = payload?.items.find((i) => i.size !== UNKNOWN_SIZE && i.size === d.size);
  if (sameSize) return { kind: "same-size", label: sameSize.label, name: sameSize.name };
  return { kind: "no-match" };
}

export function VerifyApp() {
  const fromLink = useMemo(readPayload, []);
  const [payload, setPayload] = useState<ExpectedList | null>(fromLink.payload);
  const [error, setError] = useState<string | null>(fromLink.error);
  const [manual, setManual] = useState("");
  const listInput = useRef<HTMLInputElement>(null);

  const loadList = async (file: File) => {
    try {
      setPayload(await readExpectedList(file));
      setError(null);
      setChecked([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file could not be read.");
    }
  };
  const [checked, setChecked] = useState<Checked[]>([]);
  const nextKey = useRef(1);

  const check = (files: File[]) => {
    for (const file of files) {
      const k = nextKey.current++;
      setChecked((cs) => [{ key: k, name: file.name, size: file.size, progress: null, digests: null, outcome: null, error: null }, ...cs]);
      sharedPool()
        .hashFile(file, (p) => setChecked((cs) => cs.map((c) => (c.key === k ? { ...c, progress: { done: p.done, total: p.total } } : c))))
        .promise.then((d) =>
          setChecked((cs) => cs.map((c) => (c.key === k ? { ...c, digests: d, outcome: judge(d, payload, manual) } : c))),
        )
        .catch((e: unknown) => {
          if (e instanceof HashCancelled) return;
          setChecked((cs) =>
            cs.map((c) => (c.key === k ? { ...c, error: e instanceof Error ? e.message : "Could not read the file." } : c)),
          );
        });
    }
  };

  const compareTitle = payload ? `Records listed for ${payload.caseRef}` : "What to compare against";

  return (
    <>
      <header className="topbar">
        <a className="brand" href="./">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={36} height={36} />
          <span>
            <span className="brand-name">Saboot</span>
            <span className="brand-tag">Check a file against a hash report</span>
          </span>
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="./">Open Saboot</a>
        </nav>
      </header>
      <main className="desk" id="main">
        <section className="sheet" aria-labelledby="verify-title">
          <h1 id="verify-title">Check a file against a hash report</h1>
          <p className="lede">
            Choose a file to see whether it is bit-for-bit identical to a record listed in a Saboot certificate. The file is read on this
            device only. It is never uploaded.
          </p>

          {error && (
            <Notice tone="warn" title="This could not be read">
              {error} You can still load a hash list or paste a hash value below.
            </Notice>
          )}

          <DropZone onFiles={check} title="Choose files to check" detail="Large video files can take a few minutes. Nothing is uploaded." />

          {checked.map((c) => (
            <div key={c.key} className="record">
              <div className="record-head">
                <span className="name" style={{ gridColumn: "1 / 3" }}>
                  {c.name}
                </span>
                <span className="small">{formatBytes(c.size)}</span>
              </div>
              {!c.digests && !c.error && (
                <Progress done={c.progress?.done ?? 0} total={c.progress?.total ?? c.size} label={`Hashing ${c.name}`} />
              )}
              {c.error && <Notice tone="warn">{c.error}</Notice>}
              {c.outcome?.kind === "match" && (
                <Notice tone="ok" title={`Matches ${c.outcome.label}`}>
                  This file is identical to record {c.outcome.label} ({c.outcome.name}) listed in the certificate.
                </Notice>
              )}
              {c.outcome?.kind === "manual-match" && (
                <Notice tone="ok" title="Matches the hash value you entered">
                  This file produces exactly the hash value you entered. SHA-256 matches are the strongest; MD5 and SHA-1 are older
                  algorithms.
                </Notice>
              )}
              {c.outcome?.kind === "same-size" && (
                <Notice tone="warn" title="Different file">
                  It has the same size as {c.outcome.label} ({c.outcome.name}) but a different hash, so at least one byte differs.
                </Notice>
              )}
              {c.outcome?.kind === "no-match" && (
                <Notice tone="warn" title="No match">
                  This file does not match {payload ? "any record listed below" : "the hash value entered"}.
                </Notice>
              )}
              {c.digests && (
                <div className="hash">
                  <span className="alg">SHA-256</span>
                  <span className="value">{groupHex(c.digests.sha256)}</span>
                  <span />
                  <span className="alg">SHA-1</span>
                  <span className="value">{groupHex(c.digests.sha1)}</span>
                  <span />
                  <span className="alg">MD5</span>
                  <span className="value">{groupHex(c.digests.md5)}</span>
                  <span />
                </div>
              )}
            </div>
          ))}

          <section className="output" aria-labelledby="compare-title">
            <h2 id="compare-title">{compareTitle}</h2>
            {payload ? (
              <>
                <Notice title="Where this list comes from">
                  {payload.source === "link" ? (
                    <p>
                      These records were written into the link or QR code you opened, on the page at <code>{window.location.host}</code>.
                      The link itself is not signed: compare these values with the printed hash report before relying on a match.
                    </p>
                  ) : (
                    <p>
                      These records come from the {payload.source} you chose on this device. Compare them with the printed hash report
                      before relying on a match.
                    </p>
                  )}
                </Notice>
                <ul className="record-list">
                  {payload.items.map((i) => (
                    <li key={i.label + i.sha256} className="record">
                      <div className="record-head">
                        <Stamp>{i.label}</Stamp>
                        <span className="name">{i.name}</span>
                        {i.size !== UNKNOWN_SIZE ? <span className="small">{shortSize(i.size)}</span> : <span />}
                      </div>
                      <div className="hash">
                        <span className="alg">SHA-256</span>
                        <span className="value">{groupHex(i.sha256)}</span>
                        <span />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p>
                  Scanning a QR code from a Saboot hash report fills this in automatically. Otherwise, load the case's{" "}
                  <code>SHA256SUMS</code> file or backup, or paste one hash value.
                </p>
                <TextField
                  label="Expected hash value (SHA-256, SHA-1 or MD5)"
                  value={manual}
                  onChange={setManual}
                  mono
                  hint="Copy it from the hash report. Spaces are ignored."
                />
              </>
            )}
            <div className="actions">
              <button type="button" className="btn secondary" onClick={() => listInput.current?.click()}>
                {payload ? "Load a different hash list" : "Load a hash list or case backup"}
              </button>
              <input
                ref={listInput}
                type="file"
                accept=".txt,.sha256,.json,text/plain,application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void loadList(f);
                  e.target.value = "";
                }}
              />
            </div>
          </section>
        </section>

        <section className="sheet">
          <MessageCheck />
          <p className="small" style={{ marginTop: "1.6rem" }}>
            A match shows the file is the same one that was hashed. It does not show whether what the file contains is true, and this page
            is not legal advice.
          </p>
        </section>
      </main>
    </>
  );
}
