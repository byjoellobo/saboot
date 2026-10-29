// Runs cargo with a toolchain that can actually link on this machine.
//
// Rust build scripts (e.g. crc32fast's) are compiled for the HOST, so even a
// wasm32 build needs a host linker. Windows machines without Visual Studio
// Build Tools have no MSVC `link.exe`; rustup's GNU toolchain ships its own
// MinGW linker, so we fall back to it when it is installed.
//
// Override with SAKSHYA_RUST_TOOLCHAIN=<toolchain> (e.g. "stable").
import { execFileSync, spawnSync } from "node:child_process";

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

export function pickToolchain() {
  if (process.env.SAKSHYA_RUST_TOOLCHAIN) return process.env.SAKSHYA_RUST_TOOLCHAIN;
  if (process.platform !== "win32" || hasMsvcLinker()) return null;
  const gnu = installedToolchains()
    .split(/\r?\n/)
    .map((line) => line.split(/\s+/)[0])
    .find((name) => name && name.includes("windows-gnu"));
  return gnu ?? null;
}

export function runCargo(args, options = {}) {
  const toolchain = pickToolchain();
  const fullArgs = toolchain ? [`+${toolchain}`, ...args] : args;
  if (toolchain) console.log(`[cargo] using toolchain ${toolchain}`);
  const result = spawnSync("cargo", fullArgs, { stdio: "inherit", ...options });
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
    runCargo(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
