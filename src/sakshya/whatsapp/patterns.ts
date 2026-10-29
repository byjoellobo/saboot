// Regular expressions for WhatsApp "Export chat" text files.
// Derived from real Android and iOS exports (see docs/research/whatsapp.md)
// and the open-source parsers whatsapp-chat-parser (MIT) and whatstk.

/** Spaces WhatsApp uses between fields: SPACE, NBSP, NARROW NBSP (U+202F, newer builds), THIN SPACE. */
const SP = "[ \\u00A0\\u202F\\u2009]";
const AMPM = `(?<ampm>[AaPp]\\.?${SP}?[Mm]\\.?)`;
const DATE = "(?<d1>\\d{1,4})(?<sep>[/.\\-])(?<d2>\\d{1,2})\\k<sep>(?<d3>\\d{1,4})";

/** Android: "27/08/23, 9:34<U+202F>pm - " or "16/11/2021, 13:49 - " */
export const ANDROID_HEADER = new RegExp(
  `^${DATE},?${SP}(?<time>\\d{1,2}[:.]\\d{2})(?:${SP}?${AMPM})?${SP}[-\\u2013]${SP}`,
  "u",
);

/** iOS: "[28/07/24, 9:09:28<U+202F>PM] " with optional leading U+200E and optional era (" BE"). */
export const IOS_HEADER = new RegExp(
  `^(?<lrm>\\u200E?)\\[${DATE}(?:${SP}[A-Z]{1,3})?,?${SP}(?<time>\\d{1,2}[:.]\\d{2}[:.]\\d{2})(?:${SP}${AMPM})?\\]${SP}`,
  "u",
);

/** Author is the shortest run up to ": " (or ":" at end of line, seen on iOS empty messages). */
export const AUTHOR_SPLIT = /^(?<author>[^\n]{1,120}?):(?: |$)/u;

export const INVISIBLE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/gu;

const ATTACH_WORDS = [
  "file attached",
  "Datei angehängt",
  "archivo adjunto",
  "arquivo anexado",
  "ficheiro anexado",
  "fichier joint",
  "file allegato",
  "bestand bijgevoegd",
  "dosya ekli",
  "plik załączony",
  "файл прикреплен",
  "файл прикріплено",
].join("|");

/** Android with-media attachment line: "IMG-20240115-WA0003.jpg (file attached)". */
export const ANDROID_ATTACHED = new RegExp(`^(?<file>.+?\\.[^\\s.()]*)\\s\\((?:${ATTACH_WORDS})\\)$`, "u");

/** iOS attachment marker anywhere in the first body line: "<attached: 00000035-PHOTO-...jpg>". */
export const IOS_ATTACHED =
  /\u200E?<\s?(?:attached|adjunto|anexado|Anhang|adjunt|pièce jointe|allegato|bijlage|załącznik|вложение)\s?:\s?(?<file>[^<>\n]+?)\s?>/u;

export const ANDROID_MEDIA_OMITTED = /^<(?:Media omitted|Multimedia omitido|Mídia oculta|Médias omis|Medien ausgeschlossen|मीडिया हटाया गया|मीडिया छोड़ा गया)>$/u;

export const IOS_OMITTED = new RegExp(
  "\\u200E(?:image|video|audio|sticker|GIF|document|Contact card) omitted$|" +
    "\\u200E?(?:फ़ोटो हटाई गई|वीडियो छोड़ा गया|ऑडियो हटाई गयी|स्टिकर छोड़ा गया|GIF छोड़ा गया|कॉन्टैक्ट कार्ड छोड़ा गया|डॉक्यूमेंट छोड़ा गया)$",
  "u",
);

export const DELETED = /^\u200E?(?:This message was deleted|You deleted this message|यह मैसेज डिलीट कर दिया गया है|आपने यह मैसेज डिलीट किया)\.?$/u;
export const EDITED_SUFFIX = / ?\u200E?<This message was edited>$/u;
export const VIEW_ONCE = /^null$/u;
export const LOCATION = /^\u200E?(?:location|Location|लोकेशन): (?<url>https?:\/\/\S+)$/u;
export const POLL = /^POLL:$/u;
export const CALL = /^(?:Missed voice call|Missed video call|Voice call|Video call|Missed group voice call|Missed group video call)$/u;
export const PENDING = /^Waiting for this message\.?$/u;

/** Phrases that mark an Android line as a system notice even if it contains ": ". */
export const SYSTEM_PHRASES =
  /\b(?:created group|created this group|changed the subject|changed the group name|changed the group icon|changed this group's icon|changed the group settings|changed the settings|turned on admin approval|turned off admin approval|requested to join|approved|reset this group's invite link|changed this group's|changed the group description|added|removed|left|joined using|were added|was added|changed their phone number|changed to|turned on disappearing|turned off disappearing|updated the message timer|security code|now an admin|started a call|deleted this group|pinned a message|This business|Messages and calls are end-to-end encrypted|Messages to this group are now secured)\b/u;

export const ENCRYPTION_NOTICE = /end-to-end encrypt|एंड-टू-एंड एन्क्रिप्टेड/u;
