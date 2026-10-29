import type { DeviceProfile } from "../model";
import type { DeviceGuide } from "./guide-types";
import { CCTV_GUIDE } from "./guides-cctv";
import { MAC_GUIDE, WINDOWS_GUIDE } from "./guides-computers";
import { ANDROID_GUIDE, IPHONE_GUIDE } from "./guides-phones";
import {
  BSA_SCHEDULE,
  WHATSAPP_CHANGE_NUMBER,
  WHATSAPP_USERNAMES,
  GOOGLE_ANDROID_ACCOUNTS,
  GMAIL_ACCOUNTS,
  GOOGLE_COMPUTER,
  APPLE_ACCOUNT,
  CAUTION_BOTH_VALUES,
  CAUTION_NO_AADHAAR,
  CAUTION_NO_SECRETS,
  CAUTION_NO_CHANGES,
} from "./guides-shared";

// Step-by-step guides for finding the device details asked for in the Section 63(4) Schedule.
// Content comes from docs/research/devices.md. Confidence labels:
//   "official"   = read on a maker's, standards body's or government page (including search excerpts of one);
//   "reliable"   = reputable third party, or official and third-party sources combined;
//   "unverified" = inference, weak sources or no source at all, so the text carries a hedge.
// Phones, computers and CCTV recorders live in guides-phones.ts, guides-computers.ts and guides-cctv.ts.
// USB, CD/DVD, server and "other" were not covered by the research: their steps are general and marked unverified.

// ---------------------------------------------------------------- USB, CD/DVD (not covered by the research)

const USB_GUIDE: DeviceGuide = {
  profile: "usb",
  title: "USB pen drive",
  sourceKind: "flash",
  summary:
    "Write down what is printed on the drive: the brand, model, capacity and any serial number, plus its colour. " +
    "Copy them exactly as printed.",
  identifierSlots: [],
  sections: [
    {
      id: "make-model",
      title: "Make, model and colour",
      targets: ["makeModel", "color"],
      steps: [
        {
          text:
            "Read the brand, model and capacity (for example '32 GB') printed on the drive or its packaging, and " +
            "write them under Make & Model.",
          confidence: "unverified",
        },
        { text: "Look at the drive and write its colour.", confidence: "reliable" },
      ],
    },
    {
      id: "serial",
      title: "Serial number",
      targets: ["serial"],
      steps: [
        {
          text:
            "If a serial number is printed or engraved on the drive, copy it exactly. Many pen drives have none " +
            "printed. Then leave the field blank, or write that no serial is printed on the drive.",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [
    "Write only what you can see on the drive or its packaging. Do not guess a serial number.",
    "Do not add, delete or format anything on the drive while you prepare the certificate.",
    "If the drive and its packaging show different details, write both and say where each came from.",
  ],
  sources: [BSA_SCHEDULE],
};

const DISC_GUIDE: DeviceGuide = {
  profile: "disc",
  title: "CD or DVD",
  sourceKind: "cd",
  summary:
    "Write down what is printed on the disc or its case (brand, type such as DVD-R, and capacity), its colour, and " +
    "whether it was finalised (closed) after the files were written.",
  identifierSlots: [],
  sections: [
    {
      id: "make-model",
      title: "Make, model and colour",
      targets: ["makeModel", "color"],
      steps: [
        {
          text: "Read the brand, type (for example DVD-R) and capacity printed on the disc or its case.",
          confidence: "unverified",
        },
        { text: "Look at the disc and write its colour.", confidence: "reliable" },
      ],
    },
    {
      id: "serial",
      title: "Serial number",
      targets: ["serial"],
      steps: [
        {
          text:
            "Discs rarely carry a serial number. If a number is printed on the disc or its case, copy it and say " +
            "where it is printed. Otherwise leave the field blank.",
          confidence: "unverified",
        },
      ],
    },
    {
      id: "finalise",
      title: "Finalised disc",
      targets: ["export"],
      steps: [
        {
          text:
            "Most disc-writing programs can finalise (close) a disc so that nothing more can be added. If yours did, " +
            "note under 'any other relevant information' that the disc was finalised.",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [
    "Write only what you can see on the disc or its case. Do not guess a serial number.",
    "If the disc and its case show different details, write both and say where each came from.",
  ],
  sources: [BSA_SCHEDULE],
};

// ---------------------------------------------------------------- Cloud

const CLOUD_GUIDE: DeviceGuide = {
  profile: "cloud",
  title: "Cloud account (WhatsApp, Google, Apple)",
  sourceKind: "cloud",
  summary:
    "Write down which service holds the evidence and the account it belongs to: the email address or phone number " + "used to sign in.",
  identifierSlots: [{ type: "Cloud ID", note: "account email / phone number" }],
  sections: [
    {
      id: "cloud",
      title: "Find the account ID",
      targets: ["cloud"],
      steps: [
        {
          text: "WhatsApp on Android: tap the three dots (top right), then Settings, then your name or photo.",
          path: "WhatsApp > three dots > Settings > your profile photo",
          confidence: "official",
        },
        {
          text: "WhatsApp on iPhone: open Settings (newer versions call this tab 'You') or your profile.",
          confidence: "official",
        },
        {
          text:
            "Google account on Android: the accounts are listed under Accounts. The menu may instead be called Users " +
            "& accounts, Passwords, passkeys & autofill, or Manage accounts.",
          path: "Settings > Passwords & accounts",
          confidence: "official",
        },
        {
          text: "Gmail app: tap your profile picture (top right) to see the signed-in email.",
          confidence: "official",
        },
        {
          text: "Google account on a computer: open myaccount.google.com, or select your profile image at the top right.",
          confidence: "official",
        },
        {
          text: "Apple Account on iPhone: your sign-in email addresses and phone numbers are listed here.",
          path: "Settings > [your name] > Sign-In & Security",
          confidence: "official",
        },
        {
          text: "Apple Account on a Mac: the same details are under Sign-In & Security.",
          path: "System Settings > [your name] > Sign-In & Security",
          confidence: "official",
        },
      ],
    },
    {
      id: "service",
      title: "Name the service",
      targets: ["makeModel"],
      steps: [
        {
          text:
            "Write the name of the service that holds the evidence (for example WhatsApp, Google Drive or iCloud), " +
            "so the reader knows where the account lives.",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [
    "Write the WhatsApp number in full international format, for example 'WhatsApp: +91 98xxxxxxxx'.",
    "Phones often have several Google accounts. Write the one that holds the evidence (for example the Drive or Photos account).",
    "If the WhatsApp number was changed, the number used at the time of the chats may differ from today's. Write " +
      "the number that was used then.",
    "WhatsApp usernames can be changed or deleted. Put a username under 'other relevant information', not as the main ID.",
    "Your Apple Account sign-in email may differ from your @icloud.com mail address.",
    "Never write a password or a one-time code (OTP) on the certificate.",
  ],
  sources: [
    BSA_SCHEDULE,
    WHATSAPP_CHANGE_NUMBER,
    WHATSAPP_USERNAMES,
    GOOGLE_ANDROID_ACCOUNTS,
    { label: "Google Account Help: manage your Google settings", url: "https://support.google.com/accounts/answer/3118621" },
    GMAIL_ACCOUNTS,
    GOOGLE_COMPUTER,
    APPLE_ACCOUNT,
  ],
};

// ---------------------------------------------------------------- Server, other (not covered by the research)

const SERVER_GUIDE: DeviceGuide = {
  profile: "server",
  title: "Server",
  sourceKind: "server",
  summary:
    "A server is usually run by someone else. Ask whoever runs it for its name (hostname), IP address, make, model " +
    "and serial number, and note who gave you each detail.",
  identifierSlots: [{ type: "Other", note: "Hostname / IP address" }],
  sections: [
    {
      id: "admin",
      title: "Get the details from whoever runs the server",
      targets: ["makeModel", "serial", "color"],
      steps: [
        {
          text:
            "Ask the person or company that runs the server for its hostname, IP address, make and model, and " +
            "serial number. Ask for these in writing (for example by email) and keep the reply.",
          confidence: "unverified",
        },
        {
          text:
            "A rented or cloud server may have no physical serial number. Then write the provider's name and the " +
            "server or account ID they give you.",
          confidence: "unverified",
        },
        {
          text: "If the server runs Windows and you can use it, the PowerShell commands in the Windows guide may also work.",
          confidence: "unverified",
        },
        {
          text: "Colour: write it only if you have seen the machine yourself. Otherwise say that you have not seen it.",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [
    "Never write passwords, access keys or login details on the certificate.",
    "Say where each detail came from (for example 'serial as stated by the hosting company by email').",
  ],
  sources: [BSA_SCHEDULE],
};

const OTHER_GUIDE: DeviceGuide = {
  profile: "other",
  title: "Other device",
  sourceKind: "other",
  summary:
    "For any other device (for example a camera, voice recorder, smartwatch or drone), write the make, model, " +
    "colour and any serial number or ID it shows, and say where you found each one.",
  identifierSlots: [{ type: "Other", note: "ID shown on the device" }],
  sections: [
    {
      id: "record",
      title: "Record what the device shows",
      targets: ["makeModel", "color", "serial"],
      steps: [
        {
          text:
            "Look for a label on the device, inside its battery compartment, on its box or on the invoice. Check its " +
            "settings or 'About' screen if it has one. Copy the make, model and serial exactly, and say where you " +
            "found each.",
          confidence: "unverified",
        },
        { text: "Look at the device and write its colour.", confidence: "reliable" },
        {
          text:
            "Drones: a registered drone has a Unique Identification Number (UIN) under the Drone Rules, 2021. The " +
            "form's 'UIN' may mean this, but that is not confirmed.",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [CAUTION_BOTH_VALUES, CAUTION_NO_SECRETS, CAUTION_NO_CHANGES, CAUTION_NO_AADHAAR],
  sources: [
    BSA_SCHEDULE,
    { label: "Drone Rules, 2021 (Gazette)", url: "https://egazette.gov.in/WriteReadData/2021/229221.pdf" },
    {
      label: "LiveLaw: commentary on the BSA and digital evidence",
      url: "https://www.livelaw.in/articles/bharatiya-sakshya-adhiniyam-transformed-digital-evidence-552681",
    },
  ],
};

// ---------------------------------------------------------------- exports

export const GUIDES: Readonly<Record<DeviceProfile, DeviceGuide>> = {
  android: ANDROID_GUIDE,
  iphone: IPHONE_GUIDE,
  cctv: CCTV_GUIDE,
  windows: WINDOWS_GUIDE,
  mac: MAC_GUIDE,
  usb: USB_GUIDE,
  disc: DISC_GUIDE,
  cloud: CLOUD_GUIDE,
  server: SERVER_GUIDE,
  other: OTHER_GUIDE,
};

/** Order of the device picker. */
export const GUIDE_ORDER: readonly DeviceProfile[] = [
  "android",
  "iphone",
  "cctv",
  "windows",
  "mac",
  "usb",
  "disc",
  "cloud",
  "server",
  "other",
];
