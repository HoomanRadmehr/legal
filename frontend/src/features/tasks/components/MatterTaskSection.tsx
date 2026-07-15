import { useState } from "react";

import { ConfirmationDialog } from "../../../components/confirmationDialog";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import {
  useCancelTaskAction,
  useCompleteTaskAction,
  useTaskList,
} from "../hooks";
import type { TaskListItem } from "../types";
import { TaskListTable } from "./TaskListTable";
import { taskText } from "./taskLabels";
import { TaskMutationError } from "./TaskMutationError";

const MATTER_TASK_PAGE_SIZE = 20;

type PendingTaskAction = {
  task: TaskListItem;
  type: "cancel" | "complete";
} | null;

export function MatterTaskSection({
  canMutate,
  matterId,
}: {
  canMutate: boolean;
  matterId: string;
}) {
  const { locale } = useI18n();
  const labels = taskText(locale);
  const [pendingAction, setPendingAction] = useState<PendingTaskAction>(null);
  const query = useTaskList({ matter: matterId, ordering: "due_at" });
  const completeMutation = useCompleteTaskAction();
  const cancelMutation = useCancelTaskAction();

  return (
    <section
      aria-labelledby="matter-tasks-title"
      className="task-matter-section"
    >
      <h2 id="matter-tasks-title">{labels.listTitle}</h2>
      {query.isLoading ? <LoadingState label={labels.loadingList} /> : null}
      {query.isError ? (
        <ErrorState title={labels.error} message={query.error.message} />
      ) : null}
      {query.data ? (
        <>
          <TaskListTable
            caption={labels.matterTasks}
            page={1}
            pageCount={pageCount(query.data.count)}
            rows={query.data.results}
          />
          <MatterTaskActions
            canMutate={canMutate}
            onCancel={setPendingAction}
            onComplete={setPendingAction}
            tasks={query.data.results}
          />
        </>
      ) : null}
      <MatterTaskConfirmation
        action={pendingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction?.type === "complete") {
            completeMutation.mutate({
              taskId: pendingAction.task.id,
              version: pendingAction.task.version,
            });
          }
          if (pendingAction?.type === "cancel") {
            cancelMutation.mutate({
              taskId: pendingAction.task.id,
              version: pendingAction.task.version,
            });
          }
          setPendingAction(null);
        }}
      />
      <TaskMutationError error={completeMutation.error} />
      <TaskMutationError error={cancelMutation.error} />
    </section>
  );
}

function MatterTaskActions({
  canMutate,
  onCancel,
  onComplete,
  tasks,
}: {
  canMutate: boolean;
  onCancel: (action: PendingTaskAction) => void;
  onComplete: (action: PendingTaskAction) => void;
  tasks: TaskListItem[];
}) {
  const { locale } = useI18n();
  const labels = taskText(locale);

  if (!canMutate) {
    return null;
  }

  const openTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress",
  );
  return (
    <div className="task-inline-actions" aria-label={labels.matterTasks}>
      {openTasks.map((task) => (
        <div key={task.id}>
          <span>{task.title}</span>
          <button
            type="button"
            onClick={() => onComplete({ task, type: "complete" })}
          >
            {labels.complete}
          </button>
          <button
            type="button"
            onClick={() => onCancel({ task, type: "cancel" })}
          >
            {labels.cancel}
          </button>
        </div>
      ))}
    </div>
  );
}

function MatterTaskConfirmation({
  action,
  onCancel,
  onConfirm,
}: {
  action: PendingTaskAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { locale } = useI18n();
  const labels = taskText(locale);

  if (action?.type === "complete") {
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
      open={action?.type === "cancel"}
      title={labels.cancel}
    >
      {labels.cancelBody}
    </ConfirmationDialog>
  );
}

function pageCount(count: number): number {
  return Math.max(1, Math.ceil(count / MATTER_TASK_PAGE_SIZE));
}
