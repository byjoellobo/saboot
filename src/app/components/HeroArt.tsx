// Home illustration: a certificate sheet on the file, stamped with a record
// label and the HASHED mark. Drawn in the app's own palette; decorative only.
const QR = [
  "1111111010111111",
  "1000001001100001",
  "1011101110101101",
  "1011101011101101",
  "1000001100100001",
  "1111111010111111",
  "0000000111000000",
  "1101011001011010",
  "0110110110100111",
  "1011001011011001",
  "0000000101100110",
  "1111111011001011",
  "1000001110110100",
  "1011101001011011",
  "1000001110100110",
  "1111111010011101",
];

export function HeroArt() {
  const cell = 3.4;
  return (
    <svg viewBox="0 0 360 420" role="presentation" aria-hidden="true" focusable="false">
      <defs>
        <filter id="paper" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#403008" floodOpacity="0.28" />
        </filter>
      </defs>
      {/* sheet underneath */}
      <rect x="44" y="34" width="268" height="356" rx="3" fill="#f4eee0" transform="rotate(4 178 212)" filter="url(#paper)" />
      {/* certificate sheet */}
      <g transform="rotate(-2.5 178 212)" filter="url(#paper)">
        <rect x="40" y="26" width="276" height="362" rx="3" fill="#fffefb" />
        <line x1="70" y1="26" x2="70" y2="388" stroke="#ebc1bb" strokeWidth="1.2" />
        {/* heading lines */}
        <rect x="130" y="52" width="110" height="7" rx="2" fill="#1b2340" />
        <rect x="150" y="66" width="70" height="5" rx="2" fill="#8c8fa0" />
        <rect x="160" y="82" width="50" height="6" rx="2" fill="#1b2340" />
        {/* text lines */}
        {[104, 116, 128, 152, 164].map((y, i) => (
          <rect key={y} x="86" y={y} width={i % 2 ? 190 : 214} height="4" rx="2" fill="#c9c4b6" />
        ))}
        {/* tick boxes */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${86 + i * 56} 184)`}>
            <rect width="11" height="11" rx="1.5" fill="none" stroke="#1b2340" strokeWidth="1.3" />
            {i === 2 && (
              <path
                d="M2.2 5.8l2.6 2.6 4-5.6"
                fill="none"
                stroke="#5a3e9b"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <rect x="15" y="3.5" width="26" height="4" rx="2" fill="#c9c4b6" />
          </g>
        ))}
        {/* hash lines */}
        {[214, 226, 238].map((y) => (
          <rect key={y} x="86" y={y} width="214" height="5" rx="1" fill="#e2dccd" />
        ))}
        <rect x="86" y="214" width="150" height="5" rx="1" fill="#5f6476" opacity="0.55" />
        <rect x="86" y="226" width="186" height="5" rx="1" fill="#5f6476" opacity="0.4" />
        {/* QR code */}
        <g transform="translate(212 268)">
          <rect x="-5" y="-5" width={QR.length * cell + 10} height={QR.length * cell + 10} fill="#fff" stroke="#e2dccd" />
          {QR.flatMap((row, r) =>
            [...row].map((bit, c) =>
              bit === "1" ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1b2340" /> : null,
            ),
          )}
        </g>
        {/* signature line */}
        <line x1="86" y1="340" x2="176" y2="340" stroke="#1b2340" strokeWidth="1" />
        <rect x="96" y="348" width="70" height="4" rx="2" fill="#c9c4b6" />
      </g>
      {/* record label stamp */}
      <g transform="translate(96 252) rotate(-7)">
        <rect width="58" height="28" rx="3" fill="#f1ecfb" stroke="#5a3e9b" strokeWidth="2.4" />
        <text x="29" y="19.5" textAnchor="middle" fontFamily="Noto Sans Mono, monospace" fontSize="15" fill="#4a3083">
          R-1
        </text>
      </g>
      {/* HASHED stamp */}
      <g transform="translate(250 372) rotate(-12)" opacity="0.9">
        <ellipse cx="0" cy="0" rx="62" ry="25" fill="none" stroke="#5a3e9b" strokeWidth="2.4" />
        <ellipse cx="0" cy="0" rx="56" ry="20" fill="none" stroke="#5a3e9b" strokeWidth="1.2" />
        <text x="0" y="5.5" textAnchor="middle" fontFamily="Noto Sans Mono, monospace" fontSize="15" letterSpacing="2.5" fill="#5a3e9b">
          HASHED
        </text>
      </g>
    </svg>
  );
}
