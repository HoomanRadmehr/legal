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
import { useI18n } from "../../../i18n";
import { CaseForm } from "../components/CaseForm";
import { caseText } from "../components/caseLabels";
import { useCaseDetail, useUpdateCase } from "../hooks";
import type { CaseUpdateInput } from "../types";
import { CasePageShell } from "./CasePageShell";

export function CaseEditPage() {
  const { caseId } = useParams();
  const { locale } = useI18n();
  const labels = caseText(locale);
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useCaseDetail(caseId ?? "");
  const mutation = useUpdateCase(caseId ?? "");
  const role = session?.membership.role ?? "";

  if (!caseId) {
    return <NotFoundState title={labels.notFound} />;
  }
  if (!canEditMatter(role)) {
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
        title={labels.edit}
        actions={
          <button onClick={() => navigate(`/cases/${caseId}`)} type="button">
            {labels.backToDetail}
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label={labels.loading} /> : null}
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
  const { locale } = useI18n();
  const labels = caseText(locale);

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
