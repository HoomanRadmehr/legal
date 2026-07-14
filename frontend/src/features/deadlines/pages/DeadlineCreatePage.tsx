import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { DeadlineForm } from "../components/DeadlineForm";
import { useCreateDeadline } from "../hooks";
import type { DeadlineInput } from "../types";
import { DeadlinePageShell } from "./DeadlinePageShell";

export function DeadlineCreatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateDeadline();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
    return (
      <DeadlinePageShell>
        <ForbiddenState message="Viewer access is read-only." />
      </DeadlinePageShell>
    );
  }

  return (
    <DeadlinePageShell>
      <PageHeader
        eyebrow="Deadlines"
        title="Create deadline"
        description="Create a matter-linked deadline with an explicit assignee."
        actions={
          <button onClick={() => navigate("/deadlines")} type="button">
            Back to deadlines
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
