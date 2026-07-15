import {
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import type { AsyncChoice } from "../../../components/forms/AsyncChoiceSelect";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import { LocalizedDateTimeInput } from "../../../components/localizedDateInput";
import { useI18n } from "../../../i18n";
import { AssigneeChoiceSelect, MatterChoiceSelect } from "../../choices";
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
import type { TaskDetail, TaskInput, TaskUpdateInput } from "../types";
import { taskStatusLabel, taskText } from "./taskLabels";
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
  const [assigneeChoice, setAssigneeChoice] = useState<AsyncChoice | null>(
    null,
  );
  const [matterChoice, setMatterChoice] = useState<AsyncChoice | null>(null);
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
        {mode === "create" ? (
          <>
            <MatterChoiceSelect
              id="matter_id"
              label={labels.matter}
              onChange={(choice) => {
                setMatterChoice(choice);
                form.setValue("matter_id", choice?.id ?? "", {
                  shouldValidate: true,
                });
              }}
              purpose="task_create"
              value={matterChoice}
            />
            <input {...form.register("matter_id")} type="hidden" />
          </>
        ) : (
          <label>
            {labels.matter}
            <input {...form.register("matter_id")} id="matter_id" />
          </label>
        )}
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
        assigneeChoice={assigneeChoice}
        labels={labels}
        mode={mode}
        onAssigneeChoice={setAssigneeChoice}
        register={form.register}
        setValue={form.setValue}
        value={assigneeId ?? ""}
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
  assigneeChoice,
  labels,
  mode,
  onAssigneeChoice,
  register,
  setValue,
  value,
}: {
  assignmentMode: TaskAssignmentMode;
  assigneeChoice: AsyncChoice | null;
  labels: ReturnType<typeof taskText>;
  mode: TaskFormMode;
  onAssigneeChoice: (choice: AsyncChoice | null) => void;
  register: ReturnType<typeof useForm<TaskFormValues>>["register"];
  setValue: ReturnType<typeof useForm<TaskFormValues>>["setValue"];
  value: string;
}) {
  if (assignmentMode === "locked") {
    return (
      <fieldset>
        <legend>{labels.assignment}</legend>
        <p className="task-alert">{labels.lockedAssignmentHelp}</p>
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
      {mode === "create" ? (
        <>
          <AssigneeChoiceSelect
            id="assignee_id"
            onChange={(choice) => {
              onAssigneeChoice(choice);
              setValue("assignee_id", choice?.id ?? "", {
                shouldValidate: true,
              });
            }}
            value={assigneeChoice}
          />
          <input {...register("assignee_id")} type="hidden" />
        </>
      ) : (
        <label>
          {labels.activeAssignee}
          <input {...register("assignee_id")} id="assignee_id" />
        </label>
      )}
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
  return labels.invalidValue === "Invalid value."
    ? message
    : labels.invalidValue;
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

function fieldLabel(
  field: string,
  labels: ReturnType<typeof taskText>,
): string {
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
