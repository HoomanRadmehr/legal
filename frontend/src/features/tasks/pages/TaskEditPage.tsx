import { useNavigate, useParams } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canEditMatter, canChangeMatterOwner } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { TaskForm } from "../components/TaskForm";
import { useTaskDetail, useUpdateTask } from "../hooks";
import type { TaskUpdateInput } from "../types";
import { TaskPageShell } from "./TaskPageShell";

export function TaskEditPage() {
  const { taskId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useTaskDetail(taskId ?? "");
  const mutation = useUpdateTask(taskId ?? "");
  const role = session?.membership.role ?? "";

  if (!taskId) {
    return <NotFoundState title="Task not found" />;
  }
  if (!canEditMatter(role)) {
    return (
      <TaskPageShell>
        <ForbiddenState message="Viewer access is read-only." />
      </TaskPageShell>
    );
  }

  return (
    <TaskPageShell>
      <PageHeader
        eyebrow="Tasks"
        title="Edit task"
        actions={
          <button onClick={() => navigate(`/tasks/${taskId}`)} type="button">
            Back to detail
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label="Loading task" /> : null}
      {detail.isError ? <TaskDetailError error={detail.error} /> : null}
      {detail.data ? (
        <TaskForm
          assignmentMode={canChangeMatterOwner(role) ? "editable" : "locked"}
          initialTask={detail.data}
          mode="edit"
          mutationError={mutation.error}
          onSubmit={(input) => mutation.mutateAsync(input as TaskUpdateInput)}
        />
      ) : null}
    </TaskPageShell>
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
