import { useAuth } from "../auth";
import { canRunOffboarding } from "../auth/permissions";
import { ForbiddenState, NotFoundState } from "../components/standardStates";
import { AppShell, RoleActionBar } from "../components/layout/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { useI18n } from "../i18n";

export function PublicLoginPage() {
  return <LoginPage />;
}

export function ProtectedAppShellPage() {
  const { logout, session } = useAuth();
  const { t } = useI18n();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <section aria-labelledby="dashboard-title">
        <p className="app-kicker">{t("layout.workspace")}</p>
        <h1 id="dashboard-title">{t("layout.navigation.dashboard")}</h1>
        <p className="app-muted">
          {t("layout.signedInAsName", { name: session.user.display_name })}
        </p>
        <RoleActionBar role={session.membership.role} />
      </section>
    </AppShell>
  );
}

export function AdminOffboardingPage() {
  const { logout, session } = useAuth();
  const { t } = useI18n();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {canRunOffboarding(session.membership.role) ? (
        <section aria-labelledby="offboarding-title">
          <p className="app-kicker">{t("layout.navigation.admin")}</p>
          <h1 id="offboarding-title">
            {t("layout.navigation.offboarding")}
          </h1>
        </section>
      ) : (
        <ForbiddenState />
      )}
    </AppShell>
  );
}

export function ConfidentialRecordNotFoundPage() {
  const { logout, session } = useAuth();
  const { t } = useI18n();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <NotFoundState
        title={t("routes.confidentialRecord.title")}
        message={t("routes.confidentialRecord.message")}
      />
    </AppShell>
  );
}
