import { useEffect, useState, type ReactElement } from "react";
import { Announcer } from "./components/Announcer";
import { getSetting, requestPersistence, setSetting } from "./state/db";
import { useRoute } from "./router";
import { HomeScreen } from "./screens/HomeScreen";
import { CaseScreen } from "./screens/CaseScreen";
import { LearnScreen } from "./screens/LearnScreen";
import { FirstRunDialog } from "./screens/FirstRunDialog";
import { APP_VERSION } from "./version";

export interface AppProps {
  readonly needRefresh: boolean;
  readonly onRefresh: () => void;
  readonly offlineReady: boolean;
}

export function App({ needRefresh, onRefresh, offlineReady }: AppProps): ReactElement {
  const route = useRoute();
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const [showOfflineNote, setShowOfflineNote] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    getSetting("acknowledged-v1", false).then(setAcknowledged, () => setAcknowledged(false));
    requestPersistence().then(setPersisted, () => setPersisted(false));
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    setShowOfflineNote(true);
    const t = setTimeout(() => setShowOfflineNote(false), 6000);
    return () => clearTimeout(t);
  }, [offlineReady]);

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          // Do not change the hash: it is used for routing.
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <Announcer />
      <header className="topbar">
        <a className="brand" href="#/">
          <img src="/logo.svg" alt="" width={34} height={34} />
          <span>Sakshya Kit</span>
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="#/" aria-current={route.name === "home" ? "page" : undefined}>
            Cases
          </a>
          <a href="#/learn" aria-current={route.name === "learn" ? "page" : undefined}>
            About the certificate
          </a>
          <a href="verify.html">Check a file</a>
        </nav>
      </header>

      <main className="desk" id="main" tabIndex={-1}>
        {persisted === false && route.name !== "learn" && (
          <div className="notice warn" role="note">
            This browser has not promised to keep Sakshya Kit's data, so it may clear your cases if the device runs low on space. Download a
            backup of each case from its Generate step.
          </div>
        )}
        {route.name === "home" && <HomeScreen />}
        {route.name === "learn" && <LearnScreen />}
        {route.name === "case" && <CaseScreen key={route.id} id={route.id} step={route.step} />}
      </main>

      <footer className="foot">
        Sakshya Kit {APP_VERSION}. Your files stay on this device. This is a software tool, not legal advice and not an expert.{" "}
        <a href="#/learn">Read the limits</a>.
      </footer>

      {acknowledged === false && (
        <FirstRunDialog
          onAccept={async () => {
            await setSetting("acknowledged-v1", true);
            setAcknowledged(true);
          }}
        />
      )}

      {needRefresh && (
        <div className="banner" role="status">
          <span>A new version of Sakshya Kit is ready.</span>
          <button type="button" className="btn" onClick={onRefresh}>
            Reload to update
          </button>
        </div>
      )}
      {!needRefresh && showOfflineNote && (
        <div className="banner" role="status">
          <span>Sakshya Kit now works without internet on this device.</span>
          <button type="button" className="btn" onClick={() => setShowOfflineNote(false)}>
            OK
          </button>
        </div>
      )}
    </>
  );
}
