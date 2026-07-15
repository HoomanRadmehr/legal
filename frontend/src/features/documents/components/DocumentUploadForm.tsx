import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useForm, type FieldErrors } from "react-hook-form";

import { isApiError } from "../../../api/errors";
import type { AsyncChoice } from "../../../components/forms/AsyncChoiceSelect";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import { TechnicalValue } from "../../../components/technicalValue";
import { choiceQueryKeys, listMatterChoices } from "../../choices";
import type { MatterChoicePage } from "../../choices";
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
import { DocumentMatterChoiceSelect } from "./DocumentMatterChoiceSelect";
import { DocumentUploadProgress } from "./DocumentUploadProgress";
import { DocumentUploadResult } from "./DocumentUploadResult";

type DocumentUploadFormValues = {
  description: string;
};

export function DocumentUploadForm({
  initialMatterId,
}: {
  initialMatterId?: string;
}) {
  const { locale } = useI18n();
  const labels = documentText(locale);
  const [matter, setMatter] = useState<AsyncChoice | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [matterError, setMatterError] = useState("");
  const [fileError, setFileError] = useState("");
  const form = useForm<DocumentUploadFormValues>({
    defaultValues: { description: "" },
  });
  const upload = useDocumentUpload(matter?.id ?? "");
  const documentId = upload.attempt.document?.id ?? "";
  const statusQuery = useDocumentUploadStatus({
    documentId,
    enabled: Boolean(documentId),
    polling: isActiveUploadStatus(upload.attempt.serverStatus),
  });
  const serverStatus = statusQuery.data?.status ?? upload.attempt.serverStatus;

  useInitialMatter({ initialMatterId, matter, setMatter, setMatterError });

  function submit(values: DocumentUploadFormValues) {
    if (
      !validateUpload({
        file,
        labels,
        locale,
        matter,
        setFileError,
        setMatterError,
      })
    ) {
      focusFirstInvalid({ matter });
      return;
    }
    if (file && matter) {
      upload.startUpload(file, values.description);
    }
  }

  return (
    <form
      className="document-upload"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <FormErrorSummary errors={formErrors(form.formState.errors, labels)} />
      <DocumentMatterChoiceSelect
        disabled={isBusy(upload.attempt.status)}
        error={matterError}
        onChange={(choice) => {
          setMatter(choice);
          setMatterError("");
        }}
        value={matter}
      />
      {initialMatterId && !matter && !matterError ? (
        <p className="document-upload__status">{labels.resolvingMatter}</p>
      ) : null}
      <FileField
        disabled={isBusy(upload.attempt.status)}
        error={fileError}
        file={file}
        onFileChange={(nextFile) => {
          setFile(nextFile);
          setFileError("");
        }}
      />
      <label className="document-upload__field">
        {labels.description}
        <textarea
          {...form.register("description", { maxLength: 2000 })}
          disabled={isBusy(upload.attempt.status)}
          rows={4}
        />
      </label>
      <button disabled={isBusy(upload.attempt.status)} type="submit">
        {labels.upload}
      </button>
      <UploadStatus
        error={upload.error}
        serverStatus={serverStatus}
        upload={upload}
      />
    </form>
  );
}

function FileField({
  disabled,
  error,
  file,
  onFileChange,
}: {
  disabled: boolean;
  error: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const { locale } = useI18n();
  const labels = documentText(locale);

  return (
    <div className="document-upload__field">
      <label htmlFor="document-file">{labels.selectFile}</label>
      <input
        accept={allowedUploadTypes()}
        disabled={disabled}
        id="document-file"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        type="file"
      />
      {file ? (
        <SelectedFile
          disabled={disabled}
          file={file}
          onRemove={() => onFileChange(null)}
        />
      ) : null}
      {error ? (
        <p className="document-upload__alert" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectedFile({
  disabled,
  file,
  onRemove,
}: {
  disabled: boolean;
  file: File;
  onRemove: () => void;
}) {
  const { locale } = useI18n();
  const labels = documentText(locale);

  return (
    <dl className="document-upload__file">
      <dt>{labels.fileName}</dt>
      <dd>
        <TechnicalValue>{file.name}</TechnicalValue>
      </dd>
      <dt>{labels.fileSize}</dt>
      <dd>
        <TechnicalValue>{formatFileSize(file.size, locale)}</TechnicalValue>
      </dd>
      <dt>{labels.mimeType}</dt>
      <dd>
        <TechnicalValue>
          {file.type || "application/octet-stream"}
        </TechnicalValue>
      </dd>
      <dd>
        <button disabled={disabled} onClick={onRemove} type="button">
          {labels.removeFile}
        </button>
      </dd>
    </dl>
  );
}

function UploadStatus({
  error,
  serverStatus,
  upload,
}: {
  error: unknown;
  serverStatus: DocumentStatus | "";
  upload: ReturnType<typeof useDocumentUpload>;
}) {
  const { locale } = useI18n();
  const labels = documentText(locale);

  return (
    <>
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
        <p className="document-upload__status" role="status">
          {labels.verifying}
        </p>
      ) : null}
      {upload.isError ? (
        <p className="document-upload__alert" role="alert">
          {uploadErrorMessage(error, locale)}
        </p>
      ) : null}
      {upload.attempt.document ? (
        <DocumentUploadResult
          document={upload.attempt.document}
          onReset={upload.reset}
        />
      ) : null}
    </>
  );
}

function useInitialMatter({
  initialMatterId,
  matter,
  setMatter,
  setMatterError,
}: {
  initialMatterId?: string;
  matter: AsyncChoice | null;
  setMatter: (matter: AsyncChoice) => void;
  setMatterError: (message: string) => void;
}) {
  const { locale } = useI18n();
  const labels = documentText(locale);
  const query = useInitialMatterChoice(
    initialMatterId ?? "",
    Boolean(initialMatterId && !matter),
  );

  useEffect(() => {
    if (!initialMatterId || matter || query.isLoading) {
      return;
    }
    const choices = query.data?.pages.flatMap((page) => page.results) ?? [];
    const found = choices.find((choice) => choice.id === initialMatterId);
    if (found) {
      setMatter(found);
    } else if (query.isSuccess) {
      setMatterError(labels.unavailableMatter);
    }
  }, [
    initialMatterId,
    labels.unavailableMatter,
    matter,
    query.data,
    query.isLoading,
    query.isSuccess,
    setMatter,
    setMatterError,
  ]);
}

function useInitialMatterChoice(query: string, enabled: boolean) {
  return useInfiniteQuery<MatterChoicePage>({
    enabled,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listMatterChoices({
        cursor: pageParam as string | undefined,
        purpose: "document_upload",
        query,
      }),
    queryKey: [
      ...choiceQueryKeys.matters({ purpose: "document_upload" }),
      query,
    ],
  });
}

function validateUpload({
  file,
  labels,
  locale,
  matter,
  setFileError,
  setMatterError,
}: {
  file: File | null;
  labels: ReturnType<typeof documentText>;
  locale: ReturnType<typeof useI18n>["locale"];
  matter: AsyncChoice | null;
  setFileError: (message: string) => void;
  setMatterError: (message: string) => void;
}): boolean {
  const fileError = file ? filePolicyError(file, locale) : labels.fileRequired;
  setMatterError(matter ? "" : labels.matterRequired);
  setFileError(fileError);
  return Boolean(matter && file && !fileError);
}

function focusFirstInvalid({ matter }: { matter: AsyncChoice | null }) {
  if (!matter) {
    document.querySelector<HTMLInputElement>("[role='combobox']")?.focus();
    return;
  }
  document.getElementById("document-file")?.focus();
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
  if (isApiError(error) && error.status === 403) {
    return labels.permissionDenied;
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

function isBusy(status: string): boolean {
  return [
    "preparing",
    "requesting_presign",
    "uploading",
    "uploaded_to_storage",
    "completing",
    "verifying",
  ].includes(status);
}

function formErrors(
  errors: FieldErrors<DocumentUploadFormValues>,
  labels: ReturnType<typeof documentText>,
): FormErrorItem[] {
  if (!errors.description) {
    return [];
  }
  return [
    {
      fieldId: "description",
      label: labels.description,
      message: labels.descriptionTooLong,
    },
  ];
}

function formatFileSize(
  size: number,
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const formatter = new Intl.NumberFormat(locale);
  if (size < 1024) {
    return `${formatter.format(size)} B`;
  }
  return `${formatter.format(Math.round(size / 1024))} KB`;
}
