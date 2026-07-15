import {
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import type { AsyncChoice } from "../../../components/forms/AsyncChoiceSelect";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import { LocalizedDateTimeInput } from "../../../components/localizedDateInput";
import { useI18n } from "../../../i18n";
import { AssigneeChoiceSelect, MatterChoiceSelect } from "../../choices";
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
import { deadlinePriorityLabel, deadlineText } from "./deadlineLabels";
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
  const { locale } = useI18n();
  const labels = deadlineText(locale);
  const [assigneeChoice, setAssigneeChoice] = useState<AsyncChoice | null>(
    null,
  );
  const [matterChoice, setMatterChoice] = useState<AsyncChoice | null>(null);
  const form = useForm<DeadlineFormValues>({
    defaultValues: initialDeadline ? undefined : defaultDeadlineFormValues(),
    values: initialDeadline
      ? deadlineDetailToFormValues(initialDeadline)
      : undefined,
  });
  const dueAtLocal = useWatch({ control: form.control, name: "due_at_local" });

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
      applyFormError(form.setError, error, labels);
    }
  }

  return (
    <form
      className="deadline-form"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <FormErrorSummary errors={formErrors(form.formState.errors, labels)} />
      <DeadlineMutationError error={mutationError} />
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
              purpose="deadline_create"
              value={matterChoice}
            />
            <input {...form.register("matter_id")} type="hidden" />
            <AssigneeChoiceSelect
              id="assignee_id"
              onChange={(choice) => {
                setAssigneeChoice(choice);
                form.setValue("assignee_id", choice?.id ?? "", {
                  shouldValidate: true,
                });
              }}
              value={assigneeChoice}
            />
            <input {...form.register("assignee_id")} type="hidden" />
          </>
        ) : (
          <>
            <label>
              {labels.matter}
              <input {...form.register("matter_id")} id="matter_id" />
            </label>
            <label>
              {labels.assigneeMembershipId}
              <input {...form.register("assignee_id")} id="assignee_id" />
            </label>
          </>
        )}
        <LocalizedDateTimeInput
          id="due_at_local"
          label={labels.dueDateTime}
          onValueChange={(value) => form.setValue("due_at_local", value)}
          registration={form.register("due_at_local")}
          value={dueAtLocal}
        />
        <label>
          {labels.priority}
          <select {...form.register("priority")} id="priority">
            {(["normal", "low", "high", "critical"] as const).map(
              (priority) => (
                <option key={priority} value={priority}>
                  {deadlinePriorityLabel(priority, locale)}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="deadline-checkbox">
          <input {...form.register("reminder_enabled")} type="checkbox" />
          {labels.reminder}
        </label>
      </fieldset>
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
      <div className="deadline-form__actions">
        <button disabled={form.formState.isSubmitting} type="submit">
          {mode === "create" ? labels.create : labels.save}
        </button>
      </div>
    </form>
  );
}

function applyFormError(
  setError: ReturnType<typeof useForm<DeadlineFormValues>>["setError"],
  error: unknown,
  labels: ReturnType<typeof deadlineText>,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as FieldPath<DeadlineFormValues>, {
        message: validationMessage(issue.message, labels),
      });
    }
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : labels.saveFailed,
  });
}

function validationMessage(
  message: string,
  labels: ReturnType<typeof deadlineText>,
): string {
  return labels.invalidValue === "Invalid value."
    ? message
    : labels.invalidValue;
}

function formErrors(
  errors: FieldErrors<DeadlineFormValues>,
  labels: ReturnType<typeof deadlineText>,
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
  labels: ReturnType<typeof deadlineText>,
): string {
  const fieldLabels: Record<string, string> = {
    assignee_id: labels.assigneeMembershipId,
    description: labels.description,
    due_at_local: labels.dueDateTime,
    matter_id: labels.matter,
    priority: labels.priority,
    reminder_enabled: labels.reminder,
    title: labels.title,
  };
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}
