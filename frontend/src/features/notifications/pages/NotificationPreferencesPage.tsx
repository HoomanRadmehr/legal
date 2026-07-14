import { Link } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { NotificationPreferenceForm } from "../components/NotificationPreferenceForm";
import {
  useNotificationPreferences,
  useSaveNotificationPreferences,
} from "../hooks";
import "../notifications.css";

export function NotificationPreferencesPage() {
  const preferences = useNotificationPreferences();
  const savePreferences = useSaveNotificationPreferences();

  return (
    <main className="notification-page">
      <PageHeader
        eyebrow="Settings"
        title="Notification preferences"
        description="Choose channels for your own notification events."
        actions={<Link to="/notifications">Notification center</Link>}
      />
      <p className="notification-provider-note">
        Provider availability is enforced by the backend. SMS and push delivery
        may be skipped safely when providers are not configured.
      </p>
      {preferences.isLoading ? (
        <LoadingState label="Loading notification preferences" />
      ) : null}
      {preferences.isError ? (
        <PreferenceError error={preferences.error} />
      ) : null}
      {preferences.data ? (
        <NotificationPreferenceForm
          error={saveError(savePreferences.error)}
          onSubmit={(input) => savePreferences.mutate(input)}
          preferences={preferences.data}
          saving={savePreferences.isPending}
        />
      ) : null}
    </main>
  );
}

function PreferenceError({ error }: { error: Error }) {
  return (
    <ErrorState
      title="Preferences unavailable"
      message={saveError(error) ?? "The request could not be completed."}
      retryAfterSeconds={
        isApiError(error) ? error.retryAfterSeconds : undefined
      }
    />
  );
}

function saveError(error: unknown): string | undefined {
  if (!error) {
    return undefined;
  }
  if (isApiError(error)) {
    return error.message;
  }
  return error instanceof Error ? error.message : "The request failed.";
}
