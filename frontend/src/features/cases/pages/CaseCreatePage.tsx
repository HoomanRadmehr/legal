import { useNavigate } from "react-router-dom";

import { canCreateMatter } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { CaseForm } from "../components/CaseForm";
import { caseText } from "../components/caseLabels";
import { useCreateCase } from "../hooks";
import type { CaseInput } from "../types";
import { CasePageShell } from "./CasePageShell";

export function CaseCreatePage() {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = caseText(locale);
  const navigate = useNavigate();
  const mutation = useCreateCase();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
    return (
      <CasePageShell>
        <ForbiddenState message={labels.viewerReadonly} />
      </CasePageShell>
    );
  }

  return (
    <CasePageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={labels.create}
        description={labels.createDescription}
        actions={
          <button onClick={() => navigate("/cases")} type="button">
            {labels.backToCases}
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
