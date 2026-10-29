// A small flowing-layout PDF writer on top of pdf-lib.
//
// It handles what evidence documents need and pdf-lib leaves to the caller:
// mixed-script text with per-script fonts, word wrapping, tables that break
// across pages, check boxes, QR codes, and "Page X of Y" footers.
// @pdf-lib/fontkit's Indic shaper (used for Hindi, Kannada, Tamil...) is
// transpiled with generators and expects a global regeneratorRuntime.
import "regenerator-runtime/runtime";
import fontkit from "@pdf-lib/fontkit";
import { degrees, PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import QRCode from "qrcode";
import { FONT_FILES, splitRuns, type BaseStyle, type FontKey, type FontLoader, type Run } from "./fonts";

export const A4: readonly [number, number] = [595.28, 841.89];

export const INK = rgb(0.08, 0.09, 0.12);
export const MUTED = rgb(0.38, 0.4, 0.45);
export const FILL = rgb(0.06, 0.16, 0.45);
export const RULE = rgb(0.75, 0.76, 0.8);
export const WARN = rgb(0.62, 0.1, 0.1);

export interface Span {
  readonly text: string;
  readonly style?: BaseStyle;
  readonly color?: RGB;
}

export interface Block {
  readonly spans: readonly Span[];
  readonly size: number;
  readonly align?: "left" | "center" | "right";
}

interface LaidRun extends Run {
  readonly width: number;
  readonly color: RGB;
}

interface Line {
  readonly runs: readonly LaidRun[];
  readonly width: number;
  readonly size: number;
  readonly height: number;
  readonly align: "left" | "center" | "right";
}

export interface Column {
  readonly header: string;
  /** Fraction of the available width. */
  readonly width: number;
}

/** A table cell: blocks stacked vertically (e.g. text, then a small hash line). */
export type Cell = readonly Block[];
/** A table row: one cell per column. */
export type Row = readonly Cell[];

export interface WriterOptions {
  readonly loader: FontLoader;
  readonly title: string;
  readonly subject: string;
  readonly keywords?: readonly string[];
  readonly createdAt?: Date;
}

const LINE_GAP = 1.32;

export class PdfWriter {
  readonly doc: PDFDocument;
  page!: PDFPage;
  /** Distance from the bottom of the page to the next baseline area. */
  y = 0;
  readonly margin = { left: 50, right: 50, top: 54, bottom: 62 };

  private readonly fonts = new Map<FontKey, PDFFont>();
  private readonly coverage = new Map<BaseStyle, { hasGlyphForCodePoint(cp: number): boolean }>();
  private readonly widthCache = new Map<string, number>();

  private constructor(
    doc: PDFDocument,
    private readonly loader: FontLoader,
  ) {
    this.doc = doc;
  }

  static async create(opts: WriterOptions): Promise<PdfWriter> {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const when = opts.createdAt ?? new Date();
    doc.setTitle(opts.title, { showInWindowTitleBar: true });
    doc.setSubject(opts.subject);
    doc.setCreator("Sakshya Kit");
    doc.setProducer("Sakshya Kit (pdf-lib)");
    doc.setKeywords([...(opts.keywords ?? [])]);
    doc.setCreationDate(when);
    doc.setModificationDate(when);
    doc.setLanguage("en-IN");
    const w = new PdfWriter(doc, opts.loader);
    await w.loadFont("sans");
    await w.loadFont("sansBold");
    await w.loadFont("mono");
    w.newPage();
    return w;
  }

  get width(): number {
    return A4[0] - this.margin.left - this.margin.right;
  }

  get pageCount(): number {
    return this.doc.getPageCount();
  }

  newPage(): void {
    this.page = this.doc.addPage([...A4] as [number, number]);
    this.y = A4[1] - this.margin.top;
  }

  /** Start a new page if fewer than `height` points remain. */
  ensure(height: number): void {
    if (this.y - height < this.margin.bottom) this.newPage();
  }

  spacer(height: number): void {
    this.y -= height;
  }

  rule(color: RGB = RULE, thickness = 0.6): void {
    this.ensure(6);
    this.y -= 3;
    this.page.drawLine({
      start: { x: this.margin.left, y: this.y },
      end: { x: A4[0] - this.margin.right, y: this.y },
      thickness,
      color,
    });
    this.y -= 5;
  }

  // ---------------------------------------------------------------- fonts

  private async loadFont(key: FontKey): Promise<PDFFont> {
    const existing = this.fonts.get(key);
    if (existing) return existing;
    const bytes = await this.loader(FONT_FILES[key]);
    const font = await this.doc.embedFont(bytes, { subset: true });
    this.fonts.set(key, font);
    if (key === "sans" || key === "sansBold" || key === "mono") {
      this.coverage.set(key, fontkit.create(bytes as never) as unknown as { hasGlyphForCodePoint(cp: number): boolean });
    }
    return font;
  }

  private font(key: FontKey): PDFFont {
    const f = this.fonts.get(key);
    if (!f) throw new Error(`Font ${key} used before loading`);
    return f;
  }

  private runs(text: string, style: BaseStyle): Run[] {
    return splitRuns(text, style, (base, cp) => this.coverage.get(base)?.hasGlyphForCodePoint(cp) ?? false);
  }

  /** Load every font the given spans will need. Call before layout. */
  async prepare(spans: readonly Span[]): Promise<void> {
    const needed = new Set<FontKey>();
    for (const s of spans) for (const r of this.runs(s.text, s.style ?? "sans")) needed.add(r.font);
    for (const key of needed) await this.loadFont(key);
  }

  private measure(run: Run, size: number): number {
    const key = `${run.font}|${size}|${run.text}`;
    const cached = this.widthCache.get(key);
    if (cached !== undefined) return cached;
    const w = this.font(run.font).widthOfTextAtSize(run.text, size);
    if (this.widthCache.size > 50_000) this.widthCache.clear();
    this.widthCache.set(key, w);
    return w;
  }

  // ---------------------------------------------------------------- layout

  private static segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;

  private graphemes(text: string): string[] {
    const seg = PdfWriter.segmenter;
    return seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text);
  }

  /** Lay out a block into wrapped lines. Fonts must already be prepared. */
  layout(block: Block, maxWidth: number): Line[] {
    const size = block.size;
    const height = size * LINE_GAP;
    const align = block.align ?? "left";
    const lines: Line[] = [];
    let cur: LaidRun[] = [];
    let curWidth = 0;

    const flush = () => {
      // Drop trailing spaces from the line's width.
      const trimmed = trimTrailing(cur, (r) => this.measure(r, size));
      lines.push({ runs: trimmed.runs, width: trimmed.width, size, height, align });
      cur = [];
      curWidth = 0;
    };

    const tokenRuns = (text: string, style: BaseStyle, color: RGB): LaidRun[] =>
      this.runs(text, style).map((r) => ({ ...r, color, width: this.measure(r, size) }));

    const place = (token: LaidRun[]) => {
      const w = token.reduce((s, r) => s + r.width, 0);
      const wNoSpace = w - trailingSpaceWidth(token, (r) => this.measure(r, size));
      if (cur.length > 0 && curWidth + wNoSpace > maxWidth) flush();
      if (wNoSpace > maxWidth) {
        // Very long token (hash, URL, unbroken text): break by grapheme.
        for (const r of token) {
          for (const g of this.graphemes(r.text)) {
            const piece: LaidRun = { text: g, font: r.font, color: r.color, width: this.measure({ text: g, font: r.font }, size) };
            if (cur.length > 0 && curWidth + piece.width > maxWidth) flush();
            appendRun(cur, piece);
            curWidth += piece.width;
          }
        }
        return;
      }
      for (const r of token) appendRun(cur, r);
      curWidth += w;
    };

    for (const span of block.spans) {
      const style = span.style ?? "sans";
      const color = span.color ?? INK;
      const paragraphs = span.text.split("\n");
      paragraphs.forEach((para, i) => {
        if (i > 0) flush();
        const tokens = para.match(/\S+\s*|\s+/g) ?? [];
        for (const t of tokens) place(tokenRuns(t, style, color));
      });
    }
    if (cur.length > 0 || lines.length === 0) flush();
    return lines;
  }

  private drawLine(line: Line, x: number, width: number, baselineY: number, page: PDFPage = this.page): void {
    let at = x;
    if (line.align === "center") at = x + (width - line.width) / 2;
    if (line.align === "right") at = x + width - line.width;
    for (const r of line.runs) {
      if (r.text.length > 0) {
        page.drawText(r.text, { x: at, y: baselineY, size: line.size, font: this.font(r.font), color: r.color });
      }
      at += r.width;
    }
  }

  /** Flowing paragraph across the full width (or an indented width). */
  async paragraph(
    spans: readonly Span[],
    size = 10,
    opts: { indent?: number; align?: Block["align"]; after?: number } = {},
  ): Promise<void> {
    await this.prepare(spans);
    const indent = opts.indent ?? 0;
    const lines = this.layout({ spans, size, align: opts.align }, this.width - indent);
    for (const line of lines) {
      this.ensure(line.height);
      this.y -= line.height;
      this.drawLine(line, this.margin.left + indent, this.width - indent, this.y + line.size * 0.28);
    }
    this.y -= opts.after ?? size * 0.5;
  }

  async heading(text: string, size = 13, align: Block["align"] = "left"): Promise<void> {
    this.ensure(size * 3);
    await this.paragraph([{ text, style: "sansBold" }], size, { align, after: size * 0.4 });
  }

  /** A row of labelled tick boxes, e.g. the Schedule's device-source boxes. */
  async checkboxes(items: readonly { label: string; checked: boolean }[], size = 9.5, indent = 0): Promise<void> {
    await this.prepare(items.map((i) => ({ text: i.label })));
    const box = size * 0.95;
    const gap = size * 0.95;
    const rowHeight = size * 1.9;
    let x = this.margin.left + indent;
    this.ensure(rowHeight);
    this.y -= rowHeight;
    for (const item of items) {
      const labelWidth = this.font("sans").widthOfTextAtSize(item.label, size);
      if (x + box + 4 + labelWidth > A4[0] - this.margin.right) {
        x = this.margin.left + indent;
        this.ensure(rowHeight);
        this.y -= rowHeight;
      }
      this.drawCheckbox(x, this.y, box, item.checked);
      this.page.drawText(item.label, { x: x + box + 4, y: this.y + 1, size, font: this.font("sans"), color: INK });
      x += box + 4 + labelWidth + gap;
    }
    this.y -= size * 0.5;
  }

  drawCheckbox(x: number, y: number, size: number, checked: boolean): void {
    this.page.drawRectangle({ x, y, width: size, height: size, borderColor: INK, borderWidth: 0.8 });
    if (checked) {
      // A drawn tick mark, so it does not depend on any font having U+2713.
      this.page.drawLine({
        start: { x: x + size * 0.18, y: y + size * 0.52 },
        end: { x: x + size * 0.42, y: y + size * 0.2 },
        thickness: 1.4,
        color: FILL,
      });
      this.page.drawLine({
        start: { x: x + size * 0.42, y: y + size * 0.2 },
        end: { x: x + size * 0.86, y: y + size * 0.86 },
        thickness: 1.4,
        color: FILL,
      });
    }
  }

  /**
   * Table with wrapped cells. Rows that fit on one page are never split;
   * taller rows continue on the next page. The header repeats on each page.
   */
  async table(
    columns: readonly Column[],
    rows: readonly Row[],
    opts: { headerSize?: number; padding?: number; zebra?: boolean; header?: boolean } = {},
  ): Promise<void> {
    const pad = opts.padding ?? 4;
    const headerSize = opts.headerSize ?? 8;
    const widths = columns.map((c) => c.width * this.width);
    await this.prepare(columns.map((c) => ({ text: c.header, style: "sansBold" })));
    for (const row of rows) for (const cell of row) for (const b of cell) await this.prepare(b.spans);

    const headerLines = columns.map((c, i) =>
      this.layout({ spans: [{ text: c.header, style: "sansBold" }], size: headerSize }, (widths[i] ?? 0) - pad * 2),
    );
    const headerHeight = Math.max(...headerLines.map((ls) => ls.reduce((s, l) => s + l.height, 0))) + pad * 2;
    const pageRoom = A4[1] - this.margin.top - this.margin.bottom - headerHeight - pad * 2;

    const drawHeader = () => {
      this.ensure(headerHeight + 20);
      const top = this.y;
      this.page.drawRectangle({
        x: this.margin.left,
        y: top - headerHeight,
        width: this.width,
        height: headerHeight,
        color: rgb(0.92, 0.93, 0.96),
      });
      let x = this.margin.left;
      headerLines.forEach((ls, i) => {
        let y = top - pad;
        for (const l of ls) {
          y -= l.height;
          this.drawLine(l, x + pad, (widths[i] ?? 0) - pad * 2, y + l.size * 0.28);
        }
        x += widths[i] ?? 0;
      });
      this.y = top - headerHeight;
    };
    const freshPage = () => {
      this.newPage();
      drawHeader();
    };

    if (opts.header ?? true) drawHeader();
    rows.forEach((row, rowIndex) => {
      // Flatten each cell to a queue of lines (blocks stacked vertically).
      const queues = row.map((cell, i) => cell.flatMap((b) => this.layout(b, (widths[i] ?? 0) - pad * 2)));
      const fullHeight = Math.max(...queues.map((q) => q.reduce((s, l) => s + l.height, 0))) + pad * 2;
      if (fullHeight <= pageRoom && this.y - fullHeight < this.margin.bottom) freshPage();

      let onFreshPage = false;
      while (queues.some((q) => q.length > 0)) {
        const available = this.y - this.margin.bottom - pad * 2;
        const smallest = Math.min(...queues.filter((q) => q.length > 0).map((q) => q[0]?.height ?? 0));
        const force = available < smallest && onFreshPage;
        if (available < smallest && !force) {
          freshPage();
          onFreshPage = true;
          continue;
        }
        // Take as many lines from each column as fit (at least one when forced).
        const taken = queues.map((q) => {
          const out: Line[] = [];
          let h = 0;
          while (q.length > 0 && (h + (q[0]?.height ?? 0) <= available || (force && out.length === 0))) {
            const l = q.shift() as Line;
            h += l.height;
            out.push(l);
          }
          return { lines: out, height: h };
        });
        const rowHeight = Math.max(...taken.map((t) => t.height)) + pad * 2;
        const top = this.y;
        if (opts.zebra && rowIndex % 2 === 1) {
          this.page.drawRectangle({
            x: this.margin.left,
            y: top - rowHeight,
            width: this.width,
            height: rowHeight,
            color: rgb(0.975, 0.975, 0.985),
          });
        }
        let x = this.margin.left;
        taken.forEach((t, i) => {
          let y = top - pad;
          for (const l of t.lines) {
            y -= l.height;
            this.drawLine(l, x + pad, (widths[i] ?? 0) - pad * 2, y + l.size * 0.28);
          }
          x += widths[i] ?? 0;
        });
        this.page.drawLine({
          start: { x: this.margin.left, y: top - rowHeight },
          end: { x: A4[0] - this.margin.right, y: top - rowHeight },
          thickness: 0.4,
          color: RULE,
        });
        this.y = top - rowHeight;
        onFreshPage = false;
        if (queues.some((q) => q.length > 0)) {
          freshPage();
          onFreshPage = true;
        }
      }
    });
    this.y -= 6;
  }

  /** Draw a QR code with its top-left corner at (x, top). */
  drawQr(text: string, x: number, top: number, size: number): void {
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const quiet = 2;
    const cell = size / (n + quiet * 2);
    this.page.drawRectangle({ x, y: top - size, width: size, height: size, color: rgb(1, 1, 1) });
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!qr.modules.get(r, c)) {
          c++;
          continue;
        }
        const start = c;
        while (c < n && qr.modules.get(r, c)) c++;
        this.page.drawRectangle({
          x: x + (quiet + start) * cell,
          y: top - (quiet + r + 1) * cell,
          width: (c - start) * cell + 0.05,
          height: cell + 0.05,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  /** Index of the current page (0-based). */
  get pageIndex(): number {
    return this.doc.getPageCount() - 1;
  }

  /**
   * Mark pages [from, to] with a faint diagonal watermark and a one-line
   * banner at the top, so every page of a draft says it is a draft.
   */
  async markPages(from: number, to: number, watermark: string, banner: string): Promise<void> {
    await this.prepare([
      { text: watermark, style: "sansBold" },
      { text: banner, style: "sansBold" },
    ]);
    const pages = this.doc.getPages().slice(from, to + 1);
    for (const page of pages) {
      page.drawText(watermark, {
        x: 120,
        y: 230,
        size: 46,
        font: this.font("sansBold"),
        color: rgb(0.75, 0.1, 0.1),
        opacity: 0.08,
        rotate: degrees(38),
      });
      page.drawText(banner, { x: this.margin.left, y: A4[1] - 30, size: 7.5, font: this.font("sansBold"), color: WARN });
    }
  }

  /** Text at an absolute position (single line, no wrap). */
  async textAt(
    text: string,
    x: number,
    y: number,
    size: number,
    style: BaseStyle = "sans",
    color: RGB = INK,
    page: PDFPage = this.page,
  ): Promise<number> {
    await this.prepare([{ text, style }]);
    const [line] = this.layout({ spans: [{ text, style, color }], size }, 10_000);
    if (line) this.drawLine(line, x, line.width, y, page);
    return line?.width ?? 0;
  }

  /** Stamp headers/footers on every page, then serialise. */
  async finish(footer: (pageNumber: number, pageCount: number) => { left: string; right: string }): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as PDFPage;
      const { left, right } = footer(i + 1, pages.length);
      page.drawLine({ start: { x: this.margin.left, y: 44 }, end: { x: A4[0] - this.margin.right, y: 44 }, thickness: 0.4, color: RULE });
      await this.textAt(left, this.margin.left, 32, 7, "sans", MUTED, page);
      await this.prepare([{ text: right }]);
      const [line] = this.layout({ spans: [{ text: right, color: MUTED }], size: 7 }, 10_000);
      if (line) this.drawLine(line, A4[0] - this.margin.right - line.width, line.width, 32, page);
    }
    return this.doc.save({ useObjectStreams: false });
  }
}

function appendRun(line: LaidRun[], run: LaidRun): void {
  const last = line[line.length - 1];
  if (last && last.font === run.font && last.color === run.color) {
    line[line.length - 1] = { ...last, text: last.text + run.text, width: last.width + run.width };
  } else {
    line.push(run);
  }
}

function trailingSpaceWidth(runs: readonly LaidRun[], measure: (r: Run) => number): number {
  const last = runs[runs.length - 1];
  if (!last) return 0;
  const trimmed = last.text.replace(/\s+$/, "");
  if (trimmed.length === last.text.length) return 0;
  return last.width - measure({ text: trimmed, font: last.font });
}

function trimTrailing(runs: readonly LaidRun[], measure: (r: Run) => number): { runs: LaidRun[]; width: number } {
  const out = [...runs];
  const last = out[out.length - 1];
  if (last) {
    const trimmed = last.text.replace(/\s+$/, "");
    if (trimmed.length !== last.text.length)
      out[out.length - 1] = { ...last, text: trimmed, width: measure({ text: trimmed, font: last.font }) };
  }
  return { runs: out, width: out.reduce((s, r) => s + r.width, 0) };
}
