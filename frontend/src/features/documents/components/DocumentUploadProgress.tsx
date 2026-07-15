import { useI18n } from "../../../i18n";
import { documentStatusLabel, documentText, fillDocumentText } from "../text";
import type { DirectUploadState, DocumentStatus } from "../types";

export function DocumentUploadProgress({
  canCancel,
  canRetry,
  onCancel,
  onReset,
  onRetry,
  progress,
  serverStatus,
  status,
}: {
  canCancel: boolean;
  canRetry: boolean;
  onCancel: () => void;
  onReset: () => void;
  onRetry: () => void;
  progress: number;
  serverStatus: DocumentStatus | "";
  status: DirectUploadState;
}) {
  const { locale } = useI18n();
  const labels = documentText(locale);

  if (status === "idle") {
    return null;
  }

  return (
    <div className="document-upload__progress" aria-live="polite">
      <progress aria-label={labels.uploadProgress} max={100} value={progress} />
      <span>
        {uploadStateLabel({ locale, progress, serverStatus, status })}
      </span>
      <div className="document-upload__actions">
        {canCancel ? (
          <button onClick={onCancel} type="button">
            {labels.cancel}
          </button>
        ) : null}
        {canRetry ? (
          <button onClick={onRetry} type="button">
            {labels.retry}
          </button>
        ) : null}
        {status !== "uploading" ? (
          <button onClick={onReset} type="button">
            {labels.remove}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function uploadStateLabel({
  locale,
  progress,
  serverStatus,
  status,
}: {
  locale: ReturnType<typeof useI18n>["locale"];
  progress: number;
  serverStatus: DocumentStatus | "";
  status: DirectUploadState;
}): string {
  const labels = documentText(locale);
  if (status === "uploading") {
    return fillDocumentText(labels.uploading, { progress });
  }
  if (status === "verifying" && serverStatus) {
    return fillDocumentText(labels.serverStatus, {
      status: documentStatusLabel(serverStatus, locale),
    });
  }
  return labels[status];
}
