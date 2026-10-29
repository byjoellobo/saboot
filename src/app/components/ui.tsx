import { useId, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { groupHex } from "../../engine/util/format";
import { announce } from "./Announcer";

export function Stamp({ children, big = false }: { children: ReactNode; big?: boolean }) {
  return <span className={big ? "stamp big" : "stamp"}>{children}</span>;
}

/** The one animated moment: a stamp that lands when a file finishes hashing. */
export function HashedStamp({ fresh }: { fresh: boolean }) {
  return (
    <span className={fresh ? "hashed-stamp fresh" : "hashed-stamp"}>HASHED</span>
  );
}

export function Notice({
  tone = "info",
  title,
  level = 3,
  children,
}: {
  tone?: "info" | "warn" | "ok";
  title?: string;
  level?: 2 | 3;
  children: ReactNode;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className={tone === "info" ? "notice" : `notice ${tone}`} role={tone === "warn" ? "alert" : undefined}>
      {title && <Heading className="notice-title">{title}</Heading>}
      {children}
    </div>
  );
}

export function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  return (
    <div>
      <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CopyButton({ text, label = "Copy", what }: { text: string; label?: string; what: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn link"
      aria-label={`Copy ${what}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          announce(`Copied ${what}`);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
          announce("Could not copy. Select the text and copy it instead.");
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function HashLines({ hashes, of }: { hashes: { sha256: string; sha1?: string; md5?: string }; of: string }) {
  const rows: [string, string | undefined][] = [
    ["SHA-256", hashes.sha256],
    ["SHA-1", hashes.sha1],
    ["MD5", hashes.md5],
  ];
  return (
    <div className="hash">
      {rows
        .filter((r): r is [string, string] => Boolean(r[1]))
        .map(([alg, value]) => (
          <HashRow key={alg} alg={alg} value={value} of={of} />
        ))}
    </div>
  );
}

function HashRow({ alg, value, of }: { alg: string; value: string; of: string }) {
  return (
    <>
      <span className="alg">{alg}</span>
      <span className="value">{groupHex(value)}</span>
      <CopyButton text={value} what={`${alg} of ${of}`} />
    </>
  );
}

interface TextFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: ReactNode;
  message?: { severity: "ok" | "warning" | "error"; text: string } | null;
  placeholder?: string;
  mono?: boolean;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url";
}

export function TextField({ id: givenId, label, value, onChange, hint, message, placeholder, mono, multiline, type = "text", autoComplete = "off", inputMode }: TextFieldProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const hintId = `${id}-hint`;
  const msgId = `${id}-msg`;
  const describedBy = [hint ? hintId : "", message?.text ? msgId : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    value,
    placeholder,
    "aria-describedby": describedBy,
    "aria-invalid": message?.severity === "error" ? true : undefined,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea {...common} />
      ) : (
        <input {...common} type={type} className={mono ? "mono" : undefined} autoComplete={autoComplete} inputMode={inputMode} spellCheck={!mono} />
      )}
      {hint && (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      )}
      {message?.text && (
        <span className={`msg ${message.severity}`} id={msgId} aria-live="polite">
          {message.text}
        </span>
      )}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Check({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function DropZone({ onFiles, title, detail, multiple = true }: { onFiles: (files: File[]) => void; title: string; detail: ReactNode; multiple?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const detailId = useId();
  const take = (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (files.length) onFiles(files);
  };
  return (
    <div
      className={over ? "drop over" : "drop"}
      role="button"
      tabIndex={0}
      aria-describedby={detailId}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
    >
      <strong>{title}</strong>
      <small id={detailId}>{detail}</small>
      <input
        ref={input}
        type="file"
        multiple={multiple}
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
