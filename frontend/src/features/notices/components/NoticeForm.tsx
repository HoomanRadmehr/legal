import { useState } from "react";
import {
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import type { AsyncChoice } from "../../../components/forms/AsyncChoiceSelect";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import {
  LocalizedDateInput,
  LocalizedDateTimeInput,
} from "../../../components/localizedDateInput";
import { useI18n } from "../../../i18n";
import { OwnerChoiceSelect } from "../../choices";
import {
  buildNoticeCreateInput,
  buildNoticeUpdateInput,
  defaultNoticeFormValues,
  noticeDetailToFormValues,
  type NoticeFormMode,
  type NoticeFormValues,
} from "../schemas";
import type { NoticeDetail, NoticeInput, NoticeUpdateInput } from "../types";
import {
  noticePriorityLabel,
  noticeResponseStatusLabel,
  noticeStatusLabel,
  noticeText,
} from "./noticeLabels";
import { NoticeMutationError } from "./NoticeMutationError";
import { NoticeRelatedMatterPicker } from "./NoticeRelatedMatterPicker";

export function NoticeForm({
  initialNotice,
  mode,
  mutationError,
  onSubmit,
}: {
  initialNotice?: NoticeDetail;
  mode: NoticeFormMode;
  mutationError: unknown;
  onSubmit: (input: NoticeInput | NoticeUpdateInput) => Promise<NoticeDetail>;
}) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const labels = noticeText(locale);
  const [ownerChoice, setOwnerChoice] = useState<AsyncChoice | null>(null);
  const form = useForm<NoticeFormValues>({
    defaultValues: initialNotice ? undefined : defaultNoticeFormValues(),
    values: initialNotice ? noticeDetailToFormValues(initialNotice) : undefined,
  });
  const receivedDate = useWatch({
    control: form.control,
    name: "received_date",
  });
  const responseDeadline = useWatch({
    control: form.control,
    name: "response_deadline_local",
  });
  const openedOn = useWatch({ control: form.control, name: "opened_on" });
  const closedOn = useWatch({ control: form.control, name: "closed_on" });

  async function submit(values: NoticeFormValues) {
    form.clearErrors();
    try {
      const input =
        mode === "create"
          ? buildNoticeCreateInput(values)
          : buildNoticeUpdateInput(values);
      const savedNotice = await onSubmit(input);
      navigate(`/notices/${savedNotice.id}`);
    } catch (error) {
      applyFormError(form.setError, error, labels);
    }
  }

  return (
    <form
      className="notice-form"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <FormErrorSummary errors={formErrors(form.formState.errors, labels)} />
      <NoticeMutationError error={mutationError} />
      <fieldset>
        <legend>{labels.details}</legend>
        <label>
          {labels.title}
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          {labels.referenceCode}
          <input {...form.register("reference_code")} id="reference_code" />
        </label>
        <label>
          {labels.sender}
          <input {...form.register("sender")} id="sender" />
        </label>
        {mode === "create" ? (
          <>
            <OwnerChoiceSelect
              id="owner_id"
              onChange={(choice) => {
                setOwnerChoice(choice);
                form.setValue("owner_id", choice?.id ?? "", {
                  shouldValidate: true,
                });
              }}
              value={ownerChoice}
            />
            <input {...form.register("owner_id")} type="hidden" />
          </>
        ) : (
          <label>
            {labels.ownerMembership}
            <input {...form.register("owner_id")} id="owner_id" />
          </label>
        )}
        <label>
          {labels.status}
          <select {...form.register("status")} id="status">
            {(
              [
                "received",
                "under_review",
                "response_due",
                "responded",
                "closed",
                "archived",
              ] as const
            ).map((status) => (
              <option key={status} value={status}>
                {noticeStatusLabel(status, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {labels.priority}
          <select {...form.register("priority")} id="priority">
            {(["normal", "low", "high", "critical"] as const).map(
              (priority) => (
                <option key={priority} value={priority}>
                  {noticePriorityLabel(priority, locale)}
                </option>
              ),
            )}
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>{labels.responseDates}</legend>
        <LocalizedDateInput
          id="received_date"
          label={labels.receivedDate}
          onValueChange={(value) => form.setValue("received_date", value)}
          registration={form.register("received_date")}
          value={receivedDate}
        />
        <LocalizedDateTimeInput
          id="response_deadline_local"
          label={labels.responseDeadline}
          onValueChange={(value) =>
            form.setValue("response_deadline_local", value)
          }
          registration={form.register("response_deadline_local")}
          value={responseDeadline}
        />
        <label>
          {labels.responseStatus}
          <select {...form.register("response_status")} id="response_status">
            {(["pending", "responded", "cancelled"] as const).map((status) => (
              <option key={status} value={status}>
                {noticeResponseStatusLabel(status, locale)}
              </option>
            ))}
          </select>
        </label>
        <LocalizedDateInput
          id="opened_on"
          label={labels.openedOn}
          onValueChange={(value) => form.setValue("opened_on", value)}
          registration={form.register("opened_on")}
          value={openedOn}
        />
        <LocalizedDateInput
          id="closed_on"
          label={labels.closedOn}
          onValueChange={(value) => form.setValue("closed_on", value)}
          registration={form.register("closed_on")}
          value={closedOn}
        />
        <p className="notice-help">{labels.responseDeadlineHelp}</p>
      </fieldset>
      <NoticeRelatedMatterPicker form={form} mode={mode} />
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
      <div className="notice-form__actions">
        <button disabled={form.formState.isSubmitting} type="submit">
          {mode === "create" ? labels.create : labels.save}
        </button>
      </div>
    </form>
  );
}

function applyFormError(
  setError: ReturnType<typeof useForm<NoticeFormValues>>["setError"],
  error: unknown,
  labels: ReturnType<typeof noticeText>,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as FieldPath<NoticeFormValues>, {
        message: validationMessage(issue.message, labels),
      });
    }
    return;
  }
  if (isApiError(error) && error.code === "notice_response_date_invalid") {
    setError("response_deadline_local", {
      message: labels.responseDateInvalid,
    });
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : labels.saveFailed,
  });
}

function validationMessage(
  message: string,
  labels: ReturnType<typeof noticeText>,
): string {
  return labels.invalidValue === "Invalid value."
    ? message
    : labels.invalidValue;
}

function formErrors(
  errors: FieldErrors<NoticeFormValues>,
  labels: ReturnType<typeof noticeText>,
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
  labels: ReturnType<typeof noticeText>,
): string {
  const fieldLabels: Record<string, string> = {
    closed_on: labels.closedOn,
    description: labels.description,
    opened_on: labels.openedOn,
    owner_id: labels.ownerMembership,
    priority: labels.priority,
    received_date: labels.receivedDate,
    reference_code: labels.referenceCode,
    related_matter_ids: labels.relatedMatters,
    response_deadline_local: labels.responseDeadline,
    response_status: labels.responseStatus,
    sender: labels.sender,
    status: labels.status,
    title: labels.title,
  };
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}
