import { isApiError } from "../../../api/errors";
import { useI18n } from "../../../i18n";
import { taskText } from "./taskLabels";

export function TaskMutationError({ error }: { error: unknown }) {
  const { locale } = useI18n();
  const labels = taskText(locale);

  if (!error) {
    return null;
  }
  if (isApiError(error) && error.code === "task_version_conflict") {
    return (
      <p className="task-alert" role="alert">
        {labels.versionConflict}
      </p>
    );
  }
  if (isApiError(error) && error.code === "task_state_conflict") {
    return (
      <p className="task-alert" role="alert">
        {labels.stateConflict}
      </p>
    );
  }
  if (isApiError(error) && error.code === "task_assignee_invalid") {
    return (
      <p className="task-alert" role="alert">
        {labels.assigneeInvalid}
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
      <p className="task-alert" role="alert">
        {labels.rateLimited.replace("{{suffix}}", suffix)}
      </p>
    );
  }
  return (
    <p className="task-alert" role="alert">
      {error instanceof Error ? error.message : labels.actionFailed}
    </p>
  );
}
