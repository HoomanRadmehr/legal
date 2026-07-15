import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { connectUserEvents } from "../../realtime";
import type { DocumentUploadStatusEvent, RealtimeStatus } from "../../realtime";
import {
  completeDocumentUpload,
  createDocumentPresign,
  getDocument,
  listDocumentMatterChoices,
  listDocuments,
  requestDocumentDownloadUrl,
  revokeDocument,
} from "./api";
import { documentQueryKeys } from "./queryKeys";
import { calculateOptionalSha256, uploadFileDirectlyToMinio } from "./upload";
import type {
  CreateDocumentPresignInput,
  DirectUploadState,
  DocumentListParams,
  DocumentRecord,
  DocumentStatus,
  DocumentUploadIntent,
  DocumentUploadSummary,
  ChoicePage,
  MatterChoice,
} from "./types";

export type UploadAttempt = {
  document:
    DocumentUploadIntent | DocumentRecord | DocumentUploadSummary | null;
  error: unknown;
  progress: number;
  serverStatus: DocumentStatus | "";
  status: DirectUploadState;
};

type UploadJob =
  | { description: string; file: File; kind: "new" }
  | { documentId: string; kind: "complete" };

const ACTIVE_DOCUMENT_STATUSES: DocumentStatus[] = [
  "pending_upload",
  "verifying",
];
const FINAL_DOCUMENT_STATUSES: DocumentStatus[] = [
  "available",
  "cancelled",
  "expired",
  "failed",
];

export function useDocumentUpload(matterId: string) {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const completionDocumentIdRef = useRef("");
  const descriptionRef = useRef("");
  const fileRef = useRef<File | null>(null);
  const [attempt, setAttempt] = useState<UploadAttempt>(initialAttempt());
  const mutation = useMutation({
    mutationFn: (job: UploadJob) =>
      runUploadJob({
        abortRef,
        completionDocumentIdRef,
        descriptionRef,
        fileRef,
        job,
        matterId,
        queryClient,
        setAttempt,
      }),
    onError: (error) => {
      setAttempt((current) => failedAttempt(current, error));
    },
  });

  return useMemo(
    () => ({
      attempt,
      cancelUpload: () => cancelUpload({ abortRef, setAttempt }),
      error: uploadError({ attempt, mutationError: mutation.error }),
      isError: Boolean(uploadError({ attempt, mutationError: mutation.error })),
      reset: () =>
        resetUpload({
          completionDocumentIdRef,
          descriptionRef,
          fileRef,
          mutation,
          setAttempt,
        }),
      retry: () =>
        retryUpload({
          completionDocumentIdRef,
          descriptionRef,
          fileRef,
          mutation,
        }),
      startUpload: (file: File, description = "") => {
        descriptionRef.current = description;
        fileRef.current = file;
        completionDocumentIdRef.current = "";
        mutation.mutate({ description, file, kind: "new" });
      },
    }),
    [attempt, mutation],
  );
}

export function useDocumentUploadStatus({
  documentId,
  enabled,
  polling,
}: {
  documentId: string;
  enabled: boolean;
  polling: boolean;
}) {
  return useQuery({
    enabled: enabled && Boolean(documentId),
    queryFn: () => getDocument(documentId),
    queryKey: documentQueryKeys.detail(documentId),
    refetchInterval: polling ? 5_000 : false,
  });
}

export function useDocumentList(params: DocumentListParams = {}) {
  return useQuery({
    queryFn: () => listDocuments(params),
    queryKey: documentQueryKeys.list(params),
  });
}

export function useDocumentMatterChoices(query: string, enabled: boolean) {
  return useInfiniteQuery({
    enabled,
    getNextPageParam: (lastPage: ChoicePage<MatterChoice>) =>
      lastPage.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }): Promise<ChoicePage<MatterChoice>> =>
      listDocumentMatterChoices({ cursor: pageParam, query }),
    queryKey: documentQueryKeys.matterChoices(query),
  });
}

export function useDocumentDownload() {
  return useMutation({
    mutationFn: (documentId: string) => requestDocumentDownloadUrl(documentId),
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
  });
}

export function useRevokeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => revokeDocument(documentId),
    onSuccess: (document) => {
      updateDocumentCaches(queryClient, document);
    },
  });
}

export function useDocumentRealtimeRecovery() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");

  useEffect(() => {
    if (typeof WebSocket === "undefined") {
      return undefined;
    }
    const connection = connectUserEvents({
      onEvent: (event) => handleUploadEvent(queryClient, event),
      onStatusChange: (nextStatus) => {
        setStatus(nextStatus);
        if (nextStatus === "connected") {
          void queryClient.invalidateQueries({
            queryKey: documentQueryKeys.all,
          });
        }
      },
    });
    return () => connection.disconnect();
  }, [queryClient]);

  return status;
}

export function isActiveUploadStatus(status: DocumentStatus | ""): boolean {
  return ACTIVE_DOCUMENT_STATUSES.includes(status as DocumentStatus);
}

export function applyDocumentStatusEvent(
  document: DocumentRecord,
  event: DocumentUploadStatusEvent,
): DocumentRecord {
  if (document.id !== event.data.document_id) {
    return document;
  }
  if (isFinalStatus(document.status) && document.status !== event.data.status) {
    return document;
  }
  return { ...document, status: event.data.status as DocumentStatus };
}

async function runUploadJob({
  abortRef,
  completionDocumentIdRef,
  descriptionRef,
  fileRef,
  job,
  matterId,
  queryClient,
  setAttempt,
}: {
  abortRef: React.MutableRefObject<AbortController | null>;
  completionDocumentIdRef: React.MutableRefObject<string>;
  descriptionRef: React.MutableRefObject<string>;
  fileRef: React.MutableRefObject<File | null>;
  job: UploadJob;
  matterId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  setAttempt: Dispatch<SetStateAction<UploadAttempt>>;
}) {
  if (job.kind === "complete") {
    return completeStoredDocument({
      documentId: job.documentId,
      queryClient,
      setAttempt,
    });
  }
  return uploadNewFile({
    abortRef,
    completionDocumentIdRef,
    description: job.description,
    descriptionRef,
    file: job.file,
    fileRef,
    matterId,
    queryClient,
    setAttempt,
  });
}

async function uploadNewFile({
  abortRef,
  completionDocumentIdRef,
  description,
  descriptionRef,
  file,
  matterId,
  queryClient,
  setAttempt,
}: {
  abortRef: React.MutableRefObject<AbortController | null>;
  completionDocumentIdRef: React.MutableRefObject<string>;
  description: string;
  descriptionRef: React.MutableRefObject<string>;
  file: File;
  fileRef: React.MutableRefObject<File | null>;
  matterId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  setAttempt: Dispatch<SetStateAction<UploadAttempt>>;
}) {
  const idempotencyKey = crypto.randomUUID();
  const abortController = new AbortController();
  descriptionRef.current = description;
  abortRef.current = abortController;
  setAttempt(() => statusAttempt("preparing"));
  const checksum = await calculateOptionalSha256(file);
  setAttempt((attempt) => ({ ...attempt, status: "requesting_presign" }));
  const presign = await createDocumentPresign(
    uploadInput({ checksum, description, file, matterId }),
    idempotencyKey,
  );
  completionDocumentIdRef.current = presign.document.id;
  setAttempt((attempt) => uploadStarted(attempt, presign.document));
  await uploadFileDirectlyToMinio({
    file,
    onProgress: (progress) => {
      setAttempt((attempt) => ({ ...attempt, progress: progress.percent }));
    },
    signal: abortController.signal,
    upload: presign.upload,
  });
  setAttempt((attempt) => ({
    ...attempt,
    progress: 100,
    status: "uploaded_to_storage",
  }));
  return completeStoredDocument({
    documentId: presign.document.id,
    queryClient,
    setAttempt,
  });
}

async function completeStoredDocument({
  documentId,
  queryClient,
  setAttempt,
}: {
  documentId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  setAttempt: Dispatch<SetStateAction<UploadAttempt>>;
}) {
  setAttempt((attempt) => ({ ...attempt, status: "completing" }));
  const document = await completeDocumentUpload(documentId);
  cacheDocumentSummary(queryClient, document);
  setAttempt((attempt) => documentAttempt(attempt, document));
  return document;
}

function handleUploadEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  event: DocumentUploadStatusEvent,
): void {
  queryClient.setQueryData<DocumentRecord>(
    documentQueryKeys.detail(event.data.document_id),
    (document) =>
      document ? applyDocumentStatusEvent(document, event) : document,
  );
  void queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
}

function cacheDocumentSummary(
  queryClient: ReturnType<typeof useQueryClient>,
  document: DocumentUploadSummary,
): void {
  queryClient.setQueryData(documentQueryKeys.detail(document.id), document);
  void queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
}

function updateDocumentCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  document: DocumentRecord,
): void {
  void queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
  queryClient.setQueriesData(
    { queryKey: documentQueryKeys.all },
    (data: unknown) => replaceDocumentInPage(data, document),
  );
}

function replaceDocumentInPage(data: unknown, document: DocumentRecord) {
  if (!isDocumentPage(data)) {
    return data;
  }
  return {
    ...data,
    results: data.results.map((item) =>
      item.id === document.id ? document : item,
    ),
  };
}

function isDocumentPage(data: unknown): data is {
  results: DocumentRecord[];
} {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { results?: unknown }).results)
  );
}

function uploadInput({
  checksum,
  description,
  file,
  matterId,
}: {
  checksum: string;
  description: string;
  file: File;
  matterId: string;
}): CreateDocumentPresignInput {
  return {
    checksum_sha256: checksum,
    content_type: file.type || "application/octet-stream",
    description: description.trim() || undefined,
    filename: file.name,
    matter_id: matterId,
    size: file.size,
  };
}

function uploadStarted(
  attempt: UploadAttempt,
  document: DocumentUploadIntent,
): UploadAttempt {
  return {
    ...attempt,
    document,
    error: null,
    progress: 0,
    serverStatus: document.status,
    status: "uploading",
  };
}

function documentAttempt(
  attempt: UploadAttempt,
  document: DocumentUploadSummary,
): UploadAttempt {
  return {
    ...attempt,
    document,
    error: null,
    progress: 100,
    serverStatus: document.status,
    status: uploadStateFromDocument(document.status),
  };
}

function failedAttempt(attempt: UploadAttempt, error: unknown): UploadAttempt {
  if (attempt.status === "cancelled") {
    return attempt;
  }
  return { ...attempt, error, status: "failed" };
}

function statusAttempt(status: DirectUploadState): UploadAttempt {
  return {
    document: null,
    error: null,
    progress: 0,
    serverStatus: "",
    status,
  };
}

function initialAttempt(): UploadAttempt {
  return statusAttempt("idle");
}

function uploadStateFromDocument(status: DocumentStatus): DirectUploadState {
  if (status === "pending_upload") {
    return "verifying";
  }
  return status;
}

function cancelUpload({
  abortRef,
  setAttempt,
}: {
  abortRef: React.MutableRefObject<AbortController | null>;
  setAttempt: Dispatch<SetStateAction<UploadAttempt>>;
}) {
  abortRef.current?.abort();
  setAttempt((attempt) => ({ ...attempt, error: null, status: "cancelled" }));
}

function uploadError({
  attempt,
  mutationError,
}: {
  attempt: UploadAttempt;
  mutationError: unknown;
}): unknown {
  if (attempt.status === "cancelled") {
    return attempt.error;
  }
  return attempt.error ?? mutationError;
}

function retryUpload({
  completionDocumentIdRef,
  descriptionRef,
  fileRef,
  mutation,
}: {
  completionDocumentIdRef: React.MutableRefObject<string>;
  descriptionRef: React.MutableRefObject<string>;
  fileRef: React.MutableRefObject<File | null>;
  mutation: ReturnType<
    typeof useMutation<DocumentUploadSummary, Error, UploadJob>
  >;
}) {
  if (completionDocumentIdRef.current) {
    mutation.mutate({
      documentId: completionDocumentIdRef.current,
      kind: "complete",
    });
    return;
  }
  if (fileRef.current) {
    mutation.mutate({
      description: descriptionRef.current,
      file: fileRef.current,
      kind: "new",
    });
  }
}

function resetUpload({
  completionDocumentIdRef,
  descriptionRef,
  fileRef,
  mutation,
  setAttempt,
}: {
  completionDocumentIdRef: React.MutableRefObject<string>;
  descriptionRef: React.MutableRefObject<string>;
  fileRef: React.MutableRefObject<File | null>;
  mutation: ReturnType<
    typeof useMutation<DocumentUploadSummary, Error, UploadJob>
  >;
  setAttempt: Dispatch<SetStateAction<UploadAttempt>>;
}) {
  completionDocumentIdRef.current = "";
  descriptionRef.current = "";
  fileRef.current = null;
  mutation.reset();
  setAttempt(initialAttempt());
}

function isFinalStatus(status: string): boolean {
  return FINAL_DOCUMENT_STATUSES.includes(status as DocumentStatus);
}
