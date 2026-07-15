import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { DeadlineForm } from "../components/DeadlineForm";
import { deadlineText } from "../components/deadlineLabels";
import { useCreateDeadline } from "../hooks";
import type { DeadlineInput } from "../types";
import { DeadlinePageShell } from "./DeadlinePageShell";

export function DeadlineCreatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const labels = deadlineText(locale);
  const mutation = useCreateDeadline();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
    return (
      <DeadlinePageShell>
        <ForbiddenState message={labels.viewerReadonly} />
      </DeadlinePageShell>
    );
  }

  return (
    <DeadlinePageShell>
      <PageHeader
        eyebrow={labels.listTitle}
        title={labels.create}
        description={labels.createDescription}
        actions={
          <button onClick={() => navigate("/deadlines")} type="button">
            {labels.backToDeadlines}
          </button>
        }
      />
      <DeadlineForm
        mode="create"
        mutationError={mutation.error}
        onSubmit={(input) => mutation.mutateAsync(input as DeadlineInput)}
      />
    </DeadlinePageShell>
  );
}
