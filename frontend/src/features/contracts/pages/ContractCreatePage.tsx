import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { ContractForm } from "../components/ContractForm";
import { useCreateContract } from "../hooks";
import type { ContractInput } from "../types";
import { ContractPageShell } from "./ContractPageShell";

export function ContractCreatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateContract();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
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
        title="Create contract"
        description="Create a matter-linked contract with explicit renewal and expiration dates."
        actions={
          <button onClick={() => navigate("/contracts")} type="button">
            Back to contracts
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
