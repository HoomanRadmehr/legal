import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canEditMatter } from "../../../auth/permissions";
import { isApiError } from "../../../api/errors";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { ContractForm } from "../components/ContractForm";
import { useContractDetail, useUpdateContract } from "../hooks";
import type { ContractUpdateInput } from "../types";
import { ContractPageShell } from "./ContractPageShell";

export function ContractEditPage() {
  const { contractId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useContractDetail(contractId ?? "");
  const mutation = useUpdateContract(contractId ?? "");
  const role = session?.membership.role ?? "";

  if (!contractId) {
    return <NotFoundState title="Contract not found" />;
  }
  if (!canEditMatter(role)) {
    return (
      <ContractPageShell>
        <ForbiddenState message="Viewer access is read-only." />
      </ContractPageShell>
    );
  }

  return (
    <ContractPageShell>
      <PageHeader
        eyebrow="Contracts"
        title="Edit contract"
        actions={
          <button
            onClick={() => navigate(`/contracts/${contractId}`)}
            type="button"
          >
            Back to detail
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label="Loading contract" /> : null}
      {detail.isError ? <ContractDetailError error={detail.error} /> : null}
      {detail.data ? (
        <ContractForm
          initialContract={detail.data}
          mode="edit"
          mutationError={mutation.error}
          onSubmit={(input) =>
            mutation.mutateAsync(input as ContractUpdateInput)
          }
        />
      ) : null}
    </ContractPageShell>
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
