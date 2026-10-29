import { SECTION_63_4 } from "../../sakshya/certificate/schedule";

const SOURCES = [
  {
    label: "Bharatiya Sakshya Adhiniyam, 2023 (Act 47 of 2023), Gazette of India, 25 December 2023 (section 63 and the Schedule)",
    url: "https://prsindia.org/files/bills_acts/acts_parliament/2023/The%20Bharatiya%20Sakshya%20Bill,%202023.pdf",
  },
  {
    label: "Pune Bar Association v. Union of India, W.P.(C) No. 599 of 2026, Supreme Court, order dated 22 May 2026",
    url: "https://www.livelaw.in/pdf_upload/2026/05/27/pune-bar-association-v-union-of-india-676590.pdf",
  },
  {
    label: "Samarth Saxena, \"How Bharatiya Sakshya Adhiniyam Has Transformed Digital Evidence\", LiveLaw, 2 October 2026",
    url: "https://www.livelaw.in/articles/bharatiya-sakshya-adhiniyam-transformed-digital-evidence-552681",
  },
];

export function LearnScreen() {
  return (
    <>
      <section className="sheet">
        <h1>About the section 63 certificate</h1>
        <p className="lede">
          A plain-language summary of the rule this tool helps with, what is settled, and what is not. It is not legal advice; ask an advocate
          about your case.
        </p>

        <h2>What the law asks for</h2>
        <p>
          Under section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023, a certificate "shall be submitted along with the electronic record at
          each instance where it is being submitted for admission". The form of the certificate is set out in the Schedule to the Act. It has
          two parts:
        </p>
        <ul>
          <li>
            <strong>Part A, filled by the party:</strong> who you are, which device or source the record came from (tick box, make and model,
            colour, serial number, IMEI/UIN/UID/MAC/Cloud ID), a statement that the device was under lawful control and working properly,
            whether you own, maintain, manage or operate it, and the hash value of each record.
          </li>
          <li>
            <strong>Part B, filled by an expert:</strong> the same device details and hash values, stated by the expert, with their name,
            designation and signature.
          </li>
        </ul>
        <p>
          Both parts carry the hash block ("I state that the HASH value/s of the electronic/digital record/s is ___", with boxes for SHA1,
          SHA256, MD5 or Other) and the note "(Hash report to be enclosed with the certificate)". Both are signed with the date and the time in
          IST, 24-hour format.
        </p>
        <details>
          <summary>Read section 63(4)</summary>
          <blockquote>
            <p>{SECTION_63_4}</p>
          </blockquote>
        </details>

        <h2>What a hash value is</h2>
        <p>
          A hash is a short code calculated from every bit of a file. If even one bit changes, the hash changes completely, so two files with the
          same SHA-256 value are, in practice, the same file. In Pune Bar Association v. Union of India (22 May 2026) the Supreme Court said:
          "Hash value of an electronic data is synonymous with an electronic fingerprint and provides a sure way of identifying and verifying
          digital data." The Court also noted that challenges to electronic records "are further accentuated with the advent of artificial
          intelligence and deepfake technology".
        </p>

        <h2>What is not settled</h2>
        <ul>
          <li>
            <strong>Who may sign Part B.</strong> The Supreme Court kept this question of law open. It observed that, besides an Examiner of
            Electronic Evidence notified under section 79A of the Information Technology Act, 2000, it is possible that another person may sign
            if the court is satisfied, on unimpeachable material, that they have special skill and expertise in computer science and cyber
            forensics.
          </li>
          <li>
            <strong>Whether a certificate is needed when the original device itself is produced.</strong> Under the old law the Supreme Court
            had said it was not (Arjun Panditrao Khotkar, 2020). Some commentators argue that exception no longer survives under section 63;
            at least one High Court has continued to apply it. Ask your advocate.
          </li>
          <li>
            <strong>Whether a missing certificate can be filed later.</strong> Courts have allowed extra time in some cases, but there is no
            Supreme Court ruling on this under the new Act.
          </li>
        </ul>
        <p>
          A practitioner's analysis in LiveLaw notes that "two signatures are now required where one previously served" and that the burden
          "bears most heavily on the party who does not control the device that produced the record".
        </p>

        <h2>What Sakshya Kit does, and does not do</h2>
        <ul>
          <li>It reads and hashes your files on your own device (SHA-256, SHA-1 and MD5 in one pass). Nothing is uploaded.</li>
          <li>It guides you to the identifiers of your phone, computer or CCTV recorder, and checks them for typing mistakes.</li>
          <li>It fills Part A with what you entered, drafts Part B for an expert to verify, and prints a hash report with QR codes.</li>
          <li>It turns a WhatsApp export into a page-numbered transcript where every message has its own hash and byte position.</li>
          <li>It keeps a custody log in which each entry is chained to the one before it.</li>
          <li>
            It is <strong>not</strong> a lawyer and <strong>not</strong> the expert. It cannot tell whether a record is genuine, and it cannot
            make an inadmissible record admissible.
          </li>
        </ul>
        <p>
          The only time it uses the internet is when you choose to add a trusted timestamp to a generated PDF; then only the PDF's hash is sent.
        </p>

        <h2>Sources</h2>
        <ul>
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
