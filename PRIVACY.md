# Privacy

This page explains, in plain words, what Sakshya Kit keeps, where it keeps it, and what (if anything) leaves your device.

## The short version

- Your files are read on your own device. They are never uploaded.
- Your case details are saved only in this browser, on this device.
- Nothing is sent anywhere, unless you press the button to add a timestamp to a PDF. Then only a hash of that PDF is sent.
- There are no accounts, no analytics, no cookies, no ads and no tracking.
- You can delete everything at any time.

The people who make Sakshya Kit never receive your files or your case details, so we cannot see, correct or delete them for you. They are only on your device.

## What Sakshya Kit stores

Sakshya Kit saves your work in this browser's own storage (called IndexedDB), so you can close the page and come back later. It stores:

- **Case details** you type in: the case title, court and case number; your name, your parent's or spouse's name, your address and place; and the same details and designation for the expert.
- **Records**: for each file you add, its name, type, size, dates, its hash values (MD5, SHA-1, SHA-256) and any description you type. For files inside a zip, the path inside the zip.
- **Device details** you type in: make, model, colour, serial number, identifiers such as IMEI, MAC address, EID, or the phone number or account linked to the device, any notes, and any clock check.
- **The custody log**: a dated list of what was done with the case (files added, devices recorded, documents generated), with the name you entered.
- **WhatsApp chat text**: the text file from a WhatsApp export, so that you can make a transcript later without adding the export again.
- **Two settings**: whether you have accepted the "Before you start" notice, and the address of the check page printed in your QR codes.

It **never stores your media files**. Photos, screenshots, recordings, videos, documents and zip files are read only to work out their hash values. The files themselves stay where they were, unchanged.

## Where it is stored

Only in this browser, on this device. It is not copied to any server, and it does not move to your other devices or browsers. If you open Sakshya Kit in a different browser, it will be empty there.

Sakshya Kit does not encrypt what it stores. Anyone who can open this browser on this device could see your cases. Use a screen lock, and avoid shared or public computers. A private or incognito window may not keep your work after you close it.

Sakshya Kit asks the browser to keep its data even when the device is low on space. Some browsers may still remove it, so download a backup of any case you need to keep.

## What leaves your device

**Your files and case details: nothing.** Hashing, reading WhatsApp chats and making PDFs all happen inside your browser. The app's security settings block it from contacting any other website, except the one below.

**The optional timestamp.** On the Generate step you can ask for a trusted timestamp for a PDF. Only when you press that button, Sakshya Kit sends a SHA-256 hash computed from the PDF (a short fixed-length code) to the timestamp service at `rfc3161.ai.moda`. The PDF itself is not sent, and the PDF cannot be rebuilt from its hash. Like any website, the timestamp service can see your internet (IP) address, the time of the request, and the address of the site you are using Sakshya Kit from. It sends back a signed time, which is added to your PDF. If you never press the button, nothing is sent.

**Opening the app.** Sakshya Kit is a website. When you open it, the server that hosts it sees an ordinary web request (your IP address, the time and your browser type), as with any website. It does not see your cases or files. After the first visit, the app is saved on your device and works offline.

**Files you download and share yourself.** PDFs and backup files you download are ordinary files on your device. Where they go next is up to you. A backup file contains your case details, device details, custody log and WhatsApp chat text, and it is not encrypted, so keep it safe.

## QR codes and check links

The certificate's hash report has QR codes. Each QR code is a link to the check page. The details needed for the check are placed after the `#` in the link: a short case reference (case number, court and title, shortened), the record labels, the file names (shortened), the file sizes, and the SHA-256 values.

Browsers do not send the part after `#` to any server. So when someone scans the QR code, the site hosting the check page only sees that the page was opened, not the case details or hash values. Anyone who has the printed certificate or the link can read these details, but they are already printed on the certificate.

When someone uses the check page, the file they choose is hashed on their own device, and so is any hash list or backup file they open there. Nothing is uploaded.

## No accounts, analytics or cookies

Sakshya Kit has no sign-up and no login. It does not use cookies, analytics, advertising, tracking pixels, crash reporting or any third-party service, apart from the optional timestamp described above.

## How to delete your data

- **Delete one case:** on the **Cases** screen, choose **Delete** next to the case. This removes the case and its stored WhatsApp chat text from this browser.
- **Delete everything:** open **About the certificate**, go to "Your data on this device" and choose **Delete all data on this device**. This removes every case, chat text and setting that Sakshya Kit stored in this browser.
- **Remove the app completely:** clear the site's data in your browser settings (often called "Site settings", "Clear browsing data" or "Manage website data"). This also removes the offline copy of the app. If you installed it as an app, uninstall it as well.

Deleting data in Sakshya Kit does not touch your original files, or PDFs and backups you have already downloaded. Delete those separately if you want to. Download a backup first if you may need a case later: deleted data cannot be recovered.

## Changes to this page

If what Sakshya Kit stores or sends ever changes, this page and the [changelog](CHANGELOG.md) will say so.

## Questions

Ask in the project's GitHub issues. Please do not include any personal data or case details in an issue.
