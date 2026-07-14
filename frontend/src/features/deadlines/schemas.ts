import { z } from "zod";

import type {
  DeadlineDetail,
  DeadlineInput,
  DeadlineUpdateInput,
} from "./types";

const optionalText = z.string().trim().optional().default("");
const optionalUuid = z.string().trim().uuid().optional().or(z.literal(""));

export const deadlineCreateFormSchema = z.object({
  assignee_id: z.string().trim().uuid("Assignee membership ID is required."),
  description: optionalText,
  due_at_local: z.string().trim().min(1, "Due date and time are required."),
  matter_id: z.string().trim().uuid("Matter ID is required."),
  priority: z.enum(["critical", "high", "low", "normal"]),
  reminder_enabled: z.coerce.boolean().default(true),
  title: z.string().trim().min(1, "Title is required.").max(255),
});

export const deadlineUpdateFormSchema = deadlineCreateFormSchema.extend({
  assignee_id: optionalUuid,
  matter_id: optionalUuid,
  version: z.coerce.number().int().min(1),
});

export type DeadlineFormValues = z.input<typeof deadlineUpdateFormSchema>;
export type DeadlineFormMode = "create" | "edit";

export function buildDeadlineCreateInput(
  values: DeadlineFormValues,
): DeadlineInput {
  const parsed = deadlineCreateFormSchema.parse(values);
  return {
    assignee_id: parsed.assignee_id,
    description: parsed.description,
    due_at: localDateTimeToIso(parsed.due_at_local),
    matter_id: parsed.matter_id,
    priority: parsed.priority,
    reminder_enabled: parsed.reminder_enabled,
    title: parsed.title,
  };
}

export function buildDeadlineUpdateInput(
  values: DeadlineFormValues,
): DeadlineUpdateInput {
  const parsed = deadlineUpdateFormSchema.parse(values);
  return {
    assignee_id: parsed.assignee_id || undefined,
    description: parsed.description,
    due_at: localDateTimeToIso(parsed.due_at_local),
    matter_id: parsed.matter_id || undefined,
    priority: parsed.priority,
    reminder_enabled: parsed.reminder_enabled,
    title: parsed.title,
    version: parsed.version,
  };
}

export function deadlineDetailToFormValues(
  deadline: DeadlineDetail,
): DeadlineFormValues {
  return {
    assignee_id: deadline.assignee_id,
    description: deadline.description,
    due_at_local: isoToLocalDateTime(deadline.due_at),
    matter_id: deadline.matter_id,
    priority: deadline.priority,
    reminder_enabled: deadline.reminder_enabled,
    title: deadline.title,
    version: deadline.version,
  };
}

export function defaultDeadlineFormValues(): DeadlineFormValues {
  return {
    assignee_id: "",
    description: "",
    due_at_local: "",
    matter_id: "",
    priority: "normal",
    reminder_enabled: true,
    title: "",
    version: 1,
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
