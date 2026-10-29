import type { DeviceGuide } from "../../../sakshya/devices/guide-types";

const CONFIDENCE_NOTE = {
  official: null,
  reliable: "from a reliable third-party source",
  unverified: "not confirmed: check on your device",
} as const;

export function DeviceGuidePanel({ guide }: { guide: DeviceGuide }) {
  return (
    <div className="guide">
      <h3>How to find the details: {guide.title}</h3>
      <p>{guide.summary}</p>
      <p className="small">Open the part you need. Steps marked "not confirmed" could not be checked against an official source.</p>
      {guide.sections.map((s) => (
        <details key={s.id} className="guide-section">
          <summary>
            {s.title}{" "}
            <span className="small">
              ({s.steps.length} step{s.steps.length === 1 ? "" : "s"})
            </span>
          </summary>
          <ol>
            {s.steps.map((step, i) => (
              <li key={i}>
                {step.text}
                {CONFIDENCE_NOTE[step.confidence] && <span className="conf">({CONFIDENCE_NOTE[step.confidence]})</span>}
                {step.path && <code className="path">{step.path}</code>}
              </li>
            ))}
          </ol>
        </details>
      ))}
      {guide.cautions.length > 0 && (
        <details className="guide-section">
          <summary>Take care ({guide.cautions.length})</summary>
          <ul>
            {guide.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      )}
      {guide.sources.length > 0 && (
        <details>
          <summary className="small">Sources for these steps</summary>
          <ul className="small">
            {guide.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer noopener">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
