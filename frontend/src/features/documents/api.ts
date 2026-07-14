import { apiClient, type QueryValue } from "../../api/client";
import type {
  DirectUploadInput,
  DocumentDownloadUrl,
  DocumentListParams,
  DocumentRecord,
  DocumentUploadInitiateInput,
  DocumentUploadInitiation,
  DocumentUploadSession,
  PaginatedResponse,
  UploadInitiationApiResponse,
} from "./types";

export async function initiateDocumentUpload(
  input: DocumentUploadInitiateInput,
): Promise<DocumentUploadInitiation> {
  const response = await apiClient.request<UploadInitiationApiResponse>(
    "/documents/uploads/",
    {
      body: input,
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
  return normalizeInitiationResponse(response, input);
}

export async function completeDocumentUpload({
  idempotencyKey,
  uploadId,
}: {
  idempotencyKey: string;
  uploadId: string;
}): Promise<DocumentUploadSession> {
  return apiClient.request<DocumentUploadSession>(
    `/documents/uploads/${uploadId}/complete/`,
    {
      headers: { "Idempotency-Key": idempotencyKey },
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}

export async function getDocumentUpload(
  uploadId: string,
): Promise<DocumentUploadSession> {
  return apiClient.request<DocumentUploadSession>(
    `/documents/uploads/${uploadId}/`,
  );
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

export function uploadFileToStorage({
  file,
  instructions,
  onProgress,
}: DirectUploadInput): Promise<void> {
  if (instructions.method === "POST") {
    return postFileToStorage({ file, instructions, onProgress });
  }
  return putFileToStorage({ file, instructions, onProgress });
}

function putFileToStorage({
  file,
  instructions,
  onProgress,
}: DirectUploadInput): Promise<void> {
  return sendStorageRequest({
    body: file,
    headers: instructions.headers,
    method: instructions.method,
    onProgress,
    url: instructions.url,
  });
}

function postFileToStorage({
  file,
  instructions,
  onProgress,
}: DirectUploadInput): Promise<void> {
  const body = new FormData();
  for (const [key, value] of Object.entries(instructions.fields)) {
    body.append(key, value);
  }
  body.append("file", file);
  return sendStorageRequest({
    body,
    headers: instructions.headers,
    method: instructions.method,
    onProgress,
    url: instructions.url,
  });
}

function sendStorageRequest({
  body,
  headers,
  method,
  onProgress,
  url,
}: {
  body: XMLHttpRequestBodyInit;
  headers: Record<string, string>;
  method: string;
  onProgress: DirectUploadInput["onProgress"];
  url: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url);
    setStorageHeaders(request, headers);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(progressFromEvent(event));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress({ loaded: 1, percent: 100, total: 1 });
        resolve();
        return;
      }
      reject(new Error("The upload could not be completed."));
    };
    request.onerror = () =>
      reject(new Error("The upload could not be completed."));
    request.send(body);
  });
}

function setStorageHeaders(
  request: XMLHttpRequest,
  headers: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(headers)) {
    request.setRequestHeader(name, value);
  }
}

function progressFromEvent(event: ProgressEvent): {
  loaded: number;
  percent: number;
  total: number;
} {
  const percent = Math.round((event.loaded / event.total) * 100);
  return {
    loaded: event.loaded,
    percent: Math.min(percent, 99),
    total: event.total,
  };
}

function normalizeInitiationResponse(
  response: UploadInitiationApiResponse,
  input: DocumentUploadInitiateInput,
): DocumentUploadInitiation {
  if ("instructions" in response) {
    return response;
  }
  return {
    instructions: {
      completion_url: response.completion_url,
      expires_at: response.expires_at,
      fields: response.fields,
      headers: response.headers,
      method: response.method,
      polling_url: response.polling_url,
      url: response.url,
    },
    upload: {
      completed_at: null,
      created_at: "",
      description: input.description ?? "",
      expected_checksum: input.checksum ?? "",
      expected_content_type: input.content_type,
      expected_size: input.size,
      expires_at: response.expires_at,
      failure_code: "",
      id: response.id,
      matter_id: input.matter_id,
      original_filename: input.filename,
      requested_by_id: "",
      status: response.status,
      updated_at: "",
    },
  };
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
