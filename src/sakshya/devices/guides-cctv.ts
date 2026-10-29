import type { DeviceGuide } from "./guide-types";

// CCTV recorder (DVR / NVR) guide. Content comes from docs/research/devices.md, Section 6.
// Confidence: "official" = maker's manual, forensic standard or government page;
// "reliable" = reputable third party, or official and third-party sources combined;
// "unverified" = inference or weak sources only, so the text carries a hedge.
// Menu paths drift with firmware. Every brand path is a likely guide, not a promise.

export const CCTV_GUIDE: DeviceGuide = {
  profile: "cctv",
  title: "CCTV recorder (DVR or NVR)",
  sourceKind: "dvr",
  summary:
    "Write down the recorder's make, model, colour, serial number and network (MAC) address, and record how far " +
    "its clock is from Indian Standard Time before you export any footage. These details tie the footage to one " +
    "recorder and let the times on it be read correctly.",
  identifierSlots: [
    { type: "MAC", note: "LAN" },
    { type: "Cloud ID", note: "P2P / cloud ID (if used)" },
  ],
  sections: [
    {
      id: "start",
      title: "Start here: take photos first",
      targets: ["makeModel", "serial"],
      steps: [
        {
          text:
            "Before you open any menu, photograph the label on the back or bottom of the recorder. It usually shows " +
            "the model and serial number. Cover any verification code and QR code in the photo before you share it.",
          confidence: "reliable",
        },
        {
          text:
            "Then open the recorder's device information screen (see the brand steps below) and photograph it. " +
            "Menu names change with firmware, so treat the paths below as a guide.",
          confidence: "reliable",
        },
        {
          text:
            "If you use a computer tool such as Hikvision SADP or Dahua ConfigTool, use it only to read details. " +
            "These tools can also change the recorder's network address and reset passwords.",
          confidence: "reliable",
        },
      ],
    },
    {
      id: "make-model",
      title: "Make, model and colour",
      targets: ["makeModel", "color"],
      steps: [
        {
          text:
            "Make: write the brand shown on the recorder, for example Hikvision, Prama, Dahua, CP Plus, Godrej or " +
            "Honeywell. On unbranded recorders that use the XMEye app, write the brand on the label: XMEye is only " +
            "the name of the app.",
          confidence: "reliable",
        },
        {
          text:
            "Model: copy the model from the label, then check it against the 'Model' line (Hikvision) or the " +
            "'Device Model' line (Dahua, CP Plus) on the recorder's information screen.",
          confidence: "official",
        },
        {
          text:
            "Prama: write 'Prama' if that is what the label says. Prama is closely linked to Hikvision India, so the " +
            "Hikvision steps below may also work, but this is not confirmed.",
          confidence: "unverified",
        },
        {
          text: "Colour: no recorder menu shows it. Look at the unit and write the colour you see.",
          confidence: "reliable",
        },
      ],
    },
    {
      id: "serial",
      title: "Find the serial number",
      targets: ["serial"],
      steps: [
        {
          text:
            "Hikvision, older menus (firmware 3.x, or the 'GUI 4.0' menus from about 2018): right-click on the live " +
            "screen to open the menu. The Device Info screen shows the Model, the Serial No. and the firmware version.",
          path: "Menu > Maintenance > System Info > Device Info",
          confidence: "official",
        },
        {
          text:
            "Hikvision, V5 menus: this screen may list the model and serial, but that is not confirmed. If it does " +
            "not, use the label or the web page.",
          path: "System > System Maintenance > Running Info > System Info",
          confidence: "unverified",
        },
        {
          text:
            "Hikvision, newer 'Easy' or 'Expert' menus: the manuals do not say where the serial is shown. Use the " +
            "label, the web page or SADP instead.",
          confidence: "unverified",
        },
        {
          text:
            "Hikvision web page: on a computer on the same network, type the recorder's IP address into a browser " +
            "and log in. The Basic Information page shows the Model and the Serial No.",
          path: "Configuration > System > System Settings > Basic Information",
          confidence: "official",
        },
        {
          text:
            "Hikvision SADP (a free Windows tool) lists the Device Serial No. of each recorder on the same network. " +
            "Hikvision stopped updating SADP from April 2026 and now points to HiTools Delivery.",
          confidence: "official",
        },
        {
          text: "Dahua, GUI 4.0 DVR or XVR: the Version screen shows the Device Model and the SN (serial number).",
          path: "Main Menu > INFO > VERSION",
          confidence: "official",
        },
        {
          text:
            "Dahua, GUI 4.0 NVR: the Version screen shows the model and SN. This path comes from Dahua manuals " +
            "copied on other websites.",
          path: "Main Menu > MAINTAIN > System Info > Version",
          confidence: "reliable",
        },
        {
          text: "Dahua, older menus: the Version screen shows the version number, build date and serial number.",
          path: "Main menu > Info > System > Version",
          confidence: "official",
        },
        {
          text: "Dahua, newest menus (2022 onwards): the Version screen path is not confirmed. Use the label or the web page.",
          confidence: "unverified",
        },
        {
          text:
            "Dahua web page (default address 192.168.1.108): the serial is in the version information. On the " +
            "older web page it is under this path.",
          path: "Setup > Information > Version",
          confidence: "reliable",
        },
        {
          text: "Dahua ConfigTool (a free Windows tool) lists the model, MAC address and SN of recorders on the network.",
          confidence: "official",
        },
        {
          text:
            "If a Dahua screen shows SN 0 or a blank serial, use the label. Dahua warns that on some older models " +
            "the SN shown is the main board's and may be wrong.",
          confidence: "official",
        },
        {
          text:
            "CP Plus web page (default address 192.168.1.240 for a DVR, 192.168.1.245 for an NVR): the Version page " +
            "shows the Device Model, the SN and the DevID.",
          path: "Info > System Info > Version",
          confidence: "official",
        },
        {
          text:
            "CP Plus, on the recorder's own screen: this path is confirmed only in one CP Plus mobile NVR manual. " +
            "Other CP Plus recorders probably use a similar path, but this is not confirmed.",
          path: "Main Menu > Info > System Info > Version",
          confidence: "unverified",
        },
        {
          text:
            "XMEye-type recorders: right-click to open the menu and look for the 'SerialNo' line. Some versions use " +
            "Main Menu > System > Info > Version. These paths come from third-party guides only.",
          path: "Main Menu > Info > Version",
          confidence: "unverified",
        },
        {
          text:
            "Godrej SeeThru Smart NVR: click the menu bar at the bottom of the live screen to see the Device Serial " +
            "Number. Do not use the serial under Disk Settings: that is most likely the hard disk's serial.",
          confidence: "official",
        },
        {
          text:
            "Honeywell and 'Impact by Honeywell': no user manuals are published online, so no menu path can be " +
            "given. Use the label and a photo of any information screen you can find.",
          confidence: "unverified",
        },
      ],
    },
    {
      id: "mac",
      title: "Find the MAC address (LAN)",
      targets: ["mac"],
      steps: [
        {
          text: "Hikvision, firmware 3.x: the General tab shows 'MAC Address'.",
          path: "Menu > Configuration > Network > General",
          confidence: "official",
        },
        {
          text: "Hikvision, GUI 4.0: the TCP/IP screen shows 'MAC Address'.",
          path: "System > Network > TCP/IP",
          confidence: "official",
        },
        {
          text: "Hikvision, V5 menus: the TCP/IP screen probably shows the MAC address, but this is not confirmed.",
          path: "System > System Settings > Network > Network > TCP/IP",
          confidence: "unverified",
        },
        {
          text: "Hikvision web page: the TCP/IP page shows 'Mac Address'.",
          path: "Configuration > Network > Basic Settings > TCP/IP",
          confidence: "official",
        },
        {
          text: "Dahua, GUI 4.0: the TCP/IP screen displays the MAC address of the recorder.",
          path: "Main Menu > NETWORK > TCP/IP",
          confidence: "official",
        },
        {
          text: "Dahua, older menus: the TCP/IP screen shows the MAC address (you cannot edit it there).",
          path: "Main menu > Setting > Network > TCP/IP",
          confidence: "official",
        },
        {
          text: "Dahua web page: the TCP/IP page shows the MAC address. Dahua also says the MAC is on the device label.",
          path: "Setup > Network > TCP/IP",
          confidence: "reliable",
        },
        {
          text: "CP Plus web page: the TCP/IP page displays the MAC address of the recorder.",
          path: "Manage > Network > TCP/IP",
          confidence: "official",
        },
        {
          text: "XMEye-type, Godrej and Honeywell recorders: where the MAC is shown was not confirmed. Check the label.",
          confidence: "unverified",
        },
      ],
    },
    {
      id: "cloud",
      title: "Cloud or P2P ID (if the recorder is linked to a phone app)",
      targets: ["cloud"],
      steps: [
        {
          text:
            "Hikvision (Hik-Connect app): the cloud ID is a 9-character short serial taken from the long serial. It " +
            "is usually nine digits, or one letter and eight digits. For example, in " +
            "DS-7608NI-I2/8P0820170207CCRR123456789WCVU the short serial is 123456789. Write it as " +
            "'Hik-Connect serial: 123456789'.",
          confidence: "official",
        },
        {
          text: "Hikvision, firmware 3.x: the Platform Access screen shows the Hik-Connect settings.",
          path: "Menu > Configuration > Network > Platform Access",
          confidence: "official",
        },
        {
          text: "Hikvision, V5 menus: the Hik-Connect screen shows the Hik-Connect settings.",
          path: "System > System Settings > Network > Hik-Connect",
          confidence: "official",
        },
        {
          text:
            "Dahua (DMSS app): the P2P ID is the device SN. The app adds a recorder by scanning its QR code or by " +
            "typing the SN. The P2P screen shows the QR code.",
          path: "Main Menu > NETWORK > P2P",
          confidence: "reliable",
        },
        {
          text:
            "CP Plus web page: the InstaOn Cloud page shows the Cloud ID as text and as a QR code. It may differ " +
            "from the serial number, so record both, each with its label.",
          path: "Manage > Network > InstaOn Cloud",
          confidence: "official",
        },
        {
          text: "XMEye: the app logs in with the recorder's serial number. Write it as 'XMEye Serial No. (cloud login)'.",
          confidence: "official",
        },
        {
          text: "Godrej: remote access through autonat.com uses the device serial number.",
          confidence: "official",
        },
      ],
    },
    {
      id: "clock",
      title: "Record the recorder's clock",
      targets: ["clock"],
      steps: [
        {
          text:
            "Do not change the recorder's date or time. Do not press NTP, 'Sync PC' or any time-update button " +
            "before or during export. Dahua warns that changing the time can make recorded video impossible to search.",
          confidence: "official",
        },
        {
          text:
            "Open NPL's Indian Standard Time (IST) clock on a phone. CSIR-NPL keeps India's official time. The page " +
            "also shows how far the phone's own clock is off.",
          path: "https://www.nplindia.org/clockcode/html/",
          confidence: "official",
        },
        {
          text:
            "Look at the recorder's live-view screen, which shows its clock in a corner. Take one photo that shows " +
            "both the recorder's clock and the phone's IST clock, both readable. (Forensic guides ask for the two " +
            "times to be read at the same moment; a single photo is one practical way to do that.)",
          confidence: "unverified",
        },
        {
          text:
            "Write down the date, the recorder's time, the IST time, and what you used as the reference, for " +
            "example 'NPL IST web clock on phone'.",
          confidence: "official",
        },
        {
          text:
            "Work out the difference: recorder time minus IST. Write 'DVR ahead by N min N s' or 'DVR behind by " +
            "N min N s'. Check the date too: it can be wrong after a power cut or with a weak clock battery.",
          confidence: "official",
        },
        {
          text:
            "To find footage of a real-world time, add the difference. For example, if the DVR is 5 minutes ahead, " +
            "footage of 10:00 IST is at 10:05 on the DVR.",
          confidence: "official",
        },
        {
          text:
            "Recorders with IP cameras: each camera may print its own time on the picture. Note any camera whose " +
            "time differs from the recorder's.",
          confidence: "official",
        },
        {
          text: "After the export you may repeat the photo. Then check that the exported files play and show the " + "expected times.",
          confidence: "official",
        },
        {
          text: "Hikvision, older menus (3.x): this screen shows System Date and System Time. Look only; do not edit.",
          path: "Menu > Configuration > General",
          confidence: "official",
        },
        {
          text: "Hikvision, GUI 4.0: this screen shows the date and time. Look only; do not edit.",
          path: "System > General",
          confidence: "official",
        },
        {
          text:
            "Hikvision, 'Easy' or 'Expert' menus: this screen shows the date and time. Look only; do not edit. " +
            "Hikvision's Time Sync Diagnosis (under Device Maintenance) warns that a weak clock battery causes " +
            "incorrect recording time.",
          path: "Configuration > System > General",
          confidence: "official",
        },
        {
          text: "Hikvision, V5 menus: this screen shows the date and time. Look only; do not edit.",
          path: "System > System Settings > System Configuration",
          confidence: "official",
        },
        {
          text: "Dahua, GUI 4.0: this screen shows the date and time. Look only; do not edit.",
          path: "Main Menu > SYSTEM > GENERAL > Date&Time",
          confidence: "official",
        },
        {
          text: "CP Plus web page: this page shows the date and time. Do not press the 'Sync PC' button.",
          path: "Manage > System > General > Date&Time",
          confidence: "official",
        },
        {
          text: "XMEye-type recorders: the clock setting is probably here, but this is not confirmed. Look only.",
          path: "Main Menu > System > General > System Time",
          confidence: "unverified",
        },
        {
          text: "Godrej, older recorders: the date and time are under this menu. Look only; do not edit.",
          path: "Setting > General",
          confidence: "official",
        },
      ],
    },
    {
      id: "export",
      title: "Export the footage",
      targets: ["export"],
      steps: [
        {
          text:
            "Plug a USB stick into the recorder and export only the clips you need. Where the recorder offers it, " +
            "export in its own (native) format and let it copy its player program too. Forensic guidance says the " +
            "native format is likely to be the best evidence. You can make a separate MP4 copy for easy viewing.",
          confidence: "official",
        },
        {
          text:
            "Native files (.dav, .cpv, .h264 and Hikvision's own .mp4) may not open in ordinary video players. You " +
            "may need the maker's player, so keep it with the export.",
          confidence: "reliable",
        },
        {
          text:
            "Hikvision, older menus (3.x): choose Normal (or Event). Quick Export allows up to 24 hours per " +
            "channel. The recorder copies its player (player.exe) to the USB stick automatically.",
          path: "Menu > Export > Normal",
          confidence: "official",
        },
        {
          text: "Hikvision, GUI 4.0: select the files, then choose Export.",
          path: "File Management > All Files > Export",
          confidence: "official",
        },
        {
          text: "Hikvision, 'Easy' or 'Expert' menus: search for the footage, then use Export or Quick Export.",
          path: "Search > Export",
          confidence: "official",
        },
        {
          text: "Hikvision, V5 menus: search for the footage, then use Export or Export All.",
          path: "Backup > Search > Export",
          confidence: "official",
        },
        {
          text:
            "Hikvision player: use VSPlayer (part of Hikvision HiTools) on a computer. If stream encryption is " +
            "turned on, the files may need the encryption key to play.",
          confidence: "official",
        },
        {
          text: "Dahua, GUI 4.0: in the File Format list, choose DAV (Dahua's own format) or MP4.",
          path: "Main Menu > BACKUP",
          confidence: "official",
        },
        {
          text: "Dahua, older menus: the formats are DAV or ASF. File names end in .dav.",
          path: "Main menu > Backup",
          confidence: "reliable",
        },
        {
          text:
            "Dahua player: Dahua Smart Player plays .dav files and has a watermark (tamper) check. Whether the " +
            "recorder copies the player to the USB stick is not confirmed.",
          confidence: "official",
        },
        {
          text: "CP Plus web page: on the Backup page, the file format can be CPV or MP4.",
          confidence: "official",
        },
        {
          text:
            "CP Plus, on the recorder's own screen: this path is confirmed only for one CP Plus mobile NVR. Other " + "models may differ.",
          path: "Main menu > Video > Backup",
          confidence: "unverified",
        },
        {
          text:
            "CP Plus player: CPPLUS_Orange_SmartPlayer plays avi, mp4, asf, mov and dav files. Whether it plays " +
            ".cpv files is not confirmed.",
          confidence: "official",
        },
        {
          text:
            "XMEye-type recorders: click Detect if the USB stick is not shown. Set the channel, start time and end " +
            "time, click Add, choose H26X, AVI or MP4, click Start and wait for 'Backup Finished'. These steps come " +
            "from third-party guides only.",
          path: "Main Menu > Record > Backup",
          confidence: "unverified",
        },
        {
          text:
            "Godrej and Honeywell: export steps could not be confirmed from the makers' documents. Godrej says its " +
            "EVE NCR backs up only through the mobile app.",
          confidence: "unverified",
        },
      ],
    },
  ],
  cautions: [
    "Never write a password or the Hikvision Verification Code on the certificate. Do not attach an uncovered photo " +
      "of the Hikvision label QR code: it contains the model, serial number and verification code.",
    "Do not use these as the serial number: the Hikvision 'Device No.' (a number from 1 to 255, set to 255 by default), the " +
      "Dahua 'Device No.', any hard-disk serial, or any camera serial.",
    "If the label and the screen show different serial numbers, write both and say where each came from.",
    "Do not change the date, time or any other setting on the recorder. Use computer tools such as SADP or " +
      "ConfigTool only to read details.",
    "Keep the exported files exactly as exported: do not rename, trim, convert or re-save them. If you want an MP4 " +
      "to watch, make a separate copy.",
    "Write the clock difference under 'any other relevant information' on the certificate.",
    "An IMEI applies only to recorders that have a 4G or SIM card module.",
    "'UIN/UID' is not defined in the form. If you list a P2P or cloud ID, label it clearly (for example " +
      "'Hik-Connect serial'). Never enter an Aadhaar number there.",
  ],
  sources: [
    {
      label: "Hikvision NVR user manual V3.4.98 (older menus)",
      url: "https://www.hikvision.com/content/dam/hikvision/products/S000000001/S000000002/S000000007/S000000026/OFR000040/M000000560/User_Manual/Baseline_User-Manual_DS-7600NI-Q-&-K_Network-Video-Recorder_V3.4.98_20180124.pdf",
    },
    {
      label: "Hikvision GUI 4.0 user manual",
      url: "https://inter-cdn.com/images/document/3686274/4.0-USER-MANUAL-HIKVISION.pdf",
    },
    {
      label: "Hikvision DVR user manual V4.83",
      url: "https://assets.hikvision.com/prd/normal/all/doc/m000168161/UD39876B-A_Digital-Video-Recorder_User-Manual_V4.83.300_20250324.pdf",
    },
    {
      label: "Hikvision NVR user manual V5.04",
      url: "https://assets.hikvision.com/prd/public/all/doc/m000060965/UD39811B-A_Network-Video-Recorder_User-Manual_V5.04.000_20250324.pdf",
    },
    {
      label: "Hikvision: enable Hik-Connect on recorders",
      url: "https://www.hikvision.com/content/dam/hikvision/ca/how-to-document/Enable-Hik-Connect-3.0-on-recorders.pdf",
    },
    {
      label: "Hikvision: add a device to Hik-Connect by serial number",
      url: "https://www.hikvision.com/content/dam/hikvision/ca/how-to-document/Adding-a-device-to-hik-connect-app-by-serial-number-and-verification-code.pdf",
    },
    {
      label: "Hikvision USA: how to find the device serial number",
      url: "https://supportusa.hikvision.com/support/solutions/articles/17000136433-how-to-check-find-device-serial-number",
    },
    { label: "Hikvision HiTools (SADP, VSPlayer)", url: "https://www.hikvision.com/en/support/tools/hitools/" },
    { label: "Prama India: about us", url: "https://www.pramaindia.in/about-us" },
    { label: "Hikvision India: about us", url: "https://www.hikvisionindia.com/aboutus" },
    {
      label: "Dahua HDCVI AI DVR user manual",
      url: "https://www.dahuasecurity.com/asset/upload/uploads/soft/20200619/Dahua-HDCVI-AI-DVR_Users-Manual_V1.0.42.pdf",
    },
    {
      label: "Dahua NVR user manual V6.0.0 (older menus)",
      url: "https://dahuawiki.com/images/3/33/NVR+(60+and+724+Series)_User's+Manual_V6.0.0.pdf",
    },
    {
      label: "Dahua ConfigTool user manual",
      url: "https://dahuawiki.com/images/2/27/Dahua_ConfigTool_Users_Manual_V3.1.0_20150707.pdf",
    },
    {
      label: "Dahua wiki: identify model and serial number",
      url: "https://www.dahuawiki.com/Basic_Setup/Identify_Model_and_Serial_Number",
    },
    {
      label: "CP Plus DVR user manual",
      url: "https://www.cpplusworld.com/prodassets/usermannual/e0e92063-1a59-4a74-8432-b8d58e6ff036.pdf",
    },
    {
      label: "CP Plus NVR user manual",
      url: "https://www.cpplusworld.com/prodassets/usermannual/95c3171d-1c55-4487-9f4f-a3d7ffb76c76.pdf",
    },
    { label: "CP Plus software downloads", url: "https://www.cpplusworld.com/software" },
    { label: "CP Plus FAQ", url: "https://www.cpplusworld.com/faq" },
    { label: "XMEye guide (third party)", url: "https://securitycamcenter.com/connect-dvr-nvr-xmeye/" },
    { label: "XMEye app listing", url: "https://apps.apple.com/us/app/-/id884006786" },
    {
      label: "Godrej SeeThru Smart NVR quick start guide",
      url: "https://static.godrejenterprises.com/See_Thru_Smart_NVR_45e42b8d6f.pdf",
    },
    {
      label: "Godrej user manuals",
      url: "https://www.godrejenterprises.com/support/locks-and-security/home-security/user-manuals-and-catalogues",
    },
    {
      label: "Honeywell India AHD DVRs",
      url: "https://www.honeywellbuildings.in/intelligent-security/mass-mid-segment/video-system/ahd-dvr/2mp-dvrs",
    },
    {
      label: "SWGDE: Best Practices for Data Acquisition from Digital Video Recorders (2026)",
      url: "https://swgde.org/wp-content/uploads/2026/06/2026-06-02-Best-Practices-for-Data-Acquisition-from-Digital-Video-Recorders-17-V-002-1.4.pdf",
    },
    {
      label: "SWGIT Section 24: retrieval of digital video",
      url: "https://swgde.org/wp-content/uploads/2024/06/Section_24_Best_Practices_for_the_Retrieval_of_Digital_Video.pdf",
    },
    {
      label: "UK Home Office: Recovery and Acquisition of Video Evidence v3.0",
      url: "https://assets.publishing.service.gov.uk/media/62a9f18fd3bf7f036bb12944/Recovery_and_Acquisition_of_Video_Evidence_v3-0.pdf",
    },
    { label: "NIST IR 8161r1", url: "https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.8161r1.pdf" },
    {
      label: "Kerala Police SOP (CCTV chapter)",
      url: "https://keralapolice.gov.in/storage/pages/custom/ckFiles/file/7GafuMCjLbFgjBNh8aXz8WhLv2Zqtfczvbi7Uv6m.pdf",
    },
    { label: "CSIR-NPL Indian Standard Time clock", url: "https://www.nplindia.org/clockcode/html/" },
  ],
};
