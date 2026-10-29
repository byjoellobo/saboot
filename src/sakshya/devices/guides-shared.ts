import type { GuideSource, GuideStep } from "./guide-types";

// Sources, steps and cautions shared by several device guides.
// Content comes from docs/research/devices.md. Confidence labels are explained at the top of guides.ts.

export const BSA_SCHEDULE: GuideSource = {
  label: "Bharatiya Sakshya Adhiniyam, 2023: The Schedule (India Code)",
  url: "https://www.indiacode.nic.in/bitstream/123456789/20063/1/aa202347.pdf",
};
export const IEEE_MAC: GuideSource = {
  label: "IEEE: guidelines for EUI, OUI and CID (MAC address structure)",
  url: "https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/eui.pdf",
};
export const TS_22_030: GuideSource = {
  label: "3GPP TS 22.030: the *#06# code shows the IMEI",
  url: "https://www.etsi.org/deliver/etsi_ts/122000_122099/122030/19.00.00_60/ts_122030v190000p.pdf",
};
export const SANCHAR_SAATHI: GuideSource = { label: "Sanchar Saathi", url: "https://sancharsaathi.gov.in" };
export const KYM: GuideSource = {
  label: "Sanchar Saathi: Know Your Mobile (IMEI check)",
  url: "https://ceir.sancharsaathi.gov.in/Device/SancharSaathiKym.jsp",
};
export const WHATSAPP_CHANGE_NUMBER: GuideSource = {
  label: "WhatsApp: change your phone number",
  url: "https://faq.whatsapp.com/498754122134583/",
};
export const WHATSAPP_USERNAMES: GuideSource = { label: "WhatsApp: about usernames", url: "https://faq.whatsapp.com/658755553162769/" };
export const GOOGLE_ANDROID_ACCOUNTS: GuideSource = {
  label: "Google: accounts on an Android device",
  url: "https://support.google.com/android/answer/7664951",
};
export const GMAIL_ACCOUNTS: GuideSource = { label: "Gmail Help: signed-in accounts", url: "https://support.google.com/mail/answer/8154" };
export const GOOGLE_COMPUTER: GuideSource = {
  label: "Google Account Help: on a computer",
  url: "https://support.google.com/accounts/answer/1721977",
};
export const APPLE_ACCOUNT: GuideSource = { label: "Apple 102627: Apple Account email", url: "https://support.apple.com/en-us/102627" };

export const KYM_STEP: GuideStep = {
  text:
    "Check the IMEI with the government's Sanchar Saathi 'Know Your Mobile' service. Send an SMS with KYM followed " +
    "by the 15-digit IMEI to 14422 (older instructions put a space after KYM), or use the Sanchar Saathi app or " +
    "website. It returns the brand and model: make sure they match what you wrote.",
  path: "SMS: KYM<15-digit IMEI> to 14422",
  confidence: "official",
};

export const MAC_SECOND_CHARACTER_STEP: GuideStep = {
  text:
    "Check the second character of the MAC. 0, 4, 8 or C means a factory (hardware) address. 2, 6, A or E means " +
    "the address was set on the device, usually a private (randomised) one. Any other character means it is not a " +
    "device address at all: check that you copied it correctly.",
  confidence: "official",
};

export const CAUTION_IMEI_15 =
  "An IMEI has exactly 15 digits. If extra digits appear (for example '/01' or a 2-digit software number), keep " +
  "only the first 15. Never enter the 16-digit IMEI SV (software version) as the IMEI.";
export const CAUTION_LUHN =
  "A check-digit (Luhn) test only catches typing mistakes. It does not prove the IMEI is genuine or belongs to this " +
  "phone. Use Sanchar Saathi 'Know Your Mobile' (SMS KYM<IMEI> to 14422) to confirm the brand and model.";
export const CAUTION_OPERATOR_DIGITS =
  "Operator records may show an IMEI with only 14 digits or ending in 0, because networks do not send the check " +
  "digit. A difference only in the last digit does not by itself mean a different phone.";
export const CAUTION_BOTH_VALUES = "If the label and the screen show different values, write both and say where each came from.";
export const CAUTION_BOTH_VALUES_PHONE =
  "If the label and the screen show different values, write both and say where each came from, for example " +
  "'IMEI 1: 35xxxxxxxxxxxxx (Settings > About phone)'.";
export const CAUTION_NO_AADHAAR =
  "'UIN/UID' is not defined in the form. Do not enter your Aadhaar number there: Aadhaar identifies a person, not a device.";
export const CAUTION_NO_SECRETS = "Never write a PIN, password, pattern or passcode on the certificate.";
export const CAUTION_NO_CHANGES =
  "Do not change any settings while you collect these details, including Wi-Fi privacy (MAC address) settings.";
