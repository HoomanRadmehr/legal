import { Link } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { NotificationPreferenceForm } from "../components/NotificationPreferenceForm";
import {
  useNotificationPreferences,
  useSaveNotificationPreferences,
} from "../hooks";
import { notificationText } from "../text";
import "../notifications.css";

export function NotificationPreferencesPage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <NotificationPreferencesContent />
    </AppShell>
  );
}

function NotificationPreferencesContent() {
  const { locale } = useI18n();
  const labels = notificationText(locale);
  const preferences = useNotificationPreferences();
  const savePreferences = useSaveNotificationPreferences();

  return (
    <section className="notification-page">
      <PageHeader
        eyebrow={labels.preferences}
        title={labels.preferencesTitle}
        description={labels.preferencesDescription}
        actions={<Link to="/notifications">{labels.centerTitle}</Link>}
      />
      <p className="notification-provider-note">
        {labels.providerNote}
      </p>
      {preferences.isLoading ? (
        <LoadingState label={labels.loadingPreferences} />
      ) : null}
      {preferences.isError ? (
        <PreferenceError error={preferences.error} />
      ) : null}
      {preferences.data ? (
        <NotificationPreferenceForm
          error={saveError(savePreferences.error, locale)}
          onSubmit={(input) => savePreferences.mutate(input)}
          preferences={preferences.data}
          saving={savePreferences.isPending}
        />
      ) : null}
    </section>
  );
}

function PreferenceError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const labels = notificationText(locale);

  return (
    <ErrorState
      title={labels.unavailable.preferences}
      message={saveError(error, locale) ?? labels.unavailable.request}
      retryAfterSeconds={
        isApiError(error) ? error.retryAfterSeconds : undefined
      }
    />
  );
}

function saveError(
  error: unknown,
  locale: ReturnType<typeof useI18n>["locale"] = "fa",
): string | undefined {
  const labels = notificationText(locale);
  if (!error) {
    return undefined;
  }
  if (isApiError(error)) {
    return error.message;
  }
  return error instanceof Error ? error.message : labels.unavailable.failed;
}
