import { EmptyState, LoadingState } from "../components/standardStates";

export function PublicLoginPage() {
  return (
    <main className="app-shell app-shell--public">
      <section className="app-panel" aria-labelledby="login-title">
        <p className="app-kicker">Public route</p>
        <h1 id="login-title">Sign in</h1>
        <p className="app-muted">
          Authentication workflow will be implemented in its dedicated task.
        </p>
      </section>
    </main>
  );
}

export function ProtectedAppShellPage() {
  return (
    <main className="app-shell" aria-labelledby="workspace-title">
      <section className="app-panel">
        <p className="app-kicker">Protected route</p>
        <h1 id="workspace-title">Legal workspace</h1>
        <p className="app-muted">
          Authenticated case, contract, notice, deadline, and document pages
          will mount here.
        </p>
        <div className="app-state-row" aria-label="Standard states preview">
          <LoadingState label="Loading workspace" />
          <EmptyState
            title="No records yet"
            message="Create flows will appear in their feature tasks."
          />
        </div>
      </section>
    </main>
  );
}
