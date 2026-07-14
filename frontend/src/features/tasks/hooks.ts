import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelTask,
  completeTask,
  createTask,
  getTask,
  listMembershipChoices,
  listTasks,
  updateTask,
} from "./api";
import { taskQueryKeys } from "./queryKeys";
import type { TaskInput, TaskListParams, TaskUpdateInput } from "./types";

export function useTaskList(params: TaskListParams) {
  return useQuery({
    queryFn: () => listTasks(params),
    queryKey: taskQueryKeys.list(params),
  });
}

export function useTaskDetail(taskId: string) {
  return useQuery({
    queryFn: () => getTask(taskId),
    queryKey: taskQueryKeys.detail(taskId),
  });
}

export function useTaskAssignees() {
  return useQuery({
    queryFn: activeMembershipChoices,
    queryKey: taskQueryKeys.assignees(),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: (createdTask) => {
      queryClient.setQueryData(
        taskQueryKeys.detail(createdTask.id),
        createdTask,
      );
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskUpdateInput) => updateTask(taskId, input),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskQueryKeys.detail(taskId), updatedTask);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useCompleteTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => completeTask(taskId, version),
    onSuccess: (completedTask) => {
      queryClient.setQueryData(taskQueryKeys.detail(taskId), completedTask);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useCompleteTaskAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { taskId: string; version: number }) =>
      completeTask(input.taskId, input.version),
    onSuccess: (completedTask) => {
      queryClient.setQueryData(
        taskQueryKeys.detail(completedTask.id),
        completedTask,
      );
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useCancelTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => cancelTask(taskId, version),
    onSuccess: (cancelledTask) => {
      queryClient.setQueryData(taskQueryKeys.detail(taskId), cancelledTask);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useCancelTaskAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { taskId: string; version: number }) =>
      cancelTask(input.taskId, input.version),
    onSuccess: (cancelledTask) => {
      queryClient.setQueryData(
        taskQueryKeys.detail(cancelledTask.id),
        cancelledTask,
      );
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

async function activeMembershipChoices() {
  const choices = await listMembershipChoices();
  return choices.filter(
    (choice) => choice.status === undefined || choice.status === "active",
  );
}
