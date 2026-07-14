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
import { NoticeMutationError } from "../components/NoticeMutationError";
import { NoticeSummary } from "../components/NoticeSummary";
import { NoticeTimeline } from "../components/NoticeTimeline";
import { useArchiveNotice, useNoticeDetail, useNoticeTimeline } from "../hooks";
import { NoticePageShell } from "./NoticePageShell";

export function NoticeDetailPage() {
  const { noticeId } = useParams();
  const { session } = useAuth();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const detail = useNoticeDetail(noticeId ?? "");
  const timeline = useNoticeTimeline(noticeId ?? "");
  const archiveMutation = useArchiveNotice(noticeId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!noticeId) {
    return <NotFoundState title="Notice not found" />;
  }

  return (
    <NoticePageShell>
      <PageHeader
        eyebrow="Legal notices"
        title={detail.data?.title ?? "Notice detail"}
        actions={
          <NoticeActions
            canMutate={canMutate}
            isArchived={Boolean(detail.data?.archived_at)}
            noticeId={noticeId}
            onArchive={() => setArchiveOpen(true)}
          />
        }
      />
      {detail.isLoading ? <LoadingState label="Loading notice" /> : null}
      {detail.isError ? <NoticeDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="notice-alert">Viewer access is read-only.</p>
          ) : null}
          <NoticeSummary notice={detail.data} />
          <section id="timeline" aria-labelledby="notice-timeline-title">
            <h2 id="notice-timeline-title">Timeline</h2>
            <NoticeTimeline
              errorMessage={timeline.error?.message}
              events={timeline.data ?? []}
              isError={timeline.isError}
              isLoading={timeline.isLoading}
            />
          </section>
          <ConfirmationDialog
            confirmLabel="Archive notice"
            onCancel={() => setArchiveOpen(false)}
            onConfirm={() => {
              setArchiveOpen(false);
              archiveMutation.mutate(detail.data.version);
            }}
            open={archiveOpen}
            title="Archive notice"
          >
            Archive keeps the notice and linked records available for permitted
            users. It is not a delete.
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
  noticeId,
  onArchive,
}: {
  canMutate: boolean;
  isArchived: boolean;
  noticeId: string;
  onArchive: () => void;
}) {
  if (!canMutate || isArchived) {
    return null;
  }

  return (
    <>
      <Link to={`/notices/${noticeId}/edit`}>Edit notice</Link>
      <button type="button" onClick={onArchive}>
        Archive notice
      </button>
    </>
  );
}

function NoticeDetailError({ error }: { error: Error }) {
  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title="Notice not found"
        message="The notice could not be found."
      />
    );
  }
  return <ErrorState title="Notice unavailable" message={error.message} />;
}
