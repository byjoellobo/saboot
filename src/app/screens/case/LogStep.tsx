import { useEffect, useState } from "react";
import { verifyChain, type ChainCheck } from "../../../engine/custody/custody-log";
import { istStamp } from "../../../engine/util/format";
import type { CaseFile } from "../../../sakshya/model";
import { Notice } from "../../components/ui";

export function LogStep({ caseFile: c }: { caseFile: CaseFile }) {
  const [check, setCheck] = useState<ChainCheck | null>(null);
  useEffect(() => {
    void verifyChain(c.custody).then(setCheck);
  }, [c.custody]);

  return (
    <>
      <h1 id="step-title" tabIndex={-1}>
        Custody log
      </h1>
      <p>
        Every time a record is added, hashed or used to generate a document, an entry is added here. Each entry stores the SHA-256 of the
        one before it, so changing or deleting an old entry would break the chain. This catches accidental or careless changes; it does not
        prove who wrote the log, because it is kept on your own device. It is printed as Annexure C of the certificate bundle.
      </p>
      {check && (check.ok ? (
        <Notice tone="ok">All {c.custody.length} entries link to each other correctly.</Notice>
      ) : (
        <Notice tone="warn" title="The chain is broken">
          Entry {check.brokenAt}: {check.reason}.
        </Notice>
      ))}
      <div style={{ overflowX: "auto" }} role="region" aria-label="Custody log entries" tabIndex={0}>
        <table className="log">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Time (IST)</th>
              <th scope="col">What happened</th>
              <th scope="col">Entry SHA-256</th>
            </tr>
          </thead>
          <tbody>
            {[...c.custody].reverse().map((e) => (
              <tr key={e.seq}>
                <td>{e.seq}</td>
                <td>{istStamp(new Date(e.at))}</td>
                <td>
                  {e.summary}
                  <br />
                  <span className="small">by {e.actor}</span>
                </td>
                <td className="mono">{e.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
