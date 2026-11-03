import { useEffect, useState, type ReactElement } from "react";
import { Announcer } from "./components/Announcer";
import { useInstallPrompt } from "./components/install";
import { getSetting, setSetting } from "./state/db";
import { PRIVACY_URL, RELEASES_URL, REPO_URL } from "./links";
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
  const install = useInstallPrompt();

  useEffect(() => {
    getSetting("acknowledged-v1", false).then(setAcknowledged, () => setAcknowledged(false));
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
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={36} height={36} />
          <span>
            <span className="brand-name">Saboot</span>
            <span className="brand-tag">Electronic evidence, hashed on your own device</span>
          </span>
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="#/" aria-current={route.name === "home" ? "page" : undefined}>
            Cases
          </a>
          <a href="#/learn" aria-current={route.name === "learn" ? "page" : undefined}>
            About the certificate
          </a>
          <a href="verify.html">Check a file</a>
          {install && (
            <button type="button" className="btn link" onClick={() => void install()}>
              Install app
            </button>
          )}
        </nav>
      </header>

      <main className="desk" id="main" tabIndex={-1}>
        {route.name === "home" && <HomeScreen />}
        {route.name === "learn" && <LearnScreen />}
        {route.name === "case" && <CaseScreen key={route.id} id={route.id} step={route.step} />}
      </main>

      <footer className="foot">
        <p>
          Saboot {APP_VERSION}. Your files stay on this device. Saboot is a software tool: it is not legal advice and it is not the expert
          who signs Part B. <a href="#/learn">Read the limits</a>.
        </p>
        <nav aria-label="Project">
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer noopener">
            Privacy
          </a>
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
            Source code (AGPL-3.0)
          </a>
          <a href={RELEASES_URL} target="_blank" rel="noreferrer noopener">
            Releases
          </a>
        </nav>
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
          <span>A new version of Saboot is ready.</span>
          <button type="button" className="btn" onClick={onRefresh}>
            Reload to update
          </button>
        </div>
      )}
      {!needRefresh && showOfflineNote && (
        <div className="banner" role="status">
          <span>Saboot now works without internet on this device.</span>
          <button type="button" className="btn" onClick={() => setShowOfflineNote(false)}>
            OK
          </button>
        </div>
      )}
    </>
  );
}
