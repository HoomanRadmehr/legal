import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { ContractForm } from "../components/ContractForm";
import { contractText } from "../components/contractLabels";
import { useCreateContract } from "../hooks";
import type { ContractInput } from "../types";
import { ContractPageShell } from "./ContractPageShell";

export function ContractCreatePage() {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = contractText(locale);
  const navigate = useNavigate();
  const mutation = useCreateContract();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
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
        title={labels.create}
        description={labels.createDescription}
        actions={
          <button onClick={() => navigate("/contracts")} type="button">
            {labels.backToContracts}
          </button>
        }
      />
      <ContractForm
        mode="create"
        mutationError={mutation.error}
        onSubmit={(input) => mutation.mutateAsync(input as ContractInput)}
      />
    </ContractPageShell>
  );
}
