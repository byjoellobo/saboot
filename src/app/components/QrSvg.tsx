import QRCode from "qrcode";
import { useMemo } from "react";

/** QR code drawn as SVG rectangles (no innerHTML). */
export function QrSvg({ text, size = 160, title }: { text: string; size?: number; title: string }) {
  const { n, cells } = useMemo(() => {
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const count = qr.modules.size;
    const out: { x: number; y: number; w: number }[] = [];
    for (let y = 0; y < count; y++) {
      let x = 0;
      while (x < count) {
        if (!qr.modules.get(y, x)) {
          x++;
          continue;
        }
        const start = x;
        while (x < count && qr.modules.get(y, x)) x++;
        out.push({ x: start, y, w: x - start });
      }
    }
    return { n: count, cells: out };
  }, [text]);
  const quiet = 2;
  return (
    <svg
      role="img"
      aria-label={title}
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${n + quiet * 2} ${n + quiet * 2}`}
      shapeRendering="crispEdges"
    >
      <rect x={-quiet} y={-quiet} width={n + quiet * 2} height={n + quiet * 2} fill="#fff" />
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={c.w} height={1} fill="#000" />
      ))}
    </svg>
  );
}
