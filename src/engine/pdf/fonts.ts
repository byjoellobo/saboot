// Font registry and script detection for PDF output.
//
// Text is split into "runs" that each use one font: Latin text uses Noto Sans,
// each Indian script uses its own Noto font, and characters no font covers
// (mostly emoji) are printed as their code point, e.g. [U+1F44D].

export type BaseStyle = "sans" | "sansBold" | "mono";
export type ScriptFont = "deva" | "beng" | "guru" | "gujr" | "orya" | "taml" | "telu" | "knda" | "mlym";
export type FontKey = BaseStyle | ScriptFont;

export const FONT_FILES: Readonly<Record<FontKey, string>> = {
  sans: "NotoSans-Regular.ttf",
  sansBold: "NotoSans-Bold.ttf",
  mono: "NotoSansMono-Regular.ttf",
  deva: "NotoSansDevanagari-Regular.ttf",
  beng: "NotoSansBengali-Regular.ttf",
  guru: "NotoSansGurmukhi-Regular.ttf",
  gujr: "NotoSansGujarati-Regular.ttf",
  orya: "NotoSansOriya-Regular.ttf",
  taml: "NotoSansTamil-Regular.ttf",
  telu: "NotoSansTelugu-Regular.ttf",
  knda: "NotoSansKannada-Regular.ttf",
  mlym: "NotoSansMalayalam-Regular.ttf",
};

const SCRIPT_RANGES: ReadonlyArray<readonly [number, number, ScriptFont]> = [
  [0x0900, 0x097f, "deva"],
  [0xa8e0, 0xa8ff, "deva"],
  [0x1cd0, 0x1cff, "deva"],
  [0x0980, 0x09ff, "beng"],
  [0x0a00, 0x0a7f, "guru"],
  [0x0a80, 0x0aff, "gujr"],
  [0x0b00, 0x0b7f, "orya"],
  [0x0b80, 0x0bff, "taml"],
  [0x0c00, 0x0c7f, "telu"],
  [0x0c80, 0x0cff, "knda"],
  [0x0d00, 0x0d7f, "mlym"],
];

export function scriptFontFor(cp: number): ScriptFont | null {
  for (const [lo, hi, key] of SCRIPT_RANGES) if (cp >= lo && cp <= hi) return key;
  return null;
}

export type FontLoader = (file: string) => Promise<Uint8Array>;

/** Loader for the browser: fonts are served (and precached) from /fonts. */
export function browserFontLoader(base: string): FontLoader {
  return async (file) => {
    const res = await fetch(`${base.replace(/\/?$/, "/")}fonts/${file}`);
    if (!res.ok) throw new Error(`Could not load font ${file} (${res.status}). Is the app fully installed for offline use?`);
    return new Uint8Array(await res.arrayBuffer());
  };
}

export interface Run {
  readonly text: string;
  readonly font: FontKey;
}

const ZWNJ = 0x200c;
const ZWJ = 0x200d;

function isVariationSelector(cp: number): boolean {
  return (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef);
}

function isInvisibleFormat(cp: number): boolean {
  // Bidi marks and BOM: WhatsApp on iOS puts U+200E before many lines.
  return cp === 0x200e || cp === 0x200f || cp === 0xfeff || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069);
}

function isSpace(cp: number): boolean {
  return cp === 0x20 || cp === 0x09 || cp === 0xa0 || cp === 0x202f || cp === 0x2009 || cp === 0x2002 || cp === 0x2003;
}

/**
 * Split text into font runs. `hasGlyph(base, cp)` reports whether a base font
 * covers a code point; anything uncovered becomes a visible [U+XXXX] marker.
 */
export function splitRuns(text: string, base: BaseStyle, hasGlyph: (font: BaseStyle, cp: number) => boolean): Run[] {
  const runs: Run[] = [];
  let current: { font: FontKey; text: string } | null = null;

  const push = (font: FontKey, piece: string) => {
    if (current && current.font === font) {
      current.text += piece;
      return;
    }
    if (current) runs.push(current);
    current = { font, text: piece };
  };

  for (const ch of text) {
    const cp = ch.codePointAt(0) as number;
    if (isVariationSelector(cp) || isInvisibleFormat(cp)) continue;
    if (cp === ZWJ || cp === ZWNJ) {
      // Joiners matter inside Indic words; between emoji they are just glue.
      const cur = current as { font: FontKey; text: string } | null;
      if (cur && scriptFontFor(cur.text.codePointAt(cur.text.length - 1) ?? 0)) cur.text += ch;
      continue;
    }
    const script = scriptFontFor(cp);
    if (script) {
      push(script, ch);
    } else if (isSpace(cp)) {
      // Keep spaces in whatever run is open (every font has a space glyph).
      push((current as { font: FontKey } | null)?.font ?? base, cp === 0x09 ? "    " : " ");
    } else if (hasGlyph(base, cp)) {
      push(base, ch);
    } else {
      push(base, `[U+${cp.toString(16).toUpperCase().padStart(4, "0")}]`);
    }
  }
  if (current) runs.push(current);
  return runs;
}
