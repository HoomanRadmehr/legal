import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canUploadDocument } from "../../../auth/permissions";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { DocumentUploadForm } from "../components/DocumentUploadForm";
import { useDocumentRealtimeRecovery } from "../hooks";
import { documentText } from "../text";
import "../components/documents.css";

export function CreateDocumentPage() {
  const { logout, session } = useAuth();
  const { locale } = useI18n();
  const labels = documentText(locale);
  const [params] = useSearchParams();
  const realtimeStatus = useDocumentRealtimeRecovery();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <section className="documents-page" aria-labelledby="new-document-title">
        {canUploadDocument(session.membership.role) ? (
          <>
            <PageHeader
              eyebrow={labels.pageEyebrow}
              title={labels.newDocument}
              description={labels.newDocumentDescription}
              actions={<Link to="/documents">{labels.backToDocuments}</Link>}
            />
            {realtimeStatus === "disconnected" ? (
              <p className="document-upload__status">{labels.realtimeMatter}</p>
            ) : null}
            <DocumentUploadForm
              initialMatterId={params.get("matter_id") ?? undefined}
            />
          </>
        ) : (
          <ForbiddenState message={labels.permissionDenied} />
        )}
      </section>
    </AppShell>
  );
}
