// Runs cargo with a toolchain that can actually link on this machine.
//
// Rust build scripts (e.g. crc32fast's) are compiled for the HOST, so even a
// wasm32 build needs a host linker. Windows machines without Visual Studio
// Build Tools have no MSVC `link.exe`; rustup's GNU toolchain ships its own
// MinGW linker, so we fall back to it when it is installed.
//
// Override with SAKSHYA_RUST_TOOLCHAIN=<toolchain> (e.g. "stable").
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function installedToolchains() {
  try {
    return execFileSync("rustup", ["toolchain", "list"], { encoding: "utf8" });
  } catch {
    return "";
  }
}

function hasMsvcLinker() {
  const probe = spawnSync("where", ["link.exe"], { encoding: "utf8", shell: false });
  // Git for Windows ships a GNU `link` utility; only accept MSVC's link.exe.
  return probe.status === 0 && /Microsoft Visual Studio|VC\\Tools/i.test(probe.stdout);
}

/** The Rust version pinned in crates/sakshya-hash/rust-toolchain.toml. */
export function pinnedChannel() {
  try {
    const toml = readFileSync(join(root, "crates", "sakshya-hash", "rust-toolchain.toml"), "utf8");
    return toml.match(/^channel\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function pickToolchain() {
  if (process.env.SAKSHYA_RUST_TOOLCHAIN) return process.env.SAKSHYA_RUST_TOOLCHAIN;
  if (process.platform !== "win32" || hasMsvcLinker()) return null;
  const names = installedToolchains()
    .split(/\r?\n/)
    .map((line) => line.split(/\s+/)[0])
    .filter((name) => name && name.includes("windows-gnu"));
  // The wasm is compared byte for byte in CI, so use the pinned compiler if it is installed.
  const pinned = pinnedChannel();
  const exact = pinned ? names.find((n) => n.startsWith(`${pinned}-`)) : undefined;
  if (exact) return exact;
  if (names[0] && pinned) {
    console.warn(
      `[cargo] Rust ${pinned} (GNU) is not installed; using ${names[0]}. The wasm may not match CI.\n` +
        `[cargo] Install it with: rustup toolchain install ${pinned}-x86_64-pc-windows-gnu --profile minimal --target wasm32-unknown-unknown`,
    );
  }
  return names[0] ?? null;
}

/**
 * Panic messages compiled into the binary contain source paths. Remap them so
 * the wasm never contains the builder's home directory (privacy) and so builds
 * on different machines produce the same bytes (reproducibility).
 */
export function remapFlags() {
  const cargoHome = process.env.CARGO_HOME ?? join(homedir(), ".cargo");
  return [
    `--remap-path-prefix=${join(cargoHome, "registry", "src")}=/crates`,
    `--remap-path-prefix=${join(cargoHome, "git", "checkouts")}=/git`,
    `--remap-path-prefix=${root}=/sakshya-kit`,
  ];
}

export function runCargo(args, options = {}) {
  const { remapPaths = false, env: extraEnv = {}, cwd: givenCwd, ...spawnOptions } = options;
  const toolchain = pickToolchain();
  const fullArgs = toolchain ? [`+${toolchain}`, ...args] : args;
  if (toolchain) console.log(`[cargo] using toolchain ${toolchain}`);
  const env = { ...process.env, ...extraEnv };
  if (remapPaths) {
    // CARGO_ENCODED_RUSTFLAGS uses \x1f separators, so paths with spaces work.
    env.CARGO_ENCODED_RUSTFLAGS = remapFlags().join("\x1f");
    delete env.RUSTFLAGS;
  }
  // Run inside the crate so rustup honours crates/sakshya-hash/rust-toolchain.toml.
  const cwd = givenCwd ?? join(root, "crates", "sakshya-hash");
  const result = spawnSync("cargo", fullArgs, { stdio: "inherit", ...spawnOptions, cwd, env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const hint =
      process.platform === "win32" && !toolchain
        ? "\n[cargo] No MSVC linker found. Either install VS Build Tools (C++), or run:\n" +
          "  rustup toolchain install stable-x86_64-pc-windows-gnu --profile minimal\n" +
          "  rustup target add wasm32-unknown-unknown --toolchain stable-x86_64-pc-windows-gnu"
        : "";
    throw new Error(`cargo ${args.join(" ")} failed with status ${result.status}${hint}`);
  }
}

// CLI: node scripts/cargo.mjs <cargo args...>
if (process.argv[1] && process.argv[1].endsWith("cargo.mjs")) {
  try {
    // Manifest paths on the command line are relative to the repository root.
    const args = process.argv.slice(2).map((arg, i, all) => (all[i - 1] === "--manifest-path" ? resolve(root, arg) : arg));
    runCargo(args);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
