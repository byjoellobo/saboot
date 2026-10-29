// Downloads the Noto fonts used to draw PDFs (SIL Open Font License 1.1).
// Uses the *hinted* builds: pdf-lib + @pdf-lib/fontkit drop glyphs when
// subsetting the unhinted builds, while the hinted ones subset correctly.
// PDFs embed subsets of these fonts so Hindi, Kannada, Tamil and other Indian
// scripts in WhatsApp chats print correctly. Fonts are committed under
// public/fonts so the app works offline; run this only to refresh them.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "fonts");
const BASE = "https://github.com/notofonts/notofonts.github.io/raw/main/fonts";

const FONTS = [
  ["NotoSans", "NotoSans-Regular.ttf"],
  ["NotoSans", "NotoSans-Bold.ttf"],
  ["NotoSansMono", "NotoSansMono-Regular.ttf"],
  ["NotoSansDevanagari", "NotoSansDevanagari-Regular.ttf"],
  ["NotoSansBengali", "NotoSansBengali-Regular.ttf"],
  ["NotoSansGurmukhi", "NotoSansGurmukhi-Regular.ttf"],
  ["NotoSansGujarati", "NotoSansGujarati-Regular.ttf"],
  ["NotoSansOriya", "NotoSansOriya-Regular.ttf"],
  ["NotoSansTamil", "NotoSansTamil-Regular.ttf"],
  ["NotoSansTelugu", "NotoSansTelugu-Regular.ttf"],
  ["NotoSansKannada", "NotoSansKannada-Regular.ttf"],
  ["NotoSansMalayalam", "NotoSansMalayalam-Regular.ttf"],
];

const OFL_URL = "https://raw.githubusercontent.com/notofonts/latin-greek-cyrillic/main/OFL.txt";

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

mkdirSync(outDir, { recursive: true });
for (const [family, file] of FONTS) {
  const url = `${BASE}/${family}/hinted/ttf/${file}`;
  const bytes = await download(url);
  writeFileSync(join(outDir, file), bytes);
  console.log(`${file.padEnd(36)} ${bytes.length} bytes`);
}
writeFileSync(join(outDir, "OFL.txt"), await download(OFL_URL));
console.log("OFL.txt written");
