import { canUploadDocument } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { isApiError } from "../../../api/errors";
import {
  useDocumentDownload,
  useDocumentList,
  useRevokeDocument,
} from "../hooks";
import { useI18n } from "../../../i18n";
import { documentStatusLabel, documentText } from "../text";
import type { DocumentRecord } from "../types";
import "./documents.css";

export function DocumentList({ matterId }: { matterId?: string }) {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = documentText(locale);
  const role = session?.membership.role ?? "";
  const documents = useDocumentList({
    matter: matterId,
    ordering: "-created_at",
  });
  const download = useDocumentDownload();
  const revoke = useRevokeDocument();

  return (
    <section className="document-list" aria-labelledby="document-list-title">
      <h2 id="document-list-title">{labels.listTitle}</h2>
      {documents.isLoading ? <p>{labels.loading}</p> : null}
      {documents.isError ? (
        <DocumentError error={documents.error} locale={locale} />
      ) : null}
      {documents.data?.results.length === 0 ? <p>{labels.empty}</p> : null}
      {documents.data?.results.length ? (
        <DocumentTable
          canRevoke={canUploadDocument(role)}
          documents={documents.data.results}
          downloadingId={download.variables}
          locale={locale}
          onDownload={(documentId) => download.mutate(documentId)}
          onRevoke={(documentId) => revoke.mutate(documentId)}
          revokingId={revoke.variables}
        />
      ) : null}
      {download.isError ? (
        <DocumentError error={download.error} locale={locale} />
      ) : null}
      {revoke.isError ? (
        <DocumentError error={revoke.error} locale={locale} />
      ) : null}
    </section>
  );
}

function DocumentTable({
  canRevoke,
  documents,
  downloadingId,
  locale,
  onDownload,
  onRevoke,
  revokingId,
}: {
  canRevoke: boolean;
  documents: DocumentRecord[];
  downloadingId?: string;
  locale: ReturnType<typeof useI18n>["locale"];
  onDownload: (documentId: string) => void;
  onRevoke: (documentId: string) => void;
  revokingId?: string;
}) {
  const labels = documentText(locale);

  return (
    <table className="document-list__table">
      <thead>
        <tr>
          <th scope="col">{labels.name}</th>
          <th scope="col">{labels.status}</th>
          <th scope="col">{labels.size}</th>
          <th scope="col">{labels.actions}</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <DocumentRow
            canRevoke={canRevoke}
            document={document}
            downloading={downloadingId === document.id}
            key={document.id}
            locale={locale}
            onDownload={onDownload}
            onRevoke={onRevoke}
            revoking={revokingId === document.id}
          />
        ))}
      </tbody>
    </table>
  );
}

function DocumentRow({
  canRevoke,
  document,
  downloading,
  locale,
  onDownload,
  onRevoke,
  revoking,
}: {
  canRevoke: boolean;
  document: DocumentRecord;
  downloading: boolean;
  locale: ReturnType<typeof useI18n>["locale"];
  onDownload: (documentId: string) => void;
  onRevoke: (documentId: string) => void;
  revoking: boolean;
}) {
  const available = document.status === "available";
  const labels = documentText(locale);
  return (
    <tr>
      <td>{document.original_filename}</td>
      <td>{documentStatusLabel(document.status, locale)}</td>
      <td>{formatSize(document.size, locale)}</td>
      <td>
        <div className="document-list__actions">
          <button
            disabled={!available || downloading}
            onClick={() => onDownload(document.id)}
            type="button"
          >
            {downloading ? labels.downloading : labels.download}
          </button>
          {canRevoke ? (
            <button
              disabled={!available || revoking}
              onClick={() => onRevoke(document.id)}
              type="button"
            >
              {revoking ? labels.revoking : labels.revoke}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function DocumentError({
  error,
  locale,
}: {
  error: unknown;
  locale: ReturnType<typeof useI18n>["locale"];
}) {
  return (
    <p className="document-upload__alert" role="alert">
      {documentErrorMessage(error, locale)}
    </p>
  );
}

function documentErrorMessage(
  error: unknown,
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const labels = documentText(locale);
  if (isApiError(error)) {
    return error.message;
  }
  return error instanceof Error ? error.message : labels.error;
}

function formatSize(size: number, locale: ReturnType<typeof useI18n>["locale"]) {
  const formatter = new Intl.NumberFormat(locale);
  if (size < 1024) {
    return `${formatter.format(size)} B`;
  }
  return `${formatter.format(Math.round(size / 1024))} KB`;
}
