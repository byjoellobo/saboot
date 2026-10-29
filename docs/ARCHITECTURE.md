# Architecture

This document is for contributors. It explains how Sakshya Kit is put together, how a file travels from the moment it is dropped on the page to the printed certificate, and why the main design decisions were made. For setup and rules, see [CONTRIBUTING.md](../CONTRIBUTING.md). For the security view, see [SECURITY.md](../SECURITY.md).

## The big picture

Sakshya Kit is a static web app (React + TypeScript, built with Vite) that runs entirely in the browser. There is no backend. Everything a user enters is stored in the browser's IndexedDB, and every file is read and hashed on the device. A Progressive Web App service worker (Workbox, through `vite-plugin-pwa`) precaches the app, the hasher and the fonts, so after the first visit it works offline.

The build produces two pages:

- `index.html`: the main app (`src/main.tsx`, `src/app`).
- `verify.html`: the standalone check page that the QR codes on a certificate open (`src/verify`).

## Layers

```
   index.html                                   verify.html
+---------------------------------+    +-----------------------------+
| src/app                         |    | src/verify                  |
| React screens, state, services  |    | check page: link fragment + |
| (IndexedDB, downloads, ingest,  |    | files chosen by the viewer  |
|  generate, backup, timestamp)   |    | (reuses UI from src/app)    |
+----------------+----------------+    +--------------+--------------+
                 |                                    |
                 v                                    |
+---------------------------------+                   |
| src/sakshya   (BSA-specific)    |<------------------+
| Schedule text, certificate PDF, |
| checks, device guides and ID    |
| checks, WhatsApp parser and     |
| transcript PDF                  |
+----------------+----------------+
                 |
                 v
+-----------------------------------------------------------------+
| src/engine   (no Indian law, no BSA wording, no React)          |
| hash/    wasm bridge, streaming hashing, worker, worker pool     |
| zip/     central-directory zip reader                            |
| pdf/     pdf-lib flow layout, mixed-script fonts, tables, QR     |
| custody/ hash-chained custody log                                |
| verify/  compact verify-link codec (URL fragment)                |
| util/    SHA-256 (Web Crypto), canonical JSON, ids, formatting  |
+--------------------------------+--------------------------------+
                                 |  WebAssembly.instantiate, C ABI
                                 v
               +-----------------------------------+
               | crates/sakshya-hash (Rust)        |
               | MD5 + SHA-1 + SHA-256 + CRC32     |
               | -> src/engine/hash/sakshya_hash.wasm (committed) |
               +-----------------------------------+
```

Imports only point downwards. `engine` never imports `sakshya` or `app`, and `sakshya` never imports `app`. `verify` reuses UI components (and the backup schema) from `app` but never touches stored cases.

| Layer                 | Responsibility                                                                             | Key files                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crates/sakshya-hash` | One-pass MD5, SHA-1, SHA-256 and CRC32 over a byte stream, exposed through a small C ABI   | `src/lib.rs`                                                                                                                                                                                    |
| `src/engine`          | Evidence primitives any tool could use                                                     | `hash/hash-pool.ts`, `hash/hash.worker.ts`, `hash/wasm-hasher.ts`, `hash/blob-hash.ts`, `zip/zip-reader.ts`, `pdf/writer.ts`, `pdf/fonts.ts`, `custody/custody-log.ts`, `verify/verify-link.ts` |
| `src/sakshya`         | Everything about the section 63(4) certificate under the Bharatiya Sakshya Adhiniyam, 2023 | `certificate/schedule.ts`, `certificate/certificate-pdf.ts`, `certificate/checks.ts`, `devices/*`, `whatsapp/parse.ts`, `whatsapp/patterns.ts`, `whatsapp/transcript-pdf.ts`, `model.ts`        |
| `src/app`             | The user interface and everything that touches browser storage or the network              | `screens/*`, `state/db.ts`, `state/use-case.ts`, `state/use-ingest.ts`, `state/case-ops.ts`, `services/*`                                                                                       |
| `src/verify`          | The check page                                                                             | `VerifyApp.tsx`                                                                                                                                                                                 |

## From file drop to certificate

### 1. Adding files

The user drops files on the Records step. `src/app/state/use-ingest.ts` queues them and calls `ingestFile` in `src/app/services/ingest.ts` for each one:

- A file **named `.zip`** whose first bytes are a zip signature goes to `pool.hashZip(file, [".txt"])`. Word, Excel and APK files are zips inside, but they are not unpacked: they stay single records.
- Anything else goes to `pool.hashFile(file)`.

### 2. The worker pool

`HashPool` (`src/engine/hash/hash-pool.ts`) runs up to four module Web Workers (one fewer than the number of CPU cores, at least one). Each worker takes one job at a time; extra jobs wait in a queue. Jobs can be cancelled. If a worker crashes, its job is rejected with an error, the worker is removed, and a new one is started when the next job needs it. The same pool is used by the check page.

Each worker (`hash.worker.ts`) fetches `sakshya_hash.wasm` once and keeps one `HasherModule`. Progress messages are throttled to one every 100 ms.

### 3. Hashing through the wasm ABI

`hashBlob` (`src/engine/hash/blob-hash.ts`) reads the file in 8 MiB slices with `Blob.slice().arrayBuffer()` and feeds each slice to the Rust hasher, so memory stays flat even for multi-gigabyte CCTV exports. Between slices it checks for cancellation. At the end, the number of bytes hashed must equal the file's size, or hashing fails with "was it modified while hashing?".

The bridge (`src/engine/hash/wasm-hasher.ts`) talks to the crate through these exports:

```
sk_abi_version() -> u32            sk_digest_len() -> u32
sk_alloc(len) -> ptr               sk_free(ptr, len)
sk_hasher_new() -> handle          sk_hasher_free(handle)
sk_hasher_update(handle, ptr, len)
sk_hasher_finish(handle, out_ptr)  // consumes the handle, writes 80 bytes

output: md5[16] | sha1[20] | sha256[32] | crc32[4, big-endian] | length[8, big-endian]
```

The bridge copies each chunk into a reusable scratch buffer inside the module's memory, taking a fresh view of `memory.buffer` every time because the buffer is replaced when wasm memory grows. On load it refuses any module whose `sk_abi_version()` or `sk_digest_len()` differs from what the JavaScript expects.

### 4. Zip archives

For a zip, the worker first hashes the archive as a whole (it is evidence in its own right), then calls `hashZipEntries` (`src/engine/zip/zip-reader.ts`):

1. Find the end-of-central-directory record near the end of the file (it can be followed by a comment of up to 64 KiB), and the ZIP64 records if present.
2. Read the central directory and list every entry: name, method, sizes, stored CRC32, DOS timestamp, local header offset.
3. For each entry, read its local header to find where the data starts, then stream the data in 4 MiB reads. Deflated data is inflated with `fflate` in 64 KiB slices.
4. Hash the output with a new streaming hasher, compare the CRC32 with the stored one, and keep the decompressed bytes only for `.txt` entries (the chat text), within per-entry and per-archive limits.

A damaged or unsupported entry is reported on its own and does not fail the whole archive. Kept bytes are transferred back to the page without copying.

### 5. Turning results into records

Back in `ingest.ts`, a `.txt` entry becomes the chat text only if its CRC matched and `parseChat` finds WhatsApp messages in it. The zip becomes a "whatsapp-export" (or "archive") record, and every entry becomes a child record with its path inside the zip. Entries with a CRC mismatch are left off the certificate by default, with a warning. When a zip holds more than 25 media files, only the zip and the chat text go on the certificate by default; the user can include more.

`use-ingest.ts` then stores the chat text in IndexedDB first (a record must never exist without its text), assigns record labels (R-1, R-2, ...), appends custody events, and saves the case. If saving fails, the stored chat text is removed again.

### 6. Storage and the custody log

`src/app/state/db.ts` uses three IndexedDB object stores in the `sakshya-kit` database:

| Store      | Holds                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| `cases`    | `CaseFile` objects: case details, devices, records with their hashes, the custody log. Never file contents |
| `chats`    | Raw bytes of WhatsApp chat text files, keyed by record id, indexed by case                                 |
| `settings` | Small preferences (first-run notice accepted, check page address)                                          |

All changes to a case go through pure, immutable functions in `src/app/state/case-ops.ts`. Changes that matter for evidence handling call `withEvent`, which uses `appendEvent` (`src/engine/custody/custody-log.ts`) to return a new log with one more entry. Each entry's hash is the SHA-256 of its canonical JSON (sorted keys), which includes the previous entry's hash. `verifyChain` recomputes the chain on the Log screen, before a backup is restored, and when the custody annexure is printed.

### 7. Devices

On the Devices step the user records the phone, computer or recorder each file came from. Guides in `src/sakshya/devices/guides-*.ts` give step-by-step instructions, each step tagged `official`, `reliable` or `unverified`, with the guide's sources. `validate.ts` checks identifiers as they are typed: IMEI Luhn check digit, randomised (locally administered) MAC addresses, the EID MOD-97 check, and placeholder serial numbers. A DVR's clock offset can be recorded so footage times can be read correctly.

### 8. The certificate PDF

The Generate step runs `checkCase` (`src/sakshya/certificate/checks.ts`) and blocks generation on serious problems. Then `generateCertificate` (`src/app/services/generate.ts`) calls `buildCertificatePdf` (`src/sakshya/certificate/certificate-pdf.ts`), which uses the engine's `PdfWriter` to produce one bundle:

1. a guidance page (to be removed before filing);
2. for each device, Part A pre-filled with the verbatim Schedule text from `schedule.ts`, and a watermarked Part B draft;
3. optionally, a blank Part B for the expert;
4. Annexure H, the hash report, with verify QR codes;
5. the expert's worksheet;
6. Annexure C, the custody log.

`PdfWriter` (`src/engine/pdf/writer.ts`) is a small flowing-layout writer on top of `pdf-lib`: word wrapping, tables that break across pages, check boxes, QR codes and "Page X of Y" footers. `splitRuns` (`src/engine/pdf/fonts.ts`) splits text into runs by script, so each Indian script uses its own Noto font. Fonts are loaded from the site's `fonts/` folder (precached for offline use) and embedded as subsets.

The PDF is downloaded, never stored. Its SHA-256 is recorded in the custody log.

### 9. The WhatsApp transcript

`generateTranscript` reads the chat bytes from IndexedDB and first re-hashes them: they must still match the record's size and SHA-256. `parseChat` (`src/sakshya/whatsapp/parse.ts`) splits the file into messages by byte range, `hashChat` computes each message's SHA-256 over its own bytes, and `buildTranscriptPdf` prints every message with `bytes start-end` and its SHA-256, plus the parser's warnings and limitations.

### 10. The verify link and the check page

`verifyItems` takes each record's label, file name, size and SHA-256. `encodePayload` (`src/engine/verify/verify-link.ts`) packs them with a short case reference into a compact binary form:

```
u8 version | str caseRef (<= 60 bytes) | u16 count |
  per item: str label (<= 16 bytes) | str name (<= 40 bytes) | uleb128 size | sha256[32]
-> raw deflate -> base64url -> "v1.<data>" after the "#" of <site>/verify.html
```

`chunkForQr` splits the records into groups so that each URL stays under 700 characters, small enough for a QR code to scan from a printed page or a photocopy.

`verify.html` decodes the fragment (with strict limits, see SECURITY.md), hashes the viewer's files with the same worker pool, and reports a match, a file of the same size with different content, or no match. It can also take its expected list from a local file instead of a link (`src/verify/expected-list.ts`).

### 11. Optional timestamp and backups

- **Timestamp** (`src/app/services/timestamp.ts`): only when the user asks, the `pdf-rfc3161` library is loaded and sends a hash of the PDF to an RFC 3161 Time Stamping Authority (`https://rfc3161.ai.moda/tsa`, the only outside host the Content-Security-Policy allows). The signed token is embedded in a new copy of the PDF.
- **Backups** (`src/app/services/backup.ts`): export writes one JSON file with the case and the chat text (base64). Import checks size, parses JSON, validates with a strict zod schema, verifies the custody chain, re-hashes every chat text, gives everything fresh ids, and writes it in one transaction.

## Key design decisions

### A C ABI instead of wasm-bindgen

The hasher exports a handful of plain C functions and imports nothing. The JavaScript side needs only `WebAssembly.instantiate(bytes, {})`.

- No generated glue code, and no need to keep a `wasm-bindgen` CLI version in step with the crate.
- The same bridge runs unchanged in a browser worker and in Node, so unit tests use the real committed binary.
- The surface is small enough to review in one sitting, and an ABI version check catches a stale binary.

Rust compiled to WebAssembly is used rather than Web Crypto because `crypto.subtle.digest` cannot stream (it needs the whole input in memory) and has no MD5, while the Schedule's hash block offers MD5, SHA-1 and SHA-256. One pass computes all of them, plus the CRC32 needed to check zip entries.

The `.wasm` is committed so that web-only contributors and static hosts do not need Rust. To keep the binary honest, the compiler version is pinned in `crates/sakshya-hash/rust-toolchain.toml`, source paths are remapped out of the binary at build time, and CI rebuilds the module and fails if it differs from the committed file (`npm run wasm:check`).

### Reading zips from the central directory

Android and Java tools often write zips with data descriptors, where the local header carries no sizes and the real sizes come after the data. The central directory at the end of the file is the authoritative list, and it supports ZIP64 for archives over 4 GB. Reading it first also allows random access through `Blob.slice`, so each entry can be streamed into the hasher without loading the archive into memory. It is also where the defensive checks live: entry count and directory size limits, an impossible-ratio check, a hard ceiling on inflated output, and a check that no two entries share the same data.

### Byte-range message hashing

A transcript is only useful as evidence if each message can be tied back to the export. So every message is the exact byte slice of the export file, from its first byte to the first byte of the next message, line ending included. The slices plus any preamble must add up to the whole file, which the parser asserts. Anyone with the original file can reproduce each per-message SHA-256 with standard tools.

Finding the boundaries differs by platform:

- **iOS** ends each message with CRLF and uses a bare LF inside multi-line messages, so boundaries are exact (`boundaryMethod: "crlf-records"`). A header-shaped line inside a message is recognised as part of that message and flagged.
- **Android** uses LF everywhere, so boundaries come from matching the date and time header at the start of a line (`"header-lines"`). A message body that contains a line shaped like a header cannot be told apart from a new message. The transcript states this limitation and flags suspicious messages instead of guessing. iOS exports whose CRLFs were stripped fall back to the same method, with a warning.

Header patterns, invisible characters (U+202F before am/pm, U+200E on iOS) and localised system phrases are in `src/sakshya/whatsapp/patterns.ts`, with their sources in [docs/research/whatsapp.md](research/whatsapp.md).

### Hinted Noto fonts

PDFs embed subsets of Noto fonts so that names and chats in Devanagari, Bengali, Gurmukhi, Gujarati, Odia, Tamil, Telugu, Kannada and Malayalam print correctly. The **hinted** builds are used on purpose: `pdf-lib` with `@pdf-lib/fontkit` drops glyphs when subsetting the unhinted builds, and the hinted ones subset correctly. Fontkit's Indic shaper needs a global `regeneratorRuntime`, which `writer.ts` imports. Characters no bundled font covers (mostly emoji) print as their code point, for example `[U+1F44D]`, while the hashes still cover the original bytes.

### The verify payload lives in the URL fragment

Browsers never send the part of a URL after `#` to the server. Putting the expected hashes there means the check page can be served by any static host, works offline from the service worker, and leaks nothing about the case to server logs. The trade-off is that the link is not signed: anyone can make a link listing any hash values. The check page says so and asks the viewer to compare with the printed hash report.

### No backend, and IndexedDB only

Evidence and case details are sensitive, and the users are often in a dispute with the other side. Keeping everything on the device removes a whole class of risks (breaches, subpoenas of a server, hosting costs) and lets the app work offline. The cost is that there is no sync between devices; backups are explicit JSON files.

### AGPL-3.0-or-later

Sakshya Kit is delivered as a website, and people trust it with evidence. The GNU Affero General Public License makes sure that anyone who offers a modified version to the public, including as a hosted service, must also offer its complete source code, so users and experts can always inspect what produced their hashes and certificates. The hasher crate is MIT OR Apache-2.0 so that it can be reused anywhere, and the Noto fonts keep their SIL Open Font License.

## Threat model summary

- **Protected:** file contents and case details (they never leave the device), the correctness of every hash shown or printed, the link between each transcript message and its bytes, and the integrity of the custody log.
- **Defended against:** crafted inputs from someone else (zip archives, chat exports, backup files, verify links), attempts to read case data, and attempts to make a different file pass as the original.
- **Trusted:** the user's device and browser, and the site serving the code.
- **Known limitations:** the verify link is unsigned; the custody log is kept by the user and can be rebuilt or truncated as a whole; the timestamp service is a free third-party authority not checked against a trust store; Android exports have the header ambiguity above.

The defences are listed in [SECURITY.md](../SECURITY.md).

## Reusing the engine for other evidence

The engine was kept free of BSA specifics so that other tools can be built on it. A new tool would add its own domain layer next to `src/sakshya` (for example `src/tenancy`), its own screens, and possibly its own entry page, while reusing `src/engine` as it is.

| Future tool                                                                                                 | Reuses from the engine                                                                                                                                                                         | Needs to add                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenancy move-in record**: a dated photo record that the other party acknowledges                          | `HashPool` for photos and videos; the custody log for when each photo was taken and added; `PdfWriter` for the report; verify links so the other party can check each photo on their own phone | A way to record the other party's acknowledgement, which the unsigned verify link cannot provide (for example a new, generic signing module in the engine); tenancy-specific report text                             |
| **Gig-worker earnings log**: deductions and deactivation notices checked against state gig-worker law       | Hashing of screenshots and exported statements; the custody log as a dated diary; `PdfWriter` tables; the zip reader for exported archives                                                     | Parsers for platform statements; the rules for the relevant law, in its own domain layer with sources, the same way `src/sakshya` handles the Schedule                                                               |
| **Broadband outage and speed log**: measurements turned into a complaint against service-quality benchmarks | The custody log (one entry per measurement, with details); `PdfWriter` tables; hashing of any exported files                                                                                   | A measurement component. Measuring needs network access to a test server, so this tool would need its own Content-Security-Policy and its own privacy statement; it must not loosen the policy of Sakshya Kit itself |

Guidelines for such work:

- If a tool needs something new from the engine, add it in a general form (no tenancy, gig or telecom terms) with its own unit tests.
- Keep `HasherModule`'s ABI stable; if it must change, bump `ABI_VERSION` in both the crate and the bridge.
- Keep the same privacy rules: no accounts, no analytics, no uploads of evidence.
