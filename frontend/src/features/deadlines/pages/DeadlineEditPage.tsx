import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canEditMatter } from "../../../auth/permissions";
import { isApiError } from "../../../api/errors";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { deadlineText } from "../components/deadlineLabels";
import { DeadlineForm } from "../components/DeadlineForm";
import { useDeadlineDetail, useUpdateDeadline } from "../hooks";
import type { DeadlineUpdateInput } from "../types";
import { DeadlinePageShell } from "./DeadlinePageShell";

export function DeadlineEditPage() {
  const { deadlineId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const labels = deadlineText(locale);
  const detail = useDeadlineDetail(deadlineId ?? "");
  const mutation = useUpdateDeadline(deadlineId ?? "");
  const role = session?.membership.role ?? "";

  if (!deadlineId) {
    return <NotFoundState title={labels.notFound} />;
  }
  if (!canEditMatter(role)) {
    return (
      <DeadlinePageShell>
        <ForbiddenState message={labels.viewerReadonly} />
      </DeadlinePageShell>
    );
  }

  return (
    <DeadlinePageShell>
      <PageHeader
        eyebrow={labels.listTitle}
        title={labels.edit}
        actions={
          <button
            onClick={() => navigate(`/deadlines/${deadlineId}`)}
            type="button"
          >
            {labels.backToDetail}
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
      {detail.isError ? (
        <DeadlineDetailError error={detail.error} labels={labels} />
      ) : null}
      {detail.data ? (
        <DeadlineForm
          initialDeadline={detail.data}
          mode="edit"
          mutationError={mutation.error}
          onSubmit={(input) =>
            mutation.mutateAsync(input as DeadlineUpdateInput)
          }
        />
      ) : null}
    </DeadlinePageShell>
  );
}

function DeadlineDetailError({
  error,
  labels,
}: {
  error: Error;
  labels: ReturnType<typeof deadlineText>;
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
