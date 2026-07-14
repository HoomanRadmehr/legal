import { isApiError } from "../../../api/errors";

export function DeadlineMutationError({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }
  if (isApiError(error) && error.code === "deadline_version_conflict") {
    return (
      <p className="deadline-alert" role="alert">
        This deadline changed while you were working. Reload before saving to
        avoid overwriting work.
      </p>
    );
  }
  if (isApiError(error) && error.status === 429) {
    return (
      <p className="deadline-alert" role="alert">
        Too many requests. Try again
        {error.retryAfterSeconds
          ? ` in ${error.retryAfterSeconds} seconds`
          : ""}
        .
      </p>
    );
  }
  return (
    <p className="deadline-alert" role="alert">
      {error instanceof Error ? error.message : "The action failed."}
    </p>
  );
}
