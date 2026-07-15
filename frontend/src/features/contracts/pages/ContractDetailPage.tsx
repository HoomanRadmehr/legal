import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canEditMatter } from "../../../auth/permissions";
import { isApiError } from "../../../api/errors";
import { ConfirmationDialog } from "../../../components/confirmationDialog";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { ContractSummary } from "../components/ContractSummary";
import { ContractTimeline } from "../components/ContractTimeline";
import { contractText } from "../components/contractLabels";
import {
  useArchiveContract,
  useContractDetail,
  useContractTimeline,
} from "../hooks";
import { ContractPageShell } from "./ContractPageShell";

export function ContractDetailPage() {
  const { contractId } = useParams();
  const { locale } = useI18n();
  const labels = contractText(locale);
  const { session } = useAuth();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const detail = useContractDetail(contractId ?? "");
  const timeline = useContractTimeline(contractId ?? "");
  const archiveMutation = useArchiveContract(contractId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!contractId) {
    return <NotFoundState title={labels.notFound} />;
  }

  return (
    <ContractPageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={detail.data?.title ?? labels.detail}
        actions={
          <ContractActions
            canMutate={canMutate}
            contractId={contractId}
            onArchive={() => setArchiveOpen(true)}
          />
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
      {detail.isError ? <ContractDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="contract-alert">{labels.viewerReadonly}</p>
          ) : null}
          <ContractSummary contract={detail.data} />
          <section id="timeline" aria-labelledby="contract-timeline-title">
            <h2 id="contract-timeline-title">{labels.timeline}</h2>
            <ContractTimeline
              errorMessage={timeline.error?.message}
              events={timeline.data ?? []}
              isError={timeline.isError}
              isLoading={timeline.isLoading}
            />
          </section>
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
            <p className="contract-alert" role="alert">
              {archiveMutation.error.message}
            </p>
          ) : null}
        </>
      ) : null}
    </ContractPageShell>
  );
}

function ContractActions({
  canMutate,
  contractId,
  onArchive,
}: {
  canMutate: boolean;
  contractId: string;
  onArchive: () => void;
}) {
  const { locale } = useI18n();
  const labels = contractText(locale);

  if (!canMutate) {
    return null;
  }

  return (
    <>
      <Link to={`/contracts/${contractId}/edit`}>{labels.edit}</Link>
      <button type="button" onClick={onArchive}>
        {labels.archive}
      </button>
    </>
  );
}

function ContractDetailError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const labels = contractText(locale);

  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title={labels.notFound}
        message={labels.notFoundMessage}
      />
    );
  }
  return <ErrorState title={labels.error} message={error.message} />;
}
