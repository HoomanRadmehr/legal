import { DocumentList } from "./DocumentList";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { useDocumentRealtimeRecovery } from "../hooks";
import "./documents.css";

export function DocumentSection({ matterId }: { matterId: string }) {
  const realtimeStatus = useDocumentRealtimeRecovery();

  return (
    <section className="document-section" aria-label="Matter documents">
      <DocumentUploadPanel matterId={matterId} />
      <DocumentList matterId={matterId} />
      {realtimeStatus === "disconnected" ? (
        <p className="document-upload__status">
          Realtime updates are reconnecting. Active uploads will be checked.
        </p>
      ) : null}
    </section>
  );
}
