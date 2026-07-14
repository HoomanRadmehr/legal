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
import { ContractSummary } from "../components/ContractSummary";
import { ContractTimeline } from "../components/ContractTimeline";
import {
  useArchiveContract,
  useContractDetail,
  useContractTimeline,
} from "../hooks";
import { ContractPageShell } from "./ContractPageShell";

export function ContractDetailPage() {
  const { contractId } = useParams();
  const { session } = useAuth();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const detail = useContractDetail(contractId ?? "");
  const timeline = useContractTimeline(contractId ?? "");
  const archiveMutation = useArchiveContract(contractId ?? "");
  const canMutate = canEditMatter(session?.membership.role ?? "");

  if (!contractId) {
    return <NotFoundState title="Contract not found" />;
  }

  return (
    <ContractPageShell>
      <PageHeader
        eyebrow="Contracts"
        title={detail.data?.title ?? "Contract detail"}
        actions={
          <ContractActions
            canMutate={canMutate}
            contractId={contractId}
            onArchive={() => setArchiveOpen(true)}
          />
        }
      />
      {detail.isLoading ? <LoadingState label="Loading contract" /> : null}
      {detail.isError ? <ContractDetailError error={detail.error} /> : null}
      {detail.data ? (
        <>
          {session?.membership.role === "viewer" ? (
            <p className="contract-alert">Viewer access is read-only.</p>
          ) : null}
          <ContractSummary contract={detail.data} />
          <section id="timeline" aria-labelledby="contract-timeline-title">
            <h2 id="contract-timeline-title">Timeline</h2>
            <ContractTimeline
              errorMessage={timeline.error?.message}
              events={timeline.data ?? []}
              isError={timeline.isError}
              isLoading={timeline.isLoading}
            />
          </section>
          <ConfirmationDialog
            confirmLabel="Archive contract"
            onCancel={() => setArchiveOpen(false)}
            onConfirm={() => {
              setArchiveOpen(false);
              archiveMutation.mutate(detail.data.version);
            }}
            open={archiveOpen}
            title="Archive contract"
          >
            Archive keeps the contract and timeline available for permitted
            users. It is not a delete.
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
  if (!canMutate) {
    return null;
  }

  return (
    <>
      <Link to={`/contracts/${contractId}/edit`}>Edit contract</Link>
      <button type="button" onClick={onArchive}>
        Archive contract
      </button>
    </>
  );
}

function ContractDetailError({ error }: { error: Error }) {
  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title="Contract not found"
        message="The contract could not be found."
      />
    );
  }
  return <ErrorState title="Contract unavailable" message={error.message} />;
}
