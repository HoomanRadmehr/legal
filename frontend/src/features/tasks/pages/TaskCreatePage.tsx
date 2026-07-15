import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { TaskForm } from "../components/TaskForm";
import { taskText } from "../components/taskLabels";
import { useCreateTask } from "../hooks";
import type { TaskInput } from "../types";
import { TaskPageShell } from "./TaskPageShell";

export function TaskCreatePage() {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = taskText(locale);
  const navigate = useNavigate();
  const mutation = useCreateTask();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
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
        title={labels.create}
        description={labels.createDescription}
        actions={
          <button onClick={() => navigate("/tasks")} type="button">
            {labels.backToTasks}
          </button>
        }
      />
      <TaskForm
        assignmentMode="editable"
        mode="create"
        mutationError={mutation.error}
        onSubmit={(input) => mutation.mutateAsync(input as TaskInput)}
      />
    </TaskPageShell>
  );
}
