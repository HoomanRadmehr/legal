import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelDeadline,
  completeDeadline,
  createDeadline,
  getDeadline,
  listDeadlines,
  updateDeadline,
} from "./api";
import { deadlineQueryKeys } from "./queryKeys";
import type {
  DeadlineInput,
  DeadlineListParams,
  DeadlineUpdateInput,
} from "./types";

export function useDeadlineList(params: DeadlineListParams) {
  return useQuery({
    queryFn: () => listDeadlines(params),
    queryKey: deadlineQueryKeys.list(params),
  });
}

export function useDeadlineDetail(deadlineId: string) {
  return useQuery({
    queryFn: () => getDeadline(deadlineId),
    queryKey: deadlineQueryKeys.detail(deadlineId),
  });
}

export function useCreateDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeadlineInput) => createDeadline(input),
    onSuccess: (createdDeadline) => {
      queryClient.setQueryData(
        deadlineQueryKeys.detail(createdDeadline.id),
        createdDeadline,
      );
      void queryClient.invalidateQueries({ queryKey: deadlineQueryKeys.all });
    },
  });
}

export function useUpdateDeadline(deadlineId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeadlineUpdateInput) =>
      updateDeadline(deadlineId, input),
    onSuccess: (updatedDeadline) => {
      queryClient.setQueryData(
        deadlineQueryKeys.detail(deadlineId),
        updatedDeadline,
      );
      void queryClient.invalidateQueries({ queryKey: deadlineQueryKeys.all });
    },
  });
}

export function useCompleteDeadline(deadlineId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => completeDeadline(deadlineId, version),
    onSuccess: (completedDeadline) => {
      queryClient.setQueryData(
        deadlineQueryKeys.detail(deadlineId),
        completedDeadline,
      );
      void queryClient.invalidateQueries({ queryKey: deadlineQueryKeys.all });
    },
  });
}

export function useCancelDeadline(deadlineId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => cancelDeadline(deadlineId, version),
    onSuccess: (cancelledDeadline) => {
      queryClient.setQueryData(
        deadlineQueryKeys.detail(deadlineId),
        cancelledDeadline,
      );
      void queryClient.invalidateQueries({ queryKey: deadlineQueryKeys.all });
    },
  });
}
