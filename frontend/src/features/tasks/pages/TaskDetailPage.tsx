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
import { TaskMutationError } from "../components/TaskMutationError";
import { TaskSummary } from "../components/TaskSummary";
import { taskText } from "../components/taskLabels";
import { useI18n } from "../../../i18n";
import { useCancelTask, useCompleteTask, useTaskDetail } from "../hooks";
import { TaskPageShell } from "./TaskPageShell";

type PendingAction = "cancel" | "complete" | null;

export function TaskDetailPage() {
  const { taskId } = useParams();
  const { locale } = useI18n();
  const labels = taskText(locale);
  const { session } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const detail = useTaskDetail(taskId ?? "");
  const completeMutation = useCompleteTask(taskId ?? "");
  const cancelMutation = useCancelTask(taskId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!taskId) {
    return <NotFoundState title={labels.notFound} />;
  }

  return (
    <TaskPageShell>
      <PageHeader
        eyebrow={labels.listTitle}
        title={detail.data?.title ?? labels.detail}
        actions={
          <TaskActions
            canMutate={canMutate}
            isOpen={isOpenTask(detail.data?.status)}
            onCancel={() => setPendingAction("cancel")}
            onComplete={() => setPendingAction("complete")}
            taskId={taskId}
          />
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
      {detail.isError ? <TaskDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="task-alert">{labels.viewerReadonly}</p>
          ) : null}
          <TaskSummary task={detail.data} />
          <TaskConfirmation
            action={pendingAction}
            onCancel={() => setPendingAction(null)}
            onConfirm={() => {
              if (pendingAction === "complete") {
                completeMutation.mutate(detail.data.version);
              }
              if (pendingAction === "cancel") {
                cancelMutation.mutate(detail.data.version);
              }
              setPendingAction(null);
            }}
          />
          <TaskMutationError error={completeMutation.error} />
          <TaskMutationError error={cancelMutation.error} />
        </>
      ) : null}
    </TaskPageShell>
  );
}

function TaskActions({
  canMutate,
  isOpen,
  onCancel,
  onComplete,
  taskId,
}: {
  canMutate: boolean;
  isOpen: boolean;
  onCancel: () => void;
  onComplete: () => void;
  taskId: string;
}) {
  const { locale } = useI18n();
  const labels = taskText(locale);

  if (!canMutate || !isOpen) {
    return null;
  }

  return (
    <>
      <Link to={`/tasks/${taskId}/edit`}>{labels.edit}</Link>
      <button type="button" onClick={onComplete}>
        {labels.complete}
      </button>
      <button type="button" onClick={onCancel}>
        {labels.cancel}
      </button>
    </>
  );
}

function TaskConfirmation({
  action,
  onCancel,
  onConfirm,
}: {
  action: PendingAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { locale } = useI18n();
  const labels = taskText(locale);

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

function TaskDetailError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const labels = taskText(locale);

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

function isOpenTask(status: string | undefined): boolean {
  return status === "todo" || status === "in_progress";
}
