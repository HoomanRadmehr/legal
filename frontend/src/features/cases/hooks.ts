import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveCase,
  createCase,
  getCase,
  listCaseTimeline,
  listCases,
  updateCase,
} from "./api";
import { caseQueryKeys } from "./queryKeys";
import type { CaseInput, CaseListParams, CaseUpdateInput } from "./types";

export function useCaseList(params: CaseListParams) {
  return useQuery({
    queryFn: () => listCases(params),
    queryKey: caseQueryKeys.list(params),
  });
}

export function useCaseDetail(caseId: string) {
  return useQuery({
    queryFn: () => getCase(caseId),
    queryKey: caseQueryKeys.detail(caseId),
  });
}

export function useCaseTimeline(caseId: string) {
  return useQuery({
    queryFn: () => listCaseTimeline(caseId),
    queryKey: caseQueryKeys.timeline(caseId),
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CaseInput) => createCase(input),
    onSuccess: (createdCase) => {
      queryClient.setQueryData(
        caseQueryKeys.detail(createdCase.id),
        createdCase,
      );
      void queryClient.invalidateQueries({ queryKey: caseQueryKeys.all });
    },
  });
}

export function useUpdateCase(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CaseUpdateInput) => updateCase(caseId, input),
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(caseQueryKeys.detail(caseId), updatedCase);
      void queryClient.invalidateQueries({ queryKey: caseQueryKeys.all });
    },
  });
}

export function useArchiveCase(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => archiveCase(caseId, version),
    onSuccess: (archivedCase) => {
      queryClient.setQueryData(caseQueryKeys.detail(caseId), archivedCase);
      void queryClient.invalidateQueries({ queryKey: caseQueryKeys.all });
    },
  });
}
