import { apiClient, type QueryValue } from "../../api/client";
import type {
  ContractDetail,
  ContractInput,
  ContractListItem,
  ContractListParams,
  ContractTimelineEvent,
  ContractUpdateInput,
  PaginatedResponse,
} from "./types";

export async function listContracts(
  params: ContractListParams = {},
): Promise<PaginatedResponse<ContractListItem>> {
  return apiClient.request<PaginatedResponse<ContractListItem>>("/contracts/", {
    query: buildContractListQuery(params),
  });
}

export async function getContract(contractId: string): Promise<ContractDetail> {
  return apiClient.request<ContractDetail>(`/contracts/${contractId}/`);
}

export async function createContract(
  input: ContractInput,
): Promise<ContractDetail> {
  return apiClient.request<ContractDetail>("/contracts/", {
    body: input,
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function updateContract(
  contractId: string,
  input: ContractUpdateInput,
): Promise<ContractDetail> {
  return apiClient.request<ContractDetail>(`/contracts/${contractId}/`, {
    body: input,
    method: "PATCH",
    replayOnUnauthorized: false,
  });
}

export async function archiveContract(
  contractId: string,
  version: number,
): Promise<ContractDetail> {
  return apiClient.request<ContractDetail>(
    `/contracts/${contractId}/archive/`,
    {
      body: { version },
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}

export async function listContractTimeline(
  contractId: string,
): Promise<ContractTimelineEvent[]> {
  return apiClient.request<ContractTimelineEvent[]>(
    `/contracts/${contractId}/timeline/`,
  );
}

export function buildContractListQuery(
  params: ContractListParams,
): Record<string, QueryValue> {
  return {
    archived: params.archived,
    contract_type: emptyToUndefined(params.contractType),
    counterparty: emptyToUndefined(params.counterparty),
    effective_after: emptyToUndefined(params.effectiveAfter),
    effective_before: emptyToUndefined(params.effectiveBefore),
    expiration_after: emptyToUndefined(params.expirationAfter),
    expiration_before: emptyToUndefined(params.expirationBefore),
    ordering: params.ordering,
    owner: emptyToUndefined(params.owner),
    page: params.page,
    priority: emptyToUndefined(params.priority),
    renewal_after: emptyToUndefined(params.renewalAfter),
    renewal_before: emptyToUndefined(params.renewalBefore),
    search: emptyToUndefined(params.search),
    status: emptyToUndefined(params.status),
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
