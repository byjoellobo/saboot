// Checks for device identifiers typed by the user. These catch typos before
// they reach a sworn certificate; they never "prove" an identifier is genuine.

export type Severity = "ok" | "warning" | "error";

export interface IdCheck {
  readonly severity: Severity;
  readonly normalized: string;
  readonly message: string;
}

/** Luhn (mod 10) check used by the 15th digit of an IMEI. */
export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function checkImei(input: string): IdCheck {
  const digits = input.replace(/[\s\-/.]/g, "");
  if (!/^\d+$/.test(digits)) {
    return { severity: "error", normalized: digits, message: "An IMEI contains only digits. Dial *#06# to see it." };
  }
  if (digits.length === 16) {
    return {
      severity: "warning",
      normalized: digits,
      message: "16 digits looks like an IMEISV (IMEI + software version). The certificate usually needs the 15-digit IMEI.",
    };
  }
  if (digits.length === 14) {
    return {
      severity: "warning",
      normalized: digits,
      message: "Only 14 digits. Some screens hide the 15th (check) digit; *#06# shows all 15.",
    };
  }
  if (digits.length !== 15) {
    return { severity: "error", normalized: digits, message: `An IMEI has 15 digits; this has ${digits.length}.` };
  }
  if (!luhnValid(digits)) {
    return {
      severity: "error",
      normalized: digits,
      message: "The last digit does not match (Luhn check failed). One digit is probably mistyped.",
    };
  }
  return { severity: "ok", normalized: digits, message: `Valid IMEI. Type Allocation Code (model code): ${digits.slice(0, 8)}.` };
}

export function checkMac(input: string): IdCheck {
  const hex = input.replace(/[\s:\-.]/g, "").toLowerCase();
  if (!/^[0-9a-f]{12}$/.test(hex)) {
    return { severity: "error", normalized: input.trim(), message: "A MAC address has 12 hexadecimal characters, e.g. 3C:5A:B4:01:23:45." };
  }
  const normalized = (hex.match(/../g) ?? []).join(":").toUpperCase();
  const first = parseInt(hex.slice(0, 2), 16);
  if (hex === "000000000000" || hex === "ffffffffffff") {
    return { severity: "error", normalized, message: "This is a placeholder/broadcast address, not a device address." };
  }
  if (first & 0x01) {
    return { severity: "error", normalized, message: "This is a multicast address, which no single device owns." };
  }
  if (first & 0x02) {
    return {
      severity: "warning",
      normalized,
      message:
        "This looks like a randomised (private) address: phones use these per Wi-Fi network. Record the device's own " +
        "hardware address instead (see the guide), or label this one as 'private Wi-Fi address for network X'.",
    };
  }
  return { severity: "ok", normalized, message: `Hardware address. Manufacturer prefix (OUI): ${normalized.slice(0, 8)}.` };
}

/** eSIM EID: 32 digits; check digits follow ISO 7064 MOD 97-10 (the whole number mod 97 equals 1). */
export function checkEid(input: string): IdCheck {
  const digits = input.replace(/\s/g, "");
  if (!/^\d{32}$/.test(digits)) {
    return { severity: "error", normalized: digits, message: "An EID has 32 digits." };
  }
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  if (rem !== 1) return { severity: "warning", normalized: digits, message: "The check digits do not match; please re-read the EID." };
  return { severity: "ok", normalized: digits, message: "Valid EID format." };
}

export function checkSerial(input: string): IdCheck {
  const value = input.trim();
  if (!value)
    return { severity: "warning", normalized: "", message: "Serial number is empty. Write 'Not available' if the device has none." };
  if (/^(0+|1234567890?|unknown|n\/?a|default string|to be filled by o\.?e\.?m\.?)$/i.test(value)) {
    return {
      severity: "warning",
      normalized: value,
      message: "This looks like a placeholder that some manufacturers leave in the firmware. Check the label on the device.",
    };
  }
  if (/[Oo]/.test(value) && /\d/.test(value)) {
    return { severity: "warning", normalized: value, message: "Contains the letter O next to digits: double-check it is not a zero." };
  }
  return { severity: "ok", normalized: value, message: "" };
}
