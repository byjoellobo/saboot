import { describe, expect, it } from "vitest";
import { SOURCE_BOXES, type SourceKind } from "../../src/sakshya/certificate/schedule";
import type { Confidence } from "../../src/sakshya/devices/guide-types";
import { GUIDES, GUIDE_ORDER } from "../../src/sakshya/devices/guides";
import type { DeviceProfile } from "../../src/sakshya/model";

// A Record keyed by DeviceProfile fails to compile if a profile is added or removed,
// so this list always matches the union type.
const PROFILE_KEYS: Record<DeviceProfile, true> = {
  android: true,
  iphone: true,
  windows: true,
  mac: true,
  cctv: true,
  usb: true,
  disc: true,
  server: true,
  cloud: true,
  other: true,
};
const ALL_PROFILES = Object.keys(PROFILE_KEYS) as DeviceProfile[];

const EXPECTED_SOURCE_KIND: Record<DeviceProfile, SourceKind> = {
  android: "mobile",
  iphone: "mobile",
  cctv: "dvr",
  windows: "computer",
  mac: "computer",
  usb: "flash",
  disc: "cd",
  cloud: "cloud",
  server: "server",
  other: "other",
};

const CONFIDENCES: readonly Confidence[] = ["official", "reliable", "unverified"];
// Built from its code point so this file itself contains no em dash.
const EM_DASH = String.fromCharCode(0x2014);

function collectStrings(value: unknown, where: string, out: { where: string; text: string }[]): void {
  if (typeof value === "string") {
    out.push({ where, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collectStrings(item, `${where}[${i}]`, out));
  } else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) collectStrings(item, `${where}.${key}`, out);
  }
}

describe("device guides", () => {
  it("has one guide per device profile, keyed by its own profile", () => {
    expect(Object.keys(GUIDES).sort()).toEqual([...ALL_PROFILES].sort());
    for (const profile of ALL_PROFILES) {
      expect(GUIDES[profile].profile).toBe(profile);
    }
  });

  it("lists every profile exactly once in picker order", () => {
    expect(GUIDE_ORDER).toEqual(["android", "iphone", "cctv", "windows", "mac", "usb", "disc", "cloud", "server", "other"]);
    expect(new Set(GUIDE_ORDER).size).toBe(GUIDE_ORDER.length);
    expect([...GUIDE_ORDER].sort()).toEqual([...ALL_PROFILES].sort());
  });

  it("ticks the matching Schedule box for each device", () => {
    const boxKeys = SOURCE_BOXES.map((box) => box.key);
    for (const profile of ALL_PROFILES) {
      expect(boxKeys).toContain(GUIDES[profile].sourceKind);
      expect(GUIDES[profile].sourceKind).toBe(EXPECTED_SOURCE_KIND[profile]);
    }
  });

  it("gives every guide a title, a summary and at least one section with steps", () => {
    for (const profile of ALL_PROFILES) {
      const guide = GUIDES[profile];
      expect(guide.title.trim(), profile).not.toBe("");
      expect(guide.summary.trim(), profile).not.toBe("");
      expect(guide.sections.length, profile).toBeGreaterThanOrEqual(1);
      const ids = guide.sections.map((s) => s.id);
      expect(new Set(ids).size, `${profile}: duplicate section id`).toBe(ids.length);
      for (const section of guide.sections) {
        expect(section.id.trim(), profile).not.toBe("");
        expect(section.title.trim(), `${profile}/${section.id}`).not.toBe("");
        expect(section.targets.length, `${profile}/${section.id}`).toBeGreaterThanOrEqual(1);
        expect(section.steps.length, `${profile}/${section.id}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("gives every step text, a valid confidence and a non-empty path when present", () => {
    for (const profile of ALL_PROFILES) {
      for (const section of GUIDES[profile].sections) {
        section.steps.forEach((step, i) => {
          const where = `${profile}/${section.id}[${i}]`;
          expect(step.text.trim(), where).not.toBe("");
          expect(CONFIDENCES, where).toContain(step.confidence);
          if (step.path !== undefined) expect(step.path.trim(), where).not.toBe("");
        });
      }
    }
  });

  it("uses only web links with labels as sources", () => {
    for (const profile of ALL_PROFILES) {
      for (const source of GUIDES[profile].sources) {
        expect(source.label.trim(), profile).not.toBe("");
        expect(source.url, profile).toMatch(/^https?:\/\//);
      }
    }
  });

  it("has non-empty cautions and identifier notes", () => {
    for (const profile of ALL_PROFILES) {
      const guide = GUIDES[profile];
      for (const caution of guide.cautions) expect(caution.trim(), profile).not.toBe("");
      for (const slot of guide.identifierSlots) expect(slot.note.trim(), profile).not.toBe("");
    }
  });

  it("contains no em dash anywhere", () => {
    const strings: { where: string; text: string }[] = [];
    collectStrings(GUIDES, "GUIDES", strings);
    expect(strings.length).toBeGreaterThan(100);
    const offenders = strings.filter((s) => s.text.includes(EM_DASH)).map((s) => s.where);
    expect(offenders).toEqual([]);
  });

  it("pre-creates IMEI, EID and MAC rows for phones", () => {
    for (const profile of ["android", "iphone"] as const) {
      const slots = GUIDES[profile].identifierSlots;
      expect(slots.filter((s) => s.type === "IMEI").length, profile).toBe(2);
      expect(slots.some((s) => s.type === "EID"), profile).toBe(true);
      expect(slots.some((s) => s.type === "MAC"), profile).toBe(true);
      expect(slots.some((s) => s.type === "Cloud ID"), profile).toBe(true);
    }
  });

  it("covers the clock check and export for CCTV recorders", () => {
    const cctv = GUIDES.cctv;
    expect(cctv.sourceKind).toBe("dvr");
    const targets = cctv.sections.flatMap((s) => s.targets);
    expect(targets).toContain("clock");
    expect(targets).toContain("export");
    const clockPaths = cctv.sections
      .filter((s) => s.targets.includes("clock"))
      .flatMap((s) => s.steps.map((step) => step.path ?? ""));
    expect(clockPaths).toContain("https://www.nplindia.org/clockcode/html/");
  });

  it("never offers wmic as a command to run", () => {
    const paths = Object.values(GUIDES).flatMap((g) => g.sections.flatMap((s) => s.steps.map((step) => step.path ?? "")));
    expect(paths.filter((p) => /^wmic\b/i.test(p))).toEqual([]);
  });
});
