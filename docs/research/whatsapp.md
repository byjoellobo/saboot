# WhatsApp "Export chat" format: research for a byte-exact, per-message-hashing parser

> **Redaction note.** The example lines below keep the exact format of real exports (dates, separators,
> invisible characters such as `<U+202F>` and `<U+200E>`), but every name, phone number, group name and
> message text taken from a real person's chat has been replaced with a placeholder. The public repositories
> those exports came from are not linked, because they contain real people's messages.


Research date: 2026-10-29. Target: TypeScript, in-browser parser, Indian users, court transcript with one SHA-256 per message computed over the raw bytes of that message in the chat text file.

## How this was researched, and confidence tags

Three kinds of evidence, tagged throughout:

- **[BYTES]**: I downloaded real export files from public GitHub repos and inspected the raw bytes (BOM, CR/LF, every invisible code point). Roughly 25 Android `WhatsApp Chat with X.txt` files (most from Indian users, +91 numbers, Tamil/Hindi text), about 10 iOS `_chat.txt` files, and the controlled corpus in `starkdmi/whats_json` (the same chat exported on Android and iOS in many languages, with and without media, including Hindi iOS). Files that were clearly synthetic were discarded (e.g. `rodrigogs/whats-reader` iOS sample with no LRM or NNBSP, `wchklaus97/whats_pie` "android" file built from iOS filenames).
- **[SOURCE]**: stated by a named source (parser code, issue thread, official FAQ, legal report) that I read but did not re-derive from bytes.
- **[UNVERIFIED]**: plausible or claimed, but I could not confirm it from bytes or an authoritative source.

Notation: invisible characters are written as `<U+XXXX>` in this document. In the real files they are the actual characters, not this text. Common ones:

| Code point | Name | Where it appears |
|---|---|---|
| U+202F | NARROW NO-BREAK SPACE (NNBSP) | Between time and am/pm (Android 2023+, iOS 2024+); after `~` for unsaved contacts on Android |
| U+200E | LEFT-TO-RIGHT MARK (LRM) | iOS only: line start, after `Name: `, inside system text |
| U+202A / U+202C | LRE / PDF (embedding / pop) | iOS only: around phone-number authors |
| U+00A0 | NO-BREAK SPACE | iOS phone numbers between digit groups; `p.<U+00A0>m.` in Spanish Android; inside localized system text (e.g. Russian) |
| U+200D | ZERO WIDTH JOINER | Inside emoji sequences. Never strip. |
| U+FEFF | BOM | Not observed in any sample |

Note: the web-search budget for this task ran out near the end, so a few points (exact Android/iOS OS version where U+202F started, Hindi Android strings, the Web/Desktop export format) stay unverified and are listed in section 10.

---

## 0. Key takeaways for a hashing parser

1. **Hash raw bytes, parse a normalized view.** Do not NFKC-normalize, strip LRM, or convert CRLF before hashing. Parse a copy (or match on the decoded string while tracking byte offsets) and slice the hash input from the original `Uint8Array`.
2. **iOS gives you a record delimiter; Android does not.** [BYTES] In unmodified iOS `_chat.txt`, every message record ends with CRLF (`\r\n`), while line breaks *inside* a multi-line message are bare LF (`\n`). In two real multi-line iOS files: 26 of 26 record ends were CRLF (including the final record), 35 of 35 internal breaks were bare LF, zero exceptions. Android files use bare LF everywhere (0 CR bytes in 25 files). So on iOS a "header-looking" line inside a message body is detectable; on Android it is not (see section 5, spoofing).
3. **U+202F before am/pm.** [BYTES] Present in Android exports made from about early 2023 onward and in all 2024+ iOS 12-hour exports I saw. Older Android exports use U+0020. Accept `[ \u00A0\u202F]` there. JS `\s` does match U+202F and U+00A0 (but not U+200E).
4. **India is not one format.** [BYTES] Indian users produce both `dd/MM/yy` (English (India), lowercase `am/pm`) and `M/d/yy` (English (US) phone language, uppercase `AM/PM`), plus 24-hour variants. Infer day/month order per file, never per line, and let the user confirm when ambiguous.
5. **System messages differ by platform.** Android system lines have *no* `Name: ` segment. iOS system lines *do* have one (the group or contact name), and are recognized by U+200E right after `: `.
6. **Timestamps are not monotonic.** [BYTES] The first line (encryption notice) is often dated later than the following messages (e.g. `23/03/2022, 13:31` then `18/03/2022, 14:56`). Do not reject out-of-order records.
7. **Identical messages are byte-identical.** Two `ok` messages in the same minute from the same sender produce the same bytes and the same SHA-256. Number every record (ordinal) in the transcript; consider also a chained or Merkle hash so order and completeness are provable.
8. **For Indian courts (BSA 2023, s.63(4) Schedule)** the certificate asks for the hash of "the electronic/digital record/s". Also hash the zip as received and the extracted chat `.txt` as a whole; per-message hashes are an extra integrity aid, not a substitute.

---

## 1. Header line formats

### 1.1 Android

Grammar (all observed Android exports):

```
<date>, <time>[<sp><ampm>] - <author>: <body>        user message
<date>, <time>[<sp><ampm>] - <system text>           system message (no "author: ")
```

- Separator after date: `, ` (comma + U+0020). Separator before author: ` - ` (U+0020, U+002D HYPHEN-MINUS, U+0020). [BYTES]
- No seconds on Android. [BYTES]
- 12-hour clock: hour not zero-padded (`9:34`). 24-hour clock: hour zero-padded (`09:14`). [BYTES]
- Space before am/pm: U+202F in newer exports, U+0020 in older ones. [BYTES]
- No U+200E anywhere in 25 Android files. [BYTES]
- Phone-number authors use plain ASCII spaces: `+91 XXXXX XXXXX`. [BYTES]
- Unsaved contacts (push name) are prefixed `~` + U+202F: `~<U+202F>Reena removed +91 XXXXX XXXXX`. [BYTES]

Observed variants (real lines, names from public repos):

| Variant (likely phone language) | Real example line | Date pattern | Notes |
|---|---|---|---|
| English (India), 12h, new | `27/08/23, 9:34<U+202F>pm - Person A: வணக்கம்` | `dd/MM/yy` | lowercase `am/pm`, 2-digit year, zero-padded day and month [BYTES] |
| English (India), 12h, new | `20/09/22, 7:41<U+202F>pm - You created group "Group name"` | `dd/MM/yy` | system line [BYTES] |
| English (India), 12h, old | `10/09/20, 10:47 pm - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.` | `dd/MM/yy` | U+0020 before `pm` (export made circa 2022) [BYTES] |
| English (India), 12h, old | `16/09/20, 7:38 pm - Person N: Missed video call` | `dd/MM/yy` | [BYTES] |
| English (US), 12h, new | `4/6/26, 1:57<U+202F>PM - You created this group` | `M/d/yy` | uppercase `AM/PM`, no padding [BYTES] |
| English (US), 12h, new, Indian user | `7/31/23, 7:11<U+202F>AM - +91 XXXXX XXXXX: message text` | `M/d/yy` | Indian users often run en-US [BYTES] |
| English (US), 12h, Feb 2023 | `2/4/23, 10:35<U+202F>PM - Person 1: Got it. So is it 4:30 or 6?` | `M/d/yy` | earliest dated U+202F evidence (Pustur issue #248, 2023-02-09) [SOURCE] |
| English (US), 12h, old | `1/8/21, 10:02 AM - Friend: n'aber` | `M/d/yy` | U+0020 [BYTES] |
| English (US), 24h, Indian user | `7/25/19, 23:45 - Messages to this group are now secured with end-to-end encryption. Tap for more info.` | `M/d/yy` | VIT Chennai group [BYTES] |
| English (US), 24h | `1/21/20, 10:56 - Person H created group "Group name"` | `M/d/yy` | [BYTES] |
| English (UK), 24h | `16/11/2021, 13:49 - Messages and calls are end-to-end encrypted. ...` | `dd/MM/yyyy` | 4-digit year [BYTES] |
| English (UK), 24h | `24/03/2020, 13:41 - Person J: IMG-20200324-WA0014.jpg (file attached)` | `dd/MM/yyyy` | [BYTES] |
| English (UK), 24h, Indian user | `17/07/2024, 15:35 - ~<U+202F>Person C created group "Group name "` | `dd/MM/yyyy` | note `~`+U+202F [BYTES] |
| `dd/MM/yyyy`, 12h lowercase | `13/05/2026, 4:18<U+202F>pm - Person D created group "Group name"` | `dd/MM/yyyy` | probably English (UK) with 12h, or en-PK; locale not confirmed [BYTES] |
| English (India), 24h | expected `15/01/24, 22:30 - Name: text` | `dd/MM/yy` | **[UNVERIFIED]** no real sample. footprint-messaging emulator test says en-IN uses 2-digit year and en-GB 4-digit year, so your example `15/01/2024, 22:30 - ...` matches en-GB 24h, not en-IN |
| Hindi (hi-IN) | expected `15/1/24, 10:30<U+202F>am - नाम: text` | `d/M/yy`? | **[UNVERIFIED]** no real Android Hindi sample found. Timestamp digits likely Latin (CLDR `hi` default numbering is `latn`) |
| Marathi / Bengali etc. | may use native digits (`०१२…`, `০১২…`) | ? | **[UNVERIFIED]**. CLDR default numbering for `mr` is Devanagari, `bn` is Bengali; threadrecap explicitly says it cannot read Devanagari/Bengali digits, implying such files exist |

Other world variants (from Pustur tests and threadrecap, not Indian): `03-06-2018, 01.55 PM - a: m`, `13.6.2018 klo 21.25.15 - a: m` (Finnish), `13. 6. 2018. 21:25:15 a: m`, `3/6/2018 1:55 p.<U+00A0>m. - a: m` (Spanish, NBSP inside `p. m.`), `19.09.24, 1:15 nachm. - Jonas: ...` (German 12h), `2024-07-12, 18 h 39 - Person W: ...` (French), `05/01/2021, 3:08 in the afternoon - Jane Doe: <Media omitted>` (day-period words instead of am/pm; seen in one real file from a public export and in threadrecap: `12/12/25, 7:30 in the evening - Ravi: ...`).

### 1.2 iOS

Grammar:

```
[<U+200E>]"[" <date>, <time:ss>[<U+202F><AM/PM>] "]" <sp> <author>: <body>
```

- Always square brackets, always seconds. [BYTES]
- 12-hour exports from 2024 onward use U+202F before `AM`/`PM`. [BYTES]
- iOS date order and 12/24h come from the iOS Region / Date and Time settings, not from WhatsApp's language (the Hindi-language iOS export still shows `[3/18/22, 14:56:00]`). [BYTES]
- Author for system notices is the chat name (group subject, or the contact's name in a 1:1 chat). [BYTES]

| Variant | Real example line | Notes |
|---|---|---|
| India region (likely), 12h | `[28/07/24, 9:09:28<U+202F>PM] Group Name: <U+200E>Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.` | `dd/MM/yy`, **uppercase** `PM` (unlike Android en-IN) [BYTES] |
| India region (likely), phone author | `[28/07/24, 9:09:28<U+202F>PM] <U+202A>+91<U+00A0>XXXXX<U+00A0>XXXXX<U+202C>: <U+200E><U+202A>+91<U+00A0>XXXXX<U+00A0>XXXXX<U+202C> created this group` | phone wrapped in LRE...PDF, NBSP between groups [BYTES] |
| India region (likely), media | `<U+200E>[07/02/25, 8:52:51<U+202F>PM] Person M💖: <U+200E>video omitted` | Hindi-speaking user [BYTES] |
| India region (likely), contact with trailing space | `[17/04/25, 2:20:43<U+202F>PM] Person E : message text ...` | author string ends with a space before `:` [BYTES] |
| `dd/MM/yyyy` 12h (Malaysia) | `[19/04/2025, 8:51:28<U+202F>AM] Person Q: message text` | [BYTES] |
| `d/M/yyyy` 12h | `[10/7/2024, 10:50:54<U+202F>AM] Testing: <U+200E>You created group “Testing”` | curly quotes on iOS [BYTES] |
| `M/d/yy` 24h (US language, 24h setting) | `[3/27/22, 21:41:35] Person K: Hello World` | [BYTES] |
| `d/M/yy` 24h (UK region) | `[29/5/26, 15:40:52] ~Person G: <U+200E>Messages and calls are end-to-end encrypted. ...` | iOS `~` has **no** U+202F after it [BYTES] |
| Thai Buddhist calendar | `[25/3/2567 BE, 23:15:34] Group Name: <U+200E>You created group “Group name ”` | `BE` marker [BYTES] |
| en-US 12h (canonical) | `[1/15/26, 3:45:00 PM] Jordan: Running ten minutes late` | from threadrecap; it states the space before PM is a narrow no-break space [SOURCE] |
| Old iOS (pre-2021?) | `[06.13.18 21:25:15] a: m`, `\u200E[3/6/18 1:55:00 p. m.] a: m` | no comma after date (Pustur tests) [SOURCE] |

**iOS U+200E placement rules** [BYTES, consistent across all real iOS files]:

1. **Line-leading LRM** (before `[`) on records whose body is an attachment or a media placeholder:
   `<U+200E>[19/04/2025, 9:08:39<U+202F>AM] Person F: <U+200E><attached: 00000004-AUDIO-2025-04-19-09-08-39.opus>`
   `<U+200E>[3/27/22, 21:50:09] Person K: Some file.txt <U+200E>document omitted`
2. **LRM right after `Name: `** for system notices, deleted markers, location, media placeholders, security-code notices:
   `[3/27/22, 21:54:45] Person L: <U+200E>This message was deleted.`
3. **LRM inside system text** before each sentence segment:
   `[4/28/22, 20:17:30] Person L: <U+200E><U+200E>Your security code with Person L changed. <U+200E>Tap to learn more.`
   `[25/3/2567 BE, 23:15:35] Group Name: <U+200E><U+200E><U+200E>Disappearing messages were turned on. <U+200E>New messages will disappear from this chat <U+200E>24 hours after they're sent, except when kept.` (tail truncated in my dump)
4. **LRM before page count and placeholder** in documents: `Resume-Person-K.pdf • <U+200E>2 pages <U+200E>document omitted` (`•` is U+2022).
5. **LRM inside the author**: `[25/3/2567 BE, 23:29:32] <U+200E>You: <U+200E><U+200E>You turned off disappearing messages. <U+200E>Tap to change.`
6. Ordinary text messages have **no** LRM: `[3/27/22, 21:41:35] Person K: Hello World`.

whatstk's cleaner (see 7.2) also strips U+202A..U+202E, U+200B, U+00AD, which matches the iOS phone-number wrapping above.

### 1.3 Time-zone note

Timestamps are local wall-clock time of the exporting device, with no offset written anywhere. [SOURCE: Pustur #260 discussion] For India this is IST, but a transcript should state "device local time as written in the export" rather than assert IST.

---

## 2. Day/month order (DD/MM vs MM/DD)

Facts:
- Both orders occur among Indian users (en-IN gives `dd/MM/yy`; many Indian phones are set to English (US) and give `M/d/yy`). [BYTES]
- Year can be 2 or 4 digits; on Android en-IN and en-US it is 2 digits, en-GB 4 digits. [BYTES + SOURCE footprint-messaging]
- Year-first formats exist (`2018/06/13`, Korean `2026/01/15`), and Pustur even supports `06/2018/13`. [SOURCE]

### 2.1 Pustur (whatsapp-chat-parser 4.0.2) inference, verbatim

`src/date.ts`:

```ts
function checkAbove12(numericDates: number[][]): boolean | null {
  const daysFirst = numericDates.some(indexAboveValue(0, 12));
  if (daysFirst) return true;
  const daysSecond = numericDates.some(indexAboveValue(1, 12));
  if (daysSecond) return false;
  return null;
}

function checkDecreasing(numericDates: number[][]): boolean | null {
  const datesByYear = groupArrayByValueAtIndex(numericDates, 2);
  const results = datesByYear.map(dates => {
    const daysFirst = dates.slice(1).some((date, i) => {
      const [first1] = dates[i];
      const [first2] = date;
      return isNegative(first2 - first1);
    });
    if (daysFirst) return true;
    const daysSecond = dates.slice(1).some((date, i) => {
      const [, second1] = dates[i];
      const [, second2] = date;
      return isNegative(second2 - second1);
    });
    if (daysSecond) return false;
    return null;
  });
  const anyTrue = results.some(value => value === true);
  if (anyTrue) return true;
  const anyFalse = results.some(value => value === false);
  if (anyFalse) return false;
  return null;
}

function changeFrequencyAnalysis(numericDates: number[][]): boolean | null {
  const diffs = numericDates
    .slice(1)
    .map((date, i) => date.map((num, j) => Math.abs(numericDates[i][j] - num)));
  const [first, second] = diffs.reduce(
    (total, diff) => {
      const [first1, second1] = total;
      const [first2, second2] = diff;
      return [first1 + first2, second1 + second2];
    },
    [0, 0],
  );
  if (first > second) return true;
  if (first < second) return false;
  return null;
}

function daysBeforeMonths(numericDates: number[][]): boolean | null {
  const firstCheck = checkAbove12(numericDates);
  if (firstCheck !== null) return firstCheck;
  const secondCheck = checkDecreasing(numericDates);
  if (secondCheck !== null) return secondCheck;
  return changeFrequencyAnalysis(numericDates);
}

function normalizeDate(year: string, month: string, day: string): [string, string, string] {
  return [
    // 2 digit years are assumed to be in the 2000-2099 range
    year.padStart(4, '2000'),
    month.padStart(2, '0'),
    day.padStart(2, '0'),
  ];
}

function orderDateComponents(date: string): [string, string, string] {
  const regexSplitDate = /[-/.] ?/;
  const [a, b, c] = date.split(regexSplitDate);
  const maxLength = Math.max(a.length, b.length, c.length);
  if (c.length === maxLength) return [a, b, c];
  if (b.length === maxLength) return [a, c, b];
  return [b, c, a];
}
```

In `parser.ts`, it runs on the **unique** date strings of the whole file: `Array.from(new Set(parsed.map(({ date }) => date)), date => orderDateComponents(date).map(Number))`, then applies one order to all messages. Caller can force it with `{ daysFirst: true | false }`.

Weakness: `checkDecreasing` is fooled by the out-of-order first line (encryption notice dated later), and `orderDateComponents` cannot place the year when all three parts are 2 digits (it assumes the last is the year).

### 2.2 whatstk scoring (Python, current main)

`whatstk/whatsapp/auto_header.py::_score_date_order` tries all 6 permutations and scores each:
- impossible if month outside 1..12, day outside 1..31, or year not consistently 2 or 4 digits;
- `+6` if 4-digit year; `+2` more if any day >12 with a 4-digit year;
- `+3` if day has at least as many distinct values as month; `+3` if year has at most as many distinct values as month;
- `+2` if any day >27;
- `+3` if the (year, month, day) sequence is sorted (chronological);
- ties keep the first ordering tried (deterministic).

Its docs say plainly: "On a chat that never reaches day 28 it has no way to tell the day field from the month field, and silently guesses."

### 2.3 Other tie-breaks seen

- memory-archive PR #6: "when every sampled date is ambiguous and the clock is upper-case `AM`/`PM` (the en-US style), the order is read month-first ... `pm`, `p. m.` and 24h clocks still default to day-first." [SOURCE]
- threadrecap: day-first default; a day >12 settles it; then forward-running time; then "US English with no hour above 12". [SOURCE]

### 2.4 Recommendation

Per file: (1) any first field >12 means DMY, any second field >12 means MDY (if both happen, the file is not one format: stop and flag); (2) 4-digit field is the year; (3) chronology check that ignores the first record; (4) weak hint: Android lowercase `am/pm` suggests en-IN/en-GB (DMY), Android uppercase `AM/PM` suggests en-US (MDY). Do **not** use this hint on iOS (Indian iOS exports show uppercase `PM` with DMY); (5) if still ambiguous, ask the user and print the chosen order on the transcript. Days 1..12 only is common in short chats.

---

## 3. Attachments

### 3.1 Android, "Include media"

Body format: `<filename> (file attached)` as the whole first body line; an optional caption follows on the **next line(s)** (a continuation line, not a new record). [BYTES]

```
23/03/2022, 13:32 - Person L: IMG-20220323-WA0002.jpg (file attached)
Титл
18/03/2022, 15:12 - Person K: PTT-20220323-WA0000.opus (file attached)
23/03/2022, 13:33 - Person L: STK-20220323-WA0003.webp (file attached)
02/03/24, 8:25<U+202F>am - Person S: VID-20240302-WA0000.mp4 (file attached)
15/04/24, 9:09<U+202F>am - Person S: DOC-20240415-WA0020. (file attached)
27/08/23, 9:36<U+202F>pm - Person S: 12 contacts.vcf (file attached)
08/06/24, 6:59<U+202F>am - Person S: பசுமை பெயர் Contact.vcf (file attached)
19/03/25, 9:35<U+202F>pm - Person S: Photo0116.jpg (file attached)
Photo0116.jpg
19/03/25, 9:35<U+202F>pm - Person S: IMG-20171017-WA0009(1).jpg (file attached)
IMG-20171017-WA0009(1).jpg
11/09/24, 6:44<U+202F>pm - Person S: IMG-20240911-WA0001.jpg (file attached)
Forms for Participants E Certificate
```

Observations [BYTES]:
- Filenames can contain spaces and non-ASCII (contact cards are named after the contact). A regex like Pustur's `[\w-]+\.\w+` misses these.
- `DOC-YYYYMMDD-WA####.` with an **empty extension** (trailing dot) occurs.
- Images/videos **sent as documents** keep the original name (`Photo0116.jpg`, `IMG_20240911_123456789.jpg`) and the name is repeated on the next line as the caption.
- `(1)` suffix appears on re-shared files.
- Media that was not on the device at export time still appears as `<Media omitted>` (plus caption line) even in a with-media export.
- 74 of 155 attachments in one Indian file were `IMG_YYYYMMDD_HHMMSSmmm.jpg` (camera names, sent as documents).

Localized `(file attached)` [SOURCE: wa-export-pdf table; not byte-checked by me]: `(ficheiro anexado)` pt-PT, `(arquivo anexado)` pt-BR, `(archivo adjunto)` es, `(fichier joint)` fr, `(Datei angehängt)` de, `(file allegato)` it, `(bestand bijgevoegd)` nl, `(dosya ekli)` tr, `(plik załączony)` pl, `(файл прикреплен)` ru, `(файл прикріплено)` uk, `(fitxer adjunt)` ca (memory-archive, "best-effort"). Hindi: **[UNVERIFIED]**.

Older Android forms [SOURCE: Pustur tests and #260]:
`3/6/18, 1:55 p.m. - a: 2015-08-04-PHOTO-00004762.jpg <<U+200E>attached>` and `26.12.21, 10:21 - Person P : <U+200E>43e5d8acf55f3cdfd7176398c1f72300.jpg (Datei angehängt)` (hex-hash filenames, leading LRM).

### 3.2 Android, "Without media"

- Every media type (image, video, audio, voice note, sticker, GIF, document) becomes exactly `<Media omitted>`. 1,274 occurrences across 25 files; the only other angle-bracket token was `<This message was edited>`. [BYTES]
- **Captions are dropped** in the without-media export of the controlled pair (2022): with-media has `<Media omitted>` + `Caption`, without-media has only `<Media omitted>`. Seen in one controlled pair only. [BYTES, limited]
- Contact cards still appear as `Alex.vcf (file attached)` even without media. [BYTES]
- Localized [SOURCE: wa-export-pdf, memory-archive]: `<Multimedia omitido>` es, `<Mídia oculta>` pt-BR, `<Multimédia omitido>` pt-PT, `<Médias omis>` fr, `<Medien ausgeschlossen>` de, `<Media omessi>` it, `<Media weggelaten>` nl, `<Multimèdia omès>` ca.
- Hindi Android: **[UNVERIFIED]**; other parsers guess conflicting strings: `<मीडिया हटाया गया>` (zTheJoker/chats-analyzer) vs `<मीडिया छोड़ा गया>` and `<मीडिया शामिल नहीं किया गया>` (SwarajG/whatsapp-data-extracter). Treat any single `<...>` whole-body token as a candidate placeholder and log it.

### 3.3 iOS, "With all media" (or "With selected media")

Body: `<U+200E><attached: NNNNNNNN-KIND-YYYY-MM-DD-HH-MM-SS.ext>` and the record line starts with U+200E. [BYTES]

```
<U+200E>[3/27/22, 21:41:55] Person K: <U+200E><attached: 00000035-PHOTO-2022-03-27-21-41-55.jpg>
<U+200E>[3/27/22, 21:44:16] Person K: <U+200E><attached: 00000037-VIDEO-2022-03-27-21-44-16.mp4>
<U+200E>[3/27/22, 21:44:47] Person K: <U+200E><attached: 00000038-AUDIO-2022-03-27-21-44-47.opus>
<U+200E>[3/27/22, 21:47:55] Person K: <U+200E><attached: 00000042-TR.vcf>
<U+200E>[3/27/22, 21:49:16] Person K: <U+200E><attached: 00000043-STICKER-2022-03-27-21-49-16.webp>
<U+200E>[3/27/22, 21:51:57] Person K: <U+200E><attached: 00000051-GIF-2022-03-27-21-51-57.mp4>
<U+200E>[3/27/22, 21:50:09] Person K: Some file.txt <U+200E><attached: 00000046-Some file.txt>
<U+200E>[3/27/22, 21:50:25] Person K: Resume-Person-K.pdf • <U+200E>2 pages <U+200E><attached: 00000047-Resume-Person-K.pdf>
<U+200E>[10/7/2024, 10:53:54<U+202F>AM] Klaus: Trad-diet-guide.pdf • <U+200E>5 pages <U+200E><attached: 00000008-Trad-diet-guide.pdf>
```

Observations [BYTES]:
- The 8-digit prefix is a running counter within the export (35, 36, 37, 38, 42, 43...), not stable across exports [inferred].
- Documents and contact cards keep their original names after the prefix, so spaces occur inside `<attached: ...>`.
- The attachment token is **not** always at the start of the body (documents have a name and page count before it). Pustur's `^`-anchored regex misses these.
- The date/time in a media filename is the media's own time, not necessarily the header time: header `[10/7/2024, 10:52:48 AM]`, file `00000007-STICKER-2024-07-09-10-52-47.webp` (different day).
- Media not available still shows `image omitted` etc. even in a with-media export.
- Older iOS: `< attached: 00000042-PHOTO-2020-06-07-15-13-20.jpg >` (spaces inside brackets) [SOURCE: Pustur test].
- Localized iOS tokens [SOURCE: wa-export-pdf/memory-archive]: `<adjunto: ...>` es, `<anexado: ...>` pt, `<Anhang: ...>` de, `<adjunt: ...>` ca, plus `pièce jointe`, `allegato`, `bijlage`, `załącznik`, `вложение`.

### 3.4 iOS, "Without media"

```
<U+200E>[3/27/22, 21:41:55] Person K: <U+200E>image omitted
<U+200E>[3/27/22, 21:44:16] Person K: <U+200E>video omitted
<U+200E>[3/27/22, 21:44:47] Person K: <U+200E>audio omitted
<U+200E>[3/27/22, 21:47:55] Person K: <U+200E>Contact card omitted
<U+200E>[3/27/22, 21:49:16] Person K: <U+200E>sticker omitted
<U+200E>[3/27/22, 21:51:57] Person K: <U+200E>GIF omitted
<U+200E>[3/27/22, 21:50:09] Person K: Some file.txt <U+200E>document omitted
<U+200E>[3/27/22, 21:50:25] Person K: Resume-Person-K.pdf • <U+200E>2 pages <U+200E>document omitted
```
[BYTES]. Captions with iOS placeholders: zTheJoker/chats-analyzer says `"the caption  \u200Eimage omitted" (caption first, placeholder last)` **[SOURCE, not byte-verified]**.

**Hindi iOS** (WhatsApp language Hindi; same chat as above) [BYTES]:

| English | Hindi (exact) |
|---|---|
| image omitted | `फ़ोटो हटाई गई` |
| video omitted | `वीडियो छोड़ा गया` |
| audio omitted | `ऑडियो हटाई गयी` |
| sticker omitted | `स्टिकर छोड़ा गया` |
| GIF omitted | `GIF छोड़ा गया` |
| Contact card omitted | `कॉन्टैक्ट कार्ड छोड़ा गया` |
| document omitted | `डॉक्यूमेंट छोड़ा गया` |
| 2 pages | `2 पन्ने` |

Other languages (iOS) [SOURCE: wa-export-pdf]: `imagen omitida`, `video omitido`, `audio omitido`, `imagem ocultada`/`imagem omitida`, `bild weggelassen`, `immagine omessa`, `image absente`, etc.

---

## 4. System and special messages

### 4.1 Android system lines (no `author: ` segment) [BYTES unless noted]

Encryption notice, all variants seen (exact text after ` - `):
- `Messages to this group are now secured with end-to-end encryption. Tap for more info.` (2019)
- `Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.` (16 files)
- `Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.` (6)
- `Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.` (6)
- `Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.` (2)
- `Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. *Learn more*` (2) and `... *Learn more*.` (1)
- footprint-messaging (2026 build) reports "a rewritten notice plus a second 'now end-to-end encrypted' line". [SOURCE]

Group and account events:
```
Person H created group "Group name"
You created group "Group name"
You created this group
Rai Ku added you
Rai Ku added Nabeel Afzal Ku
Shraddha Lpu and Person V were added
You were added
Shauryan Codechef Vit removed Shashwat Codechef Vit
~<U+202F>Reena removed +91 XXXXX XXXXX
You joined using this group's invite link
+91 XXXXX XXXXX joined using this group's invite link
Rai Ku changed this group's icon
You changed the subject from "Group Chat" to "Group Chat XXX"
Person K changed the group description
Person K changed this group's settings to allow only admins to send messages to this group
You're now an admin
You updated the message timer. New messages will disappear from this chat 24 hours after they're sent. Tap to change.
You turned off disappearing messages. Tap to change.
+91 XXXXX XXXXX turned off disappearing messages.
+91 XXXXX XXXXX changed their phone number to a new number. Tap to message or add the new number.
You started a call
Shauryan Codechef Vit started a call
This business works with other companies to manage this chat. Tap to learn more.
This business is now using a secure service from Meta to manage this chat. Tap to learn more.
```
Android group subjects use straight quotes `"`; iOS uses curly `“ ”` (U+201C/U+201D). [BYTES]

### 4.2 Android special bodies that DO have an author [BYTES]

```
27/03/2022, 13:44 - Person K: This message was deleted
27/03/2022, 15:14 - Person L: You deleted this message           ("You" = the exporting user; no trailing period)
5/11/26, 3:00<U+202F>PM - Person V: message text <This message was edited>
27/03/2022, 15:10 - Person K: null                           (view-once media; seen in 5+ files)
16/09/20, 7:38 pm - Person N: Missed video call
10/14/23, 3:26<U+202F>PM - Person U: Missed voice call            (author = the caller)
5/20/26, 5:31<U+202F>PM - Person T: Waiting for this message      (not yet decrypted)
10/12/22, 22:02 - Person R: location: https://maps.google.com/?q=12.9716,77.5946
23/03/2022, 13:33 - Person L: Alex.vcf (file attached)
```
- `<This message was edited>` is appended with one space to the **last line** of the body (it also appears at the end of a continuation line of a multi-line message).
- Venue (place) share is 3 lines:
  ```
  27/03/2022, 21:46 - Person K: Pimlico Gardens
  London, United Kingdom
  https://foursquare.com/v/4e89af95e5fa82ad4c0aa03b
  ```
- Poll:
  ```
  21/11/22, 11:54<U+202F>am - +91 XXXXX XXXXX: POLL:
  Which device is used for diagnostic purposes and for recording?
  OPTION: Low pass filter (0 votes)
  OPTION: Monolithic PLL (0 votes)
  OPTION: Voltage Controlled Oscillator (24 votes)
  OPTION: NOTA (3 votes)
  ```
- Live location, events (`EVENT:`), pinned messages: not seen in samples **[UNVERIFIED]**.

### 4.3 iOS system and special bodies [BYTES]

```
[3/18/22, 14:56:01] Person L: <U+200E>Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
[28/07/24, 9:09:28<U+202F>PM] Group Name: <U+200E>You were added
[10/7/2024, 10:51:03<U+202F>AM] T1: <U+200E>You removed T1                       (author is the affected participant!)
[25/3/2567 BE, 23:16:27] Group Name: <U+200E>You changed the group name to “Group Name”
[25/3/2567 BE, 23:30:41] Group Name: <U+200E>You turned on admin approval to join this group
[3/27/22, 21:54:45] Person L: <U+200E>This message was deleted.             (trailing period on iOS)
[3/27/22, 21:50:54] Person K: <U+200E>You deleted this message.
[3/27/22, 21:56:45] Person K: <U+200E>Location: https://maps.google.com/?q=12.9716,77.5946
[3/27/22, 21:46:03] Person K: Pimlico Gardens (London, United Kingdom): https://foursquare.com/v/4e89af95e5fa82ad4c0aa03b
[4/28/22, 20:17:30] Person L: <U+200E><U+200E>Your security code with Person L changed. <U+200E>Tap to learn more.
[17/12/2025, 3:59:11<U+202F>PM] ~RZ:                                            (empty body, no space after colon, then CRLF; meaning unknown)
```
Hindi iOS: `<U+200E>मैसेजेस और कॉल्स एंड-टू-एंड एन्क्रिप्टेड हैं. इस चैट में शामिल लोगों के अलावा कोई भी इन्हें पढ़ या सुन नहीं सकता, WhatsApp भी नहीं.`, `<U+200E>यह मैसेज डिलीट कर दिया गया है.`, `<U+200E>आपने यह मैसेज डिलीट किया.`, `<U+200E>लोकेशन: https://maps.google.com/?q=...`, `<U+200E><U+200E>Person L के लिए आपका सुरक्षा कोड बदल गया है. <U+200E>ज़्यादा जानने के लिए टैप करें.` [BYTES]

iOS edited marker: **[UNVERIFIED]** (no sample). Expected `<This message was edited>` like Android, possibly preceded by U+200E.

### 4.4 How to tell system lines from user messages

- **Android**: after ` - `, if the rest matches `^(.+?): ` it is *probably* a user message, else system. Known false positive: system text that itself contains `: `, e.g. `You changed the subject from "Group Chat" to "Trip: 2026"` (confirmed: Pustur parses author = `You changed the subject from "Group Chat" to "Trip`). Mitigations: (a) a phrase list of system verbs (`created group`, `changed the subject`, `changed this group's`, `added`, `removed`, `left`, `joined using`, `were added`, `changed their phone number`, `turned on/off disappearing`, `updated the message timer`, `security code`, `is now an admin`/`You're now an admin`, `started a call`, `This business`); (b) an "author" containing `"` or `“` or longer than ~60 chars, or seen only once while other authors repeat, is suspicious. Flag rather than silently decide.
- **iOS**: every record has `author: `. A record is system-ish when the body begins with U+200E **and** the record line does not itself begin with U+200E (line-leading LRM means media/attachment). Deleted and location bodies also start with LRM, so classify them by phrase after the LRM. The "author" of an iOS system notice is the chat name, or even an affected participant, so it must not be shown as the speaker in a court transcript.
- Neither platform has a machine-readable "system" flag. Phrases are localized (and reworded over time), so system detection is a best-effort label; the hash is unaffected.

---

## 5. Multi-line messages and header spoofing

- Continuation lines carry no header; blank lines inside bodies are preserved. [BYTES]
- Real Android and iOS exports from about 35 public GitHub repositories (not linked: they contain real people's messages).
- **Android**: LF everywhere (0 CR in 25 files). A body line shaped exactly like a header is indistinguishable from a real message. whatstk documents this as an authorship-forgery vector:

  > "a participant can put a line inside their own message that has the exact shape of somebody else's header, and the export becomes indistinguishable from one where that other person really spoke."

  Their example (Bob sends one two-line message; line 2 parses as Alice): `28.08.2016, 13:27 - Alice: I confirm I am transferring ownership of the account to Bob`. For a court tool: disclose this limitation in the certificate/transcript, flag records whose timestamp runs backwards or whose author appears nowhere else, and recommend cross-checking against the device.
- Partial look-alikes are handled by a strict header regex: Pustur 2.0.6 fixed "multiline message that contained a datetime" (`2016-04-29 10:30:00` as a body line stays a continuation because it does not match the full header grammar).
- The empty iOS body (`~RZ:` + CRLF) and the Android trailing `<This message was edited>` on a continuation line both mean the parser must not assume `": "` (colon + space) is always present after the author.

---

## 6. File-level details

| Aspect | Android | iOS |
|---|---|---|
| Encoding | UTF-8 [BYTES] | UTF-8 [BYTES] |
| BOM | none in 25 files [BYTES] | none in ~10 files [BYTES] |
| Line endings | LF only; file ends with `\n` [BYTES] | CRLF at end of each record (incl. last), LF inside multi-line bodies [BYTES] |
| Invisible marks | U+202F (am/pm, `~` names); no LRM | U+200E (many), U+202F, U+202A/U+202C + U+00A0 (phone authors) |
| Text file name | `WhatsApp Chat with <chat name>.txt` [BYTES file names; SOURCE footprint-messaging] | `_chat.txt` [BYTES, zip listing] |
| Container | zip holding the `.txt` (+ media at root on with-media), shared via share sheet (2026 build 2.26.37.73 per footprint-messaging) [SOURCE]. Older Android attached the bare `.txt` to an email (2022 FAQ) [SOURCE] | `WhatsApp Chat - <name>.zip` with `_chat.txt` + media at the zip root [BYTES + SOURCE] |
| Localized file names | `Conversa do WhatsApp com`, `Conversa no WhatsApp com`, `Chat de WhatsApp con`, `Discussion WhatsApp avec`, `WhatsApp-Chat mit`, `Chat WhatsApp con`, `WhatsApp-chat met`, `Чат WhatsApp с контактом`, `Chat WhatsApp s uživatelem` [SOURCE + BYTES file names] | always `_chat.txt` inside |

iOS zip entry details (one sample, `whats_json` RU zip) [BYTES]: entry `_chat.txt`, method 8 (deflate), general-purpose flags `0x0808` (bit 3 data descriptor, bit 11 UTF-8 names), "version made by" host 19 (OS X).

Re-export stability:
- Android: two exports of the same chat minutes apart had a byte-identical transcript; the zips differed only in 4 bytes of DOS timestamps. The zip carries no chat id; the display name in the file name is the only handle. [SOURCE: footprint-messaging #3]
- iOS: the same chat exported twice (English vs Hindi app language) shows some timestamps 1 second apart (`14:56:01` vs `14:56:00`, `21:46:03` vs `21:46:02`). [BYTES] So per-message hashes identify *one specific export*, not "the message" in general.

Media filename patterns:
- Android: `IMG-YYYYMMDD-WA####.jpg`, `VID-YYYYMMDD-WA####.mp4`, `PTT-YYYYMMDD-WA####.opus` (voice note), `AUD-YYYYMMDD-WA####.<ext>` (audio file), `STK-YYYYMMDD-WA####.webp`, `DOC-YYYYMMDD-WA####.<ext>` (ext may be empty), optional `(n)` suffix; documents keep original names. [BYTES for IMG/VID/PTT/STK/DOC; AUD and GIF naming from wa-export-pdf table, `GIF-` prefix **[UNVERIFIED]**]. wa-export-pdf regex: `^(?P<kind>IMG|VID|AUD|PTT|STK|DOC|GIF)-\d{8}-WA\d+`.
- iOS: `NNNNNNNN-PHOTO-YYYY-MM-DD-HH-MM-SS.jpg`, `-VIDEO-...mp4`, `-AUDIO-...opus` (voice notes), `-STICKER-...webp`, `-GIF-...mp4`, `NNNNNNNN-<original name>` for documents and `.vcf`. [BYTES] wa-export-pdf regex: `^\d+-(?P<kind>PHOTO|VIDEO|AUDIO|STICKER|GIF|CONTACT|DOCUMENT)-`.

---

## 7. Open-source parsers

### 7.1 Pustur/whatsapp-chat-parser (npm `whatsapp-chat-parser`, v4.0.2, 2024-09-21, MIT)

Source: https://github.com/Pustur/whatsapp-chat-parser/blob/master/src/parser.ts (verbatim):

```ts
const sharedRegex =
  /^(?:\u200E|\u200F)*\[?(\d{1,4}[-/.]\s?\d{1,4}[-/.]\s?\d{1,4})[,.]?\s\D*?(\d{1,2}[.:]\d{1,2}(?:[.:]\d{1,2})?)(?:\s([ap]\.?\s?m\.?))?\]?(?:\s-|:)?\s/;
const authorAndMessageRegex = /(.+?):\s([^]*)/;
const messageRegex = /([^]+)/;
const regexParser = new RegExp(
  sharedRegex.source + authorAndMessageRegex.source,
  'i',
);
const regexParserSystem = new RegExp(
  sharedRegex.source + messageRegex.source,
  'i',
);
const regexAttachment =
  /^(?:\u200E|\u200F)*(?:<.+:(.+)>|([\w-]+\.\w+)\s[(<].+[)>])/;
```

`src/index.ts`: `const newlinesRegex = /(?:\r\n|\r|\n)/;` then `string.split(newlinesRegex)` (so CRLF information is discarded).

`makeArrayOfMessages`: a line matching `regexParser` starts a user message; else if it matches `regexParserSystem` it starts a system message; else it is appended to the previous message with `\n`.

`src/time.ts`:
```ts
const regexSplitTime = /[:.]/;
function convertTime12to24(time: string, ampm: string): string {
  let [hours, minutes, seconds] = time.split(regexSplitTime);
  if (hours === '12') hours = '00';
  if (ampm === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${hours}:${minutes}${seconds ? `:${seconds}` : ''}`;
}
function normalizeAMPM(ampm: string): string {
  return ampm.replace(/[^apm]/gi, '').toUpperCase();
}
```

Notes on why it works for NNBSP: the `\s` before `([ap]\.?\s?m\.?)` matches U+202F and U+00A0 in JS (fixed in 3.1.2 for NBSP, #224; 3.2.3 for U+202F, #248). U+200E/U+200F are only skipped at the very start of the line.

Its test fixtures (verbatim, from `tests/parser.test.ts`), useful as regression cases:
```
'3/6/18, 1:55 p.m. - a: m'
'03-06-2018, 01.55 PM - a: m'
'13.06.18 21.25.15: a: m'
'[06.13.18 21:25:15] a: m'
'13.6.2018 klo 21.25.15 - a: m'
'13. 6. 2018. 21:25:15 a: m'
'[3/6/18 1:55:00 p. m.] a: m'
'\u200E[3/6/18 1:55:00 p. m.] a: m'
'[2018/06/13, 21:25:15] a: m'
'[06/2018/13, 21:25:15] a: m'
'3/6/2018 1:55 p.\u00A0m. - a: m'
'3/6/18, 1:55\u202FPM - a: m'
'3/6/18, 1:55 p.m. - a: < attached: 00000042-PHOTO-2020-06-07-15-13-20.jpg >'
'3/6/18, 1:55 p.m. - a: IMG-20210428-WA0001.jpg (file attached)'
'3/6/18, 1:55 p.m. - a: 2015-08-04-PHOTO-00004762.jpg <\u200Eattached>'
'3/6/18, 1:55 p.m. - a: \u200E4f2680f1db95a8454775cc2eefc95bfc.jpg (Datei angehängt)\nDir auch frohe Ostern.'
```

**Failure modes I confirmed by running Pustur's regexes on real lines** (Node, scratch script):

| Real line | Pustur result | Correct |
|---|---|---|
| `11/01/2023, 16:14 - You changed the subject from "Group Chat" to "Trip: 2026"` | USER, author `You changed the subject from "Group Chat" to "Trip` | system |
| `[17/12/2025, 3:59:11<U+202F>PM] ~RZ:` | SYSTEM, body `~RZ:` | user `~RZ`, empty body |
| `[28/07/24, ...PM] <U+202A>+91<U+00A0>XXXXX<U+00A0>XXXXX<U+202C>: <U+200E>... created this group` | USER, author keeps LRE/PDF chars | system; author cleaned for display |
| `<U+200E>[3/27/22, 21:50:09] Person K: Some file.txt <U+200E><attached: 00000046-Some file.txt>` | no attachment found (regex anchored at `^`) | attachment `00000046-Some file.txt` |
| `... Person S: பசுமை பெயர் Contact.vcf (file attached)` | no attachment (`[\w-]+` excludes spaces/Tamil) | attachment |
| `... Person S: DOC-20240415-WA0020. (file attached)` | no attachment (needs `\.\w+`) | attachment |
| body line `28/08/2016, 13:27 - Alice: I confirm` | new message by Alice | unknowable on Android; continuation on iOS if preceded by bare LF |

Other gaps: author strings keep trailing spaces (`Person E `), no system-phrase list, CRLF discarded, `daysFirst` inference fooled by the out-of-order first line.

### 7.2 whatstk (Python, lucasrodes/whatstk, main branch)

- `whatstk/whatsapp/assets/header_format_support.json`: 96 hformats, the cross product of `{%y,%d,%m orders} x {-,/,.} x {12h,24h} x {with/without seconds} x {Android ", ... - %name:" , iOS "[... ] %name:"}`. Shapes (X = a date/time code):
  `X/X/X, X:X - %name:`, `X/X/X, X:X X - %name:`, `X/X/X, X:X:X - %name:`, `X/X/X, X:X:X X - %name:`, `[X/X/X X:X] %name:`, `[X/X/X X:X X] %name:`, `[X/X/X X:X:X] %name:`, `[X/X/X X:X:X X] %name:` (and the same with `-` and `.`). Note its iOS shapes have **no comma** after the date; modern iOS has `[dd/MM/yy, h:mm:ss AM]`, which works because whatstk's auto-detector derives the template from the actual line.
- Regex building blocks (`whatstk/whatsapp/parser.py`, verbatim):
  ```python
  regex_simplifier = {
      "%Y": r"(?P<year>\d{2,4})",
      "%y": r"(?P<year>\d{2,4})",
      "%m": r"(?P<month>\d{1,2})",
      "%d": r"(?P<day>\d{1,2})",
      "%H": r"(?P<hour>\d{1,2})",
      "%I": r"(?P<hour>\d{1,2})",
      "%M": r"(?P<minutes>\d{2})",
      "%S": r"(?P<seconds>\d{2})",
      "%P": r"(?P<ampm>[AaPp]\.?\s?[Mm].?)",
      "%p": r"(?P<ampm>[AaPp]\.?\s?[Mm]\.?)",
      "%name": rf"(?P<{COLNAMES_DF.USERNAME}>[^:]*)",
  }
  ```
  Example: `generate_regex('%y-%m-%d, %H:%M:%S - %name:')` gives `(?P<year>\d{2,4})\-(?P<month>\d{1,2})\-(?P<day>\d{1,2}),\ (?P<hour>\d{1,2}):(?P<minutes>\d{2}):(?P<seconds>\d{2})\ \-\ (?P<username>[^:]*): `
- Pre-clean (`_clean_text`): removes U+200B, U+202A, U+202B, U+202C, U+202D, U+202E, U+200E, U+200F, U+00AD; keeps U+200D and U+200C; then `unicodedata.normalize("NFKC", text)` so U+202F becomes a space. (Fine for analysis, **not** for hashing.)
- Splitting: `re.finditer(regex, text)` over the whole text; a message runs from one header to the next.
- Day/month inference: `_score_date_order` (section 2.2).
- Limitations doc ("What whatstk cannot tell you"): authorship cannot be verified; auto-detection can pick the wrong day/month order; system messages are not reliably identified.

### 7.3 dfelix/wa-export-pdf (Python) `parser/formats.py` (verbatim excerpts)

```python
BIDI_MARKS = "\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069\uFEFF"
_SP = r"[ \xa0\u202F\u2009]"
_DATE = r"(?P<date>\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4})"
_AMPM = (
    r"(?P<ampm>[AaPp]\.?" + _SP + r"?[Mm]\.?"
    r"|午前|午後|上午|下午|오전|오후|ص|م)"
)
_TIME = r"(?P<time>\d{1,2}[:.]\d{2}(?:[:.]\d{2})?)(?:" + _SP + r"?" + _AMPM + r")?"
ANDROID_HEADER = re.compile(
    r"^[" + BIDI_MARKS + r"]*" + _DATE + r",?" + _SP + r"+(?:\xe0s" + _SP + r"+|um" + _SP + r"+)?"
    + _TIME + _SP + r"+[-\u2013]" + _SP + r"+(?P<rest>.*)$"
)
IOS_HEADER = re.compile(
    r"^[" + BIDI_MARKS + r"]*\[" + _DATE + r",?" + _SP + r"+" + _TIME + r"\]" + _SP + r"*(?P<rest>.*)$"
)
SENDER_SPLIT = re.compile(r"^(?P<sender>[^\n]{1,120}?):" + _SP + r"(?P<text>.*)$", re.S)
SENDER_SPLIT_EMPTY = re.compile(r"^(?P<sender>[^\n:]{1,120}):$")
ANDROID_ATTACHMENT = re.compile(
    r"^(?P<file>[^\n]+?)" + _SP + r"\((?:" + "|".join(map(re.escape, _ATTACHED_ANDROID)) + r")\)$", re.I)
IOS_ATTACHMENT = re.compile(
    r"^<(?:" + "|".join(map(re.escape, _ATTACHED_IOS)) + r")" + _SP + r"?:" + _SP + r"*(?P<file>[^<>\n]+)>$", re.I)
EDITED_SUFFIX = re.compile(r"\s*<(?:This message was edited|Esta mensagem foi editada|...)>\s*$", re.I)
POLL_HEADER = re.compile(r"^(?:POLL|SONDAGEM|ENQUETE|ENCUESTA|SONDAGE|UMFRAGE|SONDAGGIO|PEILING):\s*$", re.I)
```
Its localized tables (attachments, omitted placeholders, deleted markers, call markers, system phrases) are a good starting dictionary but have no Indian languages.

### 7.4 zTheJoker/chats-analyzer (TS) `src/lib/parser.ts`

Android header (verbatim, the dash class written here with escapes): `/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),? (\d{1,2}):(\d{2})(?::(\d{2}))?(?: ?([AaPp])\.? ?[Mm]\.?)? [-\u2013\u2014] (.*)$/` applied after replacing `[\u00A0\u2007\u202F]` with a space and stripping leading `[\u200E\u200F\uFEFF]`. It notes iOS document form `"report.docx • 3 pages  \u200Edocument omitted"` and caption form `"the caption  \u200Eimage omitted"`.

---

## 8. Export limits, current options, and Indian law

### 8.1 Limits

- Official WhatsApp Android FAQ, archived 2022-01-08 (http://web.archive.org/web/20220108045436/https://faq.whatsapp.com/android/chats/how-to-save-your-chat-history), verbatim: "If you choose to attach media, the most recent media sent will be added as attachments." / "When exporting with media, you can send up to 10,000 latest messages. Without media, you can send 40,000 messages. These constraints are due to maximum email sizes." / "An email will be composed with your chat history attached as a .txt document." [SOURCE, verified]
- Current FAQ (rendered in a browser on 2026-10-29, https://faq.whatsapp.com/1180414079177245/) **no longer states any message limit**:
  - Android: "Tap Without media or Include media." ... "If you choose Include media, the most recent media sent will be added as attachments to be sent from your sharesheet."
  - iOS: "If the chat contains media, choose With all media, With selected media…, or Without media." ... "Your chat history will be exported as a ZIP file." "View once messages will not be exported."
  - Web/Windows/Mac (new): "Select All messages or Custom date range." "Your chat history will be exported as a ZIP file." "Media isn't included, unlike exporting chats on your mobile device." "View once and disappearing messages won't be exported."
  - All: "Your chat history can't be re-imported because it's a text file and not a backup file."
- Whether the 10,000 / 40,000 truncation still happens: **[UNVERIFIED]**. Third-party guides still repeat it; footprint-messaging notes it was dropped from the Help Center with no replacement. Practical advice: tell users the export may silently start mid-history; record the first and last timestamps on the transcript.
- The Web/Desktop export text format: **[UNVERIFIED]**, no sample found. Expect it may differ from both Android and iOS; detect and flag unknown header shapes rather than mis-parse.

### 8.2 India: export as an "electronic record"

(Not legal advice; verify the Gazette text.)
- The Bharatiya Sakshya Adhiniyam, 2023 (BSA) replaced the Indian Evidence Act, 1872 on 1 July 2024; Section 63 replaces old Section 65B. [SOURCE: innefu, iPleaders]
- Section 63(4) requires a certificate in the Schedule, Part A (by the party) and Part B (by an expert). Both parts contain, verbatim: "I state that the HASH value/s of the electronic/digital record/s is" / "☐ SHA1: ☐ SHA256: ☐ MD5: ☐ Other" / "(Legally acceptable standard) (Hash report to be enclosed with the certificate)". Part A also asks for device make, model, serial, IMEI/UIN/UID/MAC/Cloud ID, and date/time "(IST, 24-hour format)". [SOURCE: AdvocateKhoj bare act]
- Supreme Court, *Pune Bar Association v. Union of India*, 2026 SCC OnLine SC 1297 (22 May 2026, Surya Kant CJ, Joymalya Bagchi and Vipul M. Pancholi JJ): upheld s.63(4) and the Schedule; "hash value of an electronic data is synonymous with an electronic fingerprint"; expert certification adds "an additional layer of authenticity"; the Madras HC view that only s.79-A notified examiners may sign Part B "shall not be treated as a binding precedent". [SOURCE: SCC Online blog 2026-07-08]
- Earlier law still cited: *Anvar P.V. v. P.K. Basheer* (2014) and *Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal* (2020, 3 judges): certificate is a condition precedent for secondary electronic evidence; oral evidence cannot replace it; not needed if the original device is produced. [SOURCE: innefu]
- Commentary (indianlawlive.net) argues the Schedule mandates hashing the original record; hashing the copy is good practice. [SOURCE, commentary]
- Implication for the tool: output SHA-256 (listed in the Schedule) for (1) the zip exactly as received, (2) the extracted chat `.txt`, (3) each media file, and (4) each message record; label the algorithm explicitly; put per-message hashes in a "hash report" annex.

---

## 9. Recommended approach for your TypeScript parser

### 9.1 Bytes and records

1. Read the zip with a library that gives raw entry bytes (e.g. fflate / zip.js). Pick the chat file: `_chat.txt`, else a single `*.txt` at the root whose first lines match a header.
2. Keep `bytes: Uint8Array` untouched. Decode with `new TextDecoder('utf-8', { fatal: true })` to detect corruption; if it throws, report rather than replace characters.
3. Optional BOM (EF BB BF): exclude from record 1 or treat as file preamble, but hash it in the whole-file hash.
4. Platform detection: first non-empty line starts with optional U+200E then `[` => iOS; else Android-like.
5. Record boundaries:
   - iOS with CR present: a record ends at each `\r\n`; header match is only attempted at positions immediately after `\r\n` (or file start). Internal `\n` never starts a record.
   - Android (or iOS without CR): a record starts at a line start (after `\n`) whose line matches the header regex; flag the file "authorship of header-shaped body lines cannot be verified".
6. Per-record hash input: the exact byte slice from the record's first byte (including a leading U+200E) to the byte before the next record's first byte, i.e. **including** its line terminator. Then the concatenation of all record slices equals the file byte-for-byte, which you can assert, and the transcript can state "records 1..N cover bytes 0..L of `_chat.txt` with no gaps".
7. Map char offsets to byte offsets by scanning bytes for `0x0A` line starts and decoding line by line, so you never re-encode.

### 9.2 Header regexes (apply to a decoded line; JS, `u` flag)

```ts
// spaces WhatsApp uses: SPACE, NBSP, NNBSP (thin space U+2009 kept for safety)
const SP = '[ \\u00A0\\u202F\\u2009]';
const AMPM = `(?<ampm>[AaPp]\\.?${SP}?[Mm]\\.?)`;
const DATE = '(?<d1>\\d{1,4})(?<sep>[/.\\-])(?<d2>\\d{1,2})\\k<sep>(?<d3>\\d{1,4})';

// Android: "27/08/23, 9:34<NNBSP>pm - " / "16/11/2021, 13:49 - "
export const ANDROID_HEADER = new RegExp(
  `^${DATE},?${SP}(?<time>\\d{1,2}[:.]\\d{2})(?:${SP}?${AMPM})?${SP}[-\\u2013]${SP}`,
  'u',
);

// iOS: "[28/07/24, 9:09:28<NNBSP>PM] " (optional leading LRM, optional " BE" era)
export const IOS_HEADER = new RegExp(
  `^(?<lrm>\\u200E?)\\[${DATE}(?:${SP}[A-Z]{1,3})?,?${SP}(?<time>\\d{1,2}[:.]\\d{2}[:.]\\d{2})(?:${SP}${AMPM})?\\]${SP}`,
  'u',
);

// After the header. Author: shortest run up to ": " or ":" at end of line.
// Keep the raw author string for the record; derive a display name by stripping
// U+200E, U+200F, U+202A-U+202E, U+2066-U+2069 and trimming.
export const AUTHOR_SPLIT = /^(?<author>[^\n]{1,120}?):(?: |$)/u;
```

Then normalize digits only for *parsing* (Devanagari U+0966-096F, Bengali U+09E6-09EF, Arabic-Indic U+0660-0669, Extended U+06F0-06F9 to ASCII) if you want to support native-digit locales; extend the date/time patterns with `\p{Nd}` when doing so. Day-period words (`in the afternoon`, `nachm.`, Chinese/Korean prefixes) are not covered by the above: treat an unmatched-but-date-starting line as "unknown header shape" and stop with a clear error instead of folding it into the previous message.

Tested (Node 24, extracted verbatim from this file) against: `27/08/23, 9:34<U+202F>pm - Person A: hello` (author Person A), `4/6/26, 1:57<U+202F>PM - You created this group` (no author, so system), `17/07/2024, 15:35 - ~<U+202F>Person C ... created group ...` (system), `3/6/2018 1:55 p.<U+00A0>m. - a: m`, the iOS phone-author line with LRE/PDF, `<U+200E>[07/02/25, 8:52:51<U+202F>PM] Person M: ...`, `[25/3/2567 BE, 23:15:34] ...`, `[17/12/2025, 3:59:11<U+202F>PM] ~RZ:` (author `~RZ`, empty body), and the continuation lines `2016-04-29 10:30:00` and plain text (no header). All matched as intended.

### 9.3 Body classification (after header and author split)

```ts
const LRM = '\u200E';
// Android with-media attachment (whole first body line); allow spaces, Unicode, empty ext
const ANDROID_ATTACHED = /^(?<file>.+?\.[^\s.()]*)\s\((?:file attached|Datei angehängt|archivo adjunto|arquivo anexado|ficheiro anexado|fichier joint|file allegato|bestand bijgevoegd|dosya ekli|plik załączony|файл прикреплен|файл прикріплено)\)$/u;
// iOS attachment anywhere in the first body line (also old "< attached: x.jpg >")
const IOS_ATTACHED = /\u200E?<\s?(?:attached|adjunto|anexado|Anhang|adjunt|pièce jointe|allegato|bijlage|załącznik|вложение)\s?:\s?(?<file>[^<>\n]+?)\s?>/u;
const ANDROID_MEDIA_OMITTED = /^<Media omitted>$/u;              // plus localized list
const IOS_OMITTED = /\u200E(?:image|video|audio|sticker|GIF|document|Contact card) omitted$/u; // plus Hindi list in 3.4
const DELETED = /^\u200E?(?:This message was deleted|You deleted this message)\.?$/u;
const EDITED_SUFFIX = / ?\u200E?<This message was edited>$/u;   // check on the LAST line of the body
const VIEW_ONCE_ANDROID = /^null$/u;
const LOCATION = /^\u200E?(?:location|Location|लोकेशन): (?<url>https:\/\/maps\.google\.com\/\?q=(?<lat>-?\d+(?:\.\d+)?),(?<lon>-?\d+(?:\.\d+)?))$/u;
const POLL = /^POLL:$/u;  // following lines: question, then "OPTION: <text> (<n> votes)"
const CALL = /^(?:Missed voice call|Missed video call|Voice call|Video call)$/u;
const PENDING = /^Waiting for this message$/u;
```
These are classification labels only; the hash always covers the raw record bytes regardless of label.

### 9.4 What to print on the transcript per record

Ordinal, platform, raw timestamp string as written (plus the parsed value and the day/month order used), raw author string and cleaned display name, type label (text / system / attachment / omitted / deleted / edited / view-once / poll / location / call), attachment filename and whether the file was present in the zip (with its own SHA-256), byte offset and length, and SHA-256 of the record bytes. Also print file-level SHA-256 of the zip and the `.txt`, the export platform evidence (CRLF/LRM pattern), and the limitations (Android header spoofing, possible export truncation, local time without zone, view-once/disappearing not exported).

---

## 10. Unverified / open items

1. Exact Android OS / ICU version that first emitted U+202F. Evidence: present in an en-US Android export by 2023-02-09 (Pustur #248) and in an en-IN export committed 2023-04-13; absent in exports from 2022. footprint-messaging attributes it to the CLDR 42 change (CLDR-14032). Older devices still emit U+0020, so accept both.
2. Exact iOS version that introduced U+202F (all 2024-2025 iOS 12h samples have it; 2022 iOS samples were 24h). Likely iOS 17 era, unconfirmed.
3. Android with Hindi (hi-IN) app language: timestamp pattern, `<Media omitted>` translation, `(file attached)` translation, system phrases. Other parsers' guesses conflict. Need a real sample.
4. Native digits (Marathi, Bengali, etc.) in Android timestamps: plausible, unconfirmed.
5. iOS `<This message was edited>` exact form; iOS caption placement with `image omitted` and `<attached: ...>`.
6. Android `GIF-` / `AUD-` filename prefixes (only seen in a third-party table).
7. Whether the 10,000 / 40,000 message caps still apply in 2026 builds.
8. Text format of the new Web/Windows/Mac export (ZIP, date-range option).
9. Meaning of the empty-body iOS record (`~RZ:`), and of `null` beyond view-once (also possibly polls/events on some builds).
10. Android without-media export dropping captions: seen in one controlled 2022 pair only.
11. Whether any WhatsApp build writes a BOM: none observed; tolerate it.

---

## Sources

Parsers and code:
- Pustur/whatsapp-chat-parser: https://github.com/Pustur/whatsapp-chat-parser (src/parser.ts, src/date.ts, src/time.ts, src/index.ts, tests/parser.test.ts, CHANGELOG.md)
- Pustur issues: #248 U+202F https://github.com/Pustur/whatsapp-chat-parser/issues/248 ; #224 NBSP https://github.com/Pustur/whatsapp-chat-parser/issues/224 ; #231 attachment format https://github.com/Pustur/whatsapp-chat-parser/issues/231 ; #260 attachment names and timezone https://github.com/Pustur/whatsapp-chat-parser/issues/260 ; #237 date sorting https://github.com/Pustur/whatsapp-chat-parser/issues/237
- whatstk: https://github.com/lucasrodes/whatstk (whatstk/whatsapp/parser.py, auto_header.py, hformat.py, assets/header_format_support.json, docs/source/getting_started/limitations.rst, hformat.rst, export_chat.rst); issue #172 NFKC https://github.com/lucasrodes/whatstk/issues/172
- dfelix/wa-export-pdf: https://github.com/dfelix/wa-export-pdf (src/wa_export_pdf/parser/formats.py, media/types.py, parser/discovery.py)
- zTheJoker/chats-analyzer: https://github.com/zTheJoker/chats-analyzer/blob/77a32c679545d94699cca4ff4c73f011b208b340/src/lib/parser.ts
- SwarajG/whatsapp-data-extracter: https://github.com/SwarajG/whatsapp-data-extracter/blob/9b12574e29a2b171e6d9729bee4b35e32df87914/src/parser/mediaLinker.ts
- rwxce/memory-archive PR #6 (format fixtures, tie-break): https://github.com/rwxce/memory-archive/pull/6
- SoongGuanLeong/footprint-messaging issue #3 (Android 16 emulator findings, CLDR 42, zip stability): https://github.com/SoongGuanLeong/footprint-messaging/issues/3
- threadrecap format list: https://www.threadrecap.com/en/blog/whatsapp-export-timestamp-formats

Real export files analysed byte-by-byte (raw.githubusercontent.com at the listed commits):
- Controlled corpus: https://github.com/starkdmi/whats_json/tree/760b3a0a063f8e576156e72f5807c6ab283e0943/test/data (english_android.txt, english_android_media.txt, english_ios.txt, english_ios_media.txt, hindi_ios.txt, ios/iOS Hindi.txt, android/WhatsApp Chat with Group Chat XXX Android.txt, ios/WhatsApp Chat - Person L (RU).zip, example/_chat.txt)
- Real Android and iOS exports from about 35 public GitHub repositories (not linked: they contain real people's messages).

Official WhatsApp:
- Current FAQ (rendered 2026-10-29): https://faq.whatsapp.com/1180414079177245/ (Android, iOS, Web tabs)
- 2022 Android FAQ (Wayback): http://web.archive.org/web/20220108045436/https://faq.whatsapp.com/android/chats/how-to-save-your-chat-history

Indian law:
- SCC Online on Pune Bar Association v. Union of India, 2026 SCC OnLine SC 1297: https://www.scconline.com/blog/post/2026/07/08/sc-upholds-admissibility-of-electronic-evidence-under-section-63-4-bsa/
- BSA 2023 Schedule text: https://www.advocatekhoj.com/library/bareacts/bharatiyaaakshya2023/b.php
- Section 63 BSA certificate guide: https://innefu.com/section-63-bsa-certificate-guide/
- iPleaders, electronic evidence under BSA: https://blog.ipleaders.in/electronic-evidence-under-the-bsa-2023/
- Commentary on hashing original vs copy: https://indianlawlive.net/2025/06/29/sakshya-adhiniyam-doesnt-mandate-hashing-copy-pen-drive-or-cd-produced-it-mandates-hashing-original-only/
- LiveLaw report: https://www.livelaw.in/amp/top-stories/supreme-court-rejects-challenge-to-s634-bsa-mandating-hash-value-disclosure-for-electronic-evidence-535950
