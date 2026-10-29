// Check one WhatsApp message from a Sakshya Kit transcript: the transcript
// prints "bytes START-END" and a SHA-256 under every message. This hashes
// exactly that slice of the original chat file, on this device.
import { useState } from "react";
import { sha256Hex } from "../engine/util/crypto";
import { groupHex } from "../engine/util/format";
import { Notice, TextField } from "../app/components/ui";

interface Result {
  readonly sha256: string;
  readonly text: string;
  readonly matches: boolean | null;
}

const MAX_SLICE = 1024 * 1024;

export function MessageCheck() {
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [expected, setExpected] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setResult(null);
    setError(null);
    const a = Number(start);
    const b = Number(end);
    if (!file) return setError("Choose the chat file (_chat.txt or WhatsApp Chat with ... .txt) first.");
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b <= a)
      return setError("Enter the two byte numbers shown under the message, smaller first.");
    if (b > file.size) return setError(`This file has only ${file.size} bytes, so it cannot be the file the transcript was made from.`);
    if (b - a > MAX_SLICE) return setError("That range is larger than any single message.");
    const bytes = new Uint8Array(await file.slice(a, b).arrayBuffer());
    const sha256 = await sha256Hex(bytes);
    const want = expected.toLowerCase().replace(/\s+/g, "");
    setResult({
      sha256,
      text: new TextDecoder().decode(bytes),
      matches: want ? want === sha256 : null,
    });
  };

  return (
    <section aria-labelledby="msg-check-title">
      <h2 id="msg-check-title">Check one WhatsApp message</h2>
      <p className="small">
        Under each message, a Sakshya Kit transcript prints <code>bytes START–END</code> and a SHA-256 value. Choose the original chat file
        and enter those numbers to see the exact text and its hash. Nothing is uploaded.
      </p>
      <div className="field">
        <label htmlFor="msg-file">Chat file</label>
        <input id="msg-file" type="file" accept=".txt,text/plain" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="row">
        <TextField label="Start byte" value={start} onChange={setStart} mono inputMode="numeric" />
        <TextField label="End byte" value={end} onChange={setEnd} mono inputMode="numeric" />
      </div>
      <TextField label="SHA-256 printed in the transcript (optional)" value={expected} onChange={setExpected} mono />
      <div className="actions">
        <button type="button" className="btn secondary" onClick={() => void run()}>
          Check this message
        </button>
      </div>
      {error && <Notice tone="warn">{error}</Notice>}
      {result && (
        <>
          {result.matches === true && (
            <Notice tone="ok" title="Matches the transcript">
              These bytes produce exactly the SHA-256 printed in the transcript.
            </Notice>
          )}
          {result.matches === false && (
            <Notice tone="warn" title="Does not match">
              These bytes produce a different SHA-256. Either the numbers or the file are different from the ones the transcript was made
              from.
            </Notice>
          )}
          <div className="hash">
            <span className="alg">SHA-256</span>
            <span className="value">{groupHex(result.sha256)}</span>
            <span />
          </div>
          <pre className="message-preview">{result.text}</pre>
        </>
      )}
    </section>
  );
}
