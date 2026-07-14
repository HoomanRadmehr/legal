import {
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import {
  buildTaskCreateInput,
  buildTaskUpdateInput,
  buildTaskUpdateWithoutAssigneeInput,
  defaultTaskFormValues,
  taskDetailToFormValues,
  type TaskAssignmentMode,
  type TaskFormMode,
  type TaskFormValues,
} from "../schemas";
import { useTaskAssignees } from "../hooks";
import type { TaskDetail, TaskInput, TaskUpdateInput } from "../types";
import { membershipChoiceLabel, taskStatusLabel } from "./taskLabels";
import { TaskMutationError } from "./TaskMutationError";

export function TaskForm({
  assignmentMode,
  initialTask,
  mode,
  mutationError,
  onSubmit,
}: {
  assignmentMode: TaskAssignmentMode;
  initialTask?: TaskDetail;
  mode: TaskFormMode;
  mutationError: unknown;
  onSubmit: (input: TaskInput | TaskUpdateInput) => Promise<TaskDetail>;
}) {
  const navigate = useNavigate();
  const assignees = useTaskAssignees();
  const form = useForm<TaskFormValues>({
    defaultValues: initialTask ? undefined : defaultTaskFormValues(),
    values: initialTask ? taskDetailToFormValues(initialTask) : undefined,
  });
  const assigneeId = useWatch({
    control: form.control,
    name: "assignee_id",
  });

  async function submit(values: TaskFormValues) {
    form.clearErrors();
    try {
      const input = buildTaskInput(values, mode, assignmentMode);
      const savedTask = await onSubmit(input);
      navigate(`/tasks/${savedTask.id}`);
    } catch (error) {
      applyFormError(form.setError, error);
    }
  }

  return (
    <form className="task-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <FormErrorSummary errors={formErrors(form.formState.errors)} />
      <TaskMutationError error={mutationError} />
      <fieldset>
        <legend>Task details</legend>
        <label>
          Title
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          Matter ID
          <input {...form.register("matter_id")} id="matter_id" />
        </label>
        <label>
          Due date and time
          <input
            {...form.register("due_at_local")}
            id="due_at_local"
            type="datetime-local"
          />
        </label>
        <label>
          Status
          <select {...form.register("status")} id="status">
            {(["todo", "in_progress"] as const).map((status) => (
              <option key={status} value={status}>
                {taskStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <AssignmentField
        assignmentMode={assignmentMode}
        error={assignees.error}
        isError={assignees.isError}
        isLoading={assignees.isLoading}
        options={assignees.data ?? []}
        register={form.register}
        value={assigneeId ?? ""}
      />
      <label>
        Description
        <textarea {...form.register("description")} id="description" rows={4} />
      </label>
      {mode === "edit" ? (
        <input
          {...form.register("version", { valueAsNumber: true })}
          type="hidden"
        />
      ) : null}
      <div className="task-form__actions">
        <button disabled={form.formState.isSubmitting} type="submit">
          {mode === "create" ? "Create task" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function AssignmentField({
  assignmentMode,
  error,
  isError,
  isLoading,
  options,
  register,
  value,
}: {
  assignmentMode: TaskAssignmentMode;
  error: Error | null;
  isError: boolean;
  isLoading: boolean;
  options: { display_name: string; id: string; role: string }[];
  register: ReturnType<typeof useForm<TaskFormValues>>["register"];
  value: string;
}) {
  if (assignmentMode === "locked") {
    return (
      <fieldset>
        <legend>Assignment</legend>
        <p className="task-alert">
          Counsel can update task work, but reassignment is restricted.
        </p>
        <input {...register("assignee_id")} type="hidden" />
        <p>Assignee membership ID: {value || "Not selected"}</p>
      </fieldset>
    );
  }

  return (
    <fieldset>
      <legend>Assignment</legend>
      {isLoading ? <p>Loading active assignees.</p> : null}
      {isError ? (
        <p className="task-alert">
          {error?.message ?? "Assignees unavailable."}
        </p>
      ) : null}
      <label>
        Active assignee
        <select {...register("assignee_id")} id="assignee_id">
          <option value="">Select active assignee</option>
          {options.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {membershipChoiceLabel(choice)}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

function buildTaskInput(
  values: TaskFormValues,
  mode: TaskFormMode,
  assignmentMode: TaskAssignmentMode,
) {
  if (mode === "create") {
    return buildTaskCreateInput(values);
  }
  if (assignmentMode === "locked") {
    return buildTaskUpdateWithoutAssigneeInput(values);
  }
  return buildTaskUpdateInput(values);
}

function applyFormError(
  setError: ReturnType<typeof useForm<TaskFormValues>>["setError"],
  error: unknown,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as FieldPath<TaskFormValues>, {
        message: issue.message,
      });
    }
    return;
  }
  if (isApiError(error) && error.code === "task_assignee_invalid") {
    setError("assignee_id", { message: "Select an active assignee." });
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : "Save failed.",
  });
}

function formErrors(errors: FieldErrors<TaskFormValues>): FormErrorItem[] {
  return Object.entries(errors).flatMap(([field, error]) => {
    if (!error) {
      return [];
    }
    return [
      {
        fieldId: field,
        label: fieldLabel(field),
        message: String(error.message),
      },
    ];
  });
}

function fieldLabel(field: string): string {
  return field.replaceAll("_", " ");
}
