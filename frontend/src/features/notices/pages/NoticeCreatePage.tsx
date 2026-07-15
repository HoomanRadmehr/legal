import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ForbiddenState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { NoticeForm } from "../components/NoticeForm";
import { noticeText } from "../components/noticeLabels";
import { useCreateNotice } from "../hooks";
import type { NoticeInput } from "../types";
import { NoticePageShell } from "./NoticePageShell";

export function NoticeCreatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const labels = noticeText(locale);
  const mutation = useCreateNotice();
  const role = session?.membership.role ?? "";

  if (!canCreateMatter(role)) {
    return (
      <NoticePageShell>
        <ForbiddenState message={labels.viewerReadonly} />
      </NoticePageShell>
    );
  }

  return (
    <NoticePageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={labels.create}
        description={labels.createDescription}
        actions={
          <button onClick={() => navigate("/notices")} type="button">
            {labels.backToNotices}
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
