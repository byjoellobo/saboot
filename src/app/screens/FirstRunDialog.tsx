import { useEffect, useRef, useState } from "react";
import { Check } from "../components/ui";

export function FirstRunDialog({ onAccept }: { onAccept: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog ref={ref} aria-labelledby="first-run-title" onCancel={(e) => e.preventDefault()}>
      <div className="sheet">
        <h2 id="first-run-title">Before you start</h2>
        <p>
          Saboot helps you prepare the certificate that courts ask for with electronic evidence (WhatsApp chats, screenshots, recordings,
          CCTV footage) under section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023.
        </p>
        <ul>
          <li>
            <strong>Your files stay on this device.</strong> They are read and hashed here and never uploaded.
          </li>
          <li>
            <strong>This is not legal advice.</strong> A wrong certificate can harm your case. Have a practising advocate review everything
            before it is filed.
          </li>
          <li>
            <strong>This tool is not the expert.</strong> Part B of the certificate must be completed and signed by an expert who checks the
            records independently. Saboot only prepares a draft for them.
          </li>
        </ul>
        <Check label="I understand these limits" checked={agree} onChange={setAgree} />
        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={!agree}
            onClick={() => {
              ref.current?.close();
              onAccept();
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </dialog>
  );
}
