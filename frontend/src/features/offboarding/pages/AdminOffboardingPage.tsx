import type { FormEvent } from "react";
import { useState } from "react";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canRunOffboarding } from "../../../auth/permissions";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { useMembershipList } from "../../adminUsers/hooks";
import type { MembershipListItem } from "../../adminUsers/types";
import {
  ExecuteForm,
  PreviewPanel,
  RunResult,
} from "../components/OffboardingPanels";
import {
  createOffboardingIdempotencyKey,
  useOffboardingExecute,
  useOffboardingPreview,
} from "../hooks";
import { offboardingText } from "../text";
import type { OffboardingPreview, OffboardingRun } from "../types";
import "../offboarding.css";

const MEMBER_LIST_PARAMS = { page: 1, pageSize: 100 };

type Feedback = { role: "alert" | "status"; text: string };

export function AdminOffboardingPage() {
  const { locale } = useI18n();
  const labels = offboardingText(locale);
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {canRunOffboarding(session.membership.role) ? (
        <AdminOffboardingContent />
      ) : (
        <ForbiddenState message={labels.forbidden} />
      )}
    </AppShell>
  );
}

function AdminOffboardingContent() {
  const { locale } = useI18n();
  const labels = offboardingText(locale);
  const members = useMembershipList(MEMBER_LIST_PARAMS);
  const [departingId, setDepartingId] = useState("");
  const [replacementId, setReplacementId] = useState("");
  const [preview, setPreview] = useState<OffboardingPreview | null>(null);
  const [run, setRun] = useState<OffboardingRun | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const previewMutation = useOffboardingPreview();
  const executeMutation = useOffboardingExecute();
  const choices = activeMemberships(members.data?.results ?? []);

  async function requestPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (departingId === replacementId) {
      setFeedback({ role: "alert", text: labels.sameMember });
      return;
    }
    try {
      const nextPreview = await previewMutation.mutateAsync({
        departing_membership_id: departingId,
        replacement_membership_id: replacementId,
      });
      setPreview(nextPreview);
      setRun(null);
      setConfirmation("");
      setIdempotencyKey(createOffboardingIdempotencyKey());
      setFeedback({ role: "status", text: labels.previewReady });
    } catch (error) {
      setFeedback({
        role: "alert",
        text: offboardingError(error, labels, labels.previewFailed),
      });
    }
  }

  async function executePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview || !idempotencyKey) {
      setFeedback({ role: "alert", text: labels.noPreview });
      return;
    }
    try {
      const completed = await executeMutation.mutateAsync({
        idempotencyKey,
        payload: {
          confirmation,
          departing_membership_id: departingId,
          preview_fingerprint: preview.fingerprint,
          replacement_membership_id: replacementId,
        },
      });
      setRun(completed);
      setFeedback({ role: "status", text: labels.completed });
    } catch (error) {
      handleExecuteError(
        error,
        labels,
        setFeedback,
        setPreview,
        setIdempotencyKey,
      );
    }
  }

  return (
    <section className="offboarding-page" aria-labelledby="offboarding-title">
      <PageHeader
        eyebrow={labels.administration}
        title={labels.title}
        description={labels.description}
      />
      {members.isLoading ? <LoadingState label={labels.loadMembers} /> : null}
      {members.isError ? (
        <ErrorState
          title={labels.error}
          message={offboardingError(
            members.error,
            labels,
            labels.membersFailed,
          )}
        />
      ) : null}
      {members.data ? (
        <OffboardingForm
          choices={choices}
          departingId={departingId}
          isPending={previewMutation.isPending}
          labels={labels}
          onDepartingChange={setDepartingId}
          onReplacementChange={setReplacementId}
          onSubmit={requestPreview}
          replacementId={replacementId}
        />
      ) : null}
      {feedback ? (
        <p className="offboarding-feedback" role={feedback.role}>
          {feedback.text}
        </p>
      ) : null}
      {preview ? <PreviewPanel labels={labels} preview={preview} /> : null}
      {preview && !run ? (
        <ExecuteForm
          confirmation={confirmation}
          isPending={executeMutation.isPending}
          labels={labels}
          onConfirmationChange={setConfirmation}
          onSubmit={executePreview}
        />
      ) : null}
      {run ? <RunResult labels={labels} run={run} /> : null}
    </section>
  );
}

function OffboardingForm({
  choices,
  departingId,
  isPending,
  labels,
  onDepartingChange,
  onReplacementChange,
  onSubmit,
  replacementId,
}: {
  choices: MembershipListItem[];
  departingId: string;
  isPending: boolean;
  labels: ReturnType<typeof offboardingText>;
  onDepartingChange: (value: string) => void;
  onReplacementChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  replacementId: string;
}) {
  const disabled = !departingId || !replacementId || isPending;

  return (
    <form className="offboarding-form" onSubmit={onSubmit}>
      <label>
        {labels.departing}
        <select
          aria-label={labels.selectDeparting}
          onChange={(event) => onDepartingChange(event.currentTarget.value)}
          required
          value={departingId}
        >
          <option value="">{labels.selectDeparting}</option>
          {choices.map((membership) => (
            <MembershipOption key={membership.id} membership={membership} />
          ))}
        </select>
      </label>
      <label>
        {labels.replacement}
        <select
          aria-label={labels.selectReplacement}
          onChange={(event) => onReplacementChange(event.currentTarget.value)}
          required
          value={replacementId}
        >
          <option value="">{labels.selectReplacement}</option>
          {choices.map((membership) => (
            <MembershipOption key={membership.id} membership={membership} />
          ))}
        </select>
      </label>
      <button disabled={disabled} type="submit">
        {labels.preview}
      </button>
    </form>
  );
}

function MembershipOption({ membership }: { membership: MembershipListItem }) {
  return (
    <option value={membership.id}>
      {membership.display_name} - {membership.email}
    </option>
  );
}

function activeMemberships(memberships: MembershipListItem[]) {
  return memberships.filter((membership) => {
    return membership.status === "active" && membership.user_is_active;
  });
}

function handleExecuteError(
  error: unknown,
  labels: ReturnType<typeof offboardingText>,
  setFeedback: (feedback: Feedback) => void,
  setPreview: (preview: OffboardingPreview | null) => void,
  setIdempotencyKey: (key: string | null) => void,
): void {
  if (isApiError(error) && error.code === "offboarding_preview_stale") {
    setPreview(null);
    setIdempotencyKey(null);
    setFeedback({ role: "alert", text: labels.stale });
    return;
  }
  setFeedback({
    role: "alert",
    text: offboardingError(error, labels, labels.executeFailed),
  });
}

function offboardingError(
  error: unknown,
  labels: ReturnType<typeof offboardingText>,
  fallback: string,
): string {
  if (isApiError(error) && error.status === 429 && error.retryAfterSeconds) {
    return labels.retry.replace("{{seconds}}", String(error.retryAfterSeconds));
  }
  if (isApiError(error) && (error.status === 403 || error.status === 404)) {
    return labels.forbidden;
  }
  if (isApiError(error) && error.status === 0) {
    return labels.membersFailed;
  }
  return fallback;
}
