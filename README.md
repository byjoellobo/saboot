# Sakshya Kit

**Prepare electronic evidence for Indian courts, on your own device.** Sakshya Kit hashes WhatsApp chat exports, screenshots, call recordings and CCTV footage locally, helps you find the IMEI, serial number or MAC address of the device they came from, and drafts the certificate required by **section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)**, with a hash report, QR codes anyone can use to check the files, and a per-message hashed WhatsApp transcript.

[![CI](https://github.com/mezpos/sakshya-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/mezpos/sakshya-kit/actions/workflows/ci.yml)
[![Licence: AGPL v3](https://img.shields.io/badge/licence-AGPL--3.0--or--later-blue.svg)](LICENSE)
![Works offline](https://img.shields.io/badge/works-offline-1b2340.svg)
![No uploads](https://img.shields.io/badge/files-never%20uploaded-5a3e9b.svg)

> **Not legal advice, and not the expert.** Sakshya Kit is a software tool. Part B of the certificate must be signed by an expert who checks the records independently, and every document should be reviewed by a practising advocate before filing. See [DISCLAIMER.md](DISCLAIMER.md).

| Records, hashed on the device                             | Device guide (CCTV)                                | Generate the documents                     |
| --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------ |
| ![Records step](docs/images/records.png)                  | ![CCTV device guide](docs/images/device-guide.png) | ![Generate step](docs/images/generate.png) |
| **Certificate, Part A**                                   | **WhatsApp transcript**                            | **File check page**                        |
| ![Certificate Part A](docs/images/certificate-part-a.png) | ![Transcript](docs/images/transcript.png)          | ![Verify page](docs/images/verify.png)     |

Sample outputs made from the built-in demo case (synthetic data): [certificate bundle](docs/images/demo-certificate.pdf) and [WhatsApp transcript](docs/images/demo-transcript.pdf).

## Why this exists

Section 63(4) of the BSA requires a certificate "at each instance" an electronic record is submitted. The form in the Schedule has **Part A**, signed by the party, and **Part B**, signed by an expert, and both carry the hash value block (SHA1 / SHA256 / MD5) with the note "(Hash report to be enclosed with the certificate)". On 22 May 2026 the Supreme Court declined to entertain a challenge to the provision (_Pune Bar Association v. Union of India_, W.P.(C) 599/2026), calling a hash value "synonymous with an electronic fingerprint", and kept open the question of who may sign Part B.

The burden falls hardest on people without lawyers or forensic labs: tenants with WhatsApp chats about a deposit, workers with screenshots of deductions, shopkeepers with CCTV footage. The aids that exist are a downloadable template and closed "evidence vault" products; excellent open capture tools such as Bellingcat's Auto Archiver and Harvard's Scoop do not produce this certificate or guide a non-lawyer through it. Sakshya Kit does, and it is open so that anyone (including the court and the other side) can inspect exactly how every hash was computed. Sources: [docs/research/legal.md](docs/research/legal.md).

## Features

|                            |                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Streaming hashes**       | MD5, SHA-1, SHA-256 and CRC32 in one pass, by a Rust crate compiled to WebAssembly, in a pool of Web Workers reading 8 MiB at a time, so multi-GB CCTV files never load into memory                                                                                                                                                                                        |
| **WhatsApp exports**       | The zip and every file inside it are hashed; zip CRCs are checked; the chat is parsed with exact byte ranges for Android and iPhone formats ([docs/research/whatsapp.md](docs/research/whatsapp.md))                                                                                                                                                                       |
| **Per-message transcript** | Page-numbered PDF where each message shows its byte range and SHA-256, with attachments linked to their own hashes; Hindi, Kannada, Tamil, Telugu, Bengali, Malayalam, Gujarati, Gurmukhi and Odia print correctly                                                                                                                                                         |
| **Device guides**          | Step-by-step help for Android, iPhone, CCTV recorders (Hikvision/Prama, Dahua, CP Plus, XMeye), Windows and macOS, each step marked by how well it is sourced ([docs/research/devices.md](docs/research/devices.md)); IMEI Luhn check, randomised-MAC warning, EID check, placeholder-serial detection, DVR clock-offset capture                                           |
| **Certificate bundle**     | Guidance page, Part A filled per device in the Schedule's exact words, watermarked Part B draft, blank Part B, Annexure H hash report with QR codes, expert's worksheet, Annexure C custody log                                                                                                                                                                            |
| **Hash lists**             | `SHA256SUMS` (works with `sha256sum -c`) and a CSV for experts                                                                                                                                                                                                                                                                                                             |
| **Check page**             | QR codes open `verify.html`, which hashes a file on the viewer's own device and reports a match; it also loads a `SHA256SUMS` list or case backup, and checks a single WhatsApp message by byte range. A QR code carries a short case reference, record labels, shortened file names, sizes and SHA-256 values, all after the `#`, which browsers never send to the server |
| **Custody log**            | Every action is logged; each entry carries the SHA-256 of the previous one                                                                                                                                                                                                                                                                                                 |
| **Offline and private**    | Installable PWA; data stays in the browser (IndexedDB); no accounts, analytics or cookies ([PRIVACY.md](PRIVACY.md))                                                                                                                                                                                                                                                       |
| **Optional timestamp**     | RFC 3161 timestamp for a generated PDF via [`pdf-rfc3161`](https://github.com/mingulov/pdf-rfc3161); only the PDF's hash is sent, and only when you press the button                                                                                                                                                                                                       |
| **Demo case**              | "Try a demo case" builds a full case from synthetic files so you can see every output without real evidence                                                                                                                                                                                                                                                                |

## Quick start

```bash
npm ci
npm run dev            # http://localhost:5173
```

Then press **Try a demo case**. To build and preview the production app (with the service worker):

```bash
npx vite build         # uses the committed, CI-verified wasm
npx vite preview --port 4791
```

Requirements: Node 20.19 or later (CI uses 24). Rust is needed only to change the hasher: install Rust 1.99.1 (pinned in `crates/sakshya-hash/rust-toolchain.toml`) with the `wasm32-unknown-unknown` target, then `npm run wasm`. On Windows without Visual Studio Build Tools, `scripts/cargo.mjs` automatically uses rustup's GNU toolchain.

## Scripts

| Command                                   | What it does                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                             | Development server                                                           |
| `npm run build`                           | Rebuild the wasm (if Rust is available), type-check, production build        |
| `npm test` / `npm run test:coverage`      | Unit tests (Vitest; the real wasm runs in Node)                              |
| `npm run test:e2e`                        | Playwright end-to-end tests against the production build (desktop and phone) |
| `npm run test:rust` / `npm run lint:rust` | Rust hasher tests / clippy with warnings as errors                           |
| `npm run lint` / `npm run format:check`   | ESLint / Prettier                                                            |
| `npm run wasm:check`                      | Rebuild the hasher and fail if the committed `.wasm` differs from the source |
| `npm run fonts`                           | Re-download the Noto fonts used in PDFs                                      |

## How it works

```
 File picked ─▶ worker pool ─▶ Rust/wasm hasher ─▶ record (R-n) + custody entry ─▶ IndexedDB
     │               │
     │               └─ zip: central-directory reader ─▶ every entry hashed, chat text parsed
     ▼
 Device guide ─▶ identifiers checked (Luhn, MAC bits, EID) ─▶ device
     ▼
 Generate ─▶ pdf-lib layout (Noto fonts, Indic shaping) ─▶ certificate / transcript PDF
           └▶ QR codes: expected hashes in the URL fragment ─▶ verify.html (offline check)
```

The code is split into a reusable **engine** (`src/engine`: hashing, zip, PDF, custody log, verify links) that knows nothing about the BSA, the **BSA layer** (`src/sakshya`: Schedule text, certificate, checks, device guides, WhatsApp parser), and the **app** (`src/app`, `src/verify`). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deploying

`npx vite build` produces a static site in `dist/` with two entry pages, `index.html` and `verify.html`. Host it on any HTTPS static host; the QR codes point to `<site>/verify.html` (changeable per case in the Generate step).

- **GitHub Pages:** the included [workflow](.github/workflows/pages.yml) deploys `main` automatically. Enable it under Settings > Pages > Source: GitHub Actions. It builds for the `/<repo>/` sub-path; with a custom domain set the repository variable `SAKSHYA_BASE` to `/`. GitHub Pages cannot send custom headers, so only the `<meta>` CSP and referrer policy apply there (no `frame-ancestors`, Permissions-Policy or COOP); prefer Cloudflare Pages or Netlify for the full set.
- **Cloudflare Pages / Netlify:** build command `npx vite build`, output `dist`. `public/_headers` sets a strict Content-Security-Policy; the same policy is also injected as a `<meta>` tag for hosts that ignore `_headers`.
- **Sub-path hosting elsewhere:** set `SAKSHYA_BASE=/path/` at build time.

## Integrity and security

- Stored WhatsApp chat text is re-hashed and must match the record's SHA-256 and size before every transcript and before a backup is restored.
- The zip reader rejects impossible compression ratios, entries that point at the same data and oversized directories, inflates in 64 KiB slices, and caps how much text it keeps. Only files named `.zip` are unpacked; Word, Excel and APK files stay single records.
- The committed `sakshya_hash.wasm` is rebuilt in CI and compared with the source; builds remap local paths so the binary contains no developer's home directory.
- Strict CSP; the only allowed outside connection is the opt-in timestamp service. No telemetry.

Report vulnerabilities privately: see [SECURITY.md](SECURITY.md).

## Known limitations

- The custody log is kept by the person preparing the evidence. Its hash chain detects edits to earlier entries, but not someone rebuilding the whole log or deleting its last entries.
- The verify link is not signed. Anyone can make a link listing any hash values; the check page says so and asks people to compare against the printed hash report.
- The timestamp service is a free third-party RFC 3161 TSA, not a government or accredited one, and the library does not validate it against a trust store.
- Android WhatsApp exports cannot distinguish a real message from a body line shaped like a header. Suspect lines are flagged in the transcript, not resolved.
- The interface is in English only for now.

## Roadmap

The engine is built to be reused for other kinds of everyday evidence:

1. **Tenancy move-in record:** a two-party, dated photo record in which the other side opens a link and acknowledges each photo. Bengaluru deposits commonly run 6 to 12 months' rent, and undocumented deductions drive disputes.
2. **Gig-worker earnings log:** deductions and deactivation notices checked against the Karnataka Platform Based Gig Workers Act, 2025 (reasons for each deduction, 14 days' notice, grievance timelines).
3. **Broadband outage and speed log:** measurements turned into a complaint against TRAI's quality-of-service benchmarks.
4. **Hindi and Kannada interface,** reviewed by native speakers with legal training.

## Contributing

Contributions are welcome, especially corrections to device guides, new WhatsApp export formats (with synthetic samples only), translations and accessibility fixes. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Never attach real chats, phone numbers, IMEIs or case details to an issue.

## Licence

Sakshya Kit is free software under the **GNU Affero General Public License v3.0 or later** ([LICENSE](LICENSE)): you may use, study, modify and share it, and if you run a modified version as a service for others you must offer them its source. The standalone hasher crate in `crates/sakshya-hash` is dual-licensed **MIT OR Apache-2.0**. Noto fonts are under the SIL Open Font License 1.1. See [NOTICE](NOTICE).

Organisations that want to embed Sakshya Kit in a product without the AGPL's obligations can ask the maintainers about a commercial licence.

## Acknowledgements

[pdf-lib](https://github.com/Hopding/pdf-lib) and `@pdf-lib/fontkit`, [pdf-rfc3161](https://github.com/mingulov/pdf-rfc3161), [fflate](https://github.com/101arrowz/fflate), [RustCrypto hashes](https://github.com/RustCrypto/hashes), [crc32fast](https://github.com/srijs/rust-crc32fast), [qrcode](https://github.com/soldair/node-qrcode), [zod](https://github.com/colinhacks/zod), [idb](https://github.com/jakearchibald/idb), [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) and Google's [Noto fonts](https://notofonts.github.io/). The WhatsApp parser learned from [whatsapp-chat-parser](https://github.com/Pustur/whatsapp-chat-parser) and [whatstk](https://github.com/lucasrodes/whatstk).
