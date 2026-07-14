import { z } from "zod";

import type { NoticeDetail, NoticeInput, NoticeUpdateInput } from "./types";

const emptyDate = z.literal("").transform(() => null);
const optionalText = z.string().trim().optional().default("");
const optionalUuid = z.string().trim().uuid().optional().or(z.literal(""));
type NoticeDateValues = {
  received_date: string;
  response_deadline_local: string;
};

export const noticeCreateFormSchema = z
  .object({
    closed_on: z.string().date().nullable().or(emptyDate).optional(),
    description: optionalText,
    opened_on: z.string().date().nullable().or(emptyDate).optional(),
    owner_id: optionalUuid,
    priority: z.enum(["critical", "high", "low", "normal"]),
    received_date: z.string().date("Received date is required."),
    reference_code: z
      .string()
      .trim()
      .min(1, "Reference code is required.")
      .max(64),
    related_matter_ids: z.array(z.string().uuid()).default([]),
    response_deadline_local: z
      .string()
      .trim()
      .min(1, "Response deadline is required."),
    response_status: z
      .enum(["cancelled", "pending", "responded"])
      .default("pending"),
    sender: z.string().trim().min(1, "Sender is required.").max(255),
    status: z
      .enum([
        "archived",
        "closed",
        "received",
        "responded",
        "response_due",
        "under_review",
      ])
      .default("response_due"),
    title: z.string().trim().min(1, "Title is required.").max(255),
  })
  .superRefine(validateResponseDate);

export const noticeUpdateFormSchema = noticeCreateFormSchema.extend({
  version: z.coerce.number().int().min(1),
});

export type NoticeFormValues = z.input<typeof noticeUpdateFormSchema>;
export type NoticeFormMode = "create" | "edit";

export function buildNoticeCreateInput(values: NoticeFormValues): NoticeInput {
  const parsed = noticeCreateFormSchema.parse(values);
  return cleanNoticeInput(parsed);
}

export function buildNoticeUpdateInput(
  values: NoticeFormValues,
): NoticeUpdateInput {
  const parsed = noticeUpdateFormSchema.parse(values);
  return { ...cleanNoticeInput(parsed), version: parsed.version };
}

export function noticeDetailToFormValues(
  notice: NoticeDetail,
): NoticeFormValues {
  return {
    closed_on: notice.closed_on ?? "",
    description: notice.description,
    opened_on: notice.opened_on ?? "",
    owner_id: notice.owner_id,
    priority: notice.priority,
    received_date: notice.received_date,
    reference_code: notice.reference_code,
    related_matter_ids: notice.related_matter_ids,
    response_deadline_local: isoToLocalDateTime(notice.response_deadline),
    response_status: notice.response_status,
    sender: notice.sender,
    status: notice.status,
    title: notice.title,
    version: notice.version,
  };
}

export function defaultNoticeFormValues(): NoticeFormValues {
  return {
    closed_on: "",
    description: "",
    opened_on: "",
    owner_id: "",
    priority: "normal",
    received_date: "",
    reference_code: "",
    related_matter_ids: [],
    response_deadline_local: "",
    response_status: "pending",
    sender: "",
    status: "response_due",
    title: "",
    version: 1,
  };
}

function validateResponseDate(
  values: NoticeDateValues,
  context: z.RefinementCtx,
) {
  if (!values.response_deadline_local || !values.received_date) {
    return;
  }
  if (values.response_deadline_local.slice(0, 10) >= values.received_date) {
    return;
  }
  context.addIssue({
    code: "custom",
    message: "Response deadline cannot precede received date.",
    path: ["response_deadline_local"],
  });
}

function cleanNoticeInput(
  parsed: z.output<typeof noticeCreateFormSchema>,
): NoticeInput {
  return {
    closed_on: parsed.closed_on ?? null,
    description: parsed.description,
    opened_on: parsed.opened_on ?? null,
    owner_id: parsed.owner_id || undefined,
    priority: parsed.priority,
    received_date: parsed.received_date,
    reference_code: parsed.reference_code,
    related_matter_ids: parsed.related_matter_ids,
    response_deadline: localDateTimeToIso(parsed.response_deadline_local),
    response_status: parsed.response_status,
    sender: parsed.sender,
    status: parsed.status,
    title: parsed.title,
  };
}

function localDateTimeToIso(value: string): string {
  return new Date(value).toISOString();
}

function isoToLocalDateTime(value: string): string {
  const date = new Date(value);
  const offsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMilliseconds)
    .toISOString()
    .slice(0, 16);
}
