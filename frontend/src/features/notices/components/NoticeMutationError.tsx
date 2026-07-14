import { isApiError } from "../../../api/errors";

export function NoticeMutationError({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }
  if (isApiError(error) && error.code === "notice_version_conflict") {
    return (
      <p className="notice-alert" role="alert">
        This notice changed while you were editing. Reload before saving to
        avoid overwriting work.
      </p>
    );
  }
  if (isApiError(error) && error.code === "notice_response_date_invalid") {
    return (
      <p className="notice-alert" role="alert">
        Response deadline cannot precede received date.
      </p>
    );
  }
  if (isApiError(error) && error.status === 404) {
    return (
      <p className="notice-alert" role="alert">
        A related matter was not found or is not visible.
      </p>
    );
  }
  return (
    <p className="notice-alert" role="alert">
      {error instanceof Error ? error.message : "The action failed."}
    </p>
  );
}
