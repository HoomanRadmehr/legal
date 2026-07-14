import { useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import {
  buildDeadlineCreateInput,
  buildDeadlineUpdateInput,
  deadlineDetailToFormValues,
  defaultDeadlineFormValues,
  type DeadlineFormMode,
  type DeadlineFormValues,
} from "../schemas";
import type {
  DeadlineDetail,
  DeadlineInput,
  DeadlineUpdateInput,
} from "../types";
import { deadlinePriorityLabel } from "./deadlineLabels";
import { DeadlineMutationError } from "./DeadlineMutationError";

export function DeadlineForm({
  initialDeadline,
  mode,
  mutationError,
  onSubmit,
}: {
  initialDeadline?: DeadlineDetail;
  mode: DeadlineFormMode;
  mutationError: unknown;
  onSubmit: (
    input: DeadlineInput | DeadlineUpdateInput,
  ) => Promise<DeadlineDetail>;
}) {
  const navigate = useNavigate();
  const form = useForm<DeadlineFormValues>({
    defaultValues: initialDeadline ? undefined : defaultDeadlineFormValues(),
    values: initialDeadline
      ? deadlineDetailToFormValues(initialDeadline)
      : undefined,
  });

  async function submit(values: DeadlineFormValues) {
    form.clearErrors();
    try {
      const input =
        mode === "create"
          ? buildDeadlineCreateInput(values)
          : buildDeadlineUpdateInput(values);
      const savedDeadline = await onSubmit(input);
      navigate(`/deadlines/${savedDeadline.id}`);
    } catch (error) {
      applyFormError(form.setError, error);
    }
  }

  return (
    <form
      className="deadline-form"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <FormErrorSummary errors={formErrors(form.formState.errors)} />
      <DeadlineMutationError error={mutationError} />
      <fieldset>
        <legend>Deadline details</legend>
        <label>
          Title
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          Matter ID
          <input {...form.register("matter_id")} id="matter_id" />
        </label>
        <label>
          Assignee membership ID
          <input {...form.register("assignee_id")} id="assignee_id" />
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
          Priority
          <select {...form.register("priority")} id="priority">
            {(["normal", "low", "high", "critical"] as const).map(
              (priority) => (
                <option key={priority} value={priority}>
                  {deadlinePriorityLabel(priority)}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="deadline-checkbox">
          <input {...form.register("reminder_enabled")} type="checkbox" />
          Reminder enabled
        </label>
      </fieldset>
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
      <div className="deadline-form__actions">
        <button disabled={form.formState.isSubmitting} type="submit">
          {mode === "create" ? "Create deadline" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function applyFormError(
  setError: ReturnType<typeof useForm<DeadlineFormValues>>["setError"],
  error: unknown,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as FieldPath<DeadlineFormValues>, {
        message: issue.message,
      });
    }
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : "Save failed.",
  });
}

function formErrors(errors: FieldErrors<DeadlineFormValues>): FormErrorItem[] {
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
