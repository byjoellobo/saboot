import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import { ErrorBoundary } from "./app/components/ErrorBoundary";
import "./app/styles.css";

function Root() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    const updateSW = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
    setUpdate(() => () => updateSW(true));
  }, []);

  return <App needRefresh={needRefresh} offlineReady={offlineReady} onRefresh={() => void update?.()} />;
}

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");
createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);
