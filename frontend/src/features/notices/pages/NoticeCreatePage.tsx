import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { NoticeForm } from "../components/NoticeForm";
import { useCreateNotice } from "../hooks";
import type { NoticeInput } from "../types";
import { NoticePageShell } from "./NoticePageShell";

export function NoticeCreatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateNotice();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
    return (
      <NoticePageShell>
        <ForbiddenState message="Viewer access is read-only." />
      </NoticePageShell>
    );
  }

  return (
    <NoticePageShell>
      <PageHeader
        eyebrow="Legal notices"
        title="Create notice"
        description="Record intake and create the linked response deadline."
        actions={
          <button onClick={() => navigate("/notices")} type="button">
            Back to notices
          </button>
        }
      />
      <NoticeForm
        mode="create"
        mutationError={mutation.error}
        onSubmit={(input) => mutation.mutateAsync(input as NoticeInput)}
      />
    </NoticePageShell>
  );
}
