import { useEffect, useState } from "react";

// One persistent, visually hidden live region. Regions created together with
// their content are often not read out, so everything is announced here.
type Listener = (text: string) => void;
const listeners = new Set<Listener>();

export function announce(text: string): void {
  for (const l of listeners) l(text);
}

export function Announcer() {
  const [text, setText] = useState("");
  useEffect(() => {
    const listener: Listener = (t) => {
      // Clear first so repeating the same message is announced again.
      setText("");
      requestAnimationFrame(() => setText(t));
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return (
    <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      {text}
    </div>
  );
}
