// Text of THE SCHEDULE to the Bharatiya Sakshya Adhiniyam, 2023 [see s.63(4)(c)].
//
// Source: Gazette of India Extraordinary, Part II Sec. 1, No. 55, 25 Dec 2023
// (CG-DL-E-25122023-250882), pp. 46-47, checked against page images.
// See docs/research/legal.md for the full verbatim text and provenance.
//
// The statutory wording below is quoted verbatim, including the Gazette's own
// ":—" punctuation. Do not "improve" it: the certificate must track the form.
//
// Both PART A and PART B carry the hash block. Only PART A carries the
// "lawful control" paragraph and the Owned/Maintained/Managed/Operated line.

export const SCHEDULE_SOURCE =
  "Bharatiya Sakshya Adhiniyam, 2023 (Act 47 of 2023), THE SCHEDULE [See section 63(4)(c)], " +
  "as published in the Gazette of India Extraordinary, Part II, Section 1, No. 55 dated 25.12.2023.";

export const SCHEDULE_HEADING = "THE SCHEDULE";
export const SCHEDULE_SUBHEADING = "[See section 63(4)(c)]";
export const CERTIFICATE_TITLE = "CERTIFICATE";

export const PART_A_TITLE = "PART A";
export const PART_A_SUBTITLE = "(To be filled by the Party)";
export const PART_B_TITLE = "PART B";
export const PART_B_SUBTITLE = "(To be filled by the Expert)";

/** Opening: "I, ___ (Name), Son/daughter/spouse of ___ residing/employed at ___ do hereby ..." */
export const DEPONENT_LINE = {
  i: "I,",
  name: "(Name), Son/daughter/spouse of",
  residing: "residing/employed at",
  affirm: "do hereby solemnly affirm and sincerely state and submit as follows:—",
} as const;

export const PART_A_SOURCE_INTRO =
  "I have produced electronic record/output of the digital record taken from the following device/digital record source (tick mark):—";

export const PART_B_SOURCE_INTRO =
  "The produced electronic record/output of the digital record are obtained from the following device/digital record source (tick mark):—";

/** Tick-box labels in the order printed in the Schedule. */
export const SOURCE_BOXES = [
  { key: "computer", label: "Computer / Storage Media" },
  { key: "dvr", label: "DVR" },
  { key: "mobile", label: "Mobile" },
  { key: "flash", label: "Flash Drive" },
  { key: "cd", label: "CD/DVD" },
  { key: "server", label: "Server" },
  { key: "cloud", label: "Cloud" },
  { key: "other", label: "Other" },
] as const;

export type SourceKind = (typeof SOURCE_BOXES)[number]["key"];

export const DEVICE_FIELDS = {
  other: "Other:",
  makeModel: "Make & Model:",
  color: "Color:",
  serial: "Serial Number:",
  identifiers: "IMEI/UIN/UID/MAC/Cloud ID",
  identifiersSuffix: "(as applicable)",
  otherInfo: "and any other relevant information, if any, about the device/digital record",
  otherInfoSuffix: "(specify).",
} as const;

export const PART_A_LAWFUL_CONTROL =
  "The digital device or the digital record source was under the lawful control for regularly creating, storing or " +
  "processing information for the purposes of carrying out regular activities and during this period, the computer " +
  "or the communication device was working properly and the relevant information was regularly fed into the computer " +
  "during the ordinary course of business. If the computer/digital device at any point of time was not working " +
  "properly or out of operation, then it has not affected the electronic/digital record or its accuracy. The digital " +
  "device or the source of the digital record is:—";

export const RELATION_BOXES = [
  { key: "owned", label: "Owned" },
  { key: "maintained", label: "Maintained" },
  { key: "managed", label: "Managed" },
  { key: "operated", label: "Operated" },
] as const;

export type RelationKey = (typeof RELATION_BOXES)[number]["key"];

export const RELATION_SUFFIX = "by me (select as applicable).";

export const HASH_LINE = {
  before: "I state that the HASH value/s of the electronic/digital record/s is",
  after: "obtained through the following algorithm:—",
} as const;

export const HASH_BOXES = [
  { key: "sha1", label: "SHA1:" },
  { key: "sha256", label: "SHA256:" },
  { key: "md5", label: "MD5:" },
  { key: "other", label: "Other" },
] as const;

export const HASH_OTHER_SUFFIX = "(Legally acceptable standard)";
export const HASH_REPORT_NOTE = "(Hash report to be enclosed with the certificate)";

export const SIGNATURE_CAPTION_A = "(Name and signature)";
export const SIGNATURE_CAPTION_B = "(Name, designation and signature)";

export const DATE_LINE = "Date (DD/MM/YYYY):";
export const TIME_LINE = { before: "Time (IST):", after: "hours (In 24 hours format)" } as const;
export const PLACE_LINE = "Place:";

/** Section 63(4), quoted for the explanatory page. */
export const SECTION_63_4 =
  "(4) In any proceeding where it is desired to give a statement in evidence by virtue of this section, a certificate " +
  "doing any of the following things shall be submitted along with the electronic record at each instance where it is " +
  "being submitted for admission, namely:— (a) identifying the electronic record containing the statement and " +
  "describing the manner in which it was produced; (b) giving such particulars of any device involved in the " +
  "production of that electronic record as may be appropriate for the purpose of showing that the electronic record " +
  "was produced by a computer or a communication device referred to in clauses (a) to (e) of sub-section (3); " +
  "(c) dealing with any of the matters to which the conditions mentioned in sub-section (2) relate, and purporting to " +
  "be signed by a person in charge of the computer or communication device or the management of the relevant " +
  "activities (whichever is appropriate) and an expert shall be evidence of any matter stated in the certificate; and " +
  "for the purposes of this sub-section it shall be sufficient for a matter to be stated to the best of the knowledge " +
  "and belief of the person stating it in the certificate specified in the Schedule.";
