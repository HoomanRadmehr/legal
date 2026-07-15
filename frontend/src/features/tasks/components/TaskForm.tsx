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
import { LocalizedDateTimeInput } from "../../../components/localizedDateInput";
import { useI18n } from "../../../i18n";
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
import { membershipChoiceLabel, taskStatusLabel, taskText } from "./taskLabels";
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
  const { locale } = useI18n();
  const labels = taskText(locale);
  const assignees = useTaskAssignees();
  const form = useForm<TaskFormValues>({
    defaultValues: initialTask ? undefined : defaultTaskFormValues(),
    values: initialTask ? taskDetailToFormValues(initialTask) : undefined,
  });
  const assigneeId = useWatch({
    control: form.control,
    name: "assignee_id",
  });
  const dueAtLocal = useWatch({ control: form.control, name: "due_at_local" });

  async function submit(values: TaskFormValues) {
    form.clearErrors();
    try {
      const input = buildTaskInput(values, mode, assignmentMode);
      const savedTask = await onSubmit(input);
      navigate(`/tasks/${savedTask.id}`);
    } catch (error) {
      applyFormError(form.setError, error, labels);
    }
  }

  return (
    <form className="task-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <FormErrorSummary errors={formErrors(form.formState.errors, labels)} />
      <TaskMutationError error={mutationError} />
      <fieldset>
        <legend>{labels.details}</legend>
        <label>
          {labels.title}
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          {labels.matter}
          <input {...form.register("matter_id")} id="matter_id" />
        </label>
        <LocalizedDateTimeInput
          id="due_at_local"
          label={labels.dueDateTime}
          onValueChange={(value) => form.setValue("due_at_local", value)}
          registration={form.register("due_at_local")}
          value={dueAtLocal}
        />
        <label>
          {labels.status}
          <select {...form.register("status")} id="status">
            {(["todo", "in_progress"] as const).map((status) => (
              <option key={status} value={status}>
                {taskStatusLabel(status, locale)}
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
        labels={labels}
        options={assignees.data ?? []}
        register={form.register}
        value={assigneeId ?? ""}
        locale={locale}
      />
      <label>
        {labels.description}
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
          {mode === "create" ? labels.create : labels.save}
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
  labels,
  locale,
  options,
  register,
  value,
}: {
  assignmentMode: TaskAssignmentMode;
  error: Error | null;
  isError: boolean;
  isLoading: boolean;
  labels: ReturnType<typeof taskText>;
  locale: ReturnType<typeof useI18n>["locale"];
  options: { display_name: string; id: string; role: string }[];
  register: ReturnType<typeof useForm<TaskFormValues>>["register"];
  value: string;
}) {
  if (assignmentMode === "locked") {
    return (
      <fieldset>
        <legend>{labels.assignment}</legend>
        <p className="task-alert">
          {labels.lockedAssignmentHelp}
        </p>
        <input {...register("assignee_id")} type="hidden" />
        <p>
          {labels.assigneeMembershipId}: {value || labels.notSelected}
        </p>
      </fieldset>
    );
  }

  return (
    <fieldset>
      <legend>{labels.assignment}</legend>
      {isLoading ? <p>{labels.loadingAssignees}</p> : null}
      {isError ? (
        <p className="task-alert">
          {error?.message ?? labels.assigneeUnavailable}
        </p>
      ) : null}
      <label>
        {labels.activeAssignee}
        <select {...register("assignee_id")} id="assignee_id">
          <option value="">{labels.selectAssignee}</option>
          {options.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {membershipChoiceLabel(choice, locale)}
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
  labels: ReturnType<typeof taskText>,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as FieldPath<TaskFormValues>, {
        message: validationMessage(issue.message, labels),
      });
    }
    return;
  }
  if (isApiError(error) && error.code === "task_assignee_invalid") {
    setError("assignee_id", { message: labels.selectAssigneeError });
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : labels.saveFailed,
  });
}

function validationMessage(
  message: string,
  labels: ReturnType<typeof taskText>,
): string {
  return labels.invalidValue === "Invalid value." ? message : labels.invalidValue;
}

function formErrors(
  errors: FieldErrors<TaskFormValues>,
  labels: ReturnType<typeof taskText>,
): FormErrorItem[] {
  return Object.entries(errors).flatMap(([field, error]) => {
    if (!error) {
      return [];
    }
    return [
      {
        fieldId: field,
        label: fieldLabel(field, labels),
        message: String(error.message),
      },
    ];
  });
}

function fieldLabel(field: string, labels: ReturnType<typeof taskText>): string {
  const fieldLabels: Record<string, string> = {
    assignee_id: labels.assignee,
    description: labels.description,
    due_at_local: labels.dueDateTime,
    matter_id: labels.matter,
    status: labels.status,
    title: labels.title,
  };
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}
