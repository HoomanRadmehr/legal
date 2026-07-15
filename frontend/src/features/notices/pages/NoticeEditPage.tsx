import { useNavigate, useParams } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canEditMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { NoticeForm } from "../components/NoticeForm";
import { noticeText } from "../components/noticeLabels";
import { useNoticeDetail, useUpdateNotice } from "../hooks";
import type { NoticeUpdateInput } from "../types";
import { NoticePageShell } from "./NoticePageShell";

export function NoticeEditPage() {
  const { noticeId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const labels = noticeText(locale);
  const detail = useNoticeDetail(noticeId ?? "");
  const mutation = useUpdateNotice(noticeId ?? "");
  const role = session?.membership.role ?? "";

  if (!noticeId) {
    return <NotFoundState title={labels.notFound} />;
  }
  if (!canEditMatter(role)) {
    return (
      <NoticePageShell>
        <ForbiddenState message={labels.viewerReadonly} />
      </NoticePageShell>
    );
  }

  return (
    <NoticePageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={labels.edit}
        actions={
          <button
            onClick={() => navigate(`/notices/${noticeId}`)}
            type="button"
          >
            {labels.backToDetail}
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
      {detail.isError ? (
        <NoticeDetailError error={detail.error} labels={labels} />
      ) : null}
      {detail.data ? (
        <NoticeForm
          initialNotice={detail.data}
          mode="edit"
          mutationError={mutation.error}
          onSubmit={(input) => mutation.mutateAsync(input as NoticeUpdateInput)}
        />
      ) : null}
    </NoticePageShell>
  );
}

function NoticeDetailError({
  error,
  labels,
}: {
  error: Error;
  labels: ReturnType<typeof noticeText>;
}) {
  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title={labels.notFound}
        message={labels.notFoundMessage}
      />
    );
  }
  return <ErrorState title={labels.error} message={error.message} />;
}
