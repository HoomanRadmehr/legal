import { z } from "zod";

import type { TaskDetail, TaskInput, TaskUpdateInput } from "./types";

const optionalText = z.string().trim().optional().default("");
const optionalDueAt = z.string().trim().optional().or(z.literal(""));

export const taskCreateFormSchema = z.object({
  assignee_id: z.string().trim().uuid("Assignee is required."),
  description: optionalText,
  due_at_local: optionalDueAt,
  matter_id: z.string().trim().uuid("Matter ID is required."),
  status: z.enum(["todo", "in_progress"]).default("todo"),
  title: z.string().trim().min(1, "Title is required.").max(255),
});

export const taskUpdateFormSchema = taskCreateFormSchema.extend({
  version: z.coerce.number().int().min(1),
});

export type TaskFormValues = z.input<typeof taskUpdateFormSchema>;
export type TaskFormMode = "create" | "edit";
export type TaskAssignmentMode = "editable" | "locked";

export function buildTaskCreateInput(values: TaskFormValues): TaskInput {
  const parsed = taskCreateFormSchema.parse(values);
  return cleanTaskInput(parsed);
}

export function buildTaskUpdateInput(values: TaskFormValues): TaskUpdateInput {
  const parsed = taskUpdateFormSchema.parse(values);
  return { ...cleanTaskInput(parsed), version: parsed.version };
}

export function buildTaskUpdateWithoutAssigneeInput(
  values: TaskFormValues,
): TaskUpdateInput {
  const input = buildTaskUpdateInput(values);
  delete input.assignee_id;
  return input;
}

export function taskDetailToFormValues(task: TaskDetail): TaskFormValues {
  return {
    assignee_id: task.assignee_id,
    description: task.description,
    due_at_local: task.due_at ? isoToLocalDateTime(task.due_at) : "",
    matter_id: task.matter_id,
    status: task.status === "in_progress" ? "in_progress" : "todo",
    title: task.title,
    version: task.version,
  };
}

export function defaultTaskFormValues(): TaskFormValues {
  return {
    assignee_id: "",
    description: "",
    due_at_local: "",
    matter_id: "",
    status: "todo",
    title: "",
    version: 1,
  };
}

function cleanTaskInput(
  parsed: z.output<typeof taskCreateFormSchema>,
): TaskInput {
  return {
    assignee_id: parsed.assignee_id,
    description: parsed.description,
    due_at: parsed.due_at_local
      ? localDateTimeToIso(parsed.due_at_local)
      : null,
    matter_id: parsed.matter_id,
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
