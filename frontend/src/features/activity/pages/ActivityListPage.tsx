import { useSearchParams } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canViewActivityLog } from "../../../auth/permissions";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { ActivityFilters } from "../components/ActivityFilters";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { useActivityList } from "../hooks";
import { activityText } from "../text";
import type { ActivityListParams } from "../types";

export function ActivityListPage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {canViewActivityLog(session.membership.role) ? (
        <ActivityListContent />
      ) : (
        <ForbiddenState />
      )}
    </AppShell>
  );
}

function ActivityListContent() {
  const { locale } = useI18n();
  const labels = activityText(locale);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = activityParamsFromSearch(searchParams);
  const query = useActivityList(params);

  return (
    <section className="activity-page" aria-labelledby="activity-title">
      <PageHeader
        eyebrow={labels.eyebrow}
        title={labels.title}
        description={labels.description}
      />
      <ActivityFilters
        labels={labels}
        onSubmit={(nextParams) => setSearchParams(paramsToSearch(nextParams))}
        params={params}
      />
      {query.isLoading ? <LoadingState label={labels.loading} /> : null}
      {query.isError ? <ActivityError error={query.error} /> : null}
      {query.data ? (
        <>
          <p className="activity-count">
            {labels.pageStatus.replace("{{count}}", String(query.data.count))}
          </p>
          <ActivityTimeline
            ariaLabel={labels.title}
            emptyLabel={labels.empty}
            events={query.data.results}
            isError={false}
            isLoading={false}
          />
        </>
      ) : null}
    </section>
  );
}

function ActivityError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const labels = activityText(locale);

  return (
    <ErrorState
      title={labels.error}
      message={activityErrorMessage(error, labels)}
      retryAfterSeconds={
        isApiError(error) ? error.retryAfterSeconds : undefined
      }
    />
  );
}

function activityErrorMessage(
  error: Error,
  labels: ReturnType<typeof activityText>,
): string {
  if (isApiError(error) && (error.status === 403 || error.status === 404)) {
    return labels.notVisible;
  }
  if (isApiError(error) && error.status === 429 && error.retryAfterSeconds) {
    return labels.retry.replace("{{seconds}}", String(error.retryAfterSeconds));
  }
  return labels.errorMessage;
}

function activityParamsFromSearch(
  searchParams: URLSearchParams,
): ActivityListParams {
  return {
    action: searchParams.get("action") ?? undefined,
    actor: searchParams.get("actor") ?? undefined,
    createdAfter: searchParams.get("created_after") ?? undefined,
    createdBefore: searchParams.get("created_before") ?? undefined,
    matter: searchParams.get("matter") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    targetId: searchParams.get("target_id") ?? undefined,
    targetType: searchParams.get("target_type") ?? undefined,
  };
}

function paramsToSearch(params: ActivityListParams): URLSearchParams {
  const search = new URLSearchParams();
  appendParam(search, "action", params.action);
  appendParam(search, "actor", params.actor);
  appendParam(search, "created_after", params.createdAfter);
  appendParam(search, "created_before", params.createdBefore);
  appendParam(search, "matter", params.matter);
  appendParam(search, "target_type", params.targetType);
  return search;
}

function appendParam(
  search: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value !== undefined && value !== "") {
    search.set(key, String(value));
  }
}
