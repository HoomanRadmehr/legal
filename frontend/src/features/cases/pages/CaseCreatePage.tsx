import { useNavigate } from "react-router-dom";

import { canCreateMatter } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { CaseForm } from "../components/CaseForm";
import { useCreateCase } from "../hooks";
import type { CaseInput } from "../types";
import { CasePageShell } from "./CasePageShell";

export function CaseCreatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateCase();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
    return (
      <CasePageShell>
        <ForbiddenState message="Viewer access is read-only." />
      </CasePageShell>
    );
  }

  return (
    <CasePageShell>
      <PageHeader
        eyebrow="Cases"
        title="Create case"
        description="Create a matter-linked case with explicit parties."
        actions={
          <button onClick={() => navigate("/cases")} type="button">
            Back to cases
          </button>
        }
      />
      <CaseForm
        mode="create"
        mutationError={mutation.error}
        onSubmit={(input) => mutation.mutateAsync(input as CaseInput)}
      />
    </CasePageShell>
  );
}
