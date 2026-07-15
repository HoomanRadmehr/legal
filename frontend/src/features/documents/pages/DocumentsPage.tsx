import { useAuth } from "../../../auth";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import { useI18n } from "../../../i18n";
import { DocumentList } from "../components/DocumentList";
import { useDocumentRealtimeRecovery } from "../hooks";
import { documentText } from "../text";
import "../components/documents.css";

export function DocumentsPage() {
  const { logout, session } = useAuth();
  const { locale } = useI18n();
  const labels = documentText(locale);

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <section className="documents-page" aria-labelledby="documents-title">
        <PageHeader
          eyebrow={labels.pageEyebrow}
          title={labels.listTitle}
          description={labels.pageDescription}
        />
        <DocumentRealtimeNotice />
        <DocumentList />
      </section>
    </AppShell>
  );
}

function DocumentRealtimeNotice() {
  const { locale } = useI18n();
  const labels = documentText(locale);
  const realtimeStatus = useDocumentRealtimeRecovery();

  if (realtimeStatus !== "disconnected") {
    return null;
  }

  return (
    <p className="document-upload__status">
      {labels.realtimeList}
    </p>
  );
}
