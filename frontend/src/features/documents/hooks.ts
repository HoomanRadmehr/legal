import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { connectUserEvents } from "../../realtime";
import type { DocumentUploadStatusEvent, RealtimeStatus } from "../../realtime";
import {
  completeDocumentUpload,
  getDocumentUpload,
  initiateDocumentUpload,
  listDocuments,
  requestDocumentDownloadUrl,
  revokeDocument,
  uploadFileToStorage,
} from "./api";
import { documentQueryKeys } from "./queryKeys";
import type {
  DocumentListParams,
  DocumentRecord,
  DocumentUploadInitiation,
  DocumentUploadSession,
  UploadStatus,
} from "./types";

export type LocalUploadState =
  "completed" | "completing" | "idle" | "initiating" | "selected" | "uploading";

export type UploadAttempt = {
  idempotencyKey: string;
  initiation: DocumentUploadInitiation | null;
  progress: number;
  serverStatus: UploadStatus | "";
  state: LocalUploadState;
};

const ACTIVE_UPLOAD_STATUSES = ["initiated", "processing", "verifying"];
const FINAL_UPLOAD_STATUSES = ["available", "cancelled", "expired", "failed"];

export function useDocumentUpload(matterId: string) {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState<UploadAttempt>(initialAttempt());
  const mutation = useMutation({
    mutationFn: (file: File) =>
      uploadSelectedFile({ file, matterId, queryClient, setAttempt }),
  });

  return useMemo(
    () => ({
      attempt,
      error: mutation.error,
      isError: mutation.isError,
      reset: () => {
        mutation.reset();
        setAttempt(initialAttempt());
      },
      startUpload: (file: File) => mutation.mutate(file),
    }),
    [attempt, mutation],
  );
}

export function useDocumentUploadStatus({
  enabled,
  polling,
  uploadId,
}: {
  enabled: boolean;
  polling: boolean;
  uploadId: string;
}) {
  return useQuery({
    enabled: enabled && Boolean(uploadId),
    queryFn: () => getDocumentUpload(uploadId),
    queryKey: documentQueryKeys.upload(uploadId),
    refetchInterval: polling ? 5_000 : false,
  });
}

export function useDocumentList(params: DocumentListParams = {}) {
  return useQuery({
    queryFn: () => listDocuments(params),
    queryKey: documentQueryKeys.list(params),
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

export function isActiveUploadStatus(status: UploadStatus | ""): boolean {
  return ACTIVE_UPLOAD_STATUSES.includes(status);
}

export function applyUploadStatusEvent(
  session: DocumentUploadSession,
  event: DocumentUploadStatusEvent,
): DocumentUploadSession {
  if (session.id !== event.data.upload_id) {
    return session;
  }
  if (isFinalStatus(session.status) && session.status !== event.data.status) {
    return session;
  }
  return { ...session, status: event.data.status as UploadStatus };
}

async function uploadSelectedFile({
  file,
  matterId,
  queryClient,
  setAttempt,
}: {
  file: File;
  matterId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  setAttempt: (updater: (attempt: UploadAttempt) => UploadAttempt) => void;
}) {
  const idempotencyKey = crypto.randomUUID();
  setAttempt(() => selectedAttempt(idempotencyKey));
  setAttempt((attempt) => ({ ...attempt, state: "initiating" }));
  const initiation = await initiateDocumentUpload(uploadInput(file, matterId));
  setAttempt((attempt) => uploadStarted(attempt, initiation));
  await uploadFileToStorage({
    file,
    instructions: initiation.instructions,
    onProgress: (progress) => {
      setAttempt((attempt) => ({ ...attempt, progress: progress.percent }));
    },
  });
  setAttempt((attempt) => ({ ...attempt, progress: 100, state: "completing" }));
  const session = await completeDocumentUpload({
    idempotencyKey,
    uploadId: initiation.upload.id,
  });
  cacheUploadSession(queryClient, session);
  setAttempt((attempt) => uploadCompleted(attempt, session));
  return { idempotencyKey, initiation };
}

function handleUploadEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  event: DocumentUploadStatusEvent,
): void {
  queryClient.setQueryData<DocumentUploadSession>(
    documentQueryKeys.upload(event.data.upload_id),
    (session) => (session ? applyUploadStatusEvent(session, event) : session),
  );
  void queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
}

function cacheUploadSession(
  queryClient: ReturnType<typeof useQueryClient>,
  session: DocumentUploadSession,
): void {
  queryClient.setQueryData(documentQueryKeys.upload(session.id), session);
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

function uploadInput(file: File, matterId: string) {
  return {
    content_type: file.type || "application/octet-stream",
    filename: file.name,
    matter_id: matterId,
    size: file.size,
  };
}

function uploadStarted(
  attempt: UploadAttempt,
  initiation: DocumentUploadInitiation,
): UploadAttempt {
  return {
    ...attempt,
    initiation,
    serverStatus: initiation.upload.status,
    state: "uploading",
  };
}

function uploadCompleted(
  attempt: UploadAttempt,
  session: DocumentUploadSession,
): UploadAttempt {
  return {
    ...attempt,
    progress: 100,
    serverStatus: session.status,
    state: "completed",
  };
}

function initialAttempt(): UploadAttempt {
  return {
    idempotencyKey: "",
    initiation: null,
    progress: 0,
    serverStatus: "",
    state: "idle",
  };
}

function selectedAttempt(idempotencyKey: string): UploadAttempt {
  return {
    idempotencyKey,
    initiation: null,
    progress: 0,
    serverStatus: "",
    state: "selected",
  };
}

function isFinalStatus(status: string): boolean {
  return FINAL_UPLOAD_STATUSES.includes(status);
}
