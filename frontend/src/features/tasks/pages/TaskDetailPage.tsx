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
import { useCancelTask, useCompleteTask, useTaskDetail } from "../hooks";
import { TaskPageShell } from "./TaskPageShell";

type PendingAction = "cancel" | "complete" | null;

export function TaskDetailPage() {
  const { taskId } = useParams();
  const { session } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const detail = useTaskDetail(taskId ?? "");
  const completeMutation = useCompleteTask(taskId ?? "");
  const cancelMutation = useCancelTask(taskId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!taskId) {
    return <NotFoundState title="Task not found" />;
  }

  return (
    <TaskPageShell>
      <PageHeader
        eyebrow="Tasks"
        title={detail.data?.title ?? "Task detail"}
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
      {detail.isLoading ? <LoadingState label="Loading task" /> : null}
      {detail.isError ? <TaskDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="task-alert">Viewer access is read-only.</p>
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
  if (!canMutate || !isOpen) {
    return null;
  }

  return (
    <>
      <Link to={`/tasks/${taskId}/edit`}>Edit task</Link>
      <button type="button" onClick={onComplete}>
        Complete task
      </button>
      <button type="button" onClick={onCancel}>
        Cancel task
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
  if (action === "complete") {
    return (
      <ConfirmationDialog
        confirmLabel="Complete task"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Complete task"
      >
        Mark this task done. Repeating the action returns the completed state.
      </ConfirmationDialog>
    );
  }
  return (
    <ConfirmationDialog
      confirmLabel="Cancel task"
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={action === "cancel"}
      title="Cancel task"
    >
      Cancel this task without deleting the record.
    </ConfirmationDialog>
  );
}

function TaskDetailError({ error }: { error: Error }) {
  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title="Task not found"
        message="The task could not be found."
      />
    );
  }
  return <ErrorState title="Task unavailable" message={error.message} />;
}

function isOpenTask(status: string | undefined): boolean {
  return status === "todo" || status === "in_progress";
}
