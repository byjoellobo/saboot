# Security policy

Sakshya Kit helps people prepare evidence for court. A bug that shows a wrong hash, attributes a message to the wrong person, or leaks case details can do real harm, so we treat these as security issues even when no "attacker" is involved.

## Supported versions

| Version        | Supported |
| -------------- | --------- |
| Latest release | Yes       |
| Older releases | No        |

Fixes are made on `main` and shipped in a new release. We do not backport to older versions. If you host your own copy, update to the latest release.

## Reporting a vulnerability

**Please do not open a public issue, discussion or pull request for a vulnerability.**

Report it privately through GitHub:

1. Open this repository on GitHub and go to the **Security** tab.
2. Choose **Report a vulnerability**. This creates a private security advisory that only you and the maintainers can see.

If private reporting is not available, use the contact method on a maintainer's GitHub profile to ask for a private channel. Do not include the details in that first message.

Please include:

- the Sakshya Kit version (shown at the bottom of the app) or commit, the browser and its version, and the operating system;
- what an attacker can do, and what the user would see;
- steps to reproduce, with **synthetic** test files (a zip, chat export, backup file or link you made yourself). Never send real evidence, real chats or anyone's personal data.

What to expect: this is a volunteer project. We aim to acknowledge reports within 7 days, agree a fix and disclosure timeline with you, and credit you in the advisory and the changelog unless you prefer not to be named.

## Scope

### In scope

Anything that could make Sakshya Kit:

- **show or print a wrong hash value**, or report a match for files that differ (for example in the hasher, the worker pool, the zip reader, the verify page or the PDFs);
- **mis-attribute a WhatsApp message**: wrong author, wrong time, wrong text, or a wrong byte range or per-message hash in the transcript;
- **leak file contents or case data off the device**, including through a network request, a URL, a log, the service worker, or a file name;
- **break the custody log checks**, so that an edited or reordered log is reported as consistent, or a consistent log as broken;
- **mishandle crafted input**: a malicious zip archive, WhatsApp export, case backup file, or verify link that causes code execution, script injection, a wrong result, data loss, or memory exhaustion beyond the documented limits;
- **bypass the Content-Security-Policy**, or make the app or the check page contact a host other than the site itself and the opt-in timestamp service;
- corrupt or silently alter stored cases or chat text in IndexedDB;
- produce a certificate that drops or changes the statutory text in `src/sakshya/certificate/schedule.ts`.

### Out of scope

These are documented limitations, not vulnerabilities (see "Known limitations" in the [README](README.md)):

- **The verify link is not signed.** Anyone can make a link that lists any hash values. The check page says so and asks people to compare with the printed hash report.
- **The custody log is kept by the person preparing the evidence.** Its hash chain detects edits to earlier entries, but not someone rebuilding the whole log or deleting its last entries.
- **Trust in the third-party timestamp service.** The optional RFC 3161 timestamp comes from a free public Time Stamping Authority, not a government or accredited one, and the token is not validated against a trust store.
- **Android WhatsApp exports** cannot distinguish a real message from a body line shaped like a message header. Such lines are flagged in the transcript, not resolved.

Also out of scope:

- attacks that need an already compromised device, browser, browser extension or operating system, or physical access to an unlocked device (stored data is protected by the device and browser, not encrypted by Sakshya Kit);
- a compromised or malicious host serving modified code (host the app yourself from a release you have checked if this matters to you);
- hosts that ignore `public/_headers`, as long as the `<meta>` Content-Security-Policy fallback still applies;
- slowness or memory use when a user deliberately chooses a very large but valid file;
- vulnerabilities in dependencies with no demonstrated effect on Sakshya Kit (please report those upstream; you are welcome to tell us too).

## Threat model in brief

**What we protect:** the contents of evidence files and the case details (names, addresses, device identifiers, chat text); the correctness of every hash value shown or printed; the link between each transcript message and its exact bytes; the integrity of the custody log.

**Who we defend against:** someone who hands the user a crafted file (for example an opposing party sending a zip, a "backup" or a QR link); someone who wants to read what the user is preparing; someone who wants a different file to pass as the original.

**What we trust:** the user's device and browser, and the site that serves the app's code. Sakshya Kit has no server of its own, no accounts and no stored data off the device.

## Existing defences

**Data stays on the device**

- All hashing, parsing and PDF generation happen in the browser. Cases and chat text are stored only in this browser's IndexedDB. Media files are hashed as streams and never stored.
- A strict Content-Security-Policy is sent from `public/_headers` and also injected as a `<meta>` tag at build time (`vite.config.ts`): `default-src 'self'`, scripts only from the site plus `'wasm-unsafe-eval'` for the hasher, no inline scripts or styles, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, and `connect-src` limited to the site and `https://rfc3161.ai.moda`. `_headers` also sets `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, a `Permissions-Policy` that disables camera, microphone, geolocation and payment, and `Cross-Origin-Opener-Policy: same-origin`.
- The only outside request is the optional timestamp, sent only when the user presses the button. It sends a hash of the PDF, never the PDF.
- React renders all text; the code does not use `dangerouslySetInnerHTML` or `eval`. QR codes are drawn as SVG elements.

**Correct hashes**

- MD5, SHA-1, SHA-256 and CRC32 come from a small Rust crate (`crates/sakshya-hash`) compiled to WebAssembly with a C ABI and no imports. The JavaScript bridge refuses a module whose ABI version or digest length does not match (`src/engine/hash/wasm-hasher.ts`).
- Files are streamed in 8 MiB chunks. If the number of bytes hashed differs from the file's size, hashing fails with a message instead of returning a result (`src/engine/hash/blob-hash.ts`).
- Unit tests compare the wasm results with `node:crypto`. CI rebuilds the wasm from source with a pinned compiler and fails if it differs from the committed binary (`npm run wasm:check`).

**Zip archives** (`src/engine/zip/zip-reader.ts`)

- Entries are found through the central directory, with checks that every offset and length lies inside the file. ZIP64 records are bounds-checked, and sizes or offsets too large for JavaScript to represent exactly are rejected.
- Limits: at most 200,000 entries; a central directory no larger than 64 MiB and no larger than its entries could need; no two entries pointing at the same data.
- Zip-bomb guards: a declared size beyond deflate's maximum ratio (about 1032:1) is rejected; compressed data is inflated in 64 KiB slices and stopped as soon as output exceeds the declared size (plus 1 KiB).
- Only stored and deflate entries are read; encrypted entries are reported, not read. Each entry's CRC32 is compared with the stored value, and an entry that fails is never used as chat text and is left off the certificate by default.
- Text kept for transcripts is capped at 128 MiB per entry and 256 MiB per archive. Only files named `.zip` are unpacked, so Word, Excel and APK files stay single records.

**WhatsApp transcripts** (`src/sakshya/whatsapp/parse.ts`)

- Each message is an exact byte range of the export. The ranges and any preamble must add up to the whole file, which the parser asserts, and each message's SHA-256 is computed over its own bytes.
- Stored chat text is re-hashed and must match the record's SHA-256 and size before every transcript and before a backup is restored.
- When boundaries come from matching date and time headers (Android exports, or iOS exports whose CRLF line endings were stripped), the transcript states that limitation, and suspicious messages are flagged: a sender seen only once, or a sender name that reads like a sentence.

**Case backups** (`src/app/services/backup.ts`)

- Files over 200 MiB are refused. The JSON is validated against a strict schema (`backup-schema.ts`, zod) with length limits on text fields and lists, and hex checks on every hash.
- The custody log's hash chain must verify before anything is stored.
- Every chat text in the backup must match the size and SHA-256 recorded for its record.
- Restored cases get fresh ids, so a backup can never overwrite or share storage with an existing case. Everything is written in one IndexedDB transaction.

**Verify links** (`src/engine/verify/verify-link.ts`)

- The expected hashes travel in the URL fragment (after `#`), which browsers do not send to servers.
- Decoding rejects an unknown prefix or version, links over 8 KiB, characters outside base64url, damaged deflate data, truncated fields, invalid sizes, more than 2,000 items and trailing bytes.
- Control characters and bidirectional-override characters are removed from names and labels, so a crafted name cannot disguise itself on screen.
- The check page hashes the viewer's file on their own device and says plainly that the link is not signed.

**Custody log** (`src/engine/custody/custody-log.ts`)

- Each entry stores the SHA-256 of the previous entry, computed over canonical JSON (sorted keys). The chain is verified on the Log screen, before a backup is restored, and when the certificate's custody annexure is printed.

## Hardening ideas

Suggestions that reduce risk are welcome as normal issues or pull requests, as long as they do not include exploit details for an unfixed problem. See [CONTRIBUTING.md](CONTRIBUTING.md).
