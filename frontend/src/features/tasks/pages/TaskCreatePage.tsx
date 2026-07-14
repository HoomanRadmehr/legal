import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { TaskForm } from "../components/TaskForm";
import { useCreateTask } from "../hooks";
import type { TaskInput } from "../types";
import { TaskPageShell } from "./TaskPageShell";

export function TaskCreatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateTask();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
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
        title="Create task"
        description="Create a matter-linked task with an active assignee."
        actions={
          <button onClick={() => navigate("/tasks")} type="button">
            Back to tasks
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
