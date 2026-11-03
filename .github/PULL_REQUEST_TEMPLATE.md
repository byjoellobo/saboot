## What this changes

<!-- What does this pull request do, and why? Link the issue it fixes, e.g. "Fixes #12". -->

## How it was tested

<!-- Which tests did you add or run? For UI changes, which browsers and devices did you try? -->

## Checklist

- [ ] Tests added or updated for the change, and `npm test` passes (and `npm run test:e2e` for changes to user flows)
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] No real personal data anywhere: no real chats, evidence files, phone numbers, IMEIs, serial numbers, MAC addresses, names or case details in code, fixtures, docs or screenshots
- [ ] No em dash character (U+2014) added, except inside verbatim statute quotes (`git grep -nP '\x{2014}'`)
- [ ] User-facing text is plain language, does not read as legal advice, and does not present Saboot as the expert
- [ ] No telemetry, analytics or new third-party requests
- [ ] Legal text changes (for example `src/sakshya/certificate/schedule.ts`) cite the Gazette or notification and were reviewed by someone with legal training (name them below), or this PR does not change legal text
- [ ] Device guide changes give a source and a confidence level, or this PR does not change device guides
- [ ] Hasher changes include the rebuilt `src/engine/hash/saboot_hash.wasm` and `npm run wasm:check` passes, or this PR does not change the Rust crate
- [ ] `CHANGELOG.md` updated under "Unreleased"
- [ ] Every commit is signed off (`git commit -s`)

## Legal review (only for changes to legal text)

<!-- Who reviewed the change, and their legal training (e.g. "practising advocate, Karnataka"). -->
