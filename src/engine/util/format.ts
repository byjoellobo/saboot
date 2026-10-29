// Formatting helpers. The Schedule asks for Date (DD/MM/YYYY) and Time in IST,
// 24-hour format, so those formats live here in one place.

const IST = "Asia/Kolkata";

function istParts(date: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** "29/10/2026" */
export function istDate(date: Date): string {
  const p = istParts(date);
  return `${p.day}/${p.month}/${p.year}`;
}

/** "14:05:09" (24-hour IST) */
export function istTime(date: Date): string {
  const p = istParts(date);
  return `${p.hour}:${p.minute}:${p.second}`;
}

/** "29/10/2026 14:05:09 IST" */
export function istStamp(date: Date): string {
  return `${istDate(date)} ${istTime(date)} IST`;
}

/** Exact byte count with Indian digit grouping plus a short human size. */
export function formatBytes(size: number): string {
  const exact = `${new Intl.NumberFormat("en-IN").format(size)} bytes`;
  if (size < 1024) return exact;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${exact} (${value.toFixed(value < 10 ? 2 : 1)} ${units[unit]})`;
}

export function shortSize(size: number): string {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** Split a long hex digest into groups so people can read it aloud. */
export function groupHex(hex: string, size = 8): string {
  return hex.match(new RegExp(`.{1,${size}}`, "g"))?.join(" ") ?? hex;
}
