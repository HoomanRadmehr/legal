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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const detail = useDeadlineDetail(deadlineId ?? "");
  const completeMutation = useCompleteDeadline(deadlineId ?? "");
  const cancelMutation = useCancelDeadline(deadlineId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!deadlineId) {
    return <NotFoundState title="Deadline not found" />;
  }

  return (
    <DeadlinePageShell>
      <PageHeader
        eyebrow="Deadlines"
        title={detail.data?.title ?? "Deadline detail"}
        actions={
          <DeadlineActions
            canMutate={canMutate}
            deadlineId={deadlineId}
            isOpen={detail.data?.status === "open"}
            onCancel={() => setPendingAction("cancel")}
            onComplete={() => setPendingAction("complete")}
          />
        }
      />
      {detail.isLoading ? <LoadingState label="Loading deadline" /> : null}
      {detail.isError ? <DeadlineDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="deadline-alert">Viewer access is read-only.</p>
          ) : null}
          <DeadlineSummary deadline={detail.data} />
          <DeadlineConfirmation
            action={pendingAction}
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
  onCancel,
  onComplete,
}: {
  canMutate: boolean;
  deadlineId: string;
  isOpen: boolean;
  onCancel: () => void;
  onComplete: () => void;
}) {
  if (!canMutate || !isOpen) {
    return null;
  }

  return (
    <>
      <Link to={`/deadlines/${deadlineId}/edit`}>Edit deadline</Link>
      <button type="button" onClick={onComplete}>
        Complete deadline
      </button>
      <button type="button" onClick={onCancel}>
        Cancel deadline
      </button>
    </>
  );
}

function DeadlineConfirmation({
  action,
  onCancel,
  onConfirm,
}: {
  action: PendingAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (action === "complete") {
    return (
      <ConfirmationDialog
        confirmLabel="Complete deadline"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Complete deadline"
      >
        Mark this deadline completed. Repeating the action returns the completed
        state from the backend.
      </ConfirmationDialog>
    );
  }
  return (
    <ConfirmationDialog
      confirmLabel="Cancel deadline"
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={action === "cancel"}
      title="Cancel deadline"
    >
      Cancel this deadline without deleting the record.
    </ConfirmationDialog>
  );
}

function DeadlineDetailError({ error }: { error: Error }) {
  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title="Deadline not found"
        message="The deadline could not be found."
      />
    );
  }
  return <ErrorState title="Deadline unavailable" message={error.message} />;
}
