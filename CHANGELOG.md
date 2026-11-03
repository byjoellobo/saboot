# Changelog

All notable changes to Saboot are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-11-04

First public release.

### Changed

- Renamed the project from its working name, Sakshya Kit, to **Saboot** (सबूत, "proof"), so it cannot be mistaken for the government's e-Sakshya police evidence app. The hasher crate is now `saboot-hash`; backups made under the old name still import.
- Interface polish across every screen:
  - headings in a book serif (Noto Serif, subset to 20 KB for offline use); monospace now only for data such as hashes and record labels
  - paper sheets with soft depth, a woven red-tape binding strip, and the case name on a file label instead of above each heading
  - a new home screen with an illustration, the three steps, plain facts about privacy and limits, and clearer case rows
  - drawn icons in place of text symbols; notices with icons instead of thick coloured borders
  - Generate step regrouped by output, with each result shown next to the button that produced it
  - phone layouts for records, hash values and device identifiers; no sideways scrolling down to 360 px
  - themed text selection, caret and scrollbars; tabular numerals
- The check page leads with the file drop, groups what to compare against, and links back to the app.

### Added

- Release workflow: tagging `vX.Y.Z` builds, tests and publishes a GitHub release with the web bundle, its `SHA256SUMS` and a build provenance attestation.
- `docs/RELEASING.md`, `SUPPORT.md`, `CITATION.cff` and `CODEOWNERS`.

## [0.2.0] - 2026-10-29

Developed under the working name Sakshya Kit.

### Added

- "Try a demo case": a full case built from synthetic files (invented names, a documentation-range MAC address and the standard example IMEI) that runs through the real hashing pipeline.
- Hash lists for experts: a `SHA256SUMS` file that works with `sha256sum -c`, and a CSV hash report. CSV cells that a spreadsheet would run as formulas are neutralised.
- Check page: load the expected list from a `SHA256SUMS` file or a case backup when there is no QR link, and check a single WhatsApp message by the byte range printed in a transcript.
- "Install app" button where the browser supports installation, and install instructions for iPhone.
- "Delete all data on this device" in the About page.
- Sub-path hosting (`SABOOT_BASE`) and a GitHub Pages deployment workflow.
- Reproducible hasher builds: local paths are remapped out of the wasm, the Rust compiler is pinned, and `npm run wasm:check` fails if the committed wasm does not match the source.
- ESLint and Prettier, CI for lint, types, unit, Rust, wasm match, build and end-to-end tests, and Dependabot.
- Community files: contributing guide, code of conduct, security policy, privacy statement, disclaimer, issue forms and pull request template; architecture notes.

### Changed

- Licence: AGPL-3.0-or-later for the app; the hasher crate is MIT OR Apache-2.0.
- The storage warning now appears only on the home screen and the Generate step.

### Security

- Updated Vitest to 4.1.12 (development only) for two moderate advisories.

## [0.1.0] - 2026-10-29

Developed under the working name Sakshya Kit.

First public version.

### Added

- Streaming MD5, SHA-1 and SHA-256 (plus CRC32) in one pass, from a Rust crate (`crates/saboot-hash`) compiled to WebAssembly and run in a pool of Web Workers. Files are read 8 MiB at a time, so multi-gigabyte CCTV exports never load into memory.
- WhatsApp export zip handling: a central-directory zip reader (ZIP64 aware, CRC-checked, zip-bomb guarded) hashes the zip and every file inside it in one go.
- Per-message hashed WhatsApp transcript: the parser keeps exact byte ranges, every message is hashed over its own bytes, the ranges add up to the whole file, and the PDF prints the byte range and SHA-256 under each message.
- Device identifier guides for Android phones, iPhones and iPads, CCTV recorders (Hikvision/Prama, Dahua, CP Plus, XMeye), Windows PCs, Macs, USB drives, discs, servers and cloud accounts, with each step's source and confidence level.
- Identifier checks: IMEI Luhn check, randomised MAC address detection, EID MOD-97 check, placeholder serial number detection, and DVR clock-offset capture.
- Certificate bundle PDF for section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023: guidance page, Part A pre-filled for each device (verbatim Schedule text, filled values in blue), watermarked Part B draft, optional blank Part B, Annexure H hash report with QR codes, expert's worksheet, and Annexure C custody log.
- QR verification: QR codes carry the expected hashes in the URL fragment, which is never sent to a server; `verify.html` hashes the viewer's file locally and reports a match, a different file, or no match.
- Append-only custody log, with each entry chained to the previous entry's SHA-256.
- Optional RFC 3161 trusted timestamp for generated PDFs, sending only the PDF's hash.
- Offline use as a Progressive Web App (app, hasher and fonts precached), storage in IndexedDB, and JSON case backup and restore validated with zod.
- Correct shaping of Indian scripts (Devanagari, Kannada, Tamil, Telugu, Bengali, Malayalam, Gujarati, Gurmukhi, Odia) in PDFs using embedded Noto font subsets; characters no font covers, such as emoji, print as their code point while hashes still cover the original bytes.
- Strict Content-Security-Policy sent from `public/_headers` and injected as a `<meta>` tag at build time.

[Unreleased]: https://github.com/byjoellobo/saboot/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/byjoellobo/saboot/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/byjoellobo/saboot/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/byjoellobo/saboot/releases/tag/v0.1.0
