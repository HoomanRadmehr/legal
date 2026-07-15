import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canEditMatter } from "../../../auth/permissions";
import { isApiError } from "../../../api/errors";
import { ConfirmationDialog } from "../../../components/confirmationDialog";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { deadlineText } from "../components/deadlineLabels";
import { DeadlineMutationError } from "../components/DeadlineMutationError";
import { DeadlineSummary } from "../components/DeadlineSummary";
import {
  useCancelDeadline,
  useCompleteDeadline,
  useDeadlineDetail,
} from "../hooks";
import { DeadlinePageShell } from "./DeadlinePageShell";

type PendingAction = "cancel" | "complete" | null;

export function DeadlineDetailPage() {
  const { deadlineId } = useParams();
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = deadlineText(locale);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const detail = useDeadlineDetail(deadlineId ?? "");
  const completeMutation = useCompleteDeadline(deadlineId ?? "");
  const cancelMutation = useCancelDeadline(deadlineId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!deadlineId) {
    return <NotFoundState title={labels.notFound} />;
  }

  return (
    <DeadlinePageShell>
      <PageHeader
        eyebrow={labels.listTitle}
        title={detail.data?.title ?? labels.detail}
        actions={
          <DeadlineActions
            canMutate={canMutate}
            deadlineId={deadlineId}
            isOpen={detail.data?.status === "open"}
            labels={labels}
            onCancel={() => setPendingAction("cancel")}
            onComplete={() => setPendingAction("complete")}
          />
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
      {detail.isError ? (
        <DeadlineDetailError error={detail.error} labels={labels} />
      ) : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="deadline-alert">{labels.viewerReadonly}</p>
          ) : null}
          <DeadlineSummary deadline={detail.data} />
          <DeadlineConfirmation
            action={pendingAction}
            labels={labels}
            onCancel={() => setPendingAction(null)}
            onConfirm={() => {
              setPendingAction(null);
              if (pendingAction === "complete") {
                completeMutation.mutate(detail.data.version);
              }
              if (pendingAction === "cancel") {
                cancelMutation.mutate(detail.data.version);
              }
            }}
          />
          <DeadlineMutationError error={completeMutation.error} />
          <DeadlineMutationError error={cancelMutation.error} />
        </>
      ) : null}
    </DeadlinePageShell>
  );
}

function DeadlineActions({
  canMutate,
  deadlineId,
  isOpen,
  labels,
  onCancel,
  onComplete,
}: {
  canMutate: boolean;
  deadlineId: string;
  isOpen: boolean;
  labels: ReturnType<typeof deadlineText>;
  onCancel: () => void;
  onComplete: () => void;
}) {
  if (!canMutate || !isOpen) {
    return null;
  }

  return (
    <>
      <Link to={`/deadlines/${deadlineId}/edit`}>{labels.edit}</Link>
      <button type="button" onClick={onComplete}>
        {labels.complete}
      </button>
      <button type="button" onClick={onCancel}>
        {labels.cancel}
      </button>
    </>
  );
}

function DeadlineConfirmation({
  action,
  labels,
  onCancel,
  onConfirm,
}: {
  action: PendingAction;
  labels: ReturnType<typeof deadlineText>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (action === "complete") {
    return (
      <ConfirmationDialog
        confirmLabel={labels.complete}
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title={labels.complete}
      >
        {labels.completeBody}
      </ConfirmationDialog>
    );
  }
  return (
    <ConfirmationDialog
      confirmLabel={labels.cancel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={action === "cancel"}
      title={labels.cancel}
    >
      {labels.cancelBody}
    </ConfirmationDialog>
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
