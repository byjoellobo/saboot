import { describe, expect, it } from "vitest";
import { checkEid, checkImei, checkMac, checkSerial, luhnValid } from "../../src/sakshya/devices/validate";

describe("IMEI", () => {
  it("accepts a valid 15-digit IMEI (Luhn)", () => {
    // 49015420323751 + check digit 8 is the well-known example IMEI.
    const r = checkImei("49-015420-323751-8");
    expect(r.severity).toBe("ok");
    expect(r.normalized).toBe("490154203237518");
    expect(r.message).toContain("49015420");
  });

  it("rejects a mistyped digit", () => {
    expect(checkImei("490154203237519").severity).toBe("error");
  });

  it("warns on IMEISV and 14-digit forms", () => {
    expect(checkImei("4901542032375101").severity).toBe("warning");
    expect(checkImei("49015420323751").severity).toBe("warning");
  });

  it("rejects letters and wrong lengths", () => {
    expect(checkImei("49015A203237518").severity).toBe("error");
    expect(checkImei("12345").message).toMatch(/15 digits/);
  });

  it("implements Luhn", () => {
    expect(luhnValid("79927398713")).toBe(true);
    expect(luhnValid("79927398710")).toBe(false);
    expect(luhnValid("")).toBe(false);
  });
});

describe("MAC", () => {
  it("normalises separators and accepts hardware addresses", () => {
    const r = checkMac("3c-5a-b4-01-23-45");
    expect(r.severity).toBe("ok");
    expect(r.normalized).toBe("3C:5A:B4:01:23:45");
  });

  it("flags randomised (locally administered) addresses", () => {
    // Second hex digit 2, 6, A or E means the locally-administered bit is set.
    for (const mac of ["DA:A1:19:00:00:01", "a6:00:00:00:00:01", "0e:11:22:33:44:55"]) {
      expect(checkMac(mac).severity).toBe("warning");
    }
  });

  it("rejects multicast, broadcast and malformed values", () => {
    expect(checkMac("01:00:5E:00:00:FB").severity).toBe("error");
    expect(checkMac("FF:FF:FF:FF:FF:FF").severity).toBe("error");
    expect(checkMac("00:00:00:00:00:00").severity).toBe("error");
    expect(checkMac("3C:5A:B4").severity).toBe("error");
  });
});

describe("EID and serial", () => {
  it("checks EID length and MOD 97", () => {
    expect(checkEid("123").severity).toBe("error");
    // Build a valid EID: choose the last two digits so the number mod 97 is 1.
    const body = "890490320000010000000000000000";
    let rem = 0;
    for (const ch of body + "00") rem = (rem * 10 + Number(ch)) % 97;
    const check = String((98 - rem) % 97).padStart(2, "0");
    expect(checkEid(body + check).severity).toBe("ok");
    expect(checkEid(body + (check === "00" ? "01" : "00")).severity).toBe("warning");
  });

  it("flags placeholder serials and O/0 confusion", () => {
    expect(checkSerial("").severity).toBe("warning");
    expect(checkSerial("To be filled by O.E.M.").severity).toBe("warning");
    expect(checkSerial("Default string").severity).toBe("warning");
    expect(checkSerial("R58MO12ABC").severity).toBe("warning");
    expect(checkSerial("R58M312ABC").severity).toBe("ok");
  });
});
