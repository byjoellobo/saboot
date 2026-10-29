// Builds crates/sakshya-hash to WebAssembly and copies the module into src/.
// The built .wasm is committed, so web-only contributors (and static hosts
// without Rust) can still run `vite build`. If cargo is missing we keep the
// committed file and warn instead of failing.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCargo } from "./cargo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = join(root, "crates", "sakshya-hash", "Cargo.toml");
const built = join(root, "crates", "sakshya-hash", "target", "wasm32-unknown-unknown", "release", "sakshya_hash.wasm");
const dest = join(root, "src", "engine", "hash", "sakshya_hash.wasm");

function hasCargo() {
  try {
    execFileSync("cargo", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (!hasCargo()) {
  if (existsSync(dest)) {
    console.warn("[wasm] cargo not found; using committed", dest);
    process.exit(0);
  }
  console.error("[wasm] cargo not found and no committed wasm at", dest);
  console.error("[wasm] install Rust, then: rustup target add wasm32-unknown-unknown");
  process.exit(1);
}

try {
  runCargo(["build", "--release", "--target", "wasm32-unknown-unknown", "--manifest-path", manifest], { remapPaths: true });
} catch (err) {
  if (existsSync(dest)) {
    console.warn("[wasm] build failed; keeping committed", dest);
    console.warn(err instanceof Error ? err.message : err);
    process.exit(0);
  }
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(built, dest);
console.log(`[wasm] ${dest} (${statSync(dest).size} bytes)`);
