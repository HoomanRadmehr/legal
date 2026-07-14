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
import { DeadlineForm } from "../components/DeadlineForm";
import { useDeadlineDetail, useUpdateDeadline } from "../hooks";
import type { DeadlineUpdateInput } from "../types";
import { DeadlinePageShell } from "./DeadlinePageShell";

export function DeadlineEditPage() {
  const { deadlineId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const detail = useDeadlineDetail(deadlineId ?? "");
  const mutation = useUpdateDeadline(deadlineId ?? "");
  const role = session?.membership.role ?? "";

  if (!deadlineId) {
    return <NotFoundState title="Deadline not found" />;
  }
  if (!canEditMatter(role)) {
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
        title="Edit deadline"
        actions={
          <button
            onClick={() => navigate(`/deadlines/${deadlineId}`)}
            type="button"
          >
            Back to detail
          </button>
        }
      />
      {detail.isLoading ? <LoadingState label="Loading deadline" /> : null}
      {detail.isError ? <DeadlineDetailError error={detail.error} /> : null}
      {detail.data ? (
        <DeadlineForm
          initialDeadline={detail.data}
          mode="edit"
          mutationError={mutation.error}
          onSubmit={(input) =>
            mutation.mutateAsync(input as DeadlineUpdateInput)
          }
        />
      ) : null}
    </DeadlinePageShell>
  );
}

function DeadlineDetailError({ error }: { error: Error }) {
  if (isApiError(error) && error.status === 404) {
    return (
      <NotFoundState
        title="Deadline not found"
        message="The deadline could not be found."
      />
    );
  }
  return <ErrorState title="Deadline unavailable" message={error.message} />;
}
