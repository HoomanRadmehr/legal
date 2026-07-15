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
import { useI18n } from "../../../i18n";
import { TaskForm } from "../components/TaskForm";
import { taskText } from "../components/taskLabels";
import { useTaskDetail, useUpdateTask } from "../hooks";
import type { TaskUpdateInput } from "../types";
import { TaskPageShell } from "./TaskPageShell";

export function TaskEditPage() {
  const { taskId } = useParams();
  const { locale } = useI18n();
  const labels = taskText(locale);
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useTaskDetail(taskId ?? "");
  const mutation = useUpdateTask(taskId ?? "");
  const role = session?.membership.role ?? "";

  if (!taskId) {
    return <NotFoundState title={labels.notFound} />;
  }
  if (!canEditMatter(role)) {
    return (
      <TaskPageShell>
        <ForbiddenState message={labels.viewerReadonly} />
      </TaskPageShell>
    );
  }

  return (
    <TaskPageShell>
      <PageHeader
        eyebrow={labels.listTitle}
        title={labels.edit}
        actions={
          <button onClick={() => navigate(`/tasks/${taskId}`)} type="button">
            {labels.backToDetail}
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
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
