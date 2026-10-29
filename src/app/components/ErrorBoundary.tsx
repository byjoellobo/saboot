import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  readonly error: Error | null;
}

/** Last-resort screen. Case data lives in IndexedDB, so a reload is safe. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept on this device only; there is no remote error reporting.
    console.error("Sakshya Kit crashed", error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <main className="desk">
        <section className="sheet" role="alert">
          <h1>Something went wrong</h1>
          <p>Your cases are saved on this device and are not affected. Reload the page to continue.</p>
          <p className="small">Details: {this.state.error.message}</p>
          <div className="actions">
            <button type="button" className="btn" onClick={() => window.location.assign(window.location.pathname)}>
              Reload
            </button>
          </div>
        </section>
      </main>
    );
  }
}
