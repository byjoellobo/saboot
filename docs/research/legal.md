# Saboot: legal research findings (BSA s.63(4) certificate)

Research date: 2026-10-29. Prepared for tool design only. Not legal advice.

## Verification legend

- **[PRIMARY-VERIFIED]**: read from the official Gazette PDF or the signed court order PDF, text extracted with pdftotext AND checked against a rendered page image.
- **[PRIMARY-TEXT]**: read from a primary document's text layer (not image-checked).
- **[SECONDARY]**: from a law report / news / commentary; quoted words are the outlet's, not necessarily the court's.
- **[UNVERIFIED]**: lead only; could not open the judgment.

## Source note on the statute

- India Code (`https://www.indiacode.nic.in/bitstream/123456789/20063/1/aa202347.pdf`) returned HTTP 403 to automated fetch. Not read.
- Used instead: the **Gazette of India, Extraordinary, Part II, Section 1, No. 55, New Delhi, Monday, December 25, 2023** (gazette ID `CG-DL-E-25122023-250882`), digitally signed by Government of India Press (Kshitiz Mohan, 2023-12-25 21:14:13 +05'30'), 47 pages, as hosted by PRS Legislative Research:
  `https://prsindia.org/files/bills_acts/acts_parliament/2023/The%20Bharatiya%20Sakshya%20Bill,%202023.pdf`
  (despite the "Bill" filename, the file is the enacted Act as published in the Gazette: "THE BHARATIYA SAKSHYA ADHINIYAM, 2023 / NO. 47 OF 2023 / [25th December, 2023.]", signed "DIWAKAR SINGH, Joint Secretary & Legislative Counsel to the Govt. of India.")
- Section 63 is on Gazette pp. 22–24; THE SCHEDULE is on pp. 46 (Part A) and 47 (Part B).
- Typography note: the Gazette prints a colon followed by an em dash after "follows", "namely", "algorithm", "is", "(tick mark)" etc. (e.g. `follows:—`). pdftotext renders that as `:--`. Below, the Gazette's own em dash is retained ONLY inside verbatim statutory quotes (third-party verbatim text). In the app UI you may choose to render it as `:-` or `:—`; flag for the user's style preference.
- Amendments: India Code's consolidated copy is labelled "as on 6th October, 2025" (per search snippet); I found no amending Act touching s.63 or the Schedule, but I could not open India Code to confirm. **[UNVERIFIED: no amendment]**

---

## 1. Section 63, BSA 2023, verbatim [PRIMARY-VERIFIED]

Marginal heading: "Admissibility of electronic records."

> **63.** (*1*) Notwithstanding anything contained in this Adhiniyam, any information contained in an electronic record which is printed on paper, stored, recorded or copied in optical or magnetic media or semiconductor memory which is produced by a computer or any communication device or otherwise stored, recorded or copied in any electronic form (hereinafter referred to as the computer output) shall be deemed to be also a document, if the conditions mentioned in this section are satisfied in relation to the information and computer in question and shall be admissible in any proceedings, without further proof or production of the original, as evidence or any contents of the original or of any fact stated therein of which direct evidence would be admissible.
>
> (*2*) The conditions referred to in sub-section (*1*) in respect of a computer output shall be the following, namely:—
>
> (*a*) the computer output containing the information was produced by the computer or communication device during the period over which the computer or communication device was used regularly to create, store or process information for the purposes of any activity regularly carried on over that period by the person having lawful control over the use of the computer or communication device;
>
> (*b*) during the said period, information of the kind contained in the electronic record or of the kind from which the information so contained is derived was regularly fed into the computer or communication device in the ordinary course of the said activities;
>
> (*c*) throughout the material part of the said period, the computer or communication device was operating properly or, if not, then in respect of any period in which it was not operating properly or was out of operation during that part of the period, was not such as to affect the electronic record or the accuracy of its contents; and
>
> (*d*) the information contained in the electronic record reproduces or is derived from such information fed into the computer or communication device in the ordinary course of the said activities.
>
> (*3*) Where over any period, the function of creating, storing or processing information for the purposes of any activity regularly carried on over that period as mentioned in clause (*a*) of sub-section (*2*) was regularly performed by means of one or more computers or communication device, whether—
>
> (*a*) in standalone mode; or
>
> (*b*) on a computer system; or
>
> (*c*) on a computer network; or
>
> (*d*) on a computer resource enabling information creation or providing information processing and storage; or
>
> (*e*) through an intermediary,
>
> all the computers or communication devices used for that purpose during that period shall be treated for the purposes of this section as constituting a single computer or communication device; and references in this section to a computer or communication device shall be construed accordingly.
>
> (*4*) In any proceeding where it is desired to give a statement in evidence by virtue of this section, a certificate doing any of the following things shall be submitted along with the electronic record at each instance where it is being submitted for admission, namely:—
>
> (*a*) identifying the electronic record containing the statement and describing the manner in which it was produced;
>
> (*b*) giving such particulars of any device involved in the production of that electronic record as may be appropriate for the purpose of showing that the electronic record was produced by a computer or a communication device referred to in clauses (*a*) to (*e*) of sub-section (*3*);
>
> (*c*) dealing with any of the matters to which the conditions mentioned in sub-section (*2*) relate,
>
> and purporting to be signed by a person in charge of the computer or communication device or the management of the relevant activities (whichever is appropriate) and an expert shall be evidence of any matter stated in the certificate; and for the purposes of this sub-section it shall be sufficient for a matter to be stated to the best of the knowledge and belief of the person stating it in the certificate specified in the Schedule.
>
> (*5*) For the purposes of this section,—
>
> (*a*) information shall be taken to be supplied to a computer or communication device if it is supplied thereto in any appropriate form and whether it is so supplied directly or (with or without human intervention) by means of any appropriate equipment;
>
> (*b*) a computer output shall be taken to have been produced by a computer or communication device whether it was produced by it directly or (with or without human intervention) by means of any appropriate equipment or by other electronic means as referred to in clauses (*a*) to (*e*) of sub-section (*3*).

Notes:
- Section 63 has **five** sub-sections (there is no Explanation).
- s.63(1) reads "as evidence **or** any contents of the original" in the Gazette (image-checked). The old IEA s.65B(1) read "as evidence **of** any contents". Reproduce the Gazette wording as printed.
- s.63(4) requires the certificate "at each instance where it is being submitted for admission" and to be signed by "a person in charge of the computer or communication device or the management of the relevant activities (whichever is appropriate) **and an expert**".
- The Schedule's heading cross-references "[*See* section 63(*4*)(*c*)]".

### Related provisions (same Gazette) [PRIMARY-TEXT]

- **s.61** "Electronic or digital record.": "Nothing in this Adhiniyam shall apply to deny the admissibility of an electronic or digital record in the evidence on the ground that it is an electronic or digital record and such record shall, subject to section 63, have the same legal effect, validity and enforceability as other document."
- **s.62** "Special provisions as to evidence relating to electronic record.": "The contents of electronic records may be proved in accordance with the provisions of section 63."
- **s.2(1)(d)**: "\"document\" means any matter expressed or described or otherwise recorded upon any substance by means of letters, figures or marks or any other means or by more than one of those means, intended to be used, or which may be used, for the purpose of recording that matter and includes electronic and digital records."
- **s.57** "Primary evidence means the document itself produced for the inspection of the Court." Electronic-record Explanations:
  - "Explanation 4.—Where an electronic or digital record is created or stored, and such storage occurs simultaneously or sequentially in multiple files, each such file is primary evidence."
  - "Explanation 5.—Where an electronic or digital record is produced from proper custody, such electronic and digital record is primary evidence unless it is disputed."
  - "Explanation 6.—Where a video recording is simultaneously stored in electronic form and transmitted or broadcast or transferred to another, each of the stored recordings is primary evidence."
  - "Explanation 7.—Where an electronic or digital record is stored in multiple storage spaces in a computer resource, each such automated storage, including temporary files, is primary evidence."
- **s.39** "Opinions of experts.":
  - "(1) When the Court has to form an opinion upon a point of foreign law or of science or art, or any other field, or as to identity of handwriting or finger impressions, the opinions upon that point of persons specially skilled in such foreign law, science or art, or any other field, or in questions as to identity of handwriting or finger impressions are relevant facts and such persons are called experts." (Illustrations (a)–(c) omitted.)
  - "(2) When in a proceeding, the court has to form an opinion on any matter relating to any information transmitted or stored in any computer resource or any other electronic or digital form, the opinion of the Examiner of Electronic Evidence referred to in section 79A of the Information Technology Act, 2000, is a relevant fact."
  - "Explanation.—For the purposes of this sub-section, an Examiner of Electronic Evidence shall be an expert."
- **s.170(1)**: "The Indian Evidence Act, 1872 is hereby repealed." s.170(2) saves pending applications, trials, inquiries, investigations, proceedings or appeals under the IEA.

---

## 2. THE SCHEDULE, verbatim [PRIMARY-VERIFIED]

Source: Gazette pp. 46–47 (image-checked). `[ ]` = a printed empty tick box in the Gazette. Underscore runs are reproduced approximately (their exact length is typographic). Line breaks follow the printed layout where they are meaningful.

### Header and PART A (Gazette p. 46)

```
THE SCHEDULE
[See section 63(4)(c)]

CERTIFICATE

PART A

(To be filled by the Party)

I, _____________________ (Name), Son/daughter/spouse of ___________________
residing/employed at __________________________ do hereby solemnly affirm and
sincerely state and submit as follows:—

I have produced electronic record/output of the digital record taken from the following
device/digital record source (tick mark):—

Computer / Storage Media [ ]   DVR [ ]   Mobile [ ]   Flash Drive [ ]

CD/DVD [ ]   Server [ ]   Cloud [ ]   Other [ ]

Other: ________________________________________

Make & Model: _______________ Color: _______________
Serial Number: _______________
IMEI/UIN/UID/MAC/Cloud ID_____________________ (as applicable)
and any other relevant information, if any, about the device/digital record____(specify).

The digital device or the digital record source was under the lawful control for regularly
creating, storing or processing information for the purposes of carrying out regular
activities and during this period, the computer or the communication device was working
properly and the relevant information was regularly fed into the computer during the
ordinary course of business. If the computer/digital device at any point of time was not
working properly or out of operation, then it has not affected the electronic/digital
record or its accuracy. The digital device or the source of the digital record is:—

Owned [ ]   Maintained [ ]   Managed [ ]   Operated [ ]

by me (select as applicable).

I state that the HASH value/s of the electronic/digital record/s is _________________,
obtained through the following algorithm:—

[ ] SHA1:

[ ] SHA256:

[ ] MD5:

[ ] Other__________________ (Legally acceptable standard)

(Hash report to be enclosed with the certificate)

                                                            (Name and signature)

Date (DD/MM/YYYY): _____

Time (IST): ________hours (In 24 hours format)

Place: ____________
```

### PART B (Gazette p. 47)

```
PART B

(To be filled by the Expert)

I, ____________________ (Name), Son/daughter/spouse of _____________________
residing/employed at _________________________ do hereby solemnly affirm and
sincerely state and submit as follows:—

The produced electronic record/output of the digital record are obtained from the following
device/digital record source (tick mark):—

Computer / Storage Media [ ]   DVR [ ]   Mobile [ ]   Flash Drive [ ]

CD/DVD [ ]   Server [ ]   Cloud [ ]   Other [ ]

Other: ________________________________________

Make & Model: _______________ Color: _______________
Serial Number: _______________
IMEI/UIN/UID/MAC/Cloud ID_____________________ (as applicable)
and any other relevant information, if any, about the device/digital record_______(specify).

I state that the HASH value/s of the electronic/digital record/s is _____________________,
obtained through the following algorithm:—

[ ] SHA1:

[ ] SHA256:

[ ] MD5:

[ ] Other__________________ (Legally acceptable standard)

(Hash report to be enclosed with the certificate)

                                                (Name, designation and signature)

Date (DD/MM/YYYY): _____

Time (IST): ________hours (In 24 hours format)

Place: ____________
```

### Answer to the Part A vs Part B hash dispute

**BOTH parts carry the hash value field.** Verified on the rendered Gazette images, p. 46 and p. 47. Each part has its own identical block: "I state that the HASH value/s of the electronic/digital record/s is ____, obtained through the following algorithm:—" with four tick boxes (SHA1 / SHA256 / MD5 / Other ____ (Legally acceptable standard)) and the note "(Hash report to be enclosed with the certificate)". Any secondary source saying the hash is only in Part A, or only in Part B, is wrong.

Also note: the Supreme Court's own order in *Pune Bar Association* (para 1) summarises it as "Part A which needs disclosure of the hash value of digital records, and Part B which must be signed by an expert". That is a summary, not a description of the form; the form itself puts the hash block in both parts.

### Field-by-field differences between Part A and Part B (from the Gazette)

| Element | Part A (Party) | Part B (Expert) |
|---|---|---|
| Sub-heading | "(To be filled by the Party)" | "(To be filled by the Expert)" |
| Identity lines (Name, Son/daughter/spouse of, residing/employed at, solemn affirmation) | Yes | Yes (identical wording) |
| Source sentence | "I have produced electronic record/output of the digital record taken from the following device/digital record source (tick mark):—" | "The produced electronic record/output of the digital record are obtained from the following device/digital record source (tick mark):—" |
| 8 device boxes (Computer / Storage Media, DVR, Mobile, Flash Drive, CD/DVD, Server, Cloud, Other) + "Other:" line | Yes | Yes |
| Make & Model / Color / Serial Number / IMEI/UIN/UID/MAC/Cloud ID (as applicable) / other relevant info (specify) | Yes | Yes |
| "lawful control ... working properly ... ordinary course of business" paragraph | **Yes** | **No** |
| Owned / Maintained / Managed / Operated "by me (select as applicable)" | **Yes** | **No** |
| HASH value line + SHA1 / SHA256 / MD5 / Other (Legally acceptable standard) + "(Hash report to be enclosed with the certificate)" | **Yes** | **Yes** |
| Signature caption | "(Name and signature)" | "(Name, designation and signature)" |
| Date (DD/MM/YYYY), Time (IST) ____hours (In 24 hours format), Place | Yes | Yes |

Spelling as printed: "Color" (US spelling), "SHA1" and "SHA256" (no hyphen), "IMEI/UIN/UID/MAC/Cloud ID" (no space or colon before the underscore line), "value/s", "record/s".

---

## 3. Pune Bar Association v. Union of India (SC, 22 May 2026)

### Identification [PRIMARY-VERIFIED unless marked]

- Source read: signed order PDF hosted by LiveLaw, `https://www.livelaw.in/pdf_upload/2026/05/27/pune-bar-association-v-union-of-india-676590.pdf` (7 pages; digitally signed by NITIN TALREJA, 2026-05-27 09:58:11 +05:30; pages 1-5 = signed order, pages 6-7 = Record of Proceedings). Para 4 was also image-checked.
- Cause title: **Pune Bar Association ....Petitioner(s) VERSUS Union of India and Others ...Respondent(s)**
- Court / number: IN THE SUPREME COURT OF INDIA, CIVIL ORIGINAL JURISDICTION, **WRIT PETITION (CIVIL) NO.599 OF 2026**
- Date: "NEW DELHI, MAY 22, 2026." Record of Proceedings: "Date : 22-05-2026", ITEM NO.17, COURT NO.1, SECTION X.
- Bench (three judges): **Surya Kant, CJI; Joymalya Bagchi, J; Vipul M. Pancholi, J.** All three sign. No individual author is named (order of the Court).
- For Petitioner: Mr. Tank Dhruv Ketan, AOR; Mr. Abhay Anil Anturkar, Adv.; and others. "For Respondent(s) :" blank (no notice was issued).
- Nature: a short **order at the admission stage**, not a full judgment after hearing the Union. The Court says it is "not inclined to admit the matter and issue notice upon the Union of India", and "the petition stands disposed of". ROP: "The petition stands disposed of in terms of the signed order."
- Citations (not printed on the order):
  - **2026 LiveLaw (SC) 551** [SECONDARY: LiveLaw report]
  - **2026 SCC OnLine SC 1297** [SECONDARY: SCC Times blog, 8 July 2026]
  - Indian Kanoon: `https://indiankanoon.org/doc/5836207/` "Pune Bar Association vs Union Of India on 22 May, 2026" [seen in search results only]
  - No INSC neutral citation found. [UNVERIFIED]

### Full verbatim text of the signed order [PRIMARY-VERIFIED]

(pdftotext garbled the "ff" ligatures as "a1ecting", "e.ect", "su1er"; restored to "affecting", "effect", "suffer"; "suffer" was image-checked.)

> 1. Petitioner, Pune Bar Association, contends that Section 63(4) of Bharatiya Sakshya Adhiniyam, 2023[fn 1], read with the Schedule thereto is unconstitutional as it imposes undue hardship on an ordinary litigant by requiring submission of a certificate prescribed in the Schedule comprising Part A which needs disclosure of the hash value of digital records, and Part B which must be signed by an expert. Ld. Counsel argues imposition of such pre-requisites for admissibility of electronic records is an extremely onerous obligation on a litigant and renders the provision manifestly arbitrary and unjust.
>
> 2. With advancement of technology, digital space has encroached on all spheres of human life. Consequently, evidence in the form of electronic record has become commonplace in all litigation. Physical documents are increasingly replaced with digital records like electronic mails, audio-visual clips etc. To address the admissibility of such electronic records, Section 65B was incorporated in the erstwhile Evidence Act[fn 2]. Subsequently, BSA replaced the said provision with Section 63(4) which inter alia provides that electronic records must be accompanied by a certificate as set out in the Schedule to the Act. The certificate so prescribed comprises Part A, which inter alia requires disclosure of hash value of the electronic records in addition to the declaration required under the erstwhile Section 65B of the Evidence Act. Part B of the certificate requires a further declaration signed by an expert.
>
> 3. Electronic record is a unique species of evidence which is liable to continuous mutation and modification affecting its authenticity, integrity and intrinsic evidentiary value. Challenges to admissibility and probative value of electronic records are further accentuated with the advent of artificial intelligence and deepfake technology. Such fast and varied transformation in technology necessitated reviewing the erstwhile Evidence Act and the BSA was enacted. Statement of objects and reasons for enacting the BSA inter alia emphasises:
>
> "(ii) it provides for admissibility of an electronic or digital record as evidence having the same legal effect, validity and enforceability as any other document;
>
> (iii) it seeks to expand the scope of secondary evidence to include copies made from original by mechanical processes, copies made from or compared with the original, counterparts of documents as against the parties who did not execute them and oral accounts of the contents of a document given by some person who has himself seen it and giving matching hash value of original record will be admissible as proof of evidence in the form of secondary evidence."
>
> 4. To achieve such objective, Section 63(4) of BSA improved upon the certificate envisaged under the old law by mandating the issuance of a standard-form certificate prescribed in the Schedule which inter alia requires the disclosure of hash value of the electronic/digital record along with a further certification by an expert. Hash value of an electronic data is synonymous with an electronic fingerprint and provides a sure way of identifying and verifying digital data. The necessity of incorporating the hash value of the electronic record in the certificate is thus to ensure its authenticity and integrity, and cannot be said to lack a rational nexus with the object of the Act. Similarly, certification by an expert in Part B provides an additional layer of authenticity to the secondary electronic evidence. For these reasons, we are of the considered view that the new provision has a clear and rational nexus with the object of the law and cannot be said to be either arbitrary or unreasonable so as to suffer from the vice of manifest arbitrariness.
>
> 5. At this juncture, referring to a judgement of the Madras High Court[fn 3], Ld. Counsel submits Part B must be filled up by an expert notified under Section 79A of the Information Technology Act, 2000[fn 4]. He contends that only a handful of entities are authorized by the Central/State government to examine electronic evidence under the said provision, thereby causing undue hardship and rendering its implementation illusory.
>
> 6. We have perused the cited judgment, wherein the Madras High Court, in a matrimonial case instituted in 2019 inter alia held that the same would be governed by the erstwhile Evidence Act. Thereafter, it proceeded to analyse Part B of the Schedule in Section 63(4) to hold that the certificate by an expert therein must be by an Examiner of Electronic Evidence under Section 79A of the IT Act. In doing so, the High Court merely referred to Section 39(2) of the BSA and not sub-section (1). Section 39 deals with admissibility of opinions of experts. Sub-section (1) states when the Court has to form an opinion on a point of foreign law, science or art or any other field, or as to identity of handwriting or finger impressions, the opinion on that point of persons having special skill in such domain namely foreign law, science or art, or any other field, or in respect of identity of handwriting or finger impressions becomes a relevant fact. Sub-section (2) provides when in a proceeding, the Court has to form an opinion on any matter relating to information transmitted or stored in any computer resource or any other electronic or digital form, the opinion of the Examiner of Electronic Evidence under Section 79A of the IT Act shall be treated to be that of an expert and be admissible as a relevant fact.
>
> 7. If the two sub-sections are read harmoniously, it is possible to hold, in addition to entities notified as Examiner of Electronic Evidence under Section 79A, if the Court is satisfied, on the basis of unimpeachable material, that any other person has special skill and expertise in computer science and cyber forensics, opinion of such person may be held relevant as an expert with regard to electronic/digital record and such person may sign Part B of the Schedule as an expert. We are further fortified to make such observation as sub-section (2) of Section 39 (unlike 63(4) and erstwhile 65B) is not prefaced by a non-obstante clause so as to exclude the operation of sub-section (1) from the arena of electronic records. The High Court had deferred adjudication of such issue and directed the State to notify adequate number of persons under Section 79A. Under these circumstances, we hold that the finding of the High Court that Part B must be filled up by an expert notified under Section 79A of the IT Act shall not be treated as a binding precedent. As we are not inclined to admit the matter and issue notice upon the Union of India, we refrain from giving any conclusive opinion on this issue and keep the question of law open. With this clarification, the petition stands disposed of.
>
> Footnotes: [fn 1] Hereinafter "BSA/the Act"; [fn 2] The Indian Evidence Act, 1872; [fn 3] R. v. B & Anr, 2024 SCC OnLine Mad 6084, Paras 5 to 6; [fn 4] Hereinafter "IT Act"

### Key holdings (tied to paragraphs)

1. Challenge: s.63(4) + Schedule said to be manifestly arbitrary because of the hash (Part A) and expert (Part B) requirements (para 1).
2. Held (para 4): the hash-value requirement and Part B expert certification have "a clear and rational nexus with the object of the law" and do not "suffer from the vice of manifest arbitrariness". Hash passage, verbatim: **"Hash value of an electronic data is synonymous with an electronic fingerprint and provides a sure way of identifying and verifying digital data."**
3. AI / deepfakes (para 3), verbatim: **"Challenges to admissibility and probative value of electronic records are further accentuated with the advent of artificial intelligence and deepfake technology."** This is the only AI/deepfake sentence in the order. Electronic records are "liable to continuous mutation and modification affecting its authenticity, integrity and intrinsic evidentiary value".
4. Part B "expert" (paras 6-7): reading s.39(1) and s.39(2) BSA harmoniously, "it is possible to hold" that, in addition to s.79A-notified Examiners, a person may sign Part B "if the Court is satisfied, on the basis of unimpeachable material, that any other person has special skill and expertise in computer science **and** cyber forensics". The Madras HC finding (Part B only by a s.79A examiner) "shall not be treated as a binding precedent".
5. **Left open** (para 7): "we refrain from giving any conclusive opinion on this issue and keep the question of law open." Who qualifies as the Part B expert is NOT conclusively decided. Para 7 is framed as "it is possible to hold" and "such observation".
6. Disposition: not admitted, no notice to the Union, "disposed of" (not "dismissed").

### Discrepancies in secondary sources (relevant to the tool's copy)

- TaxGuru wrote "hash values act as digital fingerprints" and "developments in artificial intelligence and deepfake technology have further complicated evidentiary reliability". **Neither phrase is in the order.** Use the order's wording.
- TaxGuru wrote "special skill and expertise in computer science **or** cyber forensics". The order says "computer science **and** cyber forensics".
- Reports say the Court "upheld" s.63(4). Strictly, it rejected the manifest-arbitrariness challenge in a non-admission order and disposed of the petition. The order does not use the word "uphold".
- The SC order says the Madras HC "directed the State to notify". The Madras HC order itself (section 5 below) directed the **second respondent, the Secretary, MeitY, Government of India**.
- The SC order (para 1, para 2) summarises Part A as the hash part and Part B as the expert part. The Schedule itself has the hash block in both parts (section 2 above).

---

## 4. LiveLaw practitioner analysis [SECONDARY]

**"How Bharatiya Sakshya Adhiniyam Has Transformed Digital Evidence"**, by **Samarth Saxena** (Advocate, Lucknow District Courts and Allahabad High Court), LiveLaw, **2 October 2026, 8:00 PM IST**.
URL: `https://www.livelaw.in/articles/bharatiya-sakshya-adhiniyam-transformed-digital-evidence-552681`

Verbatim lines (the fetch tool returned the page text in fragments; joined here in order, wording as returned):

- "The first and most immediate change the BSA makes is to the wording of the section. Section 65B(4) of the IEA used the word "may", which the courts interpreted as a mandatory requirement. Section 63(4) of the BSA instead provides that the certificate "shall" be submitted, removing the interpretive gap at a stroke. The rule that Anvar and Arjun Panditrao achieved through years of litigation is now written plainly into the text."
- Originals: "The consequence is striking: the concession in Arjun Panditrao Khotkar, which had permitted an original electronic record to be admitted without a certificate, does not survive under the BSA. Every electronic record, whether tendered as original or as output, must now carry a valid Section 63 certificate, a stricter regime than the IEA ever imposed."
- Two signatures: "The most ambitious change of the BSA is the shift from single-signatory certificate to a dual certification." ... "The BSA's Schedule splits the certificate into two parts: Part A, completed by the party or person in charge of the device, and Part B, completed by an expert. Two signatures are now required where one previously served, and the expert's involvement is no longer optional. This structural change is accompanied by an infusion of forensic science into the statutory form. Part B requires the expert to record the hash value of the electronic record, expressly recognising the standard algorithms — MD5, SHA-1 and SHA-256." (dash as printed by the author)
- Burden: "Yet the same reforms have raised the procedural burden. A contemporaneous, dual-signed, expert-verified certificate is a demanding instrument, and the requirement bears most heavily on the party who does not control the device that produced the record, precisely the access-to-justice concern that Shafhi Mohammad had sought. The framework also assumes a level of technical competence that legal practitioners, certifying agencies and judicial officers may not uniformly possess."
- Timing: "The old provision prescribed no specific stage for filing the certificate, and the courts adopted a generous attitude, permitting filing of the certificate at later stages of the trial." ... "The BSA requires the certificate to be submitted along with the electronic record at each instance it is tendered for admission, mandating contemporaneous filing and settling a question that had consumed disproportionate judicial energy."
- Expert: "Only a handful of bodies have, however, been notified under Section 79A" (the author argues "expert" should be read through s.39(1) "specially skilled").
- Hash: "Making the certificate a mandatory condition for all electronic evidence, coupled with the hash-value requirement and expert verification, the practical standard of authentication has risen appreciably, making the tampered or fabricated record easier to detect and exclude."
- Cases cited (names/years only): State (NCT of Delhi) v. Navjot Sandhu (2005); Anvar P.V. v. P.K. Basheer (2014); Shafhi Mohammad v. State of Himachal Pradesh (2018); Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020).

Caveats:
- This is an author's opinion, not a holding. The "originals" point is contested: the Himachal Pradesh HC in *Nirmal Malakar* (June 2026, see 6(c)) still applied the Arjun Panditrao original-device exception under the BSA.
- The article says Part B records the hash; it does not mention that Part A also does. The Gazette shows both.
- The article writes "SHA-1" and "SHA-256"; the Schedule prints "SHA1" and "SHA256".

Related LiveLaw pieces:
- "Unseen Burden Of Electronic Evidence", Mayank Makhija & Naman Sharma, LiveLaw, 21 Aug 2026, `https://www.livelaw.in/articles/unseen-burden-electronic-evidence-546749`. Lines returned: "Under Section 63(4), such records must be accompanied by a certificate in the form prescribed in the Schedule to the BSA." and "mandatory expert certification places an onerous financial, technical and procedural burden on litigants". It does NOT contain the "two signatures" line.
- "Constitutional But Unfunded: Section 63 BSA And Legal Aid Litigant", LiveLaw, `https://www.livelaw.in/articles/constitutional-but-unfunded-section63-bsa-legal-aid-litigant-555214` (seen in search only, not opened).

---

## 5. Section 79A, IT Act 2000, and who is the Part B "expert"

### Section 79A verbatim [PRIMARY-VERIFIED against consolidated text]

Source: consolidated "THE INFORMATION TECHNOLOGY ACT, 2000" (36 pp., consolidation with amendment footnotes), hosted by PRS: `https://prsindia.org/files/bills_acts/bills_parliament/2021/IT%20Act,%202000.pdf`, page 30, image-checked. India Code (`https://www.indiacode.nic.in/bitstream/123456789/15386/1/it_amendment_act2008.pdf`) returned HTTP 403.

> CHAPTER XIIA
> EXAMINER OF ELECTRONIC EVIDENCE
>
> **79A. Central Government to notify Examiner of Electronic Evidence.**–The Central Government may, for the purposes of providing expert opinion on electronic form evidence before any court or other authority specify, by notification in the Official Gazette, any Department, body or agency of the Central Government or a State Government as an Examiner of Electronic Evidence.
>
> *Explanation.*–For the purposes of this section, "electronic form evidence" means any information of probative value that is either stored or transmitted in electronic form and includes computer evidence, digital audio, digital video, cell phones, digital fax machines.]

Footnote on the page: "2. Subs. by, s. 40, *ibid*., for Chapter XII (w.e.f. 27-10-2009)." (ibid. = Act 10 of 2009, the IT (Amendment) Act, 2008). The closing "]" ends the bracketed substituted text.

Note: s.79A lets the Central Government notify only a **Department, body or agency of the Central Government or a State Government**. Private labs or individuals cannot be s.79A Examiners.

### Has any court or notification said Part B "expert" = s.79A examiner, or something broader?

1. **Madras HC, R v. B** (Madurai Bench), CRP(MD) No. 2362 of 2024, decided **30 Oct 2024**, **G.R. Swaminathan, J.**; 2024 LiveLaw (Mad) 414; 2024 SCC OnLine Mad 6084. Read via Indian Kanoon `https://indiankanoon.org/doc/64272103/` (short fragments only) and LiveLaw `https://www.livelaw.in/high-court/madras-high-court/madras-high-court-section-63-bsa-meity-notify-experts-within-3-months-274015`. [SECONDARY-TEXT: fragments]
   - Held the 2019 matrimonial case was governed by the IEA: "the Indian Evidence Act, 1872 would apply and not the Bharatiya Sakshaya Adhiniyam, 2023."
   - Still read s.63(4), s.39(2) BSA and s.79A IT Act together: "Part B must be filled up by the expert notified under" s.79A.
   - Declined the amicus's invitation to read down so any person specially skilled in computer science could fill Part B: "I do not want to travel that far as that would amount to re-writing."
   - Timing: "filing of the certificate is mandatory along with the electronic record"; a party "must submit a certificate at the time of filing the electronic record."
   - Direction to MeitY (second respondent): "I, therefore, direct the second respondent to expeditiously notify sufficient number of persons/bodies/entities" ... "within a period of three months from the date of receipt of copy of this order." Also: "It is surprising to note that no expert has been notified in the State of Tamil Nadu." and "It would be advisable to have such experts in each district in Tamil Nadu."
2. **Supreme Court, Pune Bar Association** (22 May 2026): the Madras finding "shall not be treated as a binding precedent"; s.39(1) + s.39(2) read harmoniously make it "possible to hold" that a non-notified person with "special skill and expertise in computer science and cyber forensics", shown by "unimpeachable material" to the Court's satisfaction, may sign Part B; but the Court kept "the question of law open". [PRIMARY-VERIFIED]
3. **No notification, rule or circular defining the Part B "expert" was found.** The BSA does not define "expert" in s.63 or the Schedule; s.39(1) and the s.39(2) Explanation ("an Examiner of Electronic Evidence shall be an expert") are the only statutory hooks. [Search-based negative; not exhaustive]
4. **MeitY list of s.79A examiners** [PRIMARY-TEXT, scanned annexure; OCR may contain errors]: Delhi High Court **Circular No. 186/Rules/DHC dated 08.07.2026** (`https://delhihighcourt.nic.in/files/2026-07/notifications-and-practice-directions/circular_no._186_dated_08.07.2026.pdf`) circulates MeitY Cyber Security Group letter No. AA-14/31/2026-CSD dated 27 May 2026, which states: "21 digital forensic labs (including two in Delhi for civil purpose) have been notified as Examiner of Electronics Evidence under Section 79A of IT Act, 2000." Annexure-I as OCR'd (verify spellings before use):
   1. Digital Forensic Division, State Forensic Science Laboratory (Directorate of Forensic Services Himachal Pradesh), Shimla Hills Junga, Shimla 171218, Himachal Pradesh
   2. State Forensic Science Laboratory, Police Line Campus, Tikarapara, Raipur, Chhattisgarh 492001
   3. Regional Forensic Science Laboratory, Kannur 670002 (Kerala)
   4. Centre of Excellence in Digital Forensics (CoEDF), National Forensic Sciences University, Sector 9, Gandhinagar 382007, Gujarat
   5. Regional Forensic Science Laboratory (RFSL), Surat, Gujarat
   6. Cyber Forensics & Digital Evidence Examiners Laboratory (CF&DEEL), Kolkata, West Bengal
   7. Forensic Wing Lab, Defence Cyber Agency (DCyA), Rajaji Marg, New Delhi
   8. Cyber Forensics Laboratory, Navy Cyber Group, Naval HQs, Ministry of Defence (Navy), Chanakya Bhawan, Chanakyapuri, New Delhi
   9. Cyber Forensic Division, State Forensic Science Laboratory, Vellayambalam, Thiruvananthapuram, Kerala
   10. Cyber Forensic Laboratory, Air Force Cyber Group, New Delhi
   11. Cyber Forensic Laboratory, CERT-In, Electronics Niketan, 6 CGO Complex, Lodhi Road, New Delhi
   12. Regional Forensic Science Laboratory, Northern Range, Dharamshala, District Kangra, Himachal Pradesh
   13. Cyber Forensic Laboratory, Army Cyber Group, DGIS, Shankar Vihar, New Delhi
   14. State Forensic Science Laboratory, Madiwala, Bengaluru (Directorate of Forensic Sciences, Karnataka Police)
   15. Central Forensic Science Laboratory, Hyderabad (Directorate of Forensic Science Services, MHA), Telangana
   16. Directorate of Forensic Science, Gandhinagar, Gujarat
   17. Computer Forensic and Data Mining Laboratory, Serious Fraud Investigation Office, MCA, New Delhi
   18. Forensic Science Laboratory, Sector 14, Rohini, New Delhi (GNCTD)
   19. Forensic Science Department, 30A Kamarajar Salai, Mylapore, Chennai 600004, Tamil Nadu
   20. Computer Forensic Division, Goa Forensic Science Laboratory, Goa Police, Verna, Goa 403722
   21. Telangana Forensic Science Laboratory (TGFSL), Red Hills, Hyderabad 500004
   - The circular says nothing about Part B. It is informational only.
   - Later additions reported [SECONDARY/UNVERIFIED]: NFSU Goa (S.O. 3807(E), 9 July 2026, per a search snippet of an egazette PDF); DFSL Kalina, Mumbai (Gazette 13 July 2026, per Free Press Journal). The count is likely above 21 by Oct 2026.
5. **Delhi HC PIL** [SECONDARY]: *Zeeshan Ekhlaque & Anr v. National Legal Services Authority & Ors*, Division Bench (D.K. Upadhyaya CJ, Tejas Karia J), notice issued (LiveLaw, 19 Aug 2026) on a plea for free forensic expert help to legal-aid beneficiaries to meet s.63 certificate requirements. Undecided. `https://www.livelaw.in/high-court/delhi-high-court/electronic-evidence-pil-free-forensic-assistance-for-legal-aid-beneficiaries-546492`

---

## 6. Notable rulings 2024-2026 on s.63(4) BSA

Context [PRIMARY-VERIFIED statute]: BSA s.170(2) keeps the IEA for any "application, trial, inquiry, investigation, proceeding or appeal pending" immediately before the BSA came into force (enforcement date 1 July 2024 per India Code record page [SECONDARY]). That is why several 2024-2026 rulings below were decided under IEA s.65B, not BSA s.63. The tool may need to tell users that older cases can still be on the s.65B regime (as a fact, not advice).

### (a) Can the certificate be filed later?

- **Statute**: "shall be submitted along with the electronic record at each instance where it is being submitted for admission" (s.63(4)). [PRIMARY-VERIFIED]
- **Delhi HC, Aishwarya Rai Bachchan v. Aishwaryaworld.com & Ors., CS(COMM) 956/2025, order 09.09.2025, Tejas Karia J** [PRIMARY-TEXT, signed order `https://www.livelaw.in/pdf_upload/highcourtorder-619940.pdf`], I.A. No.22169/2025: "12. This is an Application filed by the Plaintiff under Section 151 of the CPC seeking extension of time for filing the requisite Certificate under Section 63(4)(c) of the Bhartiya Sakshya Adhiniyam, 2023. 13. The Plaintiff shall file the relevant Certificate within a period of four weeks. 14. Accordingly, the Application is allowed in the aforesaid terms."
- **Delhi HC, Abhishek Bachchan v. The Bollywood Tee Shop & Ors., CS(COMM) 960/2025, order 10.09.2025, Tejas Karia J** [PRIMARY-TEXT, `https://www.livelaw.in/pdf_upload/highcourtorder-620031.pdf`], I.A. No.22282/2025: identical paras 12-14 (four weeks granted).
  - Both are unreasoned case-management orders at the institution stage of commercial suits. They show time being granted in practice; they are not reasoned rulings on curability.
- **Madras HC, R v. B (30 Oct 2024)**: "filing of the certificate is mandatory along with the electronic record" (obiter, since the case was held to be under the IEA). [SECONDARY-TEXT fragment]
- **AP HC, I.A. No. 01 of 2025 in Criminal Appeal No. 2639 of 2018, 12 March 2026, K. Suresh Reddy & A. Hari Haranadha Sarma JJ** (Indian Kanoon `https://indiankanoon.org/doc/154003255/`) [SECONDARY-TEXT fragments; IEA-governed]: refused the prosecution's s.65B certificate for a DVD at the appeal stage: "Section 65-B certificate can't be received in appeal stage."; "stage to produce Section 65-B Certificate is over long back". Noted the provision is "Now provided under Section 63 in Bharatiya Sakshya Adhiniyam, 2023."
- **Background SC law (IEA s.65B): Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal, 14 July 2020, (2020) 7 SCC 1** (Indian Kanoon `https://indiankanoon.org/doc/172105947/`; IK paragraph numbers) [SECONDARY-TEXT fragments]: para 50 "We may hasten to add that Section 65B does not speak of the stage at which such certificate must be furnished to the Court." Para 50 also: where a certificate is defective, or demanded and refused, "the Judge conducting the trial must summon the person/persons referred to in Section 65B(4) of the Evidence Act, and require that such certificate be given by such person/persons." Para 54: permitting evidence at a later stage "should not result in serious or irreversible prejudice to the accused." Para 57: "So long as the hearing in a trial is not yet over, the requisite certificate can be directed to be produced by the learned Judge at any stage, so that information contained in electronic record form can then be admitted". Whether this IEA latitude survives BSA s.63(4)'s "at each instance" wording has not been decided by any SC ruling found. Saxena (LiveLaw) argues it does not.
- **Kerala HC, "Alukkas Jewellery v. Anil" (July 2025), "curable defect"**: cited by blogs only. **[UNVERIFIED: could not locate the judgment or a reliable report.]**

### (b) WhatsApp chats / screenshots

- **Delhi HC, Dell International Services India Pvt Ltd v. Adeel Feroze & Ors., W.P.(C) 4733/2024, 2024:DHC:4954, c. 2 July 2024, Subramonium Prasad J** [SECONDARY: LiveLaw, SCC Times, Verdictum]: WhatsApp conversations "cannot be read as evidence without there being a proper certificate as mandated under the Evidence Act, 1872". IEA-era; consumer-forum delay-condonation context.
- **AP HC, X v. Y, CRP No. 1239 of 2024, Ravi Cheemalapati J** (LiveLaw report 13 May 2026, `https://www.livelaw.in/high-court/andhra-pradesh-high-court/andhra-pradesh-high-court-section-65b-electronic-evidence-self-certificate-whatsapp-533986`) [SECONDARY]: divorce case; trial court refused to mark WhatsApp status/screenshots, email prints, photos, DVD etc. because the self-certificate was not from a "proper authority". HC set that aside: a certificate "can also be issued by a person in lawful control of the device i.e. mobile phone"; remitted to check s.65B(4) compliance. **Decided under IEA s.65B**, not the BSA Part A/Part B form (despite the LiveLaw headline mentioning s.63 BSA). Did not address Part B.
- **Allahabad HC**, maintenance case: printed Instagram chats alone cannot prove "living in adultery" (LawBeat, `https://lawbeat.in/news-updates/instagram-chats-alone-cannot-prove-living-in-adultery-allahabad-high-court-in-maintenance-case-1638051`). [SECONDARY, not opened; Instagram, not WhatsApp]
- No 2024-2026 Supreme Court ruling specifically on WhatsApp chats under BSA s.63 was found. [Search-based negative]

### (c) Is the certificate needed when the original device is produced?

- **Statute** [PRIMARY-VERIFIED]: s.63(1) makes a computer output admissible "without further proof or production of the original" if s.63 conditions are met; s.57 Explanations 4-7 treat electronic records (each file; records "produced from proper custody ... unless it is disputed"; each stored recording; each automated storage including temporary files) as **primary evidence**. The BSA does not say in terms whether a s.63(4) certificate is needed when the original device itself is produced.
- **Arjun Panditrao (2020, IEA)** [SECONDARY-TEXT via Indian Kanoon]: para 32: "Quite obviously, the requisite certificate in sub-section (4) is unnecessary if the original document itself is produced. This can be done by the owner of a laptop computer, a computer tablet or even a mobile phone, by stepping into the witness box and proving that the concerned device, on which the original information is first stored, is owned and/or operated by him." Conclusion (IK para 72(b); reported as para 73.2 in SCC): "The clarification referred to above is that the required certificate under Section 65B(4) is unnecessary if the original document itself is produced. This can be done by the owner of a laptop computer, computer tablet or even a mobile phone, by stepping into the witness box and proving that the concerned device, on which the original information is first stored, is owned and/or operated by him. In cases where the "computer" happens to be a part of a "computer system" or "computer network" and it becomes impossible to physically bring such system or network to the Court, then the only means of providing information contained in such electronic record can be in accordance with Section 65B(1), together with the requisite certificate under Section 65B(4)."
- **Himachal Pradesh HC, Nirmal Malakar v. Larisa Enterprises Pvt. Ltd. & Anr., OMP No. 1084 of 2025 in Civil Suit No. 33 of 2024, 2026:HHC:20968, decided 01.06.2026, Sushil Kukreja J** (Law Today Live `https://www.lawtodaylive.com/judgment/10d2d94966c66c690ed4cdfe5e8347ad`) [SECONDARY-TEXT fragments]: decided under the BSA; "Requirement of certificate under Section 63(4) is a strict legal requirement which is a precondition for admissibility" of secondary electronic evidence; without it the information "would be inherently inadmissible as evidence"; exception for "the electronic record contained in the computer/device on which the original information is first stored"; "without Section 63(4) of BSA certification, there is no question of the invoices being admitted in evidence". Relied on Anvar and Arjun Panditrao. Application to lead secondary evidence of photocopied invoices dismissed. No ruling on late filing.
- **AP HC, 12 March 2026** (above): noted the same original-document exception; held the DVD (MO.4) was a copy of MO.1 and so needed a certificate. [IEA]
- **Contra view (commentary)**: Saxena (LiveLaw, 2 Oct 2026) says the Arjun Panditrao concession "does not survive under the BSA" and every record "whether tendered as original or as output" needs a certificate.
- **Status: unsettled.** No Supreme Court ruling under BSA s.63 on this point was found.

---

## Could not verify / gaps

- India Code PDFs (BSA consolidated "as on 6 Oct 2025"; IT (Amendment) Act 2008) returned HTTP 403. BSA text was taken from the Gazette copy; IT Act text from a PRS-hosted consolidation.
- No amendment to BSA s.63 or the Schedule found as of 2026-10-29 (search-based; India Code not openable).
- INSC neutral citation for Pune Bar Association: not found. The LiveLaw and SCC OnLine citations come from those publishers' reports.
- Madras HC R v. B: only short fragments of the judgment text were obtainable; full paragraphs not reproduced.
- Arjun Panditrao: official digital SCR host (`digiscr.sci.gov.in`) did not resolve; text taken from Indian Kanoon fragments. IK and SCC paragraph numbering differ.
- Kerala HC "Alukkas Jewellery v. Anil" (2025): not located.
- OCR of the MeitY Annexure-I list may contain spelling errors; check against MeitY's Cyber Security Group page before display.
- BSA commencement date (1 July 2024) taken from India Code's record page via a search snippet, not the commencement notification.

## Sources

Primary:
- Gazette of India Extraordinary, Part II Sec. 1, No. 55, 25 Dec 2023 (BSA, Act 47 of 2023), via PRS: https://prsindia.org/files/bills_acts/acts_parliament/2023/The%20Bharatiya%20Sakshya%20Bill,%202023.pdf
- India Code record (blocked to fetch): https://indiacode.nic.in/handle/123456789/20063 and https://www.indiacode.nic.in/bitstream/123456789/20063/1/aa202347.pdf
- SC order, Pune Bar Association v. UoI, WP(C) 599/2026, 22 May 2026 (via LiveLaw): https://www.livelaw.in/pdf_upload/2026/05/27/pune-bar-association-v-union-of-india-676590.pdf
- IT Act 2000 consolidated (via PRS): https://prsindia.org/files/bills_acts/bills_parliament/2021/IT%20Act,%202000.pdf
- Delhi HC Circular No. 186/Rules/DHC, 08.07.2026: https://delhihighcourt.nic.in/files/2026-07/notifications-and-practice-directions/circular_no._186_dated_08.07.2026.pdf
- Delhi HC orders 09.09.2025 / 10.09.2025 (Tejas Karia J): https://www.livelaw.in/pdf_upload/highcourtorder-619940.pdf and https://www.livelaw.in/pdf_upload/highcourtorder-620031.pdf

Judgment text via Indian Kanoon (fragments):
- R v B (Madras HC, 30 Oct 2024): https://indiankanoon.org/doc/64272103/
- Arjun Panditrao (SC, 14 July 2020): https://indiankanoon.org/doc/172105947/
- AP HC 12 March 2026: https://indiankanoon.org/doc/154003255/

Secondary:
- LiveLaw, Pune Bar report: https://www.livelaw.in/top-stories/supreme-court-rejects-challenge-to-s634-bsa-mandating-hash-value-disclosure-for-electronic-evidence-535950
- SCC Times, 8 July 2026: https://www.scconline.com/blog/post/2026/07/08/sc-upholds-admissibility-of-electronic-evidence-under-section-63-4-bsa/
- SCC Times, 13 July 2026: https://www.scconline.com/blog/post/2026/07/13/sc-explains-electronic-evidence-rules-under-bsa-2023-clarifies-hash-value/
- TaxGuru: https://taxguru.in/corporate-law/sc-clarifies-scope-expert-section-63-4-bsa-upholding-digital-evidence-safeguards.html
- Verdictum: https://www.verdictum.in/supreme-court/qualification-section-39-bsa-not-restricted-section-79a-it-act-examiners-forensics-sign-part-b-certificate-1614860
- LiveLaw (Saxena): https://www.livelaw.in/articles/bharatiya-sakshya-adhiniyam-transformed-digital-evidence-552681
- LiveLaw (Makhija & Sharma): https://www.livelaw.in/articles/unseen-burden-electronic-evidence-546749
- LiveLaw, Madras HC R v B: https://www.livelaw.in/high-court/madras-high-court/madras-high-court-section-63-bsa-meity-notify-experts-within-3-months-274015
- LiveLaw, Delhi HC PIL: https://www.livelaw.in/high-court/delhi-high-court/electronic-evidence-pil-free-forensic-assistance-for-legal-aid-beneficiaries-546492
- LiveLaw, AP HC X v Y: https://www.livelaw.in/high-court/andhra-pradesh-high-court/andhra-pradesh-high-court-section-65b-electronic-evidence-self-certificate-whatsapp-533986
- LiveLaw, Dell v Adeel Feroze: https://www.livelaw.in/high-court/delhi-high-court/whatsapp-conversations-cant-be-read-as-evidence-without-mandatory-certificate-under-evidence-act-delhi-high-court-262312
- SCC Times, Dell: https://www.scconline.com/blog/post/2024/07/06/delhi-high-court-whatsapp-chats-inadmissible-evidence-without-proper-certification-rejects-dell-international-services-delay-condonation/
- Law Today Live, Nirmal Malakar (HP HC): https://www.lawtodaylive.com/judgment/10d2d94966c66c690ed4cdfe5e8347ad
