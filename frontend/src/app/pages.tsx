import { useAuth } from "../auth";
import { canRunOffboarding } from "../auth/permissions";
import { ForbiddenState, NotFoundState } from "../components/standardStates";
import { AppShell, RoleActionBar } from "../components/layout/AppShell";
import { LoginPage } from "../features/auth/LoginPage";

export function PublicLoginPage() {
  return <LoginPage />;
}

export function ProtectedAppShellPage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <section aria-labelledby="dashboard-title">
        <p className="app-kicker">Legal workspace</p>
        <h1 id="dashboard-title">Dashboard</h1>
        <p className="app-muted">
          Signed in as {session.user.display_name}. Work queues and matter
          summaries will appear here as feature screens are added.
        </p>
        <RoleActionBar role={session.membership.role} />
      </section>
    </AppShell>
  );
}

export function AdminOffboardingPage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {canRunOffboarding(session.membership.role) ? (
        <section aria-labelledby="offboarding-title">
          <p className="app-kicker">Administration</p>
          <h1 id="offboarding-title">Offboarding</h1>
          <p className="app-muted">
            Offboarding preview and execution controls will mount here.
          </p>
        </section>
      ) : (
        <ForbiddenState
          title="Access denied"
          message="This administrative page is not available for your role."
        />
      )}
    </AppShell>
  );
}

export function ConfidentialRecordNotFoundPage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <NotFoundState
        title="Record not found"
        message="The record could not be found."
      />
    </AppShell>
  );
}
