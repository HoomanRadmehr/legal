import { useNavigate, useParams } from "react-router-dom";

import { canEditMatter } from "../../../auth/permissions";
import { useAuth } from "../../../auth";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from "../../../components/standardStates";
import { isApiError } from "../../../api/errors";
import { CaseForm } from "../components/CaseForm";
import { useCaseDetail, useUpdateCase } from "../hooks";
import type { CaseUpdateInput } from "../types";
import { CasePageShell } from "./CasePageShell";

export function CaseEditPage() {
  const { caseId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useCaseDetail(caseId ?? "");
  const mutation = useUpdateCase(caseId ?? "");
  const role = session?.membership.role ?? "";

  if (!caseId) {
    return <NotFoundState title="Case not found" />;
  }
  if (!canEditMatter(role)) {
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
        title="Edit case"
        actions={
          <button onClick={() => navigate(`/cases/${caseId}`)} type="button">
            Back to detail
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label="Loading case" /> : null}
      {detail.isError ? <CaseDetailError error={detail.error} /> : null}
      {detail.data ? (
        <CaseForm
          initialCase={detail.data}
          mode="edit"
          mutationError={mutation.error}
          onSubmit={(input) => mutation.mutateAsync(input as CaseUpdateInput)}
        />
      ) : null}
    </CasePageShell>
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
