import type { DeviceGuide } from "./guide-types";
import {
  BSA_SCHEDULE,
  IEEE_MAC,
  GOOGLE_COMPUTER,
  APPLE_ACCOUNT,
  MAC_SECOND_CHARACTER_STEP,
  CAUTION_BOTH_VALUES,
  CAUTION_NO_SECRETS,
  CAUTION_NO_CHANGES,
} from "./guides-shared";

// Windows and Mac guides. Content comes from docs/research/devices.md, Sections 4, 5 and 8.
// Confidence labels are explained at the top of guides.ts.

// ---------------------------------------------------------------- Windows

export const WINDOWS_GUIDE: DeviceGuide = {
  profile: "windows",
  title: "Windows PC or laptop",
  sourceKind: "computer",
  summary:
    "Write down the maker, model, colour, serial number and the MAC address of each network adapter. Windows " +
    "Settings does not show the serial, so use the PowerShell commands below or the label on the computer.",
  identifierSlots: [
    { type: "MAC", note: "Wi-Fi" },
    { type: "MAC", note: "Ethernet (if any)" },
    { type: "Cloud ID", note: "Microsoft/Apple account (if relevant)" },
  ],
  sections: [
    {
      id: "make-model",
      title: "Make, model and colour",
      targets: ["makeModel", "color"],
      steps: [
        {
          text: "Press Windows key + I to open Settings. The model name is shown just below the device name at the top.",
          path: "Settings > System > About",
          confidence: "official",
        },
        {
          text:
            "Or click Start, type PowerShell and open Windows PowerShell (no administrator rights needed). Paste this " +
            "line and press Enter. Manufacturer is the make; Model is the model.",
          path: "Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object Manufacturer, Model",
          confidence: "official",
        },
        { text: "Colour: no Windows screen shows it. Look at the computer and write what you see.", confidence: "reliable" },
      ],
    },
    {
      id: "serial",
      title: "Find the serial number",
      targets: ["serial"],
      steps: [
        {
          text:
            "Settings > System > About does not show the hardware serial number. 'Device ID' and 'Product ID' on " +
            "that page are Windows IDs, not the serial number.",
          confidence: "reliable",
        },
        {
          text:
            "In Windows PowerShell, paste this line and press Enter. It shows the serial number stored by the maker. " +
            "Microsoft asks makers to make it match the serial printed on the outside of the device.",
          path: "Get-CimInstance -ClassName Win32_BIOS | Select-Object SerialNumber",
          confidence: "official",
        },
        {
          text: "To cross-check, run this too. IdentifyingNumber is usually the same serial.",
          path: "Get-CimInstance -ClassName Win32_ComputerSystemProduct | Select-Object Vendor, Name, IdentifyingNumber, UUID",
          confidence: "official",
        },
        {
          text:
            "Do not use the old 'wmic bios get serialnumber' command. From August 2026, Windows 11 versions 24H2 " +
            "and 25H2 no longer include WMIC, and it cannot be added back. Use PowerShell instead.",
          confidence: "official",
        },
        {
          text:
            "If the serial reads 'To be filled by O.E.M.', 'System Serial Number', 'Default string', '0', 'None' or " +
            "is blank, no real serial is stored (common on assembled desktops). Use the label on the case or " +
            "motherboard instead.",
          confidence: "reliable",
        },
        {
          text: "Dell: the Service Tag is on the bottom label, or in BIOS setup (press F2 while the computer starts).",
          confidence: "official",
        },
        {
          text:
            "HP: press Fn + Esc (laptops) or Ctrl + Alt + S (desktops) to open HP System Information. HP's own pages " +
            "disagree on which keys work on laptops. On labels the serial is marked 'Serial NO', 'S/N' or 'SN'.",
          confidence: "official",
        },
        {
          text: "Lenovo: the serial number and machine type are on the printed label and in the Lenovo Vantage app.",
          confidence: "official",
        },
      ],
    },
    {
      id: "mac",
      title: "Find the MAC address",
      targets: ["mac"],
      steps: [
        {
          text:
            "In Windows PowerShell, run this line. It lists each network adapter (Wi-Fi, Ethernet). PermanentAddress " +
            "is the address built into the adapter; MacAddress is the address in use now.",
          path: "Get-NetAdapter -Physical | Select-Object Name, InterfaceDescription, MacAddress, PermanentAddress",
          confidence: "official",
        },
        {
          text:
            "Write PermanentAddress as the hardware MAC (it is shown without hyphens). If it differs from " +
            "MacAddress, the adapter is not using its built-in address right now. This was checked for Ethernet " +
            "but is not confirmed for Wi-Fi with random addresses turned on.",
          confidence: "unverified",
        },
        {
          text:
            "Another way, in Command Prompt: getmac /v lists the Physical Address of every network card " +
            "(ipconfig /all shows it as 'Physical Address' under each adapter). With random hardware addresses on, " +
            "it is not confirmed whether these show the random or the hardware address.",
          path: "getmac /v",
          confidence: "official",
        },
        {
          text: "In Settings, look for 'Physical address (MAC)'. Microsoft does not document this label.",
          path: "Settings > Network & internet > Wi-Fi > Hardware properties",
          confidence: "reliable",
        },
        {
          text:
            "Windows 11 can use random hardware addresses for Wi-Fi, for all networks or per network (Wi-Fi > " +
            "Manage known networks > choose the network). If this is on, a network saw a made-up address. Windows " +
            "10 calls it 'Use random hardware addresses'. Look only; do not change it.",
          path: "Settings > Network & internet > Wi-Fi > Random hardware addresses",
          confidence: "official",
        },
        MAC_SECOND_CHARACTER_STEP,
      ],
    },
    {
      id: "cloud",
      title: "Cloud ID (if relevant)",
      targets: ["cloud"],
      steps: [
        {
          text:
            "Google account: open myaccount.google.com in a browser, or select your profile image at the top right " +
            "of a Google page, to see the signed-in email.",
          confidence: "official",
        },
        {
          text:
            "Microsoft account: where Windows shows it was not checked for this guide. If the evidence came from a " +
            "Microsoft service (for example OneDrive or Outlook), write the account email as that service shows " +
            "it, and say where you saw it.",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [
    "Do not use 'Device ID' or 'Product ID' from Settings > System > About as the serial number.",
    "'To be filled by O.E.M.', 'Default string' and similar text mean there is no real serial stored. Never print " +
      "these on the certificate: use the physical label.",
    "Do not run 'wmic': it is removed on new Windows 11 installations. Use the PowerShell commands instead.",
    CAUTION_BOTH_VALUES,
    CAUTION_NO_SECRETS,
    CAUTION_NO_CHANGES,
  ],
  sources: [
    BSA_SCHEDULE,
    {
      label: "Microsoft Support: find your device information",
      url: "https://support.microsoft.com/en-us/windows/which-version-of-windows-operating-system-am-i-running-628bec99-476a-2c13-5296-9dd081cdd808",
    },
    { label: "Microsoft Learn: Win32_BIOS", url: "https://learn.microsoft.com/windows/win32/cimwin32prov/win32-bios" },
    {
      label: "Microsoft Learn: Win32_ComputerSystem",
      url: "https://learn.microsoft.com/windows/win32/cimwin32prov/win32-computersystem",
    },
    {
      label: "Microsoft Learn: Win32_ComputerSystemProduct",
      url: "https://learn.microsoft.com/windows/win32/cimwin32prov/win32-computersystemproduct",
    },
    { label: "Microsoft Learn: SMBIOS guidance for makers", url: "https://learn.microsoft.com/windows-hardware/drivers/bringup/smbios" },
    {
      label: "Microsoft Learn: 'To be filled by O.E.M' default string",
      url: "https://learn.microsoft.com/windows-hardware/manufacture/desktop/oa3-command-line-config-file-syntax",
    },
    { label: "Microsoft Learn: WMIC", url: "https://learn.microsoft.com/windows/win32/wmisdk/wmic" },
    {
      label: "Microsoft Support: WMIC removal from Windows",
      url: "https://support.microsoft.com/en-us/topic/windows-management-instrumentation-command-line-wmic-removal-from-windows-e9e83c7f-4992-477f-ba1d-96f694b8665d",
    },
    {
      label: "Microsoft Learn: getmac",
      url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/getmac",
    },
    {
      label: "Microsoft Learn: ipconfig",
      url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig",
    },
    {
      label: "Microsoft Learn: Get-NetAdapter",
      url: "https://learn.microsoft.com/en-us/powershell/module/netadapter/get-netadapter",
    },
    { label: "Microsoft Support: random hardware addresses", url: "https://support.microsoft.com/help/4578384" },
    {
      label: "Dell: find the Service Tag",
      url: "https://www.dell.com/support/kbdoc/en-us/000130711/how-to-locate-your-system-service-tag-using-command-prompt",
    },
    { label: "HP: find the serial number", url: "https://support.hp.com/us-en/document/ish_2039298-1862169-16" },
    {
      label: "Lenovo: find the serial number",
      url: "https://support.lenovo.com/us/en/solutions/ht510152-how-to-find-serial-numbers-pc",
    },
    GOOGLE_COMPUTER,
    IEEE_MAC,
  ],
};

// ---------------------------------------------------------------- Mac

export const MAC_GUIDE: DeviceGuide = {
  profile: "mac",
  title: "Mac computer",
  sourceKind: "computer",
  summary:
    "Write down the model, colour, serial number and the MAC address of each network port. About This Mac shows " +
    "the model and serial; the network settings show the MAC.",
  identifierSlots: [
    { type: "MAC", note: "Wi-Fi" },
    { type: "MAC", note: "Ethernet (if any)" },
    { type: "Cloud ID", note: "Microsoft/Apple account (if relevant)" },
  ],
  sections: [
    {
      id: "serial",
      title: "Model and serial number",
      targets: ["makeModel", "serial"],
      steps: [
        {
          text: "Choose About This Mac from the Apple menu. It shows the model name and the serial number.",
          path: "Apple menu > About This Mac",
          confidence: "official",
        },
        {
          text: "You can also find the serial number in System Settings.",
          path: "Apple menu > System Settings > General > About",
          confidence: "official",
        },
        {
          text:
            "For a full report, hold the Option key, then choose System Information from the Apple menu and click " +
            "Hardware. It shows the Serial Number, Model Identifier and Model Number.",
          path: "Apple menu > System Information > Hardware",
          confidence: "official",
        },
        {
          text:
            "In Terminal, this command shows 'Model Name', 'Model Identifier' and 'Serial Number (system)'. Since " +
            "macOS 26.3.1 the output may start with an extra log line, so read it yourself.",
          path: "system_profiler SPHardwareDataType",
          confidence: "reliable",
        },
        {
          text: "Another Terminal command that shows the serial number:",
          path: "ioreg -l | grep IOPlatformSerialNumber",
          confidence: "official",
        },
        {
          text: "The serial is usually printed on the underside of the Mac near the regulatory markings, and on the box.",
          confidence: "official",
        },
      ],
    },
    {
      id: "color",
      title: "Colour",
      targets: ["color"],
      steps: [{ text: "No screen shows the colour. Look at the Mac and write the colour you see.", confidence: "reliable" }],
    },
    {
      id: "mac",
      title: "Find the MAC address",
      targets: ["mac"],
      steps: [
        {
          text: "Choose Wi-Fi or Ethernet, click Details, then the Hardware tab, and look for the 'MAC address' row.",
          path: "System Settings > Network > Details > Hardware",
          confidence: "reliable",
        },
        {
          text:
            "In Terminal, this lists each network port with its address. en0 is usually Wi-Fi, but not always. " +
            "This command was not tested for this guide.",
          path: "networksetup -listallhardwareports",
          confidence: "unverified",
        },
        {
          text:
            "macOS Sequoia 15 or later: click Details next to a network to see its Private Wi-Fi Address setting " +
            "(Off, Fixed or Rotating). Look only; do not change it.",
          path: "System Settings > Wi-Fi > Details > Private Wi-Fi Address",
          confidence: "official",
        },
        MAC_SECOND_CHARACTER_STEP,
      ],
    },
    {
      id: "cloud",
      title: "Cloud ID: Apple Account",
      targets: ["cloud"],
      steps: [
        {
          text: "Your Apple Account sign-in email addresses and phone numbers are listed here.",
          path: "System Settings > [your name] > Sign-In & Security",
          confidence: "official",
        },
      ],
    },
  ],
  cautions: [
    CAUTION_BOTH_VALUES,
    "Your Apple Account sign-in email may differ from your @icloud.com mail address.",
    CAUTION_NO_SECRETS,
    CAUTION_NO_CHANGES,
  ],
  sources: [
    BSA_SCHEDULE,
    { label: "Apple 102767: find the Mac model and serial number", url: "https://support.apple.com/en-us/102767" },
    {
      label: "Mac User Guide: About settings",
      url: "https://support.apple.com/guide/mac-help/view-about-settings-mchlea7173f3/mac",
    },
    { label: "Mac User Guide: private Wi-Fi address", url: "https://support.apple.com/guide/mac-help/mchlb1cb3eb4/mac" },
    APPLE_ACCOUNT,
    IEEE_MAC,
  ],
};
