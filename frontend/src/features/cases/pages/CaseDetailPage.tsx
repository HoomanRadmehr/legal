import { Link, useParams } from "react-router-dom";
import { useState } from "react";

import { canEditMatter } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { ConfirmationDialog } from "../../../components/confirmationDialog";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { isApiError } from "../../../api/errors";
import { useI18n } from "../../../i18n";
import { DocumentSection } from "../../documents";
import { CaseSummary } from "../components/CaseSummary";
import { CaseTimeline } from "../components/CaseTimeline";
import { caseText } from "../components/caseLabels";
import { useArchiveCase, useCaseDetail, useCaseTimeline } from "../hooks";
import { CasePageShell } from "./CasePageShell";

export function CaseDetailPage() {
  const { caseId } = useParams();
  const { locale } = useI18n();
  const labels = caseText(locale);
  const { session } = useAuth();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const detail = useCaseDetail(caseId ?? "");
  const timeline = useCaseTimeline(caseId ?? "");
  const archiveMutation = useArchiveCase(caseId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!caseId) {
    return <NotFoundState title={labels.notFound} />;
  }

  return (
    <CasePageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={detail.data?.title ?? labels.detail}
        actions={
          <CaseActions
            caseId={caseId}
            canMutate={canMutate}
            onArchive={() => setArchiveOpen(true)}
          />
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
      {detail.isError ? <CaseDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="case-alert">{labels.viewerReadonly}</p>
          ) : null}
          <CaseSummary legalCase={detail.data} />
          <section id="timeline" aria-labelledby="case-timeline-title">
            <h2 id="case-timeline-title">{labels.timeline}</h2>
            <CaseTimeline
              errorMessage={timeline.error?.message}
              events={timeline.data ?? []}
              isError={timeline.isError}
              isLoading={timeline.isLoading}
            />
          </section>
          <DocumentSection matterId={detail.data.id} />
          <ConfirmationDialog
            confirmLabel={labels.archive}
            onCancel={() => setArchiveOpen(false)}
            onConfirm={() => {
              setArchiveOpen(false);
              archiveMutation.mutate(detail.data.version);
            }}
            open={archiveOpen}
            title={labels.archive}
          >
            {labels.archiveBody}
          </ConfirmationDialog>
          {archiveMutation.isError ? (
            <p className="case-alert" role="alert">
              {archiveMutation.error.message}
            </p>
          ) : null}
        </>
      ) : null}
    </CasePageShell>
  );
}

function CaseActions({
  canMutate,
  caseId,
  onArchive,
}: {
  canMutate: boolean;
  caseId: string;
  onArchive: () => void;
}) {
  const { locale } = useI18n();
  const labels = caseText(locale);

  if (!canMutate) {
    return null;
  }

  return (
    <>
      <Link to={`/cases/${caseId}/edit`}>{labels.edit}</Link>
      <button type="button" onClick={onArchive}>
        {labels.archive}
      </button>
    </>
  );
}

function CaseDetailError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const labels = caseText(locale);

  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState title={labels.notFound} message={labels.notFoundMessage} />
    );
  }
  return <ErrorState title={labels.error} message={error.message} />;
}
