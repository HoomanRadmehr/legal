import { Link } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canViewOrganizationDashboard } from "../../../auth/permissions";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { useDashboardSummary } from "../hooks";
import { activityLink, dashboardLinks } from "../links";
import { dashboardRoleDescription, dashboardText } from "../text";
import type { DashboardActivity, DashboardSummary } from "../types";
import "../dashboard.css";

export function DashboardPage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {canViewOrganizationDashboard(session.membership.role) ? (
        <DashboardContent role={session.membership.role} />
      ) : (
        <ForbiddenState />
      )}
    </AppShell>
  );
}

function DashboardContent({ role }: { role: string }) {
  const { locale } = useI18n();
  const text = dashboardText(locale);
  const query = useDashboardSummary();

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <PageHeader
        eyebrow={text.eyebrow}
        title={text.title}
        description={text.description}
      />
      <p className="dashboard-role-note">
        {dashboardRoleDescription(role, text)}
      </p>
      {query.isLoading ? <LoadingState label={text.loading} /> : null}
      {query.isError ? <DashboardError error={query.error} /> : null}
      {query.data ? <DashboardSections summary={query.data} /> : null}
    </section>
  );
}

function DashboardError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const text = dashboardText(locale);
  const retryAfterSeconds = isApiError(error)
    ? error.retryAfterSeconds
    : undefined;

  return (
    <ErrorState
      title={text.error}
      message={dashboardErrorMessage(error, text)}
      retryAfterSeconds={retryAfterSeconds}
    />
  );
}

function DashboardSections({ summary }: { summary: DashboardSummary }) {
  const { locale } = useI18n();
  const text = dashboardText(locale);

  return (
    <>
      {!hasVisibleWork(summary) ? (
        <EmptyState title={text.empty} />
      ) : (
        <div className="dashboard-grid">
          <DashboardCard title={text.cases}>
            <Metric
              label={text.values.totalCases}
              to={dashboardLinks.casesAll}
              value={summary.cases.total}
            />
            <Metric
              label={text.values.openCases}
              to={dashboardLinks.casesOpen}
              value={summary.cases.open}
            />
            <Metric
              label={text.values.highCases}
              to={dashboardLinks.casesHighPriority}
              urgent
              value={summary.cases.high_priority}
            />
          </DashboardCard>
          <DashboardCard title={text.contracts}>
            <Metric
              label={text.values.totalContracts}
              to={dashboardLinks.contractsAll}
              value={summary.contracts.total}
            />
            <Metric
              label={text.values.expiringContracts}
              to={dashboardLinks.contractsExpiring}
              urgent
              value={summary.contracts.expiring_soon}
            />
          </DashboardCard>
          <DashboardCard title={text.notices}>
            <Metric
              label={text.values.openNotices}
              to={dashboardLinks.noticesOpen}
              value={summary.notices.open}
            />
            <Metric
              label={text.values.overdueNotices}
              to={dashboardLinks.noticesOverdue}
              urgent
              value={summary.notices.response_overdue}
            />
          </DashboardCard>
          <DashboardCard title={text.deadlines}>
            <Metric
              label={text.values.todayDeadlines}
              to={dashboardLinks.deadlinesToday}
              urgent
              value={summary.deadlines.today}
            />
            <Metric
              label={text.values.overdueDeadlines}
              to={dashboardLinks.deadlinesOverdue}
              urgent
              value={summary.deadlines.overdue}
            />
            <Metric
              label={text.values.upcomingDeadlines}
              to={dashboardLinks.deadlinesUpcoming}
              value={summary.deadlines.upcoming}
            />
            <Metric
              label={text.values.assignedDeadlines}
              to={dashboardLinks.deadlinesAssigned}
              value={summary.deadlines.assigned_to_me}
            />
          </DashboardCard>
          <DashboardCard title={text.tasks}>
            <Metric
              label={text.values.assignedTasks}
              to={dashboardLinks.tasksAssigned}
              value={summary.tasks.assigned_to_me}
            />
            <Metric
              label={text.values.overdueTasks}
              to={dashboardLinks.tasksOverdue}
              urgent
              value={summary.tasks.overdue}
            />
          </DashboardCard>
        </div>
      )}
      <RecentActivity activities={summary.recent_activity} />
    </>
  );
}

function DashboardCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="dashboard-card">
      <h2>{title}</h2>
      <div className="dashboard-metric-list">{children}</div>
    </section>
  );
}

function Metric({
  label,
  to,
  urgent = false,
  value,
}: {
  label: string;
  to: string;
  urgent?: boolean;
  value: number;
}) {
  const { locale } = useI18n();
  const text = dashboardText(locale);
  const ariaLabel = metricAriaLabel({
    label,
    urgentLabel: text.urgent,
    urgent,
    value,
  });

  return (
    <Link aria-label={ariaLabel} className="dashboard-metric" to={to}>
      <span className="dashboard-metric__label">{label}</span>
      <strong>{value}</strong>
      {urgent && value > 0 ? (
        <span className="dashboard-urgency">{text.urgent}</span>
      ) : null}
    </Link>
  );
}

function metricAriaLabel({
  label,
  urgent,
  urgentLabel,
  value,
}: {
  label: string;
  urgent: boolean;
  urgentLabel: string;
  value: number;
}): string {
  if (urgent && value > 0) {
    return `${label} ${value} ${urgentLabel}`;
  }
  return `${label} ${value}`;
}

function RecentActivity({ activities }: { activities: DashboardActivity[] }) {
  const { locale } = useI18n();
  const text = dashboardText(locale);

  return (
    <section
      className="dashboard-activity"
      aria-labelledby="dashboard-activity-title"
    >
      <h2 id="dashboard-activity-title">{text.activity}</h2>
      {activities.length === 0 ? <p>{text.activityEmpty}</p> : null}
      <ul>
        {activities.map((activity) => (
          <ActivityItem activity={activity} key={activity.id} />
        ))}
      </ul>
    </section>
  );
}

function ActivityItem({ activity }: { activity: DashboardActivity }) {
  const { locale } = useI18n();
  const text = dashboardText(locale);
  const link = activityLink(activity);

  return (
    <li>
      <span>{activity.action}</span>
      <time dateTime={activity.created_at}>
        {formatDate(activity.created_at)}
      </time>
      {link ? <Link to={link}>{text.activityLink}</Link> : null}
    </li>
  );
}

function dashboardErrorMessage(
  error: Error,
  text: ReturnType<typeof dashboardText>,
) {
  if (isApiError(error) && error.status === 429 && error.retryAfterSeconds) {
    return text.retry.replace("{{seconds}}", String(error.retryAfterSeconds));
  }
  if (isApiError(error) && error.status === 0) {
    return error.message;
  }
  return text.errorMessage;
}

function hasVisibleWork(summary: DashboardSummary): boolean {
  return (
    summary.cases.total > 0 ||
    summary.contracts.total > 0 ||
    summary.notices.open > 0 ||
    summary.deadlines.today > 0 ||
    summary.deadlines.overdue > 0 ||
    summary.deadlines.upcoming > 0 ||
    summary.deadlines.assigned_to_me > 0 ||
    summary.tasks.assigned_to_me > 0 ||
    summary.recent_activity.length > 0
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}
