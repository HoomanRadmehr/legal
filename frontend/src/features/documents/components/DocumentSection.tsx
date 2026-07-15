import { DocumentList } from "./DocumentList";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { useI18n } from "../../../i18n";
import { useDocumentRealtimeRecovery } from "../hooks";
import { documentText } from "../text";
import "./documents.css";

export function DocumentSection({ matterId }: { matterId: string }) {
  const { locale } = useI18n();
  const labels = documentText(locale);
  const realtimeStatus = useDocumentRealtimeRecovery();

  return (
    <section className="document-section" aria-label={labels.matterDocuments}>
      <DocumentUploadPanel matterId={matterId} />
      <DocumentList matterId={matterId} />
      {realtimeStatus === "disconnected" ? (
        <p className="document-upload__status">
          {labels.realtimeMatter}
        </p>
      ) : null}
    </section>
  );
}
