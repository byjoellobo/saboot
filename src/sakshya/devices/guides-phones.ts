import type { DeviceGuide } from "./guide-types";
import {
  BSA_SCHEDULE,
  IEEE_MAC,
  TS_22_030,
  SANCHAR_SAATHI,
  KYM,
  WHATSAPP_CHANGE_NUMBER,
  WHATSAPP_USERNAMES,
  GOOGLE_ANDROID_ACCOUNTS,
  GMAIL_ACCOUNTS,
  APPLE_ACCOUNT,
  KYM_STEP,
  MAC_SECOND_CHARACTER_STEP,
  CAUTION_IMEI_15,
  CAUTION_LUHN,
  CAUTION_OPERATOR_DIGITS,
  CAUTION_BOTH_VALUES_PHONE,
  CAUTION_NO_AADHAAR,
  CAUTION_NO_SECRETS,
  CAUTION_NO_CHANGES,
} from "./guides-shared";

// Android and iPhone guides. Content comes from docs/research/devices.md, Sections 1-3, 7, 8 and 9.
// Confidence labels are explained at the top of guides.ts.

// ---------------------------------------------------------------- Android

export const ANDROID_GUIDE: DeviceGuide = {
  profile: "android",
  title: "Android phone",
  sourceKind: "mobile",
  summary:
    "Write down the phone's make and model, colour, serial number and every IMEI (dual-SIM phones have two). " +
    "Together they identify the exact phone. If the evidence depends on WhatsApp, a Google account or a Wi-Fi " +
    "network, also note the account or the phone's Wi-Fi address.",
  identifierSlots: [
    { type: "IMEI", note: "SIM 1" },
    { type: "IMEI", note: "SIM 2 (if dual-SIM)" },
    { type: "EID", note: "eSIM (if any)" },
    { type: "MAC", note: "Wi-Fi hardware address" },
    { type: "Cloud ID", note: "WhatsApp number / Google or Apple account" },
  ],
  sections: [
    {
      id: "imei",
      title: "Find the IMEI",
      targets: ["imei", "eid"],
      steps: [
        {
          text:
            "Open the phone's own Phone (dialer) app, not a third-party one, and type *#06#. No call is made: a box " +
            "with the IMEI appears. Dual-SIM phones show two IMEIs. Write both.",
          path: "*#06#",
          confidence: "official",
        },
        { text: "OPPO: if *#06# does not work, try *#66#.", path: "*#66#", confidence: "official" },
        {
          text: "Samsung: open Settings, scroll to the bottom and tap About phone. The IMEI is shown there.",
          path: "Settings > About phone",
          confidence: "official",
        },
        {
          text: "Samsung, second IMEI and more detail: tap Status information (older phones: Status), then IMEI information.",
          path: "Settings > About phone > Status information > IMEI information",
          confidence: "reliable",
        },
        {
          text:
            "Google Pixel: About phone shows the IMEI. The second one is listed as 'IMEI (SIM slot 2)' and may only " +
            "appear when Dual SIM is turned on.",
          path: "Settings > About phone > IMEI",
          confidence: "official",
        },
        {
          text:
            "Xiaomi, Redmi or POCO: the IMEI is on the Status screen. On older MIUI phones, 'Detailed info and " +
            "specs' is called 'All specs'.",
          path: "Settings > About phone > Detailed info and specs > Status > IMEI",
          confidence: "official",
        },
        { text: "OnePlus: shows IMEI 1 and IMEI 2.", path: "Settings > About device > Status > IMEI 1", confidence: "official" },
        {
          text: "OPPO or realme: the IMEI is on the Status screen. The menu may say About phone or About device.",
          path: "Settings > About phone > Status > IMEI",
          confidence: "official",
        },
        {
          text:
            "vivo: the IMEI is under Status information. On some models it is under Settings > My device > More " +
            "parameters. vivo says the exact path may differ.",
          path: "Settings > System management > About phone > Status information",
          confidence: "official",
        },
        {
          text: "eSIM (EID): *#06# does not reliably show the EID on Android. Look in Settings or on the box instead.",
          confidence: "reliable",
        },
        {
          text: "Samsung EID: tap Status information (older phones: Status), then EID. It is also printed on the box.",
          path: "Settings > About phone > Status information > EID",
          confidence: "reliable",
        },
        {
          text: "Google Pixel: the EID is on the SIM status screen.",
          path: "Settings > About phone > SIM status > EID",
          confidence: "official",
        },
        {
          text:
            "Google Pixel, other ways: the Google Store 'Your Devices' page lists IMEIs, serial numbers and models. " +
            "Find My Device on the web (select the phone, then the Information icon) also shows its details.",
          confidence: "official",
        },
        {
          text:
            "No screen access? Look at the label on the original box (near the barcode), a sticker on the back of " +
            "the phone (Samsung, OnePlus; it may have been peeled off), under a removable battery on older phones, " +
            "or the purchase invoice.",
          confidence: "official",
        },
        {
          text:
            "Makers confirm an IMEI on the SIM tray only for Google Pixel and older Samsung phones. Do not rely " +
            "on the tray for other brands.",
          confidence: "official",
        },
        KYM_STEP,
      ],
    },
    {
      id: "serial",
      title: "Find the serial number",
      targets: ["serial"],
      steps: [
        {
          text: "Samsung: About phone shows the Serial number. The *#06# box on Samsung phones also shows it as S/N.",
          path: "Settings > About phone",
          confidence: "official",
        },
        {
          text: "Google Pixel: tap Model. A hardware screen opens showing the Serial number.",
          path: "Settings > About phone > Model",
          confidence: "reliable",
        },
        {
          text: "Google Pixel, another way: the Google Store 'Your Devices' page also lists serial numbers.",
          confidence: "official",
        },
        {
          text: "Xiaomi, Redmi or POCO: on the Status screen, tap Model to see the Serial number.",
          path: "Settings > About phone > Detailed info and specs > Status > Model",
          confidence: "official",
        },
        {
          text: "OnePlus: the Status screen shows the Serial Number.",
          path: "Settings > About device > Status > Serial Number",
          confidence: "official",
        },
        {
          text:
            "realme: realme calls this serial the phone's 'chip ID sequence'. It may differ from the serial on the " +
            "box. Compare the two, and if they differ, write both with where each came from.",
          path: "Settings > About phone > Status > Serial number",
          confidence: "official",
        },
        {
          text:
            "OPPO and vivo: the serial is probably on the same Status screen as the IMEI, but the makers do not " +
            "confirm this. If you cannot find it, use the box label.",
          confidence: "unverified",
        },
        {
          text: "The serial is also on the box label and, for Samsung and OnePlus, on the back sticker and the invoice.",
          confidence: "official",
        },
      ],
    },
    {
      id: "mac",
      title: "Find the Wi-Fi MAC address",
      targets: ["mac"],
      steps: [
        {
          text:
            "Every phone has one fixed factory Wi-Fi address (MAC). Since Android 10 the phone shows each Wi-Fi " +
            "network a different made-up (randomised) address by default. Write the factory address in this field.",
          confidence: "official",
        },
        {
          text: "Google Pixel: the factory address is labelled 'Device Wi-Fi MAC address'.",
          path: "Settings > About phone > Device Wi-Fi MAC address",
          confidence: "reliable",
        },
        {
          text:
            "Samsung: look for 'Phone Wi-Fi MAC address' (older phones: Status > Wi-Fi MAC address). Wi-Fi may need " +
            "to be switched on.",
          path: "Settings > About phone > Status information > Phone Wi-Fi MAC address",
          confidence: "reliable",
        },
        {
          text: "Xiaomi, Redmi or POCO: the Status screen shows the Wi-Fi MAC address.",
          path: "Settings > About phone > Detailed info and specs > Status > Wi-Fi MAC address",
          confidence: "official",
        },
        {
          text: "realme: the Status screen shows the Wi-Fi MAC address.",
          path: "Settings > About phone > Status > Wi-Fi MAC address",
          confidence: "official",
        },
        {
          text: "OnePlus and OPPO: probably on the same Status screen as on realme, but this is not confirmed.",
          path: "Settings > About device > Status",
          confidence: "unverified",
        },
        {
          text: "vivo (OriginOS 6 and later): the Wi-Fi advanced settings show the MAC address.",
          path: "Settings > WiFi > Advanced settings > MAC address",
          confidence: "official",
        },
        {
          text:
            "vivo (Funtouch OS 11 and later): the gear icon next to a connected network may show a randomised " +
            "address, not the factory one.",
          confidence: "official",
        },
        {
          text:
            "If the evidence depends on one Wi-Fi network (for example router logs), also write the address the " +
            "phone used on that network, labelled 'private/randomised MAC (network name)'. On a Pixel, tap the gear " +
            "next to the network to see 'Randomized MAC address'.",
          path: "Settings > Network & internet > Internet > gear icon",
          confidence: "reliable",
        },
        {
          text:
            "Samsung, per-network address: tap the gear next to the network, then View more or Advanced, and look " +
            "for 'MAC address type'. The exact option names are not confirmed.",
          path: "Settings > Connections > Wi-Fi > gear icon",
          confidence: "unverified",
        },
        {
          text:
            "A factory reset changes the randomised addresses. A router log from before a reset may show a " +
            "different address from the one the phone shows now.",
          confidence: "official",
        },
        MAC_SECOND_CHARACTER_STEP,
        {
          text: "If the evidence travelled over mobile data and not Wi-Fi, probably no Wi-Fi address was involved.",
          confidence: "unverified",
        },
      ],
    },
    {
      id: "make-model",
      title: "Make, model and colour",
      targets: ["makeModel", "color"],
      steps: [
        { text: "Samsung: About phone shows the Model Name.", path: "Settings > About phone", confidence: "official" },
        {
          text: "Google Pixel: the Model is on the About phone screen.",
          path: "Settings > About phone > Model",
          confidence: "official",
        },
        {
          text: "Xiaomi, Redmi or POCO: the Model is under Detailed info and specs.",
          path: "Settings > About phone > Detailed info and specs > Model",
          confidence: "official",
        },
        {
          text:
            "Samsung, Google, Xiaomi, OnePlus, OPPO, realme and vivo print the model on the box label, together " +
            "with the IMEI and serial.",
          confidence: "official",
        },
        {
          text:
            "Colour: no settings screen shows it. Look at the phone and write the colour you see. The box or " +
            "invoice may give the maker's name for it.",
          confidence: "official",
        },
      ],
    },
    {
      id: "cloud",
      title: "Cloud ID: WhatsApp number or Google account",
      targets: ["cloud"],
      steps: [
        {
          text:
            "WhatsApp: tap the three dots (top right), then Settings, then your name or photo. Your registered " +
            "number is shown. Write it in full, for example 'WhatsApp: +91 98xxxxxxxx'.",
          path: "WhatsApp > three dots > Settings > your profile photo",
          confidence: "official",
        },
        {
          text:
            "Google account: the accounts are listed under Accounts. On some phones this menu is called Users & " +
            "accounts, Passwords, passkeys & autofill, or Manage accounts. If there are several, write the one that " +
            "holds the evidence (for example the Drive or Photos account).",
          path: "Settings > Passwords & accounts",
          confidence: "official",
        },
        {
          text:
            "Gmail app: tap your profile picture (top right). The signed-in email is shown, and 'Manage accounts on " +
            "this device' lists all accounts.",
          confidence: "official",
        },
        {
          text: "Another way: tap your profile picture. The email is usually shown under your name (not confirmed by Google).",
          path: "Settings > Google",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [
    CAUTION_IMEI_15,
    CAUTION_LUHN,
    CAUTION_OPERATOR_DIGITS,
    CAUTION_BOTH_VALUES_PHONE,
    "Write Make & Model as the brand, the model name and (if shown) the model number, for example " +
      "'Samsung Galaxy A55 (SM-A556E)'.",
    "If the WhatsApp number was changed, the number used at the time of the chats may differ from today's. Write " +
      "the number that was used then. Put any WhatsApp username under 'other relevant information', because " +
      "usernames can be changed.",
    CAUTION_NO_SECRETS,
    CAUTION_NO_CHANGES,
    CAUTION_NO_AADHAAR,
  ],
  sources: [
    BSA_SCHEDULE,
    TS_22_030,
    {
      label: "Android source: the *#06# dialer code",
      url: "https://android.googlesource.com/platform/packages/apps/Dialer/+/refs/heads/main/java/com/android/dialer/dialpadview/SpecialCharSequenceMgr.java",
    },
    {
      label: "Android source: MAC randomisation behaviour",
      url: "https://source.android.com/docs/core/connect/wifi-mac-randomization-behavior",
    },
    {
      label: "Android source: hardware info screen (serial)",
      url: "https://android.googlesource.com/platform/packages/apps/Settings/+/refs/heads/main/res/xml/hardware_info.xml",
    },
    { label: "Pixel Help: IMEI and EID", url: "https://support.google.com/pixelphone/answer/10402530" },
    { label: "Pixel Help: Wi-Fi MAC address", url: "https://support.google.com/pixelphone/answer/9655181" },
    { label: "Google Store: your devices", url: "https://support.google.com/store/answer/3333000" },
    {
      label: "Samsung India: model, serial number and IMEI",
      url: "https://www.samsung.com/in/support/mobile-devices/where-can-i-check-the-model-code-serial-number-and-imei-code-in-samsung-mobile-phones",
    },
    {
      label: "Samsung UAE: model, serial or IMEI",
      url: "https://www.samsung.com/ae/support/mobile-devices/how-to-find-phones-model-number-serial-number-or-imei-number-on-samsung-phone/",
    },
    {
      label: "Samsung UK: Wi-Fi MAC address",
      url: "https://www.samsung.com/uk/support/mobile-devices/how-do-i-locate-the-wi-fi-mac-address-on-my-samsung-galaxy-device/",
    },
    {
      label: "Samsung UK: eSIM and EID",
      url: "https://www.samsung.com/uk/support/mobile-devices/how-to-use-an-esim-with-your-galaxy-phone/",
    },
    { label: "Verizon: Galaxy S25 (third party)", url: "https://www.verizon.com/support/knowledge-base-309556/" },
    { label: "Xiaomi FAQ", url: "https://www.mi.com/global/support/faq/details/KA-497449/" },
    { label: "Xiaomi: IMEI on smartphones", url: "https://www.mi.com/global/support/guidance/imei_smartphone/" },
    {
      label: "Xiaomi account help",
      url: "https://account.xiaomi.com/helpcenter/faq/en_US/01.guide/11.appeal/faq-4",
    },
    { label: "OnePlus India: IMEI and serial number", url: "https://service.oneplus.com/in/search/search-detail?id=2234982" },
    { label: "OPPO India: check IMEI", url: "https://support.oppo.com/in/check/" },
    { label: "realme India: Status screen", url: "https://www.realme.com/in/support/kw/doc/2082786" },
    { label: "realme India: IMEI", url: "https://www.realme.com/in/support/kw/doc/2203822" },
    { label: "vivo India: IMEI", url: "https://www.vivo.com/in/support/IMEI" },
    { label: "vivo India FAQ", url: "https://www.vivo.com/in/support/questionList?categoryId=50701" },
    { label: "vivo Singapore: MAC address", url: "https://www.vivo.com/sg/support/questionList?categoryId=54730" },
    GOOGLE_ANDROID_ACCOUNTS,
    GMAIL_ACCOUNTS,
    WHATSAPP_CHANGE_NUMBER,
    WHATSAPP_USERNAMES,
    SANCHAR_SAATHI,
    KYM,
    IEEE_MAC,
  ],
};

// ---------------------------------------------------------------- iPhone

export const IPHONE_GUIDE: DeviceGuide = {
  profile: "iphone",
  title: "iPhone or iPad",
  sourceKind: "mobile",
  summary:
    "Write down the model, colour, serial number, IMEI (two on dual-SIM iPhones) and the EID if the phone uses an " +
    "eSIM. Most of these are on one screen: Settings > General > About.",
  identifierSlots: [
    { type: "IMEI", note: "SIM 1" },
    { type: "IMEI", note: "SIM 2 (if dual-SIM)" },
    { type: "EID", note: "eSIM (if any)" },
    { type: "MAC", note: "Wi-Fi hardware address" },
    { type: "Cloud ID", note: "WhatsApp number / Google or Apple account" },
  ],
  sections: [
    {
      id: "imei",
      title: "Find the IMEI and EID",
      targets: ["imei", "eid"],
      steps: [
        {
          text:
            "Scroll down to IMEI and EID (the EID appears if the phone has an eSIM). Older models may show MEID. To " +
            "copy a number, touch and hold it until Copy appears.",
          path: "Settings > General > About",
          confidence: "official",
        },
        {
          text: "Dual-SIM iPhones (XS, XR and later) usually show two IMEIs, labelled IMEI and IMEI2. Write both.",
          confidence: "reliable",
        },
        {
          text:
            "In the Phone app, dial *#06#. A 'Share Device Identifiers' sheet shows the EID, IMEI and IMEI2. Apple's " +
            "own help pages do not describe this code.",
          path: "*#06#",
          confidence: "reliable",
        },
        {
          text:
            "Phone not set up, or stuck at the Hello screen: tap the (i) button in the bottom-right corner to see " +
            "its identifiers.",
          confidence: "official",
        },
        {
          text:
            "From a computer: connect the iPhone and open Finder (Mac) or the Apple Devices app or iTunes (Windows). " +
            "Click the phone number under the device name, or the device model, to see the EID, IMEI/MEID and ICCID.",
          confidence: "official",
        },
        {
          text:
            "Printed IMEI: on the SIM tray for iPhone 6s to iPhone 13 and iPhone SE (2nd and 3rd generation); " +
            "engraved on the back for iPhone 5, 5c, 5s, 6, 6 Plus and SE (1st generation). iPhone 14 and later have " +
            "none: use Settings.",
          confidence: "official",
        },
        { text: "The barcode label on the original box also shows the IMEI.", confidence: "official" },
        { text: "iPad: cellular iPads show the IMEI on the back.", confidence: "official" },
        KYM_STEP,
      ],
    },
    {
      id: "serial",
      title: "Find the serial number",
      targets: ["serial"],
      steps: [
        { text: "The Serial Number is on the About screen.", path: "Settings > General > About", confidence: "official" },
        {
          text:
            "Other places: account.apple.com > Devices; on another device signed into the same Apple Account, " +
            "Settings > [your name] > tap this device; or the label on the original box.",
          confidence: "official",
        },
        { text: "iPad: the serial number is also printed on the back.", confidence: "official" },
      ],
    },
    {
      id: "make-model",
      title: "Make, model and colour",
      targets: ["makeModel", "color"],
      steps: [
        {
          text: "Model Name shows, for example, 'iPhone 15'. Write it with the make: 'Apple iPhone 15'.",
          path: "Settings > General > About > Model Name",
          confidence: "official",
        },
        {
          text:
            "Model Number first shows a part number starting with M or N. Tap it once to see the model number " +
            "starting with A (for example A3090). Write the A number.",
          path: "Settings > General > About > Model Number",
          confidence: "official",
        },
        {
          text:
            "Colour: no screen shows it. Look at the phone and write the colour you see. Apple's 'Identify your " +
            "iPhone model' page lists the colours each model was sold in, which can help you name it.",
          confidence: "official",
        },
      ],
    },
    {
      id: "mac",
      title: "Find the Wi-Fi MAC address",
      targets: ["mac"],
      steps: [
        {
          text:
            "By default an iPhone uses a different private Wi-Fi address for each network. When Private Wi-Fi " +
            "Address is Off for a network, the phone uses its hardware address there.",
          confidence: "official",
        },
        {
          text:
            "The 'Wi-Fi Address' on the About screen is generally taken to be the phone's own hardware address, " +
            "but Apple does not say so in words.",
          path: "Settings > General > About > Wi-Fi Address",
          confidence: "unverified",
        },
        {
          text:
            "To see the setting for one network, tap the (i) next to it (tap Edit to see networks you are not " +
            "connected to now). On iOS 18 or later, tap Private Wi-Fi Address to see Off, Fixed or Rotating. " +
            "'Rotating' changes the address every 2 weeks.",
          path: "Settings > Wi-Fi > (i)",
          confidence: "official",
        },
        {
          text:
            "The address shown on that network's screen is the one used on that network. If the evidence depends " +
            "on that network (for example router logs), write it too, labelled 'private Wi-Fi address (network name)'.",
          confidence: "reliable",
        },
        MAC_SECOND_CHARACTER_STEP,
      ],
    },
    {
      id: "cloud",
      title: "Cloud ID: Apple Account or WhatsApp number",
      targets: ["cloud"],
      steps: [
        {
          text:
            "Apple Account (formerly Apple ID): tap your name at the top, then Sign-In & Security. Your sign-in " +
            "email addresses and phone numbers are listed. Write it as 'Apple Account: name@example.com'.",
          path: "Settings > [your name] > Sign-In & Security",
          confidence: "official",
        },
        {
          text:
            "WhatsApp: open WhatsApp Settings (newer versions call this tab 'You') or your profile. Your registered " +
            "number is shown. Write it in full, for example 'WhatsApp: +91 98xxxxxxxx'.",
          confidence: "official",
        },
        {
          text: "Google apps (Gmail, Drive): tap your profile picture at the top right to see the signed-in email.",
          confidence: "reliable",
        },
      ],
    },
  ],
  cautions: [
    CAUTION_IMEI_15,
    CAUTION_LUHN,
    "iPhone 14 and later have no IMEI on the SIM tray. Use Settings > General > About or *#06#. Apple's pages " +
      "disagree on which models have a printed IMEI, so treat the Settings screen as the source of truth.",
    CAUTION_OPERATOR_DIGITS,
    CAUTION_BOTH_VALUES_PHONE,
    "Your Apple Account sign-in email may differ from your @icloud.com mail address. Write the one shown under " +
      "Sign-In & Security.",
    "If the WhatsApp number was changed, the number used at the time of the chats may differ from today's. Write " +
      "the number that was used then.",
    CAUTION_NO_SECRETS,
    CAUTION_NO_CHANGES,
    CAUTION_NO_AADHAAR,
  ],
  sources: [
    BSA_SCHEDULE,
    { label: "Apple 108037: find the serial number, IMEI and EID", url: "https://support.apple.com/en-us/108037" },
    { label: "Apple 106343: find the model number", url: "https://support.apple.com/en-us/106343" },
    { label: "Apple 108044: identify your iPhone model", url: "https://support.apple.com/en-us/108044" },
    {
      label: "iPhone User Guide: get information about your iPhone",
      url: "https://support.apple.com/guide/iphone/get-information-about-your-iphone-iph3dd5fc7e/ios",
    },
    { label: "Apple 102509: private Wi-Fi addresses", url: "https://support.apple.com/en-us/102509" },
    APPLE_ACCOUNT,
    {
      label: "iClarified: *#06# on iPhone (third party)",
      url: "https://www.iclarified.com/83557/how-to-find-your-iphone-imei-number-video",
    },
    GMAIL_ACCOUNTS,
    WHATSAPP_CHANGE_NUMBER,
    TS_22_030,
    SANCHAR_SAATHI,
    KYM,
    IEEE_MAC,
  ],
};
