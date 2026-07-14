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
import { CaseSummary } from "../components/CaseSummary";
import { CaseTimeline } from "../components/CaseTimeline";
import { useArchiveCase, useCaseDetail, useCaseTimeline } from "../hooks";
import { CasePageShell } from "./CasePageShell";

export function CaseDetailPage() {
  const { caseId } = useParams();
  const { session } = useAuth();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const detail = useCaseDetail(caseId ?? "");
  const timeline = useCaseTimeline(caseId ?? "");
  const archiveMutation = useArchiveCase(caseId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!caseId) {
    return <NotFoundState title="Case not found" />;
  }

  return (
    <CasePageShell>
      <PageHeader
        eyebrow="Cases"
        title={detail.data?.title ?? "Case detail"}
        actions={
          <CaseActions
            caseId={caseId}
            canMutate={canMutate}
            onArchive={() => setArchiveOpen(true)}
          />
        }
      />
      {detail.isLoading ? <LoadingState label="Loading case" /> : null}
      {detail.isError ? <CaseDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="case-alert">Viewer access is read-only.</p>
          ) : null}
          <CaseSummary legalCase={detail.data} />
          <section id="timeline" aria-labelledby="case-timeline-title">
            <h2 id="case-timeline-title">Timeline</h2>
            <CaseTimeline
              errorMessage={timeline.error?.message}
              events={timeline.data ?? []}
              isError={timeline.isError}
              isLoading={timeline.isLoading}
            />
          </section>
          <ConfirmationDialog
            confirmLabel="Archive case"
            onCancel={() => setArchiveOpen(false)}
            onConfirm={() => {
              setArchiveOpen(false);
              archiveMutation.mutate(detail.data.version);
            }}
            open={archiveOpen}
            title="Archive case"
          >
            Archive keeps the case and timeline available for permitted users.
            It is not a delete.
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
  if (!canMutate) {
    return null;
  }

  return (
    <>
      <Link to={`/cases/${caseId}/edit`}>Edit case</Link>
      <button type="button" onClick={onArchive}>
        Archive case
      </button>
    </>
  );
}

function CaseDetailError({ error }: { error: Error }) {
  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title="Case not found"
        message="The case could not be found."
      />
    );
  }
  return <ErrorState title="Case unavailable" message={error.message} />;
}
