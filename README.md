# Sakshya Kit

An offline-first web app that helps people in India prepare electronic evidence for court. It hashes WhatsApp chat exports, screenshots, call recordings and CCTV footage **on the user's own device**, guides them to the identifiers of the phone, computer or recorder the files came from, and drafts the certificate required by **section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)**.

> Sakshya Kit is a software tool. It is not legal advice and it is not the "expert" who must sign Part B of the certificate. Every generated document says so, and should be reviewed by a practising advocate before filing.

## Why

Section 63(4) requires a certificate "at each instance" an electronic record is submitted. The form in the Schedule has a Part A (signed by the party) and a Part B (signed by an expert), and **both parts carry the hash value block** with SHA1 / SHA256 / MD5 options and the note "(Hash report to be enclosed with the certificate)". On 22 May 2026 the Supreme Court declined to entertain a challenge to the provision (*Pune Bar Association v. Union of India*, W.P.(C) 599/2026), describing a hash value as "synonymous with an electronic fingerprint", and kept open who may sign Part B. Existing aids are a downloadable template and proprietary tools; open capture tools (Bellingcat's Auto Archiver, Harvard's Scoop) do not produce the certificate or guide a non-lawyer through it. See [docs/research/legal.md](docs/research/legal.md).

## What it does

| Feature | How |
|---|---|
| Streaming MD5 + SHA-1 + SHA-256 (+ CRC32) in one pass | Rust crate [`crates/sakshya-hash`](crates/sakshya-hash) compiled to WebAssembly, run in a pool of Web Workers, reading 8 MiB at a time, so multi-GB CCTV files never load into memory |
| WhatsApp export zip handling | Central-directory zip reader (ZIP64 aware, CRC-checked, zip-bomb guarded) hashes the zip and every file inside in one go |
| Per-message hashed transcript | Parser keeps exact byte ranges; every message is hashed over its own bytes, the ranges add up to the whole file, and the PDF prints `bytes start-end · SHA-256` under each message ([docs/research/whatsapp.md](docs/research/whatsapp.md)) |
| Device identifier guides | Step-by-step guides for Android, iPhone, CCTV recorders (Hikvision/Prama, Dahua, CP Plus, XMeye), Windows, macOS and more, with each step's source and confidence ([docs/research/devices.md](docs/research/devices.md)); IMEI Luhn check, randomised-MAC detection, EID MOD-97 check, placeholder-serial detection; DVR clock-offset capture |
| Certificate bundle PDF | Guidance page, Part A pre-filled per device (verbatim Schedule text, filled values in blue), watermarked Part B draft, blank Part B, Annexure H hash report with QR codes, expert's worksheet, Annexure C custody log |
| QR verification | QR codes carry expected hashes in the URL **fragment** (never sent to a server); `verify.html` hashes the viewer's file locally and reports match / different file / no match |
| Custody log | Append-only, each entry chained to the previous entry's SHA-256 |
| Trusted timestamp (optional, online) | RFC 3161 timestamp via [`pdf-rfc3161`](https://github.com/mingulov/pdf-rfc3161); only the PDF's hash is sent |
| Offline | PWA (Workbox precache of app, wasm and fonts); data in IndexedDB; JSON backup/restore validated with zod |

Indian scripts in chats and names (Devanagari, Kannada, Tamil, Telugu, Bengali, Malayalam, Gujarati, Gurmukhi, Odia) are shaped correctly in the PDFs using embedded Noto font subsets; characters no font covers (emoji) print as `[U+1F44D]` while hashes still cover the original bytes.

## Project layout

```
crates/sakshya-hash/      Rust hasher (C ABI, no wasm-bindgen) + unit tests
src/engine/               Reusable evidence engine (no BSA specifics)
  hash/                   wasm bridge, streaming blob hashing, worker, worker pool
  zip/                    defensive central-directory zip reader
  pdf/                    pdf-lib flow layout: mixed-script text, tables, QR, footers
  custody/                hash-chained custody log
  verify/                 compact verify-link codec (deflate + base64url in the fragment)
src/sakshya/              BSA-specific: Schedule text, certificate PDF, checks,
                          device guides and validation, WhatsApp parser + transcript
src/app/                  React UI (screens, state, services)
src/verify/               Standalone file-check page (verify.html)
tests/unit/               Vitest (runs the real wasm in Node)
tests/e2e/                Playwright against the production build
docs/research/            Sourced research notes behind the legal text, parser and guides
```

The engine is deliberately separate from the BSA layer so that later tools (see Roadmap) reuse hashing, custody, PDF and verification as-is.

## Develop

Requirements: Node 20+, and Rust with the `wasm32-unknown-unknown` target only if you change the hasher (the built `.wasm` is committed).

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # unit tests (Vitest)
npm run test:rust      # Rust hasher tests
npm run lint:rust      # clippy -D warnings
npm run build          # rebuild wasm (if Rust present), type-check, production build
npm run test:e2e       # Playwright against `vite preview` (run `npm run build` first)
```

On Windows without Visual Studio Build Tools, `scripts/cargo.mjs` automatically uses rustup's GNU toolchain (`rustup toolchain install stable-x86_64-pc-windows-gnu`), which ships its own linker.

Fonts are committed under `public/fonts`; `npm run fonts` re-downloads them. The hinted Noto builds are used on purpose: pdf-lib's subsetter drops glyphs from the unhinted builds.

## Deploy

`npm run build` produces a static site in `dist/` (two entry pages: `index.html` and `verify.html`). Host it anywhere over HTTPS. `public/_headers` sets a strict Content-Security-Policy for Cloudflare Pages / Netlify; on other hosts, copy those headers. The QR codes point at `<site>/verify.html`, which can be changed per case in the Generate step.

## Cautions built into the product

- The tool never presents itself as the expert or as legal advice; Part B is a watermarked draft and the worksheet asks the expert to recompute every hash.
- The statutory text is reproduced verbatim from the Gazette (pp. 46-47) in [`src/sakshya/certificate/schedule.ts`](src/sakshya/certificate/schedule.ts). It should still be reviewed by a practising advocate.
- Android WhatsApp exports cannot distinguish a real message from a body line shaped like a message header; the transcript discloses this. iOS exports use CRLF record terminators, so their boundaries are exact.
- Unsettled law (who may sign Part B, certificates for originals, late filing) is described as unsettled in the app.

## Integrity and security notes

- Stored WhatsApp chat text is re-hashed and must match the record's SHA-256 and size before every transcript, and before a backup is restored.
- The zip reader rejects impossible compression ratios, overlapping entries and oversized central directories, inflates in 64 KiB slices, and caps how much text it keeps.
- Only files named `.zip` are unpacked; Word, Excel and APK files (zips inside) stay single records. Entries whose stored CRC32 does not match are never used as chat text and are left off the certificate by default.
- A strict Content-Security-Policy is sent via `public/_headers` and also injected as a `<meta>` tag at build time. The only allowed outside connection is the opt-in timestamp service.
- `npm audit --omit=dev` reports no known vulnerabilities at the time of writing.

## Known limitations

- The custody log is kept by the person preparing the evidence. Its hash chain detects edits to earlier entries, but not someone rebuilding the whole log or deleting its last entries.
- The verify link is not signed. Anyone can make a link listing any hash values; the check page says so and asks people to compare against the printed hash report.
- The timestamp service is a free third-party RFC 3161 TSA, not a government or accredited one, and the library does not validate it against a trust store.
- Android WhatsApp exports cannot distinguish a real message from a body line shaped like a header. Suspect lines are flagged in the transcript, not resolved.
- The committed `sakshya_hash.wasm` should be rebuilt and compared (`npm run wasm`, then compare SHA-256) before a release, so the binary matches the source.

## Roadmap: the same engine, other evidence

1. **Tenancy move-in record**: two-party, dated photo record where the other side opens a link and acknowledges each photo (Bengaluru deposits commonly run 6-12 months' rent; undocumented deductions drive disputes).
2. **Gig-worker earnings log**: deductions and deactivation notices checked against the Karnataka Platform Based Gig Workers Act, 2025 (reasons for deductions, 14 days' notice, grievance timelines).
3. **Broadband outage and speed log**: measurements turned into a complaint against TRAI's service-quality benchmarks (compensation for district-level outages over 24 hours).

## Licence

Sakshya Kit is licensed under the **GNU Affero General Public License v3.0 or later** ([LICENSE](LICENSE)). The standalone hasher crate in `crates/sakshya-hash` is dual-licensed **MIT OR Apache-2.0**. Noto fonts are under the SIL Open Font License 1.1. See [NOTICE](NOTICE).
