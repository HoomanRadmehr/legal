import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canEditMatter } from "../../../auth/permissions";
import { ConfirmationDialog } from "../../../components/confirmationDialog";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { DocumentSection } from "../../documents";
import { NoticeMutationError } from "../components/NoticeMutationError";
import { noticeText } from "../components/noticeLabels";
import { NoticeSummary } from "../components/NoticeSummary";
import { NoticeTimeline } from "../components/NoticeTimeline";
import { useArchiveNotice, useNoticeDetail, useNoticeTimeline } from "../hooks";
import { NoticePageShell } from "./NoticePageShell";

export function NoticeDetailPage() {
  const { noticeId } = useParams();
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = noticeText(locale);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const detail = useNoticeDetail(noticeId ?? "");
  const timeline = useNoticeTimeline(noticeId ?? "");
  const archiveMutation = useArchiveNotice(noticeId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!noticeId) {
    return <NotFoundState title={labels.notFound} />;
  }

  return (
    <NoticePageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={detail.data?.title ?? labels.detail}
        actions={
          <NoticeActions
            canMutate={canMutate}
            isArchived={Boolean(detail.data?.archived_at)}
            labels={labels}
            noticeId={noticeId}
            onArchive={() => setArchiveOpen(true)}
          />
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
      {detail.isError ? (
        <NoticeDetailError error={detail.error} labels={labels} />
      ) : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="notice-alert">{labels.viewerReadonly}</p>
          ) : null}
          <NoticeSummary notice={detail.data} />
          <section id="timeline" aria-labelledby="notice-timeline-title">
            <h2 id="notice-timeline-title">{labels.timeline}</h2>
            <NoticeTimeline
              errorMessage={timeline.error?.message}
              events={timeline.data ?? []}
              isError={timeline.isError}
              isLoading={timeline.isLoading}
            />
          </section>
          <DocumentSection matterId={detail.data.id} />
          <ConfirmationDialog
            confirmLabel={labels.archive}
            onCancel={() => setArchiveOpen(false)}
            onConfirm={() => {
              setArchiveOpen(false);
              archiveMutation.mutate(detail.data.version);
            }}
            open={archiveOpen}
            title={labels.archive}
          >
            {labels.archiveBody}
          </ConfirmationDialog>
          <NoticeMutationError error={archiveMutation.error} />
        </>
      ) : null}
    </NoticePageShell>
  );
}

function NoticeActions({
  canMutate,
  isArchived,
  labels,
  noticeId,
  onArchive,
}: {
  canMutate: boolean;
  isArchived: boolean;
  labels: ReturnType<typeof noticeText>;
  noticeId: string;
  onArchive: () => void;
}) {
  if (!canMutate || isArchived) {
    return null;
  }

  return (
    <>
      <Link to={`/notices/${noticeId}/edit`}>{labels.edit}</Link>
      <button type="button" onClick={onArchive}>
        {labels.archive}
      </button>
    </>
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
      <NotFoundState title={labels.notFound} message={labels.notFoundMessage} />
    );
  }
  return <ErrorState title={labels.error} message={error.message} />;
}
