# Sakshya Kit: finding device identifiers for the BSA Section 63(4) certificate

Research date: 2026-10-29. Prepared for the "device" section of the Schedule certificate under Section 63(4)(c), Bharatiya Sakshya Adhiniyam, 2023 (BSA).

## How to read this file

Every step carries a tag:

| Tag | Meaning |
|---|---|
| **[OFFICIAL]** | Read directly on a vendor, standards-body or government page or manual during this research |
| **[OFFICIAL-snippet]** | Official page, but it blocked direct fetching; wording taken from search-engine excerpts of that page |
| **[3P]** | Reliable third party (carrier, university IT, reseller, forensic body), named in Sources |
| **[INFERENCE]** | Researcher reasoning, not stated by any source |
| **[UNVERIFIED]** | Could not be confirmed. Do not present as fact in the tool |

Menu names drift with OS and firmware versions. Every vendor says paths "may vary". The tool should show the variants and always offer a fallback (dial code, box label, invoice).

---

## 0. The form itself (official text)

Source: Gazette of India Extraordinary, No. 55, 25 Dec 2023, The Bharatiya Sakshya Adhiniyam, 2023 (No. 47 of 2023), THE SCHEDULE [See section 63(4)(c)], pp. 46-47. **[OFFICIAL]**

Part A "(To be filled by the Party)":
- Device type to tick: "Computer / Storage Media", "DVR", "Mobile", "Flash Drive", "CD/DVD", "Server", "Cloud", "Other"
- "Make & Model: ________ Color: ________"
- "Serial Number: ________"
- "IMEI/UIN/UID/MAC/Cloud ID ________ (as applicable)"
- "and any other relevant information, if any, about the device/digital record ____ (specify)."
- Part B (to be filled by the Expert) repeats the same device lines word for word.

Section 63(4)(b) (verbatim): "giving such particulars of any device involved in the production of that electronic record as may be appropriate for the purpose of showing that the electronic record was produced by a computer or a communication device..."

**"UIN/UID" has no official definition.** **[UNVERIFIED interpretation]**
- The BSA does not define these terms. LiveLaw and other commentary repeat the labels without defining them.
- One plausible reading of UIN: the Drone Rules, 2021, rule 2(za), define "Unique Identification Number" for registered drones. That fits drone footage, but nothing confirms the drafters meant it.
- UID most likely means a generic device "unique identifier" (for example a CCTV P2P/cloud UID).
- **The tool should NOT ask for Aadhaar here.** Aadhaar identifies a person, not a device.
- "(as applicable)" suggests filling only the identifiers that apply and writing "Not applicable" for the rest. This is a reading of the text, not legal advice.

---

## 1. Cross-cutting rules for the tool

1. **Record what the device shows, exactly, and say where it came from.** Example: "IMEI 1: 356xxxxxxxxxxxx (Settings > About phone)". If the label and the screen differ, record both with their sources. Do not silently pick one.
2. **Dual-SIM phones have two IMEIs. Record both**, labelled "IMEI 1" and "IMEI 2". Add "EID" if the phone has an eSIM.
   - Google: "Pixel phones that can use both eSIM and SIM cards have two IMEI numbers". **[OFFICIAL]**
   - Sanchar Saathi FAQ: "Dual SIM phones will have two IMEI numbers." **[OFFICIAL]**
3. **IMEI must be 15 digits and pass the Luhn check** (Section 8). If `*#06#` shows extra digits (for example a "/01" or SV suffix), keep only the first 15. **[OFFICIAL: 3GPP TS 22.030 §6.7]** Do not enter "IMEI SV" (16 digits) as the IMEI.
4. **Wi-Fi MAC: record the device's own (hardware/factory) MAC by default.** If the evidence depends on a particular Wi-Fi network (for example router logs), also record the per-network private or randomized MAC for that network, clearly labelled. See Sections 2.3, 3.3, 4.4 and 8.3.
5. **Color is not shown in any phone or PC Settings screen.** Tell the user to write it from looking at the device, or from the box or invoice. **[OFFICIAL, by absence on Apple/Google/Samsung pages]**
6. **Make & Model:** write the brand plus the model name and, where available, the model number.
   - Examples: "Samsung Galaxy A55 (SM-A556E)", "Apple iPhone 15 (A3090)".
   - The Samsung "SM-" model number format is [UNVERIFIED] on a Samsung page, but it is shown on the About phone screen.
7. **Never put secrets on the certificate:** passwords, PINs, the Hikvision "Verification Code", or unredacted photos of a Hikvision label QR code (it encodes the verification code). See Section 6.
8. **Do not change settings on the device while collecting identifiers.** This applies especially to the date/time on CCTV recorders (Section 6.8).

---

## 2. Android phones

### 2.1 Any Android phone: dial `*#06#`

1. Open the phone's own **Phone** (dialer) app. Use the built-in app, not a third-party dialer.
2. Type `*#06#`. No call is placed; a box pops up automatically.
3. Copy the IMEI (two IMEIs on dual-SIM phones). Some phones (for example Samsung) also show the serial number (S/N).

Verification:
- The Android open-source dialer hard-codes `*#06#` to show the IMEI, one row per SIM slot (MEID on old CDMA phones). **[OFFICIAL: AOSP source]**
- Samsung India: "Dial *#06#. The screen displayed IMEI & S/N", and notes it works "when supported by your network service provider". **[OFFICIAL]**
- OPPO: "If the *#06# doesn't work, we recommend using the *#66# to check the IMEI on your OPPO phone." **[OFFICIAL]**
- OnePlus, vivo, realme and Xiaomi all list `*#06#`. **[OFFICIAL / OFFICIAL-snippet]**
- `*#06#` does not reliably show the EID on Android. Get the EID from Settings or the box. **[AOSP code does not show it; user reports agree]**

### 2.2 Brand-by-brand Settings paths

#### Samsung Galaxy (One UI)
1. Open **Settings**, scroll to the bottom and tap **About phone**. Model Name, Serial number and IMEI are shown there.
   - Samsung India, updated 30 Jul 2026, verbatim: "Tap on About phone", "The Model Name, Serial number and IMEI will be displayed". **[OFFICIAL, re-checked]**
2. For the second IMEI and more detail, tap **Status information**, then **IMEI information**.
   - Samsung UAE: "Select IMEI Information or Status to view your IMEI number." **[OFFICIAL]**
   - The label "Status information" on current models is from a Verizon page. **[3P carrier]**
3. **EID (eSIM):** About phone > Status (shown as "Status information" on current One UI) > EID. Also printed on the box. **[OFFICIAL: Samsung UK; label 3P]**
4. **Device Wi-Fi MAC:** About phone > Status information > "Phone Wi-Fi MAC address". **[3P: Verizon, Galaxy S25]** Older Samsung wording: About phone > Status > Wi-Fi MAC address. **[OFFICIAL: Samsung UK]** Wi-Fi may need to be switched on.
5. **Other places:** the sticker on the back of the phone, the sticker on the original box near the barcode, and the purchase invoice. **[OFFICIAL]** Samsung says the SIM tray only for "older devices". On phones with a removable battery, look under the battery. **[OFFICIAL]**

#### Google Pixel
1. **IMEI:** Settings > **About phone** > "IMEI". For the second IMEI: "IMEI (SIM slot 2)". It may need Dual SIM to be enabled. **[OFFICIAL: Pixel Help]**
2. **EID:** Settings > About phone > **SIM status** > "EID". **[OFFICIAL]**
3. **Model:** Settings > About phone > "Model". **[OFFICIAL]**
4. **Serial number:** Settings > About phone > tap **Model**. A hardware screen opens showing Serial number and Hardware version.
   - The AOSP Settings source defines this screen with `hardware_info_device_serial`. **[OFFICIAL: AOSP source]**
   - "Tap Model" wording is from a Qualcomm support page. **[3P]**
   - Google Store "Your Devices" page also lists serial numbers, IMEIs and models. **[OFFICIAL]**
5. **Device Wi-Fi MAC:** Settings > About phone > "Device Wi-Fi MAC address".
   - Google Pixel Help confirms About phone shows the Wi-Fi MAC. The on-screen label is from Verizon. **[OFFICIAL + 3P]**
   - AOSP code confirms this entry reads the factory MAC. **[OFFICIAL: AOSP]**
6. **Physical locations:** "Your phone's SIM card tray" and the box. **[OFFICIAL]**
7. **Find My Device** (web): select the phone, then the Information icon. **[OFFICIAL]**

#### Xiaomi / Redmi / POCO (HyperOS; older MIUI)
1. **IMEI:** Settings > **About phone** > **Detailed info and specs** > **Status** > IMEI. **[OFFICIAL-snippet: Xiaomi FAQ, Redmi 13C 5G]**
   - Older MIUI label: Settings > About phone > **All specs** > Status. **[OFFICIAL: Xiaomi account help]**
2. **Serial number:** Settings > About phone > Detailed info and specs > Status > tap Model > Serial number. **[OFFICIAL-snippet]**
3. **Model:** Settings > About phone > Detailed info and specs > "Model". **[OFFICIAL-snippet]**
4. **Wi-Fi MAC:** Settings > About phone > Detailed info and specs > Status > Wi-Fi MAC address. **[OFFICIAL-snippet]**
5. **Other places:** "You can find IMEI on the packaging of your device." On removable-battery phones it is under the battery. **[OFFICIAL]**

Caveat: mi.com blocked direct fetching (HTTP 403), so most Xiaomi wording comes from search excerpts of the official pages.

#### OnePlus (OxygenOS)
Source: OnePlus India "How to Find / Check the IMEI and SN on OnePlus Products" (lists OnePlus 15 / Nord 6, so current). **[OFFICIAL]**
1. **IMEI:** dial `*#06#`, or open "Settings app > About device > Status > IMEI 1" (and IMEI 2).
2. **Serial number:** "Settings app > About device > Status > Serial Number".
3. **Other places:** "Located on the phone's original box", "On a small sticker on the back of the phone", "On the order's invoice from the seller".
4. **Wi-Fi MAC / Bluetooth address:** probably on the same Status screen (as on realme, which shares ColorOS). **[INFERENCE / 3P]**

#### OPPO (ColorOS)
1. **IMEI:** "[Settings] > [About Phone] / [About Device] > [Status] > [IMEI]". Or dial `*#06#`, with `*#66#` as the fallback. **[OFFICIAL: OPPO India]**
2. **Box:** "Check the bottom of product packing box." **[OFFICIAL-snippet]**
3. **Serial number / MAC:** probably About device > Status, as on realme and OnePlus. **[UNVERIFIED for OPPO]**

#### realme (realme UI)
1. **Status screen:**
   - "realme UI 1.0 & above versions: Settings > About phone/device > Status".
   - Lists IMEI 1, IMEI 2, MEID, IMEI SV, IP address, Wi-Fi MAC address, Bluetooth address, Serial number. **[OFFICIAL, updated 2024-12-04]**
2. **IMEI:** "[Settings] > [About Phone] / [About Device] > [Status] > [IMEI1]", or `*#06#`, or the phone box. **[OFFICIAL, updated 2025-04-01]**
3. **Caution:**
   - "IMEI SV is the software version of the IMEI". Do not enter it as the IMEI.
   - realme describes the Settings serial as "the chip ID sequence of the phone", which may differ from the box serial. Compare the two.

#### vivo (Funtouch OS / OriginOS, India)
1. **IMEI:**
   - "Open the dial pad and enter *#06#".
   - Or "Settings -- (system management) -- about phone -- status information".
   - Some models: "settings -- my device -- more parameters".
   - Also printed "on the mobile phone box" and the warranty card. vivo adds: "The actual UI, path and function may differ". **[OFFICIAL: vivo India FAQ]**
2. **Wi-Fi MAC:**
   - OriginOS 6+: "Settings > WiFi > Advanced settings > MAC address".
   - Funtouch OS 11+: Settings > (Network and Internet) > WiFi > gear icon of the connected network. This per-network screen may show a randomized MAC. **[OFFICIAL: vivo Singapore]**
3. **Serial number / model path:** probably About phone > Status information. **[UNVERIFIED]**

### 2.3 Android Wi-Fi MAC: the real one vs the randomized one (plain language)

**[OFFICIAL: source.android.com "MAC randomization behavior", updated 2026-10-09]**

- **Every phone has one fixed factory MAC.** Android calls it "globally unique and static". It is the address shown in About phone / Status. The label varies:
  - "Device Wi-Fi MAC address" (Pixel)
  - "Phone Wi-Fi MAC address" (Samsung)
  - "Wi-Fi MAC address" (realme, Xiaomi)
- **By default the phone shows each Wi-Fi network a different made-up MAC.**
  - "For devices running Android 10 or higher, the framework uses a randomized MAC address by default."
  - It is generated per network (based on SSID and other profile parameters).
  - It "remains the same until a factory reset" and is not re-randomized if the network is forgotten and re-added.
- **Android 12+ "non-persistent" randomization** re-randomizes at connection time, but only in narrow cases:
  - an app's network suggestion requests it;
  - an open network with an OEM overlay that is off by default;
  - or the Developer Options toggle "Wi-Fi non-persistent MAC randomization".
- **Where to see and switch the per-network MAC:**
  - Pixel/AOSP: Settings > Network & internet > Internet > gear next to the network. The screen shows "Randomized MAC address". Under Privacy, choose "Use randomized MAC" or "Use device MAC". **[OFFICIAL Pixel Help + 3P]**
  - Samsung: Settings > Connections > Wi-Fi > gear next to the network > View more / Advanced > "MAC address type". **[3P only; exact option names UNVERIFIED]**
  - vivo: network > Privacy > "Use device MAC or Use random MAC". **[OFFICIAL]**
- **Which MAC a router log shows:** the one the phone used on that network. That is the randomized one unless the user switched that network to "device MAC". **[OFFICIAL by implication]**
  - A factory reset after the event changes the randomized MAC.
  - Mobile-data activity involves no Wi-Fi MAC at all. **[INFERENCE, general networking]**
- Google tip: "include both MAC addresses" when configuring parental controls. **[OFFICIAL]**

### 2.4 Physical labels (Android)
- **Retail box label:** IMEI(s), serial and model. Official for Samsung, Google, Xiaomi, OnePlus, OPPO, realme and vivo.
- **Back sticker:** Samsung and OnePlus, official. Often a removable film that may be gone.
- **SIM tray:** official only for Google Pixel and older Samsung models. Treat it as uncommon on other Android brands.
- **Under a removable battery:** older or rugged Samsung and Xiaomi phones. **[OFFICIAL]**
- **Purchase invoice:** Samsung and OnePlus list it officially.

---

## 3. iPhone / iPad

Current versions: iOS 27 (released 14 Sept 2026, per MacRumors **[3P]**; Apple's iPhone User Guide now defaults to iOS 27 **[OFFICIAL]**). iOS 17/18/26 remain common; the About screen is essentially the same across them.

### 3.1 Settings > General > About **[OFFICIAL: Apple iPhone User Guide; Apple 108037]**
1. Open **Settings**, tap **General**, then tap **About**.
2. **Model Name** (for example "iPhone 15"): use it for Make & Model, written as "Apple iPhone 15".
3. **Model Number:** at first it shows a part number (starting with M or N). **Tap it once** to show the model number, which starts with "A" (for example A3090). Apple: "To find the model number, tap the part number."
4. **Serial Number** is on the same screen.
5. Scroll down for **IMEI**, **EID** (eSIM) and ICCID. Older or CDMA models show **MEID**.
6. To copy any of these: "touch and hold the identifier until Copy appears."

Apple's iOS 27 About list includes: Name, iOS version, Model Name, Model Number, Serial number, "Wi-Fi and Bluetooth® addresses", Modem Firmware, Carrier Lock, network and carrier info, "IMEI ..., EID, and other cellular identifiers", and "Available SIM or SIMs".

**Phone not set up or locked at the Hello screen:** tap the Info (i) button in the bottom-right corner of the Hello screen to see identifiers. **[OFFICIAL: Apple 108037]**

**From a computer:** connect the iPhone and open Finder (Mac) or the Apple Devices app / iTunes (Windows). "Click Phone Number under your device name or the device model to find the EID, IMEI/MEID, and ICCID." **[OFFICIAL]**

**Other places:**
- account.apple.com > Devices.
- On another device signed into the same Apple Account: Settings > [your name] > tap the device.
- The barcode label on the original box.
- **[OFFICIAL]**

### 3.2 Dual SIM / eSIM
- Record "IMEI 1", "IMEI 2" and "EID".
- Apple's official pages list "IMEI..., EID, and other cellular identifiers" but never use the word "IMEI2". **[OFFICIAL]**
- That dual-SIM iPhones (XS/XR and later) show "IMEI" and "IMEI2" in About and via `*#06#` comes from Apple Community posts and iClarified only. **[3P]**
- `*#06#` on iPhone: open the Phone app and dial it. A "Share Device Identifiers" sheet shows EID, IMEI and IMEI2 (iClarified, iOS 27). Apple's own article does not mention `*#06#`. **[3P]**

### 3.3 IMEI on the SIM tray or body **[OFFICIAL: Apple 108037, 108044]**
- **IMEI printed on the SIM tray:** iPhone 6s through iPhone 13 series, and iPhone SE (2nd and 3rd gen).
- **IMEI engraved on the back:** iPhone 5, 5c, 5s, 6/6 Plus, SE (1st gen).
- **"iPhone 14 models and later don't have an IMEI/MEID engraving."** For iPhone 14 and later, use Settings or `*#06#`, not the tray.
- Indian units of iPhone 14, 15, 16, 17 and 18 Pro still have a nano-SIM tray. Apple's no-tray list (US and some Gulf countries) does not include India. **iPhone Air and iPhone Duo have no SIM tray anywhere.**
- Conflict: Apple's iOS 27 guide says "On supported models, the IMEI is also printed on the SIM card tray," while article 108037 lists only up to iPhone 13 / SE 3. Treat Settings as the source of truth.
- **iPad:** the serial number is on the back. Cellular iPads also show the IMEI there. **[OFFICIAL]**

### 3.4 Wi-Fi address vs "Private Wi-Fi Address" **[OFFICIAL: Apple 102509]**
- Apple: "By default, your device improves privacy by using a different MAC address for each Wi-Fi network. This unique MAC address is your device's private Wi-Fi address".
  - "When set to Off, your device uses its hardware MAC address."
  - "Fixed": a private address that does not rotate.
  - "Rotating": "rotates to a different private address every 2 weeks."
- **Device's own (hardware) Wi-Fi MAC:** Settings > General > About > **Wi-Fi Address**. **[3P + INFERENCE]** Apple lists "Wi-Fi and Bluetooth addresses" in About but does not say in words that this is the hardware address.
- **Address a specific network saw:**
  1. Settings > **Wi-Fi**. If you are not connected to that network, tap **Edit** (top right) to see known networks.
  2. Tap the **(i)** (More Info) button next to the network.
  3. iOS 18 or later: tap **Private Wi-Fi Address** to see Off / Fixed / Rotating. Earlier iOS: a single on/off switch. **[OFFICIAL]**
  4. The address shown on that screen is the one used on that network. **[3P]**
- **Bluetooth:** Settings > General > About > Bluetooth. **[OFFICIAL]**

### 3.5 Apple Account (formerly Apple ID) **[OFFICIAL: Apple 102627]**
- Apple: "Apple ID is now Apple Account." The rename came with iOS 18 / macOS Sequoia in 2024. **[3P for timing]**
- Steps:
  1. Settings > tap **your name** at the top.
  2. Tap **Sign-In & Security**. The sign-in email address(es) and phone number(s) are listed there.
  3. Write it in the Cloud ID field as "Apple Account: name@example.com".
- Caveat: the Apple Account sign-in email may differ from the user's @icloud.com mail address. **[UNVERIFIED]**

### 3.6 Color
- Not shown in About on any iOS version. **[OFFICIAL, by absence]**
- Apple's "Identify your iPhone model" page lists the colours each model was sold in, so the tool can offer Apple's colour names for the chosen model. The user still confirms by looking at the device.

---

## 4. Windows 10 / 11 PCs

Status: Windows 10 support ended 14 Oct 2025. **[OFFICIAL]** Windows 11 24H2/25H2 are current, and 26H1/26H2 are listed on Microsoft Learn. **[OFFICIAL]**

### 4.1 Settings > System > About **[OFFICIAL: support.microsoft.com]**
1. Press **Windows key + I** to open Settings.
2. Click **System**, then **About** (at the bottom).
3. The top card shows the device name, "with the model name displayed just below it."
4. **No hardware serial number is shown on this page.** There is no evidence that any current Windows 11 build shows it.
5. **Warning:** "Device ID" (a GUID) and "Product ID" (the Windows licence ID) on this page are NOT the serial number. Do not put them on the certificate as the serial. **[3P field list; INFERENCE on misuse risk]**

### 4.2 PowerShell: make, model, serial (recommended) **[OFFICIAL: learn.microsoft.com; tested locally on Windows 11 Pro 25H2]**
1. Click **Start**, type **PowerShell**, and open **Windows PowerShell**. No administrator rights are needed.
2. Paste each line and press **Enter**:

```powershell
Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object Manufacturer, Model
Get-CimInstance -ClassName Win32_BIOS | Select-Object SerialNumber
Get-CimInstance -ClassName Win32_ComputerSystemProduct | Select-Object Vendor, Name, IdentifyingNumber, UUID
```

What each value means:
- `Manufacturer`: "Name of a computer manufacturer."
- `Model`: "Product name that a manufacturer gives to a computer."
- `Win32_BIOS.SerialNumber` is the system serial. Microsoft's SMBIOS guidance to OEMs: "The format of the Serial Number field string is to match the Serial Number on the exterior of the device." **[OFFICIAL]**
- `IdentifyingNumber`: "Product identification, such as a serial number". It is usually the same value.

**Placeholder serials on custom-built or assembled PCs:**
- The serial may read "To be filled by O.E.M.", "System Serial Number", "Default string", "0", "None", blank, or an all-zero UUID. Microsoft's OA 3.0 documentation names "To be filled by O.E.M" as a default string. **[OFFICIAL]** "Default string" was observed on a custom desktop in local testing.
- **The tool should treat these as "no serial available"** and ask for the motherboard or chassis label instead. Never print the placeholder on the certificate.

Avoid `Get-WmiObject` / `gwmi`, which some OEM pages still show. "Starting in PowerShell 3.0, this cmdlet has been superseded by Get-CimInstance." **[OFFICIAL]**

### 4.3 WMIC is gone: do not tell users to run `wmic bios get serialnumber` **[OFFICIAL, re-checked]**
- learn.microsoft.com "WMIC: WMI command-line utility", verbatim:
  - "WMIC is deprecated as of Windows 10, version 21H1".
  - "Starting in August 2026, Windows 11, versions 24H2 and 25H2 no longer include the Windows Management Instrumentation Command-line (WMIC) utility and it can't be added back as a Feature on Demand (FoD). WMIC is already removed by default in new installations of these versions."
- Microsoft Support KB5067470, "WMIC removal from Windows": "Use PowerShell for WMI tasks."
- Older pages (2024-2025) said WMIC could be re-added as an FoD. The August 2026 statements supersede them.

### 4.4 MAC address

Command Prompt or PowerShell:

```
getmac /v
ipconfig /all
```

```powershell
Get-NetAdapter -Physical | Select-Object Name, InterfaceDescription, MacAddress, PermanentAddress
```

- **`getmac /v`:** "Returns the media access control (MAC) address ... for all network cards". Columns: Connection Name, Network Adapter, Physical Address, Transport Name. **[OFFICIAL + local test]**
- **`ipconfig /all`:** the MAC is the "Physical Address" line under each adapter. **[OFFICIAL command; label from local test]**
- **`Get-NetAdapter`:**
  - `MacAddress` is the address currently in use.
  - `PermanentAddress` is "The network address that is hardcoded into a port" (shown without hyphens). **[OFFICIAL]**
  - If the two differ (after removing hyphens), the adapter is not using its burned-in address. **[local test on Ethernet; UNVERIFIED for Wi-Fi with random addresses on]**
- **Settings path:** Settings > Network & internet > Wi-Fi (or Ethernet) > **Hardware properties** > "Physical address (MAC)". **[3P: university IT KB; Microsoft does not document this label]**
- **Random hardware addresses (Windows Wi-Fi MAC randomization):** **[OFFICIAL: support.microsoft.com/help/4578384]**
  - Windows 11: Settings > Network & internet > Wi-Fi > "Random hardware addresses" (global). Per network: Wi-Fi > Manage known networks > choose the network > "Random hardware addresses".
  - Windows 10: "Use random hardware addresses"; per network under Manage known networks > Properties.
  - Whether `getmac`, `ipconfig` and the Hardware properties page show the random or the hardware address when randomization is on: **[UNVERIFIED]**. Use `PermanentAddress` for the hardware MAC.
- **Identify a randomized MAC** by its second hex character (Section 8.3).

### 4.5 Physical labels and OEM tools
- **Dell:** the Service Tag is on the bottom label or in BIOS setup (F2). Dell KB 000130711 also notes WMIC is deprecated. **[OFFICIAL]**
- **HP:**
  - Press Fn + Esc (laptops) or Ctrl + Alt + S (desktops) to open HP System Information.
  - The serial is marked "Serial NO, S/N, or SN" on labels; the product number is "Product NO or P/N".
  - **[OFFICIAL-snippet; HP's own pages conflict on Ctrl+Alt+S for laptops]**
- **Lenovo:** serial and machine type are on the printed label, in Lenovo Vantage, or via "detect my product" (article HT510152). **[OFFICIAL-snippet]**
- **Cloud ID on Windows** (Microsoft account): not researched. **[GAP]**

---

## 5. macOS (brief)

1. **Model and serial:** Apple menu > **About This Mac**. It shows the model name and "also shows the serial number." **[OFFICIAL: Apple 102767, published 26 Oct 2026]**
2. **Alternative:** Apple menu > **System Settings** > **General** > **About** ("Serial number: Shows the serial number of your Mac"). **[OFFICIAL: Mac User Guide]**
3. **Full hardware report:** hold **Option**, then choose Apple menu > **System Information** > Hardware. Shows Serial Number, Model Identifier and Model Number. **[OFFICIAL]**
4. **Terminal:**

```
system_profiler SPHardwareDataType
ioreg -l | grep IOPlatformSerialNumber
```

   - `ioreg` is given by Apple 102767. **[OFFICIAL]**
   - `system_profiler` output includes "Model Name", "Model Identifier", "Serial Number (system)" and "Hardware UUID". **[3P: University of Michigan]**
   - Since macOS 26.3.1 the output begins with an extra log line. Have a human read the output; don't parse it automatically. **[3P: Apple Developer Forums]**
5. **Physical:** the serial is "usually printed on the underside of your Mac, near the regulatory markings", and on the box. **[OFFICIAL]**
6. **MAC address:**
   - System Settings > **Network** > select Wi-Fi or Ethernet > **Details** > **Hardware** tab > "MAC address" row. **[3P; Apple confirms the path but not the MAC row]**
   - Terminal: `networksetup -listallhardwareports`, `networksetup -getmacaddress en0`, `ifconfig en0 | grep ether`. `en0` is usually Wi-Fi but not always. `ifconfig` may show the private address. **[3P; untested]**
7. **Private Wi-Fi address on Mac (macOS Sequoia 15 or later):** System Settings > Wi-Fi > Details next to the network > Private Wi-Fi Address: Off / Fixed / Rotating. **[OFFICIAL]**
8. **Apple Account:** System Settings > [your name] > **Sign-In & Security**. **[OFFICIAL]**

---

## 6. CCTV DVR / NVR recorders (India)

### 6.0 How to fill the certificate for a DVR/NVR (all brands)

| Field | What to write | Notes |
|---|---|---|
| Make | Brand on the unit: Hikvision, Prama, Dahua, CP Plus, Godrej, Honeywell / "Impact by Honeywell" | White-label XMeye units: the seller brand on the label. "XMeye" is only the app/platform name. |
| Model | "Model" from the rear/bottom label | Cross-check with on-screen "Model" (Hikvision) or "Device Model" (Dahua, CP Plus) |
| Color | From looking at the unit | No menu shows it |
| Serial Number | S/N from the label, cross-checked with on-screen serial | Write both, with sources, if they differ. Dahua FAQ: "For some previous series products, the device SN is the main board SN, it might result in error." Dahua's sample screen even shows "SN 0". If the screen shows 0 or blank, use the label. **[OFFICIAL]** |
| IMEI/UIN/UID/MAC/Cloud ID | LAN **MAC address**, plus the cloud/P2P ID if linked to a phone app, each labelled | Example: "MAC: 00:40:5e:xx:xx:xx; Hik-Connect serial: 123456789". IMEI only applies to recorders with a 4G/SIM module. |

**Do NOT use these as the serial number:**
- Hikvision "Device No.": a 1–255 number (default 255) used for remote/keyboard control, even though some manuals call it the "serial number of video recorder". **[OFFICIAL]**
- Dahua "Device No." under General: user-entered.
- Hard-disk serials (HDD/Disk screens; the Godrej "Disk Settings" serial).
- Camera serials (camera tabs, device-access lists).

**Never write or attach:**
- The Hikvision **Verification Code**, which is used "for verifying user identity, as well as encrypting a device's videos". **[OFFICIAL]**
- Any password.
- An unredacted photo of the Hikvision label QR code, which "contains the model, serial number and verification code". **[OFFICIAL]**
- The "keep it off the certificate" advice is **[INFERENCE]** from Hikvision's own description of what the code does.

**Recommended primary method for non-technical users:**
1. Photograph the rear/bottom label (covering any verification code or QR).
2. Photograph the on-screen device-info page.
3. Treat menu paths as "likely, varies by firmware". Use SADP/ConfigTool for reading only: they can also change IPs and reset passwords.

### 6.1 Hikvision (and Prama)

**On the recorder's own screen** (right-click > Menu). The path varies by firmware:

| GUI generation | Device info (Model, Serial No., Firmware) | MAC address | Tag |
|---|---|---|---|
| GUI 3.x (older, firmware V3.x) | **Menu > Maintenance > System Info > Device Info** tab | **Menu > Configuration > Network > General** tab, "MAC Address" | [OFFICIAL, re-checked: NVR manual V3.4.98 p.193, p.151] |
| GUI 4.0 (V4.1x, ~2018+) | **Menu > Maintenance > System Info > Device Info** | **System > Network > TCP/IP**, "MAC Address" | [OFFICIAL: UD09934B p.202, p.157] |
| Newer Easy/Expert UI (DVR V4.71–4.83, NVR V4.76) | Not stated in manuals. Maintenance opens via the (i) icon at top right > More | not stated | [UNVERIFIED]; use label, web or SADP |
| V5.x NVR UI | **System > System Maintenance > Running Info > System Info** (whether it lists model/serial is unconfirmed) | **System > System Settings > Network > Network > TCP/IP** | [OFFICIAL path; contents UNVERIFIED] |

**Web browser** (type the recorder's IP address):
- Model and serial: **Configuration > System > System Settings > Basic Information**. Shows Device Name, Device No., Model, Serial No. **[OFFICIAL]**
- MAC: **Configuration > Network > Basic Settings > TCP/IP**, "Mac Address". **[OFFICIAL]**
- Newer "web 5.0" paths: **[UNVERIFIED]**.

**SADP tool** (Windows PC on the same network):
- Lists Device Type, Status, IPv4 Address, Port, Software Version, Gateway, HTTP Port, **Device Serial No.** **[OFFICIAL]**
- A MAC column (scroll right) is **[UNVERIFIED]**.
- Hikvision HiTools page: "Starting in April 2026, SADP will no longer receive updates", pointing to HiTools Delivery. **[OFFICIAL]**

**Label:** serial number and a QR code "on the back cover", and on many units a default verification code. **[OFFICIAL]** Other label fields **[UNVERIFIED]**.

**Cloud ID (Hik-Connect):**
- The **9-character short serial** taken from the long serial. Hikvision: "Enter the 9 digit serial number". **[OFFICIAL]**
- Example: in DS-7608NI-I2/8P0820170207CCRR**123456789**WCVU, the bold part is the short serial.
- Hikvision USA: "usually consist of nine digits, or one letter + eight digits". **[OFFICIAL]**
- Platform page:
  - GUI 3.x: Menu > Configuration > Network > Platform Access.
  - V5: System > System Settings > Network > Hik-Connect. **[OFFICIAL]**

**Export to USB:**

| UI | Path | Tag |
|---|---|---|
| GUI 3.x | **Menu > Export > Normal** (or Event). Quick Export allows max 24 hours per channel. The manual figure shows "*.mp4" files named like "ch01_2014121009...". Manual: "The Player player.exe will be exported automatically during record file export." | [OFFICIAL, re-checked p.113-115] |
| GUI 4.0 | **File Management > All Files** > select > **Export** | [OFFICIAL] |
| Easy/Expert | Search > Export / Quick Export | [OFFICIAL] |
| V5 | **Backup > Search > Export / Export All** | [OFFICIAL] |

- PC player: **VSPlayer** (HiTools).
- If stream encryption is on, exports may need the encryption key to play. **[OFFICIAL: encryption covers "live view, playback, download, backup"]**
- MP4/AVI choice on 4.x/5.x: **[UNVERIFIED]**.

**Clock** (look only, do not edit):

| UI | Path | Tag |
|---|---|---|
| GUI 3.x | **Menu > Configuration > General**: "System Date", "System Time"; NTP tab under Configuration > Network | [OFFICIAL, re-checked] |
| GUI 4.0 | **System > General** | [OFFICIAL] |
| Easy/Expert | **Configuration > System > General**. **Device Maintenance > Time Sync Diagnosis** warns a weak RTC battery causes "incorrect recording time". | [OFFICIAL] |
| V5 | **System > System Settings > System Configuration** | [OFFICIAL] |
| Web | **Configuration > System > System Settings > Time Settings** | [OFFICIAL tab; contents UNVERIFIED] |

**Prama:**
- What is verified:
  - pramaindia.in footer: "PRAMA INDIA PRIVATE LIMITED" (CIN U74999MH2020PTC350902). The site calls itself an "indigenous security brand" and does not mention Hikvision.
  - hikvisionindia.com lists support@pramahikvision.com and describes the same plant near Mumbai.
  - A Prama DVR spec sheet lists "SADP" among supported protocols.
- Conclusion: Prama is closely linked to Hikvision India, and Hikvision paths are a likely but unguaranteed guide.
- Not verified: the historic name "Prama Hikvision India Pvt Ltd" and the current ownership. No public Prama recorder manuals were found. **Write "Prama" as the make if that is what the label says.**

### 6.2 Dahua

**On the recorder's own screen:**

| GUI generation | Version info (model, SN) | MAC | P2P | Tag |
|---|---|---|---|---|
| Old GUI (3.0-style) | **Main menu > Info > System > Version** ("version number, built date, serial number") | **Main menu > Setting > Network > TCP/IP** ("MAC address ... read-only") | Setting > Network > P2P (QR code) | [OFFICIAL: NVR V6.0.0 p.222; DVR V2.3.5 on mirror site] |
| GUI 4.0 DVR/XVR | **Main Menu > INFO > VERSION**: Device Model, Hardware/System Version, Build Date, **SN** etc. | **NETWORK > TCP/IP**: "Displays the MAC address of the Device." | **Main Menu > NETWORK > P2P**: "Obtain the Device SN by scanning the QR code." | [OFFICIAL, re-checked: AI DVR V1.0.4 §5.20.1 p.320-321] |
| GUI 4.0 NVR | **Main Menu > MAINTAIN > System Info > Version** | **Main Menu > NETWORK > TCP/IP** | | [manuals on mirror sites] |
| Newest "New GUI" (2022+) | Version path [UNVERIFIED]; menu shows "Management" | | Network > TCP/IP > P2P tab | [3P: dahuawiki] |

**Web browser:**
- Default IP 192.168.1.108.
- Old web UI: **Setup > Information > Version** (SN). **[3P]**
- The official FAQ says the SN can be confirmed via "the version information of the WEB". **[OFFICIAL]**
- MAC: **Setup > Network > TCP/IP**.
- GUI 4.0 web: OPERATION > System Info > Version. **[INFERENCE]**

**ConfigTool** (PC):
- Lists device type, model, IP, port, gateway, **MAC address**, **SN**, version. **[OFFICIAL: ConfigTool V3.1.0 manual]**
- Later versions show the SN under device details. ConfigTool 5.x columns: **[UNVERIFIED]**.

**Label:** the serial number and SN QR code. The ConfigTool manual says the MAC "can be obtained from the device label". **[OFFICIAL]**

**Cloud ID:** the Dahua P2P ID **is the Device SN** (DMSS app: "Scan QR Code" or "Manually Enter SN"). **[OFFICIAL + 3P]**

**Export to USB:**
- GUI 4.0: **Main Menu > BACKUP**: "In the File Format list, select the file format as DAV or MP4". **[OFFICIAL, re-checked p.256-257]**
- Old GUI: Main menu > Backup, formats "DAV/ASF". File name is "Channel number+Record type+Time ... Y+M+D+H+M+S. File extension name is .dav." **[manual]**
- Player: **Dahua Smart Player**. It plays .dav and has a watermark (tamper) check. Whether the player is copied to the USB stick: **[UNVERIFIED]**.

**Clock:**
- GUI 4.0: **Main Menu > SYSTEM > GENERAL > Date&Time** (has NTP). **[OFFICIAL, re-checked p.38]**
- Dahua warns: "Do not change the system time randomly; otherwise the recorded video cannot be searched." **[OFFICIAL]**
- Old GUI: Main menu > Setting > System > General > Date and Time.
- Old web: Setup > Setting > General > Date and time.

### 6.3 CP Plus

Relationship to Dahua **[OFFICIAL: Aditya Infotech Ltd Prospectus, July 2025]**:
- "Our relationship with Dahua began over 16 years ago ... becoming their exclusive distributor in India since 2023."
- Dahua parts were 74.23% of component purchases by the manufacturing subsidiary in FY2025.
- CP Plus also has its own R&D centres that develop "CCTV hardware, firmware, source code", so newer firmware may not be pure Dahua.
- Conclusion: CP Plus Orange-line units are Dahua-like. The Indigo and Red lines are **[UNVERIFIED]**.

**On the recorder's own screen:**
- Verified only for the mobile NVR manual (CP-UNR-408T2J-BI, June 2026): **[OFFICIAL]**
  - Version: **Main Menu > Info > System Info > Version**
  - Clock: **Main Menu > System > General > Date&Time**
  - Export: **Main menu > Video > Backup**
- Ordinary UVR (DVR) and UNR (NVR) local paths: **[UNVERIFIED]**, likely Dahua-style.

**Web browser:**
- Default IP 192.168.1.240 (DVR) or 192.168.1.245 (NVR). **[OFFICIAL]**
- Version: **Info > System Info > Version**. Shows Device Model, Hardware Version, **SN**, Web/System Version, **DevID** etc. **[OFFICIAL, re-checked: DVR manual §5.12.3.1, Fig 5-140]**
- MAC: **Manage > Network > TCP/IP**: "Displays the MAC address of the Device." **[OFFICIAL, re-checked]**

**Tools:** "CPPLUS_IP Finder" V4.0 on cpplusworld.com/software. Its columns are **[UNVERIFIED]**.

**Cloud ID ("InstaOn Cloud ID"):**
- Path: **Manage > Network > InstaOn Cloud**, which shows the ID as a QR code and text. **[OFFICIAL, re-checked: §5.4.12]**
- **It may differ from the SN:**
  - The manual's sample ID "CA0402YAJ02CC5" looks unlike its sample SN "2410113042000110".
  - The samples may come from different units, so this is not conclusive.
  - **Record both, labelled.**
- Apps (CP Plus FAQ):
  - gCMOB (Android) / iCMOB (iOS): Orange series.
  - IMOB with InstaOn: Indigo.
  - cMOB-20: Red/Indigo.

**Export:**
- Web Backup page: "File format: Select the file format, including CPV and MP4." **[OFFICIAL, re-checked]**
- Player: "CPPLUS_Orange_SmartPlayer" (avi, mp4, asf, mov, dav). Whether it plays .cpv: **[UNVERIFIED]**.

**Clock:** web **Manage > System > General > Date&Time** (has NTP and a "Sync PC" button). **[OFFICIAL]** **Do not press Sync PC before export.**

### 6.4 Generic Xiongmai / XMeye (white-label)

No official Xiongmai documentation could be reached. Everything in this subsection is **[3P]** unless marked.
1. **Device info:** right-click > **Main Menu > Info > Version**, line "SerialNo". Variant: Main Menu > System > Info > Version, or the QR code in the Startup Wizard. Firmware is on the "System" line (for example V4.02.R11...).
2. **Cloud ID:**
   - The XMEye app listing says "log in by the device's serial number" and "scanning serial number by QR code". **[OFFICIAL app-store listing]**
   - No Xiongmai source found uses the exact term "Cloud ID", though resellers do. Label it "XMEye Serial No. (cloud login)".
3. **Web:** default IP 192.168.1.10, port 80. **[snippet only]** The web path to device info is **[UNVERIFIED]**.
4. **MAC location:** **[UNVERIFIED]**.
5. **Export:**
   1. Plug in the USB stick.
   2. Main Menu > **Record > Backup**. Click "Detect" if the stick is not shown.
   3. Set Channel, Start and End time, then click "Add".
   4. Choose format **H26X, AVI or MP4**, then click "Start" and wait for "Backup Finished".
   - Older firmware may give raw .h264 files that need the XM VideoPlayer. **[UNVERIFIED]**
6. **Clock:** Main Menu > System > General > System Time. **[UNVERIFIED]**

### 6.5 Godrej Security Solutions
- **SeeThru Smart NVR serial:** "Device Serial Number: Click on the menu bar at the bottom of the live interface to check the serial number". **[OFFICIAL, re-checked: QSG p.5]**
- **"Disk Settings" serial** (QSG p.3) is most likely the hard-disk serial. Do not use it as the recorder serial. **[INFERENCE]**
- **Web:**
  - Default IP 192.168.1.200, HTTP port 80, server port 6036.
  - Remote access via NAT (autonat.com) uses the "device serial number", which is effectively the cloud ID. **[OFFICIAL]**
- **Older UVR/NVR clock:** "Go to Setting > General and set date and time." **[OFFICIAL FAQ, seller-hosted copy]** View only, do not edit.
- **Not verified:** export procedure (Godrej docs cover playback only), label layout, and the Godrej Device Manager fields.
  - For the EVE NCR, Godrej says backup is only through the mobile app. **[OFFICIAL]**
- **Original maker:** the Smart NVR likely comes from Chinese OEM TVT. **[INFERENCE, weak]**

### 6.6 Honeywell (India)
- **Current lines (honeywellbuildings.in):**
  - "Impact by Honeywell" AHD DVRs (HA-DVR-2104/2108/2116-L, 5104/5108/5116-L) and IP NVRs (I-HNVR-1110 etc.).
  - 35 Series NVRs and Performance Series NVRs.
  - Older lines: HRHQ/HQA and HRG.
- **No user manuals are published online**, only datasheets. **Every menu path is [UNVERIFIED].**
- **Tools named in datasheets:** "Honeywell Config tool", HDCS client, IH-Config Tool, Honeywell Smart Viewer, "Global P2P Service".
- **Backup:** "USB Device/Network"; 35 Series "USB Dongle (FAT Format)".
- **Advice:** rely on the label plus a photo of the on-screen info.
- **Original maker:** Dahua-like datasheet wording. **[INFERENCE]** The 35 Series claims NDAA s.889 compliance, which would exclude Hikvision/Dahua as maker.

### 6.7 Export formats summary

| Brand | Native/proprietary | Open option | PC player | Confidence |
|---|---|---|---|---|
| Hikvision / Prama | Hikvision-format .mp4 (may be proprietary stream) | AVI/MP4 option on some firmware | VSPlayer; GUI 3.x auto-exports player.exe | OFFICIAL (GUI 3.x); rest UNVERIFIED |
| Dahua | .dav | .mp4 (GUI 4.0), .asf (old) | Dahua Smart Player | OFFICIAL |
| CP Plus | .cpv (web backup), .dav likely on Dahua-based units | .mp4 | CPPLUS_Orange_SmartPlayer | OFFICIAL (web); local UNVERIFIED |
| XMeye | .h264 / "H26X" | AVI, MP4 | XM VideoPlayer | 3P |
| Godrej / Honeywell | unknown | unknown | vendor client | UNVERIFIED |

Forensic guidance favours exporting the **native format plus the player**, optionally with an MP4 working copy:
- SWGDE §5: "A native file format or proprietary file format is likely to provide best evidence".
- SWGIT Section 24: auto-copy the proprietary viewer "should always be done where offered".
- **[OFFICIAL: SWGDE 17-V-002-1.4 (2026), SWGIT Sec. 24]**

### 6.8 DVR clock check: why and how

**Why** (all **[OFFICIAL]** forensic guidance):
- **SWGDE 17-V-002-1.4** (v1.4, 2 Jun 2026), §10.1, says to document:
  - "Make, model, and serial number of DVR";
  - "System time/date vs Government-standardized atomic-clock time/date (document device used for actual time and date)";
  - "Calculate if there is a time offset between real time and the DVR system clock."
  - Footnote 5: "Do not change the time and date on the DVR system."
- **UK Home Office / Dstl "Recovery and Acquisition of Video Evidence" v3.0 (2022)**, §3.3(a): "compare the time displayed by the CCTV system with that given by a reliable, accurate time source. Any discrepancy ... should be recorded".
  - Its owner-level checklist: "Don't change times, dates or any other settings".
- **NIST IR 8161r1 §3.4:** offset = DVR export-unit time minus external reference time, captured "as simultaneously as possible".
- **India:**
  - Kerala Police SOP (2021), CCTV chapter: "compare the time displayed by the CCTV system with that given by the speaking clock. Any error ... should be recorded".
  - BPR&D "SOP of Audio-Video Recording for Scene of Crime" (2024), p.57: "Record unique identification", "Times offset", "Brand".
- **Case law where CCTV time mattered:**
  - Madras HC, Selvam @ Koolai Selvam (2017): timings "1&1/2 hrs ahead", explained, and the footage was accepted.
  - Delhi HC, Mantram (2026): an 18-19 minute camera discrepancy.
  - Kerala HC Crl.MC 976/2024: a time difference was alleged as tampering.

**IST reference:**
- CSIR-NPL "maintains the Indian Standard Time (IST)". **[OFFICIAL]**
- NPL IST web clock: https://www.nplindia.org/clockcode/html/ (working on 29 Oct 2026). It also shows how far the viewing device's own clock is off.
- NTP servers: time.nplindia.org and time.nplindia.in.
- Fallback: time.is/India. **[3P]**

**Steps for the user** (synthesis consistent with SWGDE, UK, NIST and Kerala guidance; the exact photo method is **[INFERENCE]**):
1. **Do not touch** the DVR date/time. Do not press NTP, "Sync PC" or any time-update button before or during export.
2. Look at the DVR live-view screen, which shows its own clock in a corner.
3. Open the NPL IST clock on a phone. Take **one photo** showing both the DVR screen clock and the phone clock, both readable.
4. Write down: the date, the DVR time, the IST time, and the reference used (for example "NPL IST web clock on phone").
5. Offset = DVR time minus IST. Write "DVR ahead by N min N s" or "DVR behind by N min N s". Check the **date** too (wrong year or day is common after power loss).
6. To find footage of a real-world IST time T, search the DVR at T + offset.
7. NVRs with IP cameras: each camera may burn in its own time. Note any camera whose on-screen time differs (UK §3.3(a)).
8. After export, optionally repeat the photo. Confirm the exported files play and show the expected times (SWGDE §14).
9. Record the offset under "any other relevant information" on the certificate.

---

## 7. Cloud IDs

### 7.1 WhatsApp **[OFFICIAL: faq.whatsapp.com]**
- **Android:** "Find your registered phone number by tapping [three-dot menu] > Settings > your profile photo."
  1. Open WhatsApp.
  2. Tap the three dots (top right).
  3. Tap **Settings**.
  4. Tap your **name/photo**. The number is shown on the profile screen.
- **iPhone:** "You can find your registered phone number by opening WhatsApp Settings or your profile." Newer app versions label the bottom tab **"You"** instead of "Settings". Mention both.
- **What to write:** the registered number in full international format, for example "WhatsApp: +91 98xxxxxxxx".
- **Usernames:**
  - WhatsApp has optional @usernames, "rolling out gradually over the next few months and might not be available to you yet".
  - "A phone number is still required for your WhatsApp account."
  - Usernames can be changed or deleted, so put any username under "other relevant information", not as the main ID. Availability in India: **[UNVERIFIED]**.
- **Number changes:** a changed number carries chats over. The number at the time of the chats may differ from today's number. Ask the user.
- **Exporting a chat** (common evidence):
  - Android: open the chat > three dots > **More** > **Export chat** > "Without media" or "Include media" > choose where to save or send. With media, only "the most recent media sent will be added".
  - iPhone: open the chat > tap the contact or group name > **Export chat** > "With all media" / "With selected media…" / "Without media" > Save to Files.
  - The output is a ZIP. "View once messages will not be exported". The export "can't be re-imported because it's a text file and not a backup file".

### 7.2 Google Account on Android **[OFFICIAL: support.google.com]**
- **Path A:** Settings > **Passwords & accounts** (accounts listed under "Accounts"). Google lists device-dependent alternatives: "Users & accounts", "Passwords, passkeys & autofill", "Password, passkeys & accounts", "Manage accounts".
- **Path B:** Settings > **Google** > tap your profile picture or initial > Manage your Google Account. The email is normally shown under the name. That Google's text says so is **[UNVERIFIED]**.
- **Gmail app:** "In the top right, tap Profile". The signed-in email is shown, and "Manage accounts on this device" lists all accounts.
- **Drive app:** tap the profile picture at top right. **[3P]**
- **Computer:** "On the top right, select your profile image or initial", or open myaccount.google.com.
- Phones often have several Google accounts. Ask which one holds the evidence (for example the Drive or Photos account).

### 7.3 iCloud / Apple Account
See Section 3.5 (iPhone) and Section 5 item 8 (Mac). Web: account.apple.com.

---

## 8. Identifier structures and validation

### 8.1 IMEI **[OFFICIAL: 3GPP TS 23.003 §6.2–6.3 and Annex B; GSMA TS.06; 3GPP TS 22.030 §6.7]**
- **IMEI = 15 decimal digits:** TAC (8) + SNR (6) + CD (1).
  - TAC (Type Allocation Code) identifies the model. "The Type Allocation Code (TAC) is issued by the GSM Association". One model can have several TACs.
  - SNR is the unit serial within that TAC.
  - CD is the Luhn check digit.
- **IMEISV = 16 digits:** TAC (8) + SNR (6) + SVN (2), with **no check digit**. Do not enter it as the IMEI.
- 3GPP: "The Check Digit is not part of the digits transmitted when the IMEI is checked". When transmitted, the spare 15th digit "shall be set to zero".
  - **[INFERENCE]** Operator records (for example CDRs) may show 14 digits, or a final 0. A mismatch only in the last digit does not necessarily mean a different phone.
- **`*#06#`** (3GPP TS 22.030): the phone "shall then display the 14 digits of the IMEI (not including the spare digit), the Check Digit and optionally the Software Version Number ... (as a single string, in that order)". It works without a SIM. Keep only the first 15 digits.

**Luhn check, worked example** (verified by hand and by script). IMEI body `49015420323751`:

| Position (from left) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Digit | 4 | 9 | 0 | 1 | 5 | 4 | 2 | 0 | 3 | 2 | 3 | 7 | 5 | 1 |
| Double even positions | | 18 | | 2 | | 8 | | 0 | | 4 | | 14 | | 2 |
| Value used (add digits of doubled result) | 4 | 9 | 0 | 2 | 5 | 8 | 2 | 0 | 3 | 4 | 3 | 5 | 5 | 2 |

1. Add the doubled positions: 9 + 2 + 8 + 0 + 4 + 5 + 2 = 30.
2. Add the odd positions: 4 + 0 + 5 + 2 + 3 + 3 + 5 = 22.
3. Total = 52. Check digit = (10 − (52 mod 10)) mod 10 = **8**.
4. Full IMEI: **490154203237518**.
5. 3GPP's own Annex B example also checks out: 26053179311383 gives sum 53, so check digit 7.

**To validate a full 15-digit IMEI:** double every second digit (positions 2, 4, …, 14), add the digits of each doubled result, add all 15 values. The total must be divisible by 10 (here 52 + 8 = 60).

Suggested browser implementation (validation only):

```js
function isValidImei(raw) {
  const s = String(raw).replace(/\D/g, "");
  if (s.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let n = s.charCodeAt(i) - 48;
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}
```

**Limits:**
- Luhn catches every single-digit typo and most swaps of adjacent digits.
- Passing Luhn does **not** prove the IMEI is genuine. Use Sanchar Saathi KYM for that (Section 9.1).
- A 16-digit IMEISV cannot be Luhn-checked.

### 8.2 MEID (CDMA; rare in India)
- 14 hex digits, plus an optional check digit that "is not transmitted". **[OFFICIAL: RFC 8464]**
- Apple: for some older iPhones "the MEID is the first 14 digits of the IMEI". **[OFFICIAL: Apple 108037]**
- India's CDMA networks shut down around 2017 (Reliance Communications, MTS). **[3P trade press; Tata date UNVERIFIED]**
- **Tool advice:** if a phone shows "IMEI/MEID", enter the 15-digit IMEI.

### 8.3 MAC address **[OFFICIAL: IEEE RA "Guidelines for Use of EUI, OUI, and CID"; RFC 9797; AOSP]**
- 48 bits = 6 octets, written AC-DE-48-23-45-67 or ac:de:48:23:45:67.
- **First 3 octets = OUI**, assigned to the manufacturer by the IEEE Registration Authority. This applies only to universally administered addresses. IEEE also assigns smaller MA-M/MA-S blocks, so a 3-octet lookup does not always identify the maker.
- IEEE, verbatim: "the least significant bit of Octet 0 (the I/G bit) indicates either an individual address (I/G=0) or group address (I/G=1), and the second least significant bit of Octet 0 (the U/L bit) indicates universal (U/L=0) or local (U/L=1) administration of the address."
- Android randomizes by "setting the locally administered bit to 1, and the unicast bit to 0". **[OFFICIAL: AOSP]**
- **Plain-language rule: look at the 2nd character of the MAC** (verified for all 16 hex values):

| 2nd hex character | Meaning | For the certificate |
|---|---|---|
| 0, 4, 8, C | Universal, individual: a factory/hardware MAC. The OUI can be looked up. | Normal device MAC |
| **2, 6, A, E** | **Locally administered, individual: typically a randomized/private MAC** | Label it "private/randomized MAC (network X)". It is not the hardware MAC. |
| 1, 5, 9, D | Universal group (multicast) | Not a device address. Re-check. |
| 3, 7, B, F | Local group | Not a device address. Re-check. |

- Caveat: a locally administered address is not proof of randomization. A user or driver can also set one manually.
- **IEEE OUI lookup:** https://regauth.standards.ieee.org/standards-ra-web/pub/view.html#registries

Suggested check:

```js
function macKind(raw) {
  const hex = String(raw).replace(/[^0-9a-f]/gi, "");
  if (hex.length !== 12) return "invalid";
  const b0 = parseInt(hex.slice(0, 2), 16);
  if (b0 & 1) return "group/multicast (not a device address)";
  return (b0 & 2) ? "locally administered (likely private/randomized)" : "universal (hardware/factory)";
}
```

---

## 9. Indian guidance worth linking

### 9.1 Sanchar Saathi "Know Your Mobile" (KYM): IMEI genuineness check **[OFFICIAL: sancharsaathi.gov.in FAQ, KYM page, PIB]**

**Web:**
1. Go to https://sancharsaathi.gov.in, then Citizen Centric Services > "Know Genuineness Of Your Mobile Handset". This opens https://ceir.sancharsaathi.gov.in/Device/SancharSaathiKym.jsp.
2. Enter your mobile number and the captcha, then tap "Get OTP".
3. Enter the OTP and tap "Verify OTP".
4. Enter the "15 digit IMEI Number" and tap Submit.

**SMS:** "sending SMS "KYM<15 digit IMEI number>" to 14422". Older CEIR text shows a space after KYM. Whether the space is required is **[UNVERIFIED]**.

**App:** the Sanchar Saathi app (launched 17 Jan 2025 per PIB) on Google Play and the App Store, with the feature "Know Your Mobile Handset's Genuineness".

**Returns:** "information about the manufacturer, device type, brand name, and model number". The tool can use this to cross-check the IMEI against the Make & Model the user entered. Status wording such as "black-listed / duplicate / already in use" is from older CEIR text and **[UNVERIFIED]** as current.

**The FAQ also says:** dial `*#06#` to find the IMEI; "Dual SIM phones will have two IMEI numbers."

### 9.2 Law on IMEI tampering **[OFFICIAL: Telecommunications Act, 2023]**
- s.2(r) defines a "telecommunication identifier" to include identifiers of "telecommunication equipment".
- s.42(3)(c): whoever "tampers with telecommunication identifiers" faces imprisonment up to three years, a fine up to fifty lakh rupees, or both.
- s.42(3)(f): the same penalty for knowingly possessing radio equipment using tampered identifiers.
- The Act does not use the word "IMEI"; coverage follows from the definition.
- **[UNVERIFIED]:** the Telecommunications (Telecom Cyber Security) Rules 2024 and their 2025 amendment, and the 2017 IMEI anti-tampering rules.

### 9.3 Evidence-handling SOPs (useful for the CCTV section)
- Kerala Police SOP (2021), CCTV chapter. **[OFFICIAL]**
- BPR&D "SOP of Audio-Video Recording for Scene of Crime" (2024). **[OFFICIAL]**
- No CERT-In, MeitY, MHA or I4C SOP on device identification was found. **[GAP]**
- The Legal Metrology (Indian Standard Time) Rules 2026 (G.S.R. 761(E), 27 Aug 2026) take effect about 180 days after publication, so they are not yet in force. Rule 6(1): time references in legal documents shall be IST. Read by a sub-thread; not re-opened. **[treat as UNVERIFIED]**

---

## 10. Consolidated list: unverified items and gaps (do not present as fact)

**Android**
1. Samsung "MAC address type" option names.
2. OPPO serial/MAC paths; vivo serial/model paths; OnePlus model-number field; OnePlus/OPPO MAC location.
3. Xiaomi wording is from search excerpts (mi.com blocked fetching).
4. The Settings serial can differ from the box serial: realme "chip ID"; a Xiaomi tablet warning. Tell users to compare.
5. EID via `*#06#` on Android: not reliable.

**iPhone / iPad**
6. "IMEI2" label and `*#06#` behaviour: third-party only.
7. About > "Wi-Fi Address" = hardware MAC: third-party plus inference.

**Windows**
8. The "Hardware properties > Physical address (MAC)" label: university KB only.
9. Whether `getmac`/`ipconfig` show the random address when randomization is on.
10. Whether `PermanentAddress` stays the burned-in value under Wi-Fi randomization.
11. Microsoft account as a Windows "Cloud ID": not researched.

**macOS**
12. The MAC row in the Hardware tab: third-party only.
13. Whether `ifconfig` shows the private address on Sequoia or later: untested.

**CCTV**
14. Hikvision Easy/Expert and V5 local model/serial screens; web 5.0 paths; MP4/AVI options; SADP MAC column.
15. Dahua New-GUI Version path; ConfigTool 5.x columns; whether the player is copied to USB.
16. CP Plus local UVR/UNR paths; local export format; whether InstaOn Cloud ID equals the SN; .cpv playback.
17. XMeye: everything is third-party.
18. Godrej: export, label, maker.
19. Honeywell: all menu paths.
20. Prama's current ownership and legal name history.

**Cloud and India**
21. WhatsApp username availability in India.
22. Whether the Google Settings > Google screen explicitly shows the email.
23. KYM SMS spacing and current status wording.
24. The 2024/2025 telecom cyber-security rules and 2017 IMEI rules.
25. UIN/UID meaning on the form.

**Color:** no OS or DVR menu shows device colour. The user must state it by looking at the device.

---

## 11. Sources

**Statute and standards**
- BSA 2023 Gazette, Schedule pp. 46-47: https://prsindia.org/files/bills_acts/acts_parliament/2023/The%20Bharatiya%20Sakshya%20Bill,%202023.pdf (also https://www.indiacode.nic.in/bitstream/123456789/20063/1/aa202347.pdf)
- Telecommunications Act 2023: https://egazette.gov.in/WriteReadData/2023/250880.pdf
- Drone Rules 2021: https://egazette.gov.in/WriteReadData/2021/229221.pdf
- 3GPP TS 23.003 (ETSI TS 123 003 V19.8.0): https://www.etsi.org/deliver/etsi_ts/123000_123099/123003/19.08.00_60/ts_123003v190800p.pdf
- 3GPP TS 22.030 (ETSI TS 122 030 V19.0.0): https://www.etsi.org/deliver/etsi_ts/122000_122099/122030/19.00.00_60/ts_122030v190000p.pdf
- GSMA TS.06: https://imeidb.gsma.com/imei/resources/documents/TS.06%20v27.0.pdf
- IEEE EUI/OUI/CID guidelines: https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/eui.pdf
- IEEE RA lookup: https://regauth.standards.ieee.org/standards-ra-web/pub/view.html#registries
- RFC 9797 (MAC randomization): https://www.rfc-editor.org/rfc/rfc9797
- RFC 8464 (MEID): https://www.rfc-editor.org/rfc/rfc8464.html

**Android / Google**
- AOSP MAC randomization: https://source.android.com/docs/core/connect/wifi-mac-randomization-behavior
- AOSP Dialer `*#06#`: https://android.googlesource.com/platform/packages/apps/Dialer/+/refs/heads/main/java/com/android/dialer/dialpadview/SpecialCharSequenceMgr.java
- AOSP factory MAC: https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/packages/SettingsLib/src/com/android/settingslib/deviceinfo/AbstractWifiMacAddressPreferenceController.java
- AOSP hardware info: https://android.googlesource.com/platform/packages/apps/Settings/+/refs/heads/main/res/xml/hardware_info.xml
- Pixel IMEI/EID: https://support.google.com/pixelphone/answer/10402530
- Pixel MAC: https://support.google.com/pixelphone/answer/9655181
- Google Store devices: https://support.google.com/store/answer/3333000
- Google accounts on Android: https://support.google.com/android/answer/7664951
- Manage Google settings: https://support.google.com/accounts/answer/3118621
- Gmail accounts: https://support.google.com/mail/answer/8154
- Google account on computer: https://support.google.com/accounts/answer/1721977

**Android OEM pages**
- Samsung India (re-checked, updated 30 Jul 2026): https://www.samsung.com/in/support/mobile-devices/where-can-i-check-the-model-code-serial-number-and-imei-code-in-samsung-mobile-phones
- Samsung UAE: https://www.samsung.com/ae/support/mobile-devices/how-to-find-phones-model-number-serial-number-or-imei-number-on-samsung-phone/
- Samsung UK MAC: https://www.samsung.com/uk/support/mobile-devices/how-do-i-locate-the-wi-fi-mac-address-on-my-samsung-galaxy-device/
- Samsung UK eSIM/EID: https://www.samsung.com/uk/support/mobile-devices/how-to-use-an-esim-with-your-galaxy-phone/
- Samsung US: https://www.samsung.com/us/support/answer/ANS00048604/
- Xiaomi account help: https://account.xiaomi.com/helpcenter/faq/en_US/01.guide/11.appeal/faq-4
- Xiaomi FAQs (snippets): https://www.mi.com/global/support/faq/details/KA-497449/ and https://www.mi.com/global/support/guidance/imei_smartphone/
- OnePlus India: https://service.oneplus.com/in/search/search-detail?id=2234982
- OPPO India: https://support.oppo.com/in/check/
- realme India: https://www.realme.com/in/support/kw/doc/2082786 and https://www.realme.com/in/support/kw/doc/2203822
- vivo India: https://www.vivo.com/in/support/questionList?categoryId=50701 and https://www.vivo.com/in/support/IMEI
- vivo Singapore MAC: https://www.vivo.com/sg/support/questionList?categoryId=54730
- Verizon Galaxy S25 (3P): https://www.verizon.com/support/knowledge-base-309556/
- Verizon Pixel 8a (3P): https://www.verizon.com/support/knowledge-base-306906/

**Apple**
- Serial/EID/IMEI (108037): https://support.apple.com/en-us/108037
- Model number (106343): https://support.apple.com/en-us/106343
- Identify iPhone model (108044): https://support.apple.com/en-us/108044
- iPhone User Guide, About: https://support.apple.com/guide/iphone/get-information-about-your-iphone-iph3dd5fc7e/ios
- Private Wi-Fi addresses (102509): https://support.apple.com/en-us/102509
- Apple Account email (102627): https://support.apple.com/en-us/102627
- Mac model and serial (102767): https://support.apple.com/en-us/102767
- Mac About settings: https://support.apple.com/guide/mac-help/view-about-settings-mchlea7173f3/mac
- Mac private Wi-Fi address: https://support.apple.com/guide/mac-help/mchlb1cb3eb4/mac
- iClarified `*#06#` (3P): https://www.iclarified.com/83557/how-to-find-your-iphone-imei-number-video

**Microsoft and PC OEMs**
- WMIC page (re-checked): https://learn.microsoft.com/windows/win32/wmisdk/wmic
- Deprecated features: https://learn.microsoft.com/windows/whats-new/deprecated-features
- WMIC removal KB5067470: https://support.microsoft.com/en-us/topic/windows-management-instrumentation-command-line-wmic-removal-from-windows-e9e83c7f-4992-477f-ba1d-96f694b8665d
- Find device info: https://support.microsoft.com/en-us/windows/which-version-of-windows-operating-system-am-i-running-628bec99-476a-2c13-5296-9dd081cdd808
- Win32_BIOS: https://learn.microsoft.com/windows/win32/cimwin32prov/win32-bios
- Win32_ComputerSystem: https://learn.microsoft.com/windows/win32/cimwin32prov/win32-computersystem
- Win32_ComputerSystemProduct: https://learn.microsoft.com/windows/win32/cimwin32prov/win32-computersystemproduct
- PowerShell 101 WMI: https://learn.microsoft.com/powershell/scripting/learn/ps101/07-working-with-wmi
- SMBIOS guidance: https://learn.microsoft.com/windows-hardware/drivers/bringup/smbios
- OA3 "To be filled by O.E.M": https://learn.microsoft.com/windows-hardware/manufacture/desktop/oa3-command-line-config-file-syntax
- getmac: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/getmac
- ipconfig: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig
- Get-NetAdapter: https://learn.microsoft.com/en-us/powershell/module/netadapter/get-netadapter
- Random hardware addresses: https://support.microsoft.com/help/4578384
- Dell Service Tag: https://www.dell.com/support/kbdoc/en-us/000130711/how-to-locate-your-system-service-tag-using-command-prompt
- HP: https://support.hp.com/us-en/document/ish_2039298-1862169-16
- Lenovo: https://support.lenovo.com/us/en/solutions/ht510152-how-to-find-serial-numbers-pc

**CCTV vendor documents**
- Hikvision NVR V3.4.98 manual: https://www.hikvision.com/content/dam/hikvision/products/S000000001/S000000002/S000000007/S000000026/OFR000040/M000000560/User_Manual/Baseline_User-Manual_DS-7600NI-Q-&-K_Network-Video-Recorder_V3.4.98_20180124.pdf
- Hikvision GUI 4.0 manual: https://inter-cdn.com/images/document/3686274/4.0-USER-MANUAL-HIKVISION.pdf
- Hikvision DVR V4.83: https://assets.hikvision.com/prd/normal/all/doc/m000168161/UD39876B-A_Digital-Video-Recorder_User-Manual_V4.83.300_20250324.pdf
- Hikvision NVR V5.04: https://assets.hikvision.com/prd/public/all/doc/m000060965/UD39811B-A_Network-Video-Recorder_User-Manual_V5.04.000_20250324.pdf
- Hik-Connect on recorders: https://www.hikvision.com/content/dam/hikvision/ca/how-to-document/Enable-Hik-Connect-3.0-on-recorders.pdf
- Hik-Connect add by serial: https://www.hikvision.com/content/dam/hikvision/ca/how-to-document/Adding-a-device-to-hik-connect-app-by-serial-number-and-verification-code.pdf
- Hikvision USA serial: https://supportusa.hikvision.com/support/solutions/articles/17000136433-how-to-check-find-device-serial-number
- HiTools (SADP, VSPlayer): https://www.hikvision.com/en/support/tools/hitools/
- Prama: https://www.pramaindia.in/about-us and https://www.hikvisionindia.com/aboutus
- Dahua AI DVR manual: https://www.dahuasecurity.com/asset/upload/uploads/soft/20200619/Dahua-HDCVI-AI-DVR_Users-Manual_V1.0.42.pdf
- Dahua NVR V6.0.0: https://dahuawiki.com/images/3/33/NVR+(60+and+724+Series)_User's+Manual_V6.0.0.pdf
- Dahua ConfigTool: https://dahuawiki.com/images/2/27/Dahua_ConfigTool_Users_Manual_V3.1.0_20150707.pdf
- Dahua model/serial (wiki): https://www.dahuawiki.com/Basic_Setup/Identify_Model_and_Serial_Number
- CP Plus DVR manual: https://www.cpplusworld.com/prodassets/usermannual/e0e92063-1a59-4a74-8432-b8d58e6ff036.pdf
- CP Plus NVR manual: https://www.cpplusworld.com/prodassets/usermannual/95c3171d-1c55-4487-9f4f-a3d7ffb76c76.pdf
- CP Plus software: https://www.cpplusworld.com/software
- CP Plus FAQ: https://www.cpplusworld.com/faq
- Aditya Infotech Prospectus: https://adityagroup.com//uploads/investor/offerdocuments/Prospectus.pdf
- XMeye (3P): https://securitycamcenter.com/connect-dvr-nvr-xmeye/ and https://github.com/OpenIPC/python-dvr
- XMEye app listing: https://apps.apple.com/us/app/-/id884006786
- Godrej Smart NVR QSG: https://static.godrejenterprises.com/See_Thru_Smart_NVR_45e42b8d6f.pdf
- Godrej manuals: https://www.godrejenterprises.com/support/locks-and-security/home-security/user-manuals-and-catalogues
- Honeywell India AHD DVR: https://www.honeywellbuildings.in/intelligent-security/mass-mid-segment/video-system/ahd-dvr/2mp-dvrs
- Honeywell 35 Series: https://www.honeywellbuildings.in/intelligent-security/small-and-medium-business/video-system/ip-recorder/35-series-nvr

**Forensic guidance and time**
- SWGDE 17-V-002-1.4 (2026): https://swgde.org/wp-content/uploads/2026/06/2026-06-02-Best-Practices-for-Data-Acquisition-from-Digital-Video-Recorders-17-V-002-1.4.pdf
- SWGIT Section 24: https://swgde.org/wp-content/uploads/2024/06/Section_24_Best_Practices_for_the_Retrieval_of_Digital_Video.pdf
- UK Recovery and Acquisition of Video Evidence v3.0: https://assets.publishing.service.gov.uk/media/62a9f18fd3bf7f036bb12944/Recovery_and_Acquisition_of_Video_Evidence_v3-0.pdf
- NIST IR 8161r1: https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.8161r1.pdf
- Kerala Police SOP: https://keralapolice.gov.in/storage/pages/custom/ckFiles/file/7GafuMCjLbFgjBNh8aXz8WhLv2Zqtfczvbi7Uv6m.pdf
- BPR&D SOP: https://bprd.nic.in/uploads/pdf/SOP%20of%20Audio%20Video%20Recording%20of%20Scene%20of%20Crime.pdf
- NPL IST clock: https://www.nplindia.org/clockcode/html/
- NPL time page: https://www.nplindia.in/index.php/science-technology/indian-standard-time-metrology-division/time-and-frequency-metrology-section-2/
- Case law: https://indiankanoon.org/doc/91745154/ (Madras HC), https://indiankanoon.org/doc/95911673/ (Delhi HC), https://indiankanoon.org/doc/129532901/ (Kerala HC)

**WhatsApp and Sanchar Saathi**
- WhatsApp change number: https://faq.whatsapp.com/498754122134583/
- WhatsApp about usernames: https://faq.whatsapp.com/658755553162769/
- WhatsApp export chat: https://faq.whatsapp.com/1180414079177245/
- Sanchar Saathi: https://sancharsaathi.gov.in
- KYM: https://ceir.sancharsaathi.gov.in/Device/SancharSaathiKym.jsp
- PIB app backgrounder: https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/dec/doc2025122715201.pdf
- Commentary on UIN/UID (no definitions found): https://www.livelaw.in/articles/bharatiya-sakshya-adhiniyam-transformed-digital-evidence-552681
