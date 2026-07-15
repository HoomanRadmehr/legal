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
import { useI18n } from "../../../i18n";
import { ContractForm } from "../components/ContractForm";
import { contractText } from "../components/contractLabels";
import { useContractDetail, useUpdateContract } from "../hooks";
import type { ContractUpdateInput } from "../types";
import { ContractPageShell } from "./ContractPageShell";

export function ContractEditPage() {
  const { contractId } = useParams();
  const { locale } = useI18n();
  const labels = contractText(locale);
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useContractDetail(contractId ?? "");
  const mutation = useUpdateContract(contractId ?? "");
  const role = session?.membership.role ?? "";

  if (!contractId) {
    return <NotFoundState title={labels.notFound} />;
  }
  if (!canEditMatter(role)) {
    return (
      <ContractPageShell>
        <ForbiddenState message={labels.viewerReadonly} />
      </ContractPageShell>
    );
  }

  return (
    <ContractPageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={labels.edit}
        actions={
          <button
            onClick={() => navigate(`/contracts/${contractId}`)}
            type="button"
          >
            {labels.backToDetail}
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
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
