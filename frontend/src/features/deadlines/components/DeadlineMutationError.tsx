import { isApiError } from "../../../api/errors";
import { useI18n } from "../../../i18n";
import { deadlineText } from "./deadlineLabels";

export function DeadlineMutationError({ error }: { error: unknown }) {
  const { locale } = useI18n();
  const labels = deadlineText(locale);

  if (!error) {
    return null;
  }
  if (isApiError(error) && error.code === "deadline_version_conflict") {
    return (
      <p className="deadline-alert" role="alert">
        {labels.versionConflict}
      </p>
    );
  }
  if (isApiError(error) && error.status === 429) {
    const suffix = error.retryAfterSeconds
      ? labels.retrySuffix.replace(
          "{{seconds}}",
          String(error.retryAfterSeconds),
        )
      : "";
    return (
      <p className="deadline-alert" role="alert">
        {labels.rateLimited.replace("{{suffix}}", suffix)}
      </p>
    );
  }
  return (
    <p className="deadline-alert" role="alert">
      {error instanceof Error ? error.message : labels.actionFailed}
    </p>
  );
}
