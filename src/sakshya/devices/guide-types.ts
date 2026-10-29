import type { SourceKind } from "../certificate/schedule";
import type { DeviceProfile, IdentifierType } from "../model";

/** How well a step is sourced. Shown to the user so they know what to double-check. */
export type Confidence = "official" | "reliable" | "unverified";

/** Which certificate field a guide section helps the user find. */
export type GuideTarget = "makeModel" | "color" | "serial" | "imei" | "eid" | "mac" | "cloud" | "clock" | "export";

export interface GuideStep {
  /** One plain-language instruction a non-technical person can follow. */
  readonly text: string;
  /** Optional menu path or command, shown in a code style, e.g. "Settings > About phone > Status". */
  readonly path?: string;
  readonly confidence: Confidence;
}

export interface GuideSection {
  readonly id: string;
  readonly title: string;
  readonly targets: readonly GuideTarget[];
  readonly steps: readonly GuideStep[];
}

export interface GuideSource {
  readonly label: string;
  readonly url: string;
}

export interface DeviceGuide {
  readonly profile: DeviceProfile;
  /** Name shown on the picker, e.g. "Android phone". */
  readonly title: string;
  /** Default tick box in the Schedule for this kind of device. */
  readonly sourceKind: SourceKind;
  /** One or two sentences: what to collect for this device and why. */
  readonly summary: string;
  /** Identifier rows to pre-create in the form, e.g. IMEI (SIM 1), IMEI (SIM 2), MAC (Wi-Fi). */
  readonly identifierSlots: readonly { readonly type: IdentifierType; readonly note: string }[];
  readonly sections: readonly GuideSection[];
  /** Things to avoid or double-check (e.g. never record passwords or verification codes). */
  readonly cautions: readonly string[];
  readonly sources: readonly GuideSource[];
}
