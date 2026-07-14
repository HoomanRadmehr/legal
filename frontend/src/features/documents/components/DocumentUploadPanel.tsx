import { useId, useState } from "react";

import { canUploadDocument } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { isApiError } from "../../../api/errors";
import {
  isActiveUploadStatus,
  useDocumentUpload,
  useDocumentUploadStatus,
} from "../hooks";
import { allowedUploadTypes, filePolicyError } from "../policy";
import "./documents.css";

export function DocumentUploadPanel({ matterId }: { matterId: string }) {
  const { session } = useAuth();
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
        <h2 id="document-upload-title">Upload document</h2>
        <p>
          Files upload directly to private storage after backend authorization.
        </p>
      </div>
      <label className="document-upload__dropzone" htmlFor={inputId}>
        <span>Select document</span>
        <input
          accept={allowedUploadTypes()}
          id={inputId}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              startFileUpload({
                file,
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
              setLocalError,
              startUpload: upload.startUpload,
            });
          }
        }}
      >
        Drop document here
      </div>
      <UploadProgress
        state={upload.attempt.state}
        progress={upload.attempt.progress}
        serverStatus={serverStatus}
      />
      {isActiveUploadStatus(serverStatus) ? (
        <p className="document-upload__status">
          Byte upload complete. Server processing remains authoritative.
        </p>
      ) : null}
      {localError ? (
        <p className="document-upload__alert" role="alert">
          {localError}
        </p>
      ) : null}
      {upload.isError ? <UploadError error={upload.error} /> : null}
    </section>
  );
}

function startFileUpload({
  file,
  setLocalError,
  startUpload,
}: {
  file: File;
  setLocalError: (message: string) => void;
  startUpload: (file: File) => void;
}) {
  const policyError = filePolicyError(file);
  if (policyError) {
    setLocalError(policyError);
    return;
  }
  setLocalError("");
  startUpload(file);
}

function UploadProgress({
  progress,
  serverStatus,
  state,
}: {
  progress: number;
  serverStatus: string;
  state: string;
}) {
  if (state === "idle") {
    return null;
  }
  return (
    <div className="document-upload__progress" aria-live="polite">
      <progress aria-label="Upload progress" max={100} value={progress} />
      <span>{uploadStateLabel(state, progress, serverStatus)}</span>
    </div>
  );
}

function uploadStateLabel(
  state: string,
  progress: number,
  serverStatus: string,
): string {
  if (state === "initiating") {
    return "Requesting upload authorization";
  }
  if (state === "uploading") {
    return `Uploading ${progress}%`;
  }
  if (state === "completing") {
    return "Confirming upload with server";
  }
  if (state === "completed" && serverStatus) {
    return `Server status: ${serverStatus}`;
  }
  return "File selected";
}

function UploadError({ error }: { error: unknown }) {
  return (
    <p className="document-upload__alert" role="alert">
      {uploadErrorMessage(error)}
    </p>
  );
}

function uploadErrorMessage(error: unknown): string {
  if (isApiError(error) && error.status === 429 && error.retryAfterSeconds) {
    return `Too many uploads. Try again in ${error.retryAfterSeconds} seconds.`;
  }
  if (isApiError(error) && error.status === 413) {
    return "The selected file is larger than the upload limit.";
  }
  if (isApiError(error) && error.status === 422) {
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "The upload could not be started.";
}
