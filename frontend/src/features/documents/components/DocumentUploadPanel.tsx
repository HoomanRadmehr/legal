import { useId, useState } from "react";

import { canUploadDocument } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { isApiError } from "../../../api/errors";
import { useI18n } from "../../../i18n";
import {
  isActiveUploadStatus,
  useDocumentUpload,
  useDocumentUploadStatus,
} from "../hooks";
import { allowedUploadTypes, filePolicyError } from "../policy";
import { documentText, fillDocumentText } from "../text";
import type { DocumentStatus } from "../types";
import { isDirectUploadError, type DirectUploadFailure } from "../upload";
import { DocumentUploadProgress } from "./DocumentUploadProgress";
import "./documents.css";

export function DocumentUploadPanel({ matterId }: { matterId: string }) {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = documentText(locale);
  const inputId = useId();
  const upload = useDocumentUpload(matterId);
  const [localError, setLocalError] = useState("");
  const role = session?.membership.role ?? "";
  const documentId = upload.attempt.document?.id ?? "";
  const statusQuery = useDocumentUploadStatus({
    documentId,
    enabled: Boolean(documentId),
    polling: isActiveUploadStatus(upload.attempt.serverStatus),
  });
  const serverStatus = statusQuery.data?.status ?? upload.attempt.serverStatus;

  if (!canUploadDocument(role)) {
    return null;
  }

  return (
    <section
      className="document-upload"
      aria-labelledby="document-upload-title"
    >
      <div>
        <h2 id="document-upload-title">{labels.upload}</h2>
        <p>{labels.uploadDescription}</p>
      </div>
      <label className="document-upload__dropzone" htmlFor={inputId}>
        <span>{labels.select}</span>
        <input
          accept={allowedUploadTypes()}
          id={inputId}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              startFileUpload({
                file,
                locale,
                setLocalError,
                startUpload: upload.startUpload,
              });
            }
          }}
          type="file"
        />
      </label>
      <div
        className="document-upload__dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) {
            startFileUpload({
              file,
              locale,
              setLocalError,
              startUpload: upload.startUpload,
            });
          }
        }}
      >
        {labels.dropHere}
      </div>
      <DocumentUploadProgress
        canCancel={upload.attempt.status === "uploading"}
        canRetry={canRetryUpload(upload.attempt.status)}
        onCancel={upload.cancelUpload}
        onReset={upload.reset}
        onRetry={upload.retry}
        progress={upload.attempt.progress}
        serverStatus={serverStatus}
        status={upload.attempt.status}
      />
      {showBackendVerification(upload.attempt.status, serverStatus) ? (
        <p className="document-upload__status">{labels.verifying}</p>
      ) : null}
      {localError ? (
        <p className="document-upload__alert" role="alert">
          {localError}
        </p>
      ) : null}
      {upload.isError ? (
        <UploadError error={upload.error} locale={locale} />
      ) : null}
    </section>
  );
}

function startFileUpload({
  file,
  locale,
  setLocalError,
  startUpload,
}: {
  file: File;
  locale: ReturnType<typeof useI18n>["locale"];
  setLocalError: (message: string) => void;
  startUpload: (file: File) => void;
}) {
  const policyError = filePolicyError(file, locale);
  if (policyError) {
    setLocalError(policyError);
    return;
  }
  setLocalError("");
  startUpload(file);
}

function UploadError({
  error,
  locale,
}: {
  error: unknown;
  locale: ReturnType<typeof useI18n>["locale"];
}) {
  return (
    <p className="document-upload__alert" role="alert">
      {uploadErrorMessage(error, locale)}
    </p>
  );
}

function uploadErrorMessage(
  error: unknown,
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const labels = documentText(locale);
  if (isApiError(error) && error.status === 429 && error.retryAfterSeconds) {
    return fillDocumentText(labels.rateLimited, {
      seconds: error.retryAfterSeconds,
    });
  }
  if (isApiError(error) && error.status === 413) {
    return labels.tooLarge;
  }
  if (isApiError(error) && error.status === 422) {
    return error.message;
  }
  if (isDirectUploadError(error)) {
    return directUploadErrorMessage(error, locale);
  }
  return error instanceof Error ? error.message : labels.uploadFailed;
}

function directUploadErrorMessage(
  error: DirectUploadFailure,
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const labels = documentText(locale);
  if (error.code === "storage_forbidden") {
    return labels.uploadUrlExpired;
  }
  if (error.code === "storage_network_error") {
    return labels.networkFailure;
  }
  if (error.code === "storage_unavailable") {
    return labels.storageUnavailable;
  }
  if (error.code === "upload_cancelled") {
    return labels.cancelled;
  }
  return labels.storageUploadFailed;
}

function canRetryUpload(status: string): boolean {
  return ["failed", "expired", "cancelled"].includes(status);
}

function showBackendVerification(
  status: string,
  serverStatus: DocumentStatus | "",
): boolean {
  if (["cancelled", "expired", "failed"].includes(status)) {
    return false;
  }
  return isActiveUploadStatus(serverStatus);
}
