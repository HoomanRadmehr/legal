import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveContract,
  createContract,
  getContract,
  listContractTimeline,
  listContracts,
  updateContract,
} from "./api";
import { contractQueryKeys } from "./queryKeys";
import type {
  ContractInput,
  ContractListParams,
  ContractUpdateInput,
} from "./types";

export function useContractList(params: ContractListParams) {
  return useQuery({
    queryFn: () => listContracts(params),
    queryKey: contractQueryKeys.list(params),
  });
}

export function useContractDetail(contractId: string) {
  return useQuery({
    queryFn: () => getContract(contractId),
    queryKey: contractQueryKeys.detail(contractId),
  });
}

export function useContractTimeline(contractId: string) {
  return useQuery({
    queryFn: () => listContractTimeline(contractId),
    queryKey: contractQueryKeys.timeline(contractId),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContractInput) => createContract(input),
    onSuccess: (createdContract) => {
      queryClient.setQueryData(
        contractQueryKeys.detail(createdContract.id),
        createdContract,
      );
      void queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
    },
  });
}

export function useUpdateContract(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContractUpdateInput) =>
      updateContract(contractId, input),
    onSuccess: (updatedContract) => {
      queryClient.setQueryData(
        contractQueryKeys.detail(contractId),
        updatedContract,
      );
      void queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
    },
  });
}

export function useArchiveContract(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) => archiveContract(contractId, version),
    onSuccess: (archivedContract) => {
      queryClient.setQueryData(
        contractQueryKeys.detail(contractId),
        archivedContract,
      );
      void queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
    },
  });
}
