# Contributing to Saboot

Thank you for helping. Saboot is used by people who are not lawyers, often on a phone, often under stress, to prepare evidence for court. That sets the bar for every change:

- **Correct**: a wrong hash, a message attributed to the wrong person, or a mistake in the statutory text can harm someone's case.
- **Private**: files and case details never leave the user's device.
- **Plain**: every word a user reads must make sense to someone without legal training, and must never sound like legal advice.

Please read this guide, the [Code of Conduct](CODE_OF_CONDUCT.md) and, for anything security related, [SECURITY.md](SECURITY.md). Do not report vulnerabilities in public issues.

The maintainers cannot give legal advice about anyone's case, including in issues and pull requests.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- Use the issue forms. They ask for what we need and remind you to remove personal data.
- If your change touches the certificate text, device guides or the WhatsApp parser, read the matching notes in [docs/research](docs/research) first. They record where each rule came from.

## Development setup

### Requirements

- **Node.js 24** and npm. CI runs Node 24. (`package.json` still accepts Node 20 or later, but test on 24.)
- **Git**.
- **Rust** (optional): only needed if you change `crates/saboot-hash`. The built WebAssembly file is committed at `src/engine/hash/saboot_hash.wasm`, so web-only contributors can skip Rust entirely.

### Get the code running

```bash
git clone <your fork>
cd saboot
npm ci
npm run dev            # http://localhost:5173
```

The dev server does not register the service worker or inject the Content-Security-Policy `<meta>` tag. Use `npx vite build` and `npm run preview` to see the production behaviour.

### Rust (only for hasher changes)

Install Rust with [rustup](https://rustup.rs), then add the WebAssembly target:

```bash
cd crates/saboot-hash
rustup toolchain install                  # installs the pinned version (needs rustup 1.28+)
rustup target add wasm32-unknown-unknown
```

The compiler version is pinned in `crates/saboot-hash/rust-toolchain.toml` because different compiler versions produce different `.wasm` bytes, and CI checks the committed file byte for byte. The npm scripts run cargo inside the crate folder so rustup picks up the pin automatically.

**Windows without Visual Studio Build Tools:** Rust build scripts need a host linker even for a wasm build. `scripts/cargo.mjs` detects a missing MSVC linker and switches to rustup's GNU toolchain, which ships its own linker:

```bash
rustup toolchain install stable-x86_64-pc-windows-gnu --profile minimal
rustup target add wasm32-unknown-unknown --toolchain stable-x86_64-pc-windows-gnu
```

An explicitly chosen toolchain takes priority over `rust-toolchain.toml`. To reproduce the committed `.wasm` exactly on Windows, install the GNU build of the pinned version and select it with `SABOOT_RUST_TOOLCHAIN=<version>-x86_64-pc-windows-gnu`, where `<version>` is the `channel` in `rust-toolchain.toml`.

## npm scripts

| Script                  | What it does                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`           | Vite dev server with hot reload at http://localhost:5173                                                                             |
| `npm run build`         | Rebuilds the wasm (if cargo is installed), type-checks, and builds the static site into `dist/`                                      |
| `npm run preview`       | Serves `dist/` at http://localhost:4791                                                                                              |
| `npm run typecheck`     | `tsc --noEmit` over `src`, tests and config                                                                                          |
| `npm run lint`          | ESLint                                                                                                                               |
| `npm run format`        | Prettier, rewrites files in place                                                                                                    |
| `npm run format:check`  | Prettier, check only                                                                                                                 |
| `npm test`              | Vitest unit tests. They load the real `saboot_hash.wasm` in Node                                                                     |
| `npm run test:watch`    | Vitest in watch mode                                                                                                                 |
| `npm run test:coverage` | Unit tests with V8 coverage for `src/engine` and `src/sakshya`                                                                       |
| `npm run test:rust`     | `cargo test` for the hasher crate                                                                                                    |
| `npm run lint:rust`     | `cargo clippy --all-targets -- -D warnings` for the hasher crate                                                                     |
| `npm run test:e2e`      | Playwright tests against `vite preview` on port 4791. Build first                                                                    |
| `npm run wasm`          | Rebuilds `crates/saboot-hash` and copies the module to `src/engine/hash/saboot_hash.wasm`. Without cargo it keeps the committed file |
| `npm run wasm:check`    | Rebuilds the hasher and fails if the committed `.wasm` does not match the Rust source. CI runs this                                  |
| `npm run fonts`         | Re-downloads the Noto fonts into `public/fonts`                                                                                      |
| `npm run icons`         | Regenerates the PWA icons from `public/logo.svg`                                                                                     |

Two helper scripts are not wrapped in npm scripts:

- `python scripts/subset-ui-font.py` (needs `pip install fonttools brotli`) rebuilds the 20 KB Noto Serif heading font in `public/fonts/ui/`.
- `node scripts/screenshots.mjs docs/images` (with `npx vite preview --port 4791` running) regenerates the README screenshots and sample PDFs from the synthetic demo case.

Releases, versioning and CI/CD are described in [docs/RELEASING.md](docs/RELEASING.md).

End-to-end tests run in two Playwright projects, "desktop" (Desktop Chrome) and "mobile" (Pixel 7), both on Chromium. Install the browser once with `npx playwright install chromium`. If you have not changed the Rust code, `npx vite build` followed by `npm run test:e2e` skips the wasm rebuild.

## Project layout

```
crates/saboot-hash/    Rust hasher: MD5 + SHA-1 + SHA-256 + CRC32 in one pass, C ABI, unit tests
src/engine/             Reusable evidence engine. No Indian law, no BSA wording, no React
  hash/                 wasm bridge, streaming blob hashing, worker, worker pool, committed .wasm
  zip/                  defensive central-directory zip reader
  pdf/                  pdf-lib flow layout: mixed-script text, tables, QR codes, footers
  custody/              hash-chained custody log
  verify/               compact verify-link codec (deflate + base64url in the URL fragment)
  util/                 SHA-256 via Web Crypto, canonical JSON, ids, formatting
src/sakshya/            BSA-specific: Schedule text, certificate PDF, pre-filing checks,
                        device guides and identifier checks, WhatsApp parser and transcript
src/app/                React UI: screens, state (IndexedDB), services (ingest, generate,
                        backup, timestamp, download)
src/verify/             The standalone check page (verify.html)
tests/unit/             Vitest
tests/e2e/              Playwright, against the production build
public/                 Static files: fonts, icons, _headers (security headers)
scripts/                wasm build and check, cargo wrapper, font download
docs/research/          Sourced research behind the legal text, the parser and the device guides
docs/ARCHITECTURE.md    How the pieces fit together
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data flow and the reasons behind the main design decisions.

## Where to add things

The code is layered so that the evidence engine can be reused by other tools. Imports only point downwards: `app` and `verify` may import `sakshya` and `engine`; `sakshya` may import `engine`; `engine` imports neither. (`verify` also reuses UI components and the backup schema from `app`, but never its stored cases.)

| Layer                | Put here                                                                                                                                      | Keep out                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/engine`         | Anything useful for any kind of evidence: hashing, archives, PDF layout primitives, custody log, verify links                                 | Statute text, Indian law, BSA terms, React, IndexedDB                              |
| `src/sakshya`        | Everything specific to the section 63(4) certificate: Schedule text, certificate and transcript PDFs, checks, device guides, WhatsApp parsing | React, IndexedDB, network calls. Keep functions pure so they can be tested in Node |
| `src/app`            | Screens, state, storage, downloads, the optional timestamp request                                                                            | Business rules that could live in `sakshya` or `engine`                            |
| `src/verify`         | The check page. It must work with nothing but the link fragment and files the viewer chooses                                                  | Access to stored cases                                                             |
| `crates/saboot-hash` | The hasher                                                                                                                                    | Anything that is not hashing                                                       |

Common cases:

- **A WhatsApp export the parser does not read**: add the pattern in `src/sakshya/whatsapp/patterns.ts`, a synthetic test in `tests/unit/whatsapp-parse.test.ts`, and a note with its source in `docs/research/whatsapp.md`.
- **A device guide correction or a new device**: edit `src/sakshya/devices/guides-*.ts` and `docs/research/devices.md` (see the rules below).
- **A new PDF layout feature**: add it to `src/engine/pdf/writer.ts` if it is generic, or to the certificate or transcript builder if it is not.
- **A change to the hasher's exports or output layout**: bump `ABI_VERSION` in both `crates/saboot-hash/src/lib.rs` and `src/engine/hash/wasm-hasher.ts`, run `npm run wasm`, and commit the rebuilt `.wasm` in the same pull request.

## Testing expectations

- **Logic gets unit tests.** Everything in `src/engine` and `src/sakshya` is covered by Vitest tests in `tests/unit`. Keep line coverage for these folders at or above 80% (`npm run test:coverage`) and do not lower it.
- **Bug fixes start with a failing test** that reproduces the bug, then the fix.
- **Hashes are checked against an independent implementation.** Unit tests compare the wasm hasher with `node:crypto`. Do the same for any new hashing path.
- **User flows get end-to-end tests.** If you add or change a flow (adding files, recording a device, generating PDFs, the check page, offline use), extend `tests/e2e`.
- **Rust changes get Rust tests**, including known-answer vectors, in `crates/saboot-hash/src/lib.rs`. Run `npm run test:rust` and `npm run lint:rust`.
- **Fixtures are synthetic.** Tests build their zips, chats and devices in code. See rule 1 below.

Before you push, run at least:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
```

## Project rules

These rules exist because of who uses Saboot. Pull requests that break them will not be merged.

### 1. No real people's data, anywhere in the repository

Never commit real chats, evidence files, screenshots, call recordings, phone numbers, IMEIs, serial numbers, MAC addresses, account IDs, names of real parties or real case details. This includes test fixtures, documentation, issue text, commit messages and screenshots in pull requests. Data being public (for example, a chat export someone posted on GitHub) does not mean the people in it agreed to have it reused.

Build synthetic fixtures instead:

- Generate files in the test itself, as `tests/e2e/app.spec.ts` does with `fflate`, and type your own chat lines.
- Use names that are clearly invented.
- Reuse the fictional device values in `tests/unit/fixtures.ts`. For new MAC addresses, use `00:00:5E:00:53:00` to `00:00:5E:00:53:FF`, which is reserved for documentation (RFC 7042).
- For phone numbers, use numbers that cannot be Indian mobile numbers, for example `+91 00000 00001` (Indian mobile numbers start with 6, 7, 8 or 9).

If you need a real export format to reproduce a bug, recreate it in a test chat with a friend who agrees, then type the lines into a fixture by hand.

### 2. Statutory text needs a citation and a legal review

`src/sakshya/certificate/schedule.ts` reproduces the Schedule to the Bharatiya Sakshya Adhiniyam, 2023 word for word. Any change to it must:

- cite the source: Gazette of India number, date and page (the current text is from Gazette of India Extraordinary, Part II, Section 1, No. 55, 25 December 2023, pp. 46-47), or the notification or amendment that changed the form;
- keep the Gazette's own wording and punctuation exactly, even where it looks odd;
- update `docs/research/legal.md` to match;
- be reviewed and approved by someone with legal training (a practising advocate or a law graduate) before it is merged. Say in the pull request who reviewed it.

The same applies to any text in the app or PDFs that states what the law requires.

### 3. Device guide steps need a source and a confidence level

Every step in `src/sakshya/devices/guides-*.ts` has a `confidence` of `official`, `reliable` or `unverified`, and the guide lists its `sources`. When you add or change a step:

- add the source (manufacturer page, official manual, or a reliable third party) to the guide's `sources`, and a note to `docs/research/devices.md`;
- use `official` only for the manufacturer's own documentation, `reliable` for a named, credible third party, and `unverified` for anything else, including "I saw this on my own phone";
- never ask users to write down passwords, PINs, OTPs or verification codes.

Menus change between models and software versions. A step that is right for one model can be wrong for the next, so say which model and version it applies to.

### 4. Plain language, and never legal advice

User-facing text (screens, PDFs, error messages, the check page) is read by people without legal training, many in their second or third language.

- Use short sentences and everyday words. Explain any technical or legal term the first time it appears.
- Tell people what to do next, especially in error messages.
- Never imply that the text is legal advice, that a document is "approved", "certified" or "admissible", or that a filing will succeed.
- Never present Saboot as the expert. Part B of the certificate is signed by an expert who checks the records independently; the tool only prepares a draft.
- Describe unsettled law as unsettled.

### 5. No em dash character

Do not use the em dash character (Unicode U+2014) in code, comments, UI copy, PDFs or documentation. Use a comma, colon, full stop, parentheses or a plain hyphen. The only exception is a verbatim quotation of statutory text, such as the Gazette's ":" followed by an em dash in `schedule.ts` and `docs/research/legal.md`.

To find any you missed:

```bash
git grep -nP '\x{2014}'
```

### 6. No telemetry, analytics or third-party requests

Do not add analytics, telemetry, crash reporting, error-tracking services, remote fonts, CDNs, embedded content or any other request to a third party. The only connection to anything other than the site itself is the optional RFC 3161 timestamp, sent only when the user presses the button. The Content-Security-Policy in `public/_headers` and `vite.config.ts` enforces this; keep both in step. If you believe a new connection is truly needed, open an issue to discuss it before writing code.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org):

```
<type>: <short description in the imperative>

<optional body: what and why>

Signed-off-by: Your Name <your email address>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`. Examples:

```
fix: accept iOS exports with an era suffix after the date
feat: add guide for CP Plus NVR serial numbers
docs: cite Gazette page for the Part B hash block
```

### Developer Certificate of Origin (DCO)

Every commit must be signed off. Signing off certifies the [Developer Certificate of Origin](https://developercertificate.org): that you wrote the change or otherwise have the right to submit it under the project's licences.

```bash
git commit -s -m "fix: ..."
```

If you forgot, add the sign-off to the last commit with `git commit --amend -s --no-edit`, or to every commit on your branch with `git rebase --signoff main`.

## Pull requests

- Keep each pull request focused on one change.
- Fill in the pull request template and its checklist.
- Make sure CI passes: lint, type check, unit tests with coverage, production build, end-to-end tests, Rust tests and clippy, and the wasm match check.
- Add a line to `CHANGELOG.md` under "Unreleased".
- Update `README.md`, `PRIVACY.md`, `SECURITY.md` or `docs/` if your change affects what they say.

## Licensing of contributions

Contributions are accepted under the same licences the project uses ("inbound = outbound"):

- Contributions to Saboot are licensed under the GNU Affero General Public License v3.0 or later ([LICENSE](LICENSE)).
- Contributions to `crates/saboot-hash` are licensed under MIT OR Apache-2.0, at the user's option (`crates/saboot-hash/LICENSE-MIT`, `crates/saboot-hash/LICENSE-APACHE`).
- The Noto fonts in `public/fonts` come from upstream under the SIL Open Font License 1.1. Changes to them should come from upstream through `npm run fonts`.

There is no contributor licence agreement. Your DCO sign-off is the record that you have the right to contribute the change under these terms. See [NOTICE](NOTICE) for the full licensing summary.
