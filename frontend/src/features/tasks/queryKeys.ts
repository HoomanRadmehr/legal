import type { TaskListParams } from "./types";

export const taskQueryKeys = {
  all: ["api", "tasks"] as const,
  assignees: () => [...taskQueryKeys.all, "assignees"] as const,
  detail: (taskId: string) => [...taskQueryKeys.all, "detail", taskId] as const,
  list: (params: TaskListParams) =>
    [...taskQueryKeys.all, "list", params] as const,
};
