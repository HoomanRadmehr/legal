import { isApiError } from "../../../api/errors";
import { useI18n } from "../../../i18n";
import { noticeText } from "./noticeLabels";

export function NoticeMutationError({ error }: { error: unknown }) {
  const { locale } = useI18n();
  const labels = noticeText(locale);

  if (!error) {
    return null;
  }
  if (isApiError(error) && error.code === "notice_version_conflict") {
    return (
      <p className="notice-alert" role="alert">
        {labels.versionConflict}
      </p>
    );
  }
  if (isApiError(error) && error.code === "notice_response_date_invalid") {
    return (
      <p className="notice-alert" role="alert">
        {labels.responseDateInvalid}
      </p>
    );
  }
  if (isApiError(error) && error.status === 404) {
    return (
      <p className="notice-alert" role="alert">
        {labels.relatedMatterNotFound}
      </p>
    );
  }
  return (
    <p className="notice-alert" role="alert">
      {error instanceof Error ? error.message : labels.actionFailed}
    </p>
  );
}
