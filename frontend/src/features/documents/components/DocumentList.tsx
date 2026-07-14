import { canUploadDocument } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { isApiError } from "../../../api/errors";
import {
  useDocumentDownload,
  useDocumentList,
  useRevokeDocument,
} from "../hooks";
import type { DocumentRecord } from "../types";
import "./documents.css";

export function DocumentList({ matterId }: { matterId: string }) {
  const { session } = useAuth();
  const role = session?.membership.role ?? "";
  const documents = useDocumentList({
    matter: matterId,
    ordering: "-created_at",
  });
  const download = useDocumentDownload();
  const revoke = useRevokeDocument();

  return (
    <section className="document-list" aria-labelledby="document-list-title">
      <h2 id="document-list-title">Documents</h2>
      {documents.isLoading ? <p>Loading documents...</p> : null}
      {documents.isError ? <DocumentError error={documents.error} /> : null}
      {documents.data?.results.length === 0 ? <p>No documents yet.</p> : null}
      {documents.data?.results.length ? (
        <DocumentTable
          canRevoke={canUploadDocument(role)}
          documents={documents.data.results}
          downloadingId={download.variables}
          onDownload={(documentId) => download.mutate(documentId)}
          onRevoke={(documentId) => revoke.mutate(documentId)}
          revokingId={revoke.variables}
        />
      ) : null}
      {download.isError ? <DocumentError error={download.error} /> : null}
      {revoke.isError ? <DocumentError error={revoke.error} /> : null}
    </section>
  );
}

function DocumentTable({
  canRevoke,
  documents,
  downloadingId,
  onDownload,
  onRevoke,
  revokingId,
}: {
  canRevoke: boolean;
  documents: DocumentRecord[];
  downloadingId?: string;
  onDownload: (documentId: string) => void;
  onRevoke: (documentId: string) => void;
  revokingId?: string;
}) {
  return (
    <table className="document-list__table">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Status</th>
          <th scope="col">Size</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <DocumentRow
            canRevoke={canRevoke}
            document={document}
            downloading={downloadingId === document.id}
            key={document.id}
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
  onDownload,
  onRevoke,
  revoking,
}: {
  canRevoke: boolean;
  document: DocumentRecord;
  downloading: boolean;
  onDownload: (documentId: string) => void;
  onRevoke: (documentId: string) => void;
  revoking: boolean;
}) {
  const available = document.status === "available";
  return (
    <tr>
      <td>{document.original_filename}</td>
      <td>{document.status}</td>
      <td>{formatSize(document.size)}</td>
      <td>
        <div className="document-list__actions">
          <button
            disabled={!available || downloading}
            onClick={() => onDownload(document.id)}
            type="button"
          >
            {downloading ? "Preparing" : "Download"}
          </button>
          {canRevoke ? (
            <button
              disabled={!available || revoking}
              onClick={() => onRevoke(document.id)}
              type="button"
            >
              {revoking ? "Revoking" : "Revoke"}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function DocumentError({ error }: { error: unknown }) {
  return (
    <p className="document-upload__alert" role="alert">
      {documentErrorMessage(error)}
    </p>
  );
}

function documentErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "The document request failed.";
}

function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  return `${Math.round(size / 1024)} KB`;
}
