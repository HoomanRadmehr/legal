import { isApiError } from "../../../api/errors";

export function TaskMutationError({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }
  if (isApiError(error) && error.code === "task_version_conflict") {
    return (
      <p className="task-alert" role="alert">
        This task changed while you were working. Reload before saving to avoid
        overwriting work.
      </p>
    );
  }
  if (isApiError(error) && error.code === "task_state_conflict") {
    return (
      <p className="task-alert" role="alert">
        The task is already in a final state. Refresh to see the latest status.
      </p>
    );
  }
  if (isApiError(error) && error.code === "task_assignee_invalid") {
    return (
      <p className="task-alert" role="alert">
        Select an active assignee from this organization.
      </p>
    );
  }
  if (isApiError(error) && error.status === 429) {
    return (
      <p className="task-alert" role="alert">
        Too many requests. Try again
        {error.retryAfterSeconds
          ? ` in ${error.retryAfterSeconds} seconds`
          : ""}
        .
      </p>
    );
  }
  return (
    <p className="task-alert" role="alert">
      {error instanceof Error ? error.message : "The action failed."}
    </p>
  );
}
