import { useState } from "react";
import { useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
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
  const [matterSearch, setMatterSearch] = useState("");
  const form = useForm<NoticeFormValues>({
    defaultValues: initialNotice ? undefined : defaultNoticeFormValues(),
    values: initialNotice ? noticeDetailToFormValues(initialNotice) : undefined,
  });

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
      applyFormError(form.setError, error);
    }
  }

  return (
    <form
      className="notice-form"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <FormErrorSummary errors={formErrors(form.formState.errors)} />
      <NoticeMutationError error={mutationError} />
      <fieldset>
        <legend>Notice details</legend>
        <label>
          Title
          <input {...form.register("title")} id="title" />
        </label>
        <label>
          Reference code
          <input {...form.register("reference_code")} id="reference_code" />
        </label>
        <label>
          Sender
          <input {...form.register("sender")} id="sender" />
        </label>
        <label>
          Owner membership ID
          <input {...form.register("owner_id")} id="owner_id" />
        </label>
        <label>
          Status
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
                {noticeStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select {...form.register("priority")} id="priority">
            {(["normal", "low", "high", "critical"] as const).map(
              (priority) => (
                <option key={priority} value={priority}>
                  {noticePriorityLabel(priority)}
                </option>
              ),
            )}
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Response dates</legend>
        <label>
          Received date
          <input
            {...form.register("received_date")}
            id="received_date"
            type="date"
          />
        </label>
        <label>
          Response deadline
          <input
            {...form.register("response_deadline_local")}
            id="response_deadline_local"
            type="datetime-local"
          />
        </label>
        <label>
          Response status
          <select {...form.register("response_status")} id="response_status">
            {(["pending", "responded", "cancelled"] as const).map((status) => (
              <option key={status} value={status}>
                {noticeResponseStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Opened on
          <input {...form.register("opened_on")} id="opened_on" type="date" />
        </label>
        <label>
          Closed on
          <input {...form.register("closed_on")} id="closed_on" type="date" />
        </label>
        <p className="notice-help">
          Changing the response deadline updates the linked deadline after save.
        </p>
      </fieldset>
      <NoticeRelatedMatterPicker
        form={form}
        onSearch={setMatterSearch}
        search={matterSearch}
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
      <div className="notice-form__actions">
        <button disabled={form.formState.isSubmitting} type="submit">
          {mode === "create" ? "Create notice" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function applyFormError(
  setError: ReturnType<typeof useForm<NoticeFormValues>>["setError"],
  error: unknown,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as FieldPath<NoticeFormValues>, {
        message: issue.message,
      });
    }
    return;
  }
  if (isApiError(error) && error.code === "notice_response_date_invalid") {
    setError("response_deadline_local", {
      message: "Response deadline cannot precede received date.",
    });
    return;
  }
  setError("root", {
    message: error instanceof Error ? error.message : "Save failed.",
  });
}

function formErrors(errors: FieldErrors<NoticeFormValues>): FormErrorItem[] {
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
