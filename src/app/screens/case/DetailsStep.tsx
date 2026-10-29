import type { CaseFile, Person } from "../../../sakshya/model";
import { SelectField, TextField } from "../../components/ui";
import { href } from "../../router";
import { touch } from "../../state/case-ops";
import type { CaseHandle } from "../../state/use-case";

const RELATIONS = [
  { value: "", label: "Choose" },
  { value: "son", label: "Son of" },
  { value: "daughter", label: "Daughter of" },
  { value: "spouse", label: "Spouse of" },
] as const;

export interface StepProps {
  readonly handle: CaseHandle;
  readonly caseFile: CaseFile;
}

export function DetailsStep({ handle, caseFile: c }: StepProps) {
  const setCase = (patch: Partial<CaseFile>) => handle.set((cur) => touch(cur, patch));
  const setParty = (patch: Partial<Person>) => handle.set((cur) => touch(cur, { party: { ...cur.party, ...patch } }));

  return (
    <>
      <h1 id="step-title" tabIndex={-1}>
        Case and your details
      </h1>
      <p>
        These details fill the top of the certificate and the opening line of Part A. Write them as they appear in your other court papers.
        Everything is saved on this device as you type.
      </p>

      <h2>The case</h2>
      <TextField label="Court" value={c.court} onChange={(v) => setCase({ court: v })} placeholder="e.g. Court of Small Causes, Bengaluru" />
      <div className="row">
        <TextField label="Case number" value={c.caseNumber} onChange={(v) => setCase({ caseNumber: v })} placeholder="e.g. SC 1234/2026" />
        <TextField label="Case title" value={c.title} onChange={(v) => setCase({ title: v })} placeholder="e.g. Asha Rao v. Ravi Kumar" />
      </div>
      <p className="small">Leave these blank if you have not filed yet; you can add them later and generate again.</p>

      <h2>You, the person signing Part A</h2>
      <p className="small">
        Part A is signed by the person in charge of the device the records came from. It begins: "I, ___ (Name), Son/daughter/spouse of ___
        residing/employed at ___".
      </p>
      <TextField label="Your full name" value={c.party.name} onChange={(v) => setParty({ name: v })} autoComplete="name" />
      <div className="row">
        <SelectField label="Relation" value={c.party.relationOf} onChange={(v) => setParty({ relationOf: v })} options={RELATIONS} />
        <TextField label="Name of parent or spouse" value={c.party.relativeName} onChange={(v) => setParty({ relativeName: v })} />
      </div>
      <TextField
        label="Residing or employed at"
        value={c.party.address}
        onChange={(v) => setParty({ address: v })}
        multiline
        autoComplete="street-address"
      />
      <TextField label="Place of signing" value={c.party.place} onChange={(v) => setParty({ place: v })} placeholder="e.g. Bengaluru" />

      <div className="actions">
        <a className="btn" href={href({ name: "case", id: c.id, step: "records" })}>
          Next: add records
        </a>
      </div>
    </>
  );
}
