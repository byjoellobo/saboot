# Versioning, CI/CD and releases

## Versioning

Saboot follows [Semantic Versioning](https://semver.org/). While the version is below 1.0, minor versions (0.**x**.0) may contain breaking changes; they are always listed in [CHANGELOG.md](../CHANGELOG.md).

For an evidence tool, "breaking" includes more than code interfaces. A change is breaking if it:

- changes how any hash value, byte range or per-message hash is computed for the same input;
- changes the verify-link payload (`v1.` in the URL fragment) so that QR codes on printed certificates stop working;
- changes the backup format (`saboot-backup`, version 1) so that older backups no longer import;
- changes the statutory text in `src/sakshya/certificate/schedule.ts` (this also needs a Gazette citation and a legal review).

Such changes need a new major version after 1.0, or a clearly flagged minor version before it, and must keep reading the old format where possible.

## Continuous integration

Every push to `main` and every pull request runs [`.github/workflows/ci.yml`](../.github/workflows/ci.yml):

| Job    | What it checks                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `web`  | `npm run lint`, `npm run format:check`, `tsc --noEmit`, unit tests with coverage thresholds (`npx vitest run --coverage`), production build, Playwright end-to-end tests on desktop and phone viewports            |
| `rust` | Rust hasher tests and clippy (warnings are errors) on the pinned compiler, then `npm run wasm:check`, which rebuilds the WebAssembly and fails if it differs from the committed `src/engine/hash/saboot_hash.wasm` |

Dependabot opens weekly update pull requests for npm, Cargo and GitHub Actions. Cargo updates change the wasm, so they need `npm run wasm` and a commit of the rebuilt file before `wasm:check` passes.

## Continuous deployment

| Trigger                | Workflow                                          | Result                                                                                                         |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Push to `main`         | [`pages.yml`](../.github/workflows/pages.yml)     | Builds for the `/saboot/` sub-path and deploys to GitHub Pages: <https://byjoellobo.github.io/saboot/>         |
| Push of a tag `vX.Y.Z` | [`release.yml`](../.github/workflows/release.yml) | Checks the tag matches `package.json`, runs lint, types and unit tests, builds, and publishes a GitHub release |

Each release has these assets:

- `saboot-vX.Y.Z-web.zip`: the built app for hosting at a site root (any static HTTPS host);
- `saboot-vX.Y.Z-sample-certificate.pdf` and `-sample-transcript.pdf`: outputs from the synthetic demo case;
- `SHA256SUMS`: hashes of all of the above;
- a GitHub build provenance attestation for every asset (`gh attestation verify <file> --repo byjoellobo/saboot`).

## Making a release

1. Make sure `main` is green in CI.
2. Add a section to `CHANGELOG.md` for the new version (move items out of `[Unreleased]`) and update the comparison links at the bottom.
3. Bump the version without tagging: `npm version 0.4.0 --no-git-tag-version`. Update `version` and `date-released` in `CITATION.cff`.
4. If the README screenshots or sample PDFs should change: `npx vite build`, `npx vite preview --port 4791`, then `node scripts/screenshots.mjs docs/images`.
5. Commit: `git commit -s -m "chore: release v0.4.0"`, and push to `main`.
6. Tag and push the tag:

   ```bash
   git tag -a v0.4.0 -m "Saboot v0.4.0"
   git push origin v0.4.0
   ```

7. Watch the Release workflow. When it finishes, check the release page and that `sha256sum -c SHA256SUMS` passes on the downloaded assets.

## Rust and the committed wasm

The hasher is pinned to the Rust version in `crates/saboot-hash/rust-toolchain.toml`, because different compilers produce different bytes. Builds remap local paths (`scripts/cargo.mjs`), so the binary contains no developer's home directory, and builds on Windows and Linux differ only in path separators, which `wasm:check` normalises.

To change the hasher: edit `crates/saboot-hash`, run `npm run test:rust`, `npm run lint:rust` and `npm run wasm`, and commit the source and the rebuilt `.wasm` together. To move to a newer compiler, change the channel in `rust-toolchain.toml`, rebuild, and commit both.
