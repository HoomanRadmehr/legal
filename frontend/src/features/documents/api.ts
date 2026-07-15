import { apiClient, type QueryValue } from "../../api/client";
import type {
  CreateDocumentPresignInput,
  CreateDocumentPresignResponse,
  DocumentDownloadUrl,
  DocumentListParams,
  DocumentRecord,
  DocumentUploadSummary,
  ChoicePage,
  MatterChoice,
  PaginatedResponse,
} from "./types";

export async function createDocumentPresign(
  input: CreateDocumentPresignInput,
  idempotencyKey: string,
): Promise<CreateDocumentPresignResponse> {
  return apiClient.request<CreateDocumentPresignResponse>(
    "/documents/presign/",
    {
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}

export async function completeDocumentUpload(
  documentId: string,
): Promise<DocumentUploadSummary> {
  return apiClient.request<DocumentUploadSummary>(
    `/documents/${documentId}/complete/`,
    {
      body: {},
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}

export async function getDocument(documentId: string): Promise<DocumentRecord> {
  return apiClient.request<DocumentRecord>(`/documents/${documentId}/`);
}

export async function listDocuments(
  params: DocumentListParams = {},
): Promise<PaginatedResponse<DocumentRecord>> {
  return apiClient.request<PaginatedResponse<DocumentRecord>>("/documents/", {
    query: buildDocumentListQuery(params),
  });
}

export async function requestDocumentDownloadUrl(
  documentId: string,
): Promise<DocumentDownloadUrl> {
  return apiClient.request<DocumentDownloadUrl>(
    `/documents/${documentId}/download-url/`,
    {
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}

export async function revokeDocument(
  documentId: string,
): Promise<DocumentRecord> {
  return apiClient.request<DocumentRecord>(`/documents/${documentId}/revoke/`, {
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function listDocumentMatterChoices(input: {
  cursor?: string;
  query: string;
}): Promise<ChoicePage<MatterChoice>> {
  return apiClient.request<ChoicePage<MatterChoice>>("/matters/choices/", {
    query: {
      cursor: emptyToUndefined(input.cursor),
      purpose: "document_upload",
      q: emptyToUndefined(input.query),
    },
  });
}

function buildDocumentListQuery(
  params: DocumentListParams,
): Record<string, QueryValue> {
  return {
    matter: emptyToUndefined(params.matter),
    ordering: params.ordering,
    page: params.page,
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
