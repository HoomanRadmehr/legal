import { apiClient, type QueryValue } from "../../api/client";
import type {
  MembershipChoice,
  PaginatedResponse,
  TaskDetail,
  TaskInput,
  TaskListItem,
  TaskListParams,
  TaskUpdateInput,
} from "./types";

export async function listTasks(
  params: TaskListParams,
): Promise<PaginatedResponse<TaskListItem>> {
  return apiClient.request<PaginatedResponse<TaskListItem>>("/tasks/", {
    query: buildTaskListQuery(params),
  });
}

export async function getTask(taskId: string): Promise<TaskDetail> {
  return apiClient.request<TaskDetail>(`/tasks/${taskId}/`);
}

export async function createTask(input: TaskInput): Promise<TaskDetail> {
  return apiClient.request<TaskDetail>("/tasks/", {
    body: input,
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function updateTask(
  taskId: string,
  input: TaskUpdateInput,
): Promise<TaskDetail> {
  return apiClient.request<TaskDetail>(`/tasks/${taskId}/`, {
    body: input,
    method: "PATCH",
    replayOnUnauthorized: false,
  });
}

export async function completeTask(
  taskId: string,
  version: number,
): Promise<TaskDetail> {
  return apiClient.request<TaskDetail>(`/tasks/${taskId}/complete/`, {
    body: { version },
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function cancelTask(
  taskId: string,
  version: number,
): Promise<TaskDetail> {
  return apiClient.request<TaskDetail>(`/tasks/${taskId}/cancel/`, {
    body: { version },
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function listMembershipChoices(): Promise<MembershipChoice[]> {
  const response = await apiClient.request<
    PaginatedResponse<MembershipChoice> | MembershipChoice[]
  >("/memberships/");
  return Array.isArray(response) ? response : response.results;
}

export function buildTaskListQuery(
  params: TaskListParams,
): Record<string, QueryValue> {
  return {
    assignee: emptyToUndefined(params.assignee),
    due_after: emptyToUndefined(params.dueAfter),
    due_before: emptyToUndefined(params.dueBefore),
    matter: emptyToUndefined(params.matter),
    ordering: params.ordering,
    page: params.page,
    status: emptyToUndefined(params.status),
    view: params.view,
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
