// Rebuilds the hasher and checks that the committed .wasm matches the source.
// Used in CI so nobody can ship a binary that differs from the Rust code.
//
// Builds on Windows and Linux differ only in the path separator inside
// (already remapped) panic-location strings, so "\" is normalised to "/"
// before comparing. Everything else must match byte for byte.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCargo } from "./cargo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = join(root, "crates", "saboot-hash", "Cargo.toml");
const built = join(root, "crates", "saboot-hash", "target", "wasm32-unknown-unknown", "release", "saboot_hash.wasm");
const committed = join(root, "src", "engine", "hash", "saboot_hash.wasm");

function normalise(bytes) {
  return Buffer.from(bytes.map((b) => (b === 0x5c ? 0x2f : b)));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function leaksHomePath(bytes) {
  const text = Buffer.from(bytes).toString("latin1");
  return /[A-Za-z]:[\\/](Users|Documents and Settings)[\\/]|\/home\/[^/]+\/|\/Users\/[^/]+\//.test(text);
}

runCargo(["build", "--release", "--target", "wasm32-unknown-unknown", "--manifest-path", manifest], { remapPaths: true });

const fresh = readFileSync(built);
const current = readFileSync(committed);
const a = sha256(normalise(fresh));
const b = sha256(normalise(current));
console.log(`[wasm:check] rebuilt   ${a} (${fresh.length} bytes)`);
console.log(`[wasm:check] committed ${b} (${current.length} bytes)`);

if (leaksHomePath(current)) {
  console.error("[wasm:check] The committed wasm contains a home-directory path. Rebuild with `npm run wasm`.");
  process.exit(1);
}
if (a !== b) {
  console.error("[wasm:check] The committed wasm does not match the Rust source. Run `npm run wasm` and commit the result.");
  console.error("[wasm:check] (Use the Rust version pinned in rust-toolchain.toml; different compilers produce different bytes.)");
  process.exit(1);
}
console.log("[wasm:check] OK: committed wasm matches the source.");
