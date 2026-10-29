import type { ClockCheck, Device, DeviceIdentifier } from "../model";

export function describeIdentifier(id: DeviceIdentifier): string {
  const note = id.note.trim() ? ` (${id.note.trim()})` : "";
  return `${id.type}${note}: ${id.value.trim()}`;
}

export function describeIdentifiers(device: Device): string {
  return device.identifiers
    .filter((i) => i.value.trim())
    .map(describeIdentifier)
    .join("; ");
}

function spell(seconds: number): string {
  const s = Math.abs(Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  const parts = [h ? `${h} h` : "", m ? `${m} min` : "", rest || (!h && !m) ? `${rest} s` : ""].filter(Boolean);
  return parts.join(" ");
}

/** Offset between what a device clock showed and real time, in seconds. */
export function clockOffsetSeconds(deviceShows: string, actual: Date): number {
  // deviceShows is wall-clock time typed by the user; read it as IST.
  const shown = new Date(`${deviceShows.length === 16 ? `${deviceShows}:00` : deviceShows}+05:30`);
  if (Number.isNaN(shown.getTime())) throw new Error("Device time is not a valid date and time");
  return Math.round((shown.getTime() - actual.getTime()) / 1000);
}

export function describeClock(clock: ClockCheck, formatInstant: (d: Date) => string): string {
  const when = formatInstant(new Date(clock.actualAt));
  const shown = clock.deviceShows.replace("T", " ");
  if (Math.abs(clock.offsetSeconds) < 2) {
    return `Clock check: at ${when} the device clock showed ${shown}, matching actual time.`;
  }
  const direction = clock.offsetSeconds > 0 ? "ahead of" : "behind";
  return `Clock check: at ${when} the device clock showed ${shown}, i.e. ${spell(clock.offsetSeconds)} ${direction} actual IST. Times recorded by this device should be read with this difference in mind.`;
}

export function deviceTitle(device: Device): string {
  return device.nickname.trim() || device.makeModel.trim() || "Unnamed device";
}
