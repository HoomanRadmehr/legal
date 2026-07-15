import { useId, useState } from "react";

import { canUploadDocument } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { isApiError } from "../../../api/errors";
import {
  isActiveUploadStatus,
  useDocumentUpload,
  useDocumentUploadStatus,
} from "../hooks";
import { useI18n } from "../../../i18n";
import { allowedUploadTypes, filePolicyError } from "../policy";
import { documentText, fillDocumentText } from "../text";
import "./documents.css";

export function DocumentUploadPanel({ matterId }: { matterId: string }) {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = documentText(locale);
  const inputId = useId();
  const upload = useDocumentUpload(matterId);
  const [localError, setLocalError] = useState("");
  const role = session?.membership.role ?? "";
  const uploadId = upload.attempt.initiation?.upload.id ?? "";
  const statusQuery = useDocumentUploadStatus({
    enabled: Boolean(uploadId),
    polling: isActiveUploadStatus(upload.attempt.serverStatus),
    uploadId,
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
      <UploadProgress
        locale={locale}
        state={upload.attempt.state}
        progress={upload.attempt.progress}
        serverStatus={serverStatus}
      />
      {isActiveUploadStatus(serverStatus) ? (
        <p className="document-upload__status">
          {labels.processing}
        </p>
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

function UploadProgress({
  progress,
  locale,
  serverStatus,
  state,
}: {
  progress: number;
  locale: ReturnType<typeof useI18n>["locale"];
  serverStatus: string;
  state: string;
}) {
  if (state === "idle") {
    return null;
  }
  return (
    <div className="document-upload__progress" aria-live="polite">
      <progress
        aria-label={documentText(locale).uploadProgress}
        max={100}
        value={progress}
      />
      <span>{uploadStateLabel(state, progress, serverStatus, locale)}</span>
    </div>
  );
}

function uploadStateLabel(
  state: string,
  progress: number,
  serverStatus: string,
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const labels = documentText(locale);
  if (state === "initiating") {
    return labels.initiating;
  }
  if (state === "uploading") {
    return fillDocumentText(labels.uploading, { progress });
  }
  if (state === "completing") {
    return labels.completing;
  }
  if (state === "completed" && serverStatus) {
    return fillDocumentText(labels.serverStatus, { status: serverStatus });
  }
  return labels.fileSelected;
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
  return error instanceof Error ? error.message : labels.uploadFailed;
}
