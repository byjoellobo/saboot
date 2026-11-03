// Prints the CHANGELOG.md section for one version, for use as release notes.
// Usage: node scripts/release-notes.mjs v0.3.0 > notes.md
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tag = process.argv[2];
if (!tag || !/^v\d+\.\d+\.\d+(-[\w.]+)?$/.test(tag)) {
  console.error("Usage: node scripts/release-notes.mjs vX.Y.Z");
  process.exit(2);
}
const version = tag.slice(1);
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
const lines = changelog.split(/\r?\n/);
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
if (start < 0) {
  console.error(`CHANGELOG.md has no section for ${version}. Add one before tagging.`);
  process.exit(1);
}
const end = lines.findIndex((l, i) => i > start && /^## \[/.test(l));
const body = lines
  .slice(start + 1, end < 0 ? undefined : end)
  .join("\n")
  .trim();

const footer = [
  "",
  "---",
  "",
  "**Verify the download:** `sha256sum -c SHA256SUMS` (or compare with `certutil -hashfile <file> SHA256` on Windows). Each asset also has a GitHub build provenance attestation: `gh attestation verify <file> --repo byjoellobo/saboot`.",
  "",
  "Saboot is a software tool, not legal advice, and not the expert who signs Part B. See [DISCLAIMER.md](https://github.com/byjoellobo/saboot/blob/main/DISCLAIMER.md).",
];
process.stdout.write(`${body}\n${footer.join("\n")}\n`);
