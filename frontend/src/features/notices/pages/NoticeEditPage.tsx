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
import { NoticeForm } from "../components/NoticeForm";
import { useNoticeDetail, useUpdateNotice } from "../hooks";
import type { NoticeUpdateInput } from "../types";
import { NoticePageShell } from "./NoticePageShell";

export function NoticeEditPage() {
  const { noticeId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useNoticeDetail(noticeId ?? "");
  const mutation = useUpdateNotice(noticeId ?? "");
  const role = session?.membership.role ?? "";

  if (!noticeId) {
    return <NotFoundState title="Notice not found" />;
  }
  if (!canEditMatter(role)) {
    return (
      <NoticePageShell>
        <ForbiddenState message="Viewer access is read-only." />
      </NoticePageShell>
    );
  }

  return (
    <NoticePageShell>
      <PageHeader
        eyebrow="Legal notices"
        title="Edit notice"
        actions={
          <button
            onClick={() => navigate(`/notices/${noticeId}`)}
            type="button"
          >
            Back to detail
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label="Loading notice" /> : null}
      {detail.isError ? <NoticeDetailError error={detail.error} /> : null}
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
