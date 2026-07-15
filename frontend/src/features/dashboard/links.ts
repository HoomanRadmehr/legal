import type { DashboardActivity } from "./types";

export const dashboardLinks = {
  casesAll: "/cases",
  casesHighPriority: "/cases?ordering=-priority",
  casesOpen: "/cases?status=open",
  contractsAll: "/contracts",
  contractsExpiring: "/contracts?ordering=expiration_date",
  deadlinesAssigned: "/deadlines?view=assigned_to_me",
  deadlinesOverdue: "/deadlines?view=overdue",
  deadlinesToday: "/deadlines?view=today",
  deadlinesUpcoming: "/deadlines?view=upcoming",
  noticesOpen: "/notices?response_status=pending",
  noticesOverdue: "/notices?overdue=true&response_status=pending",
  tasksAssigned: "/tasks?view=assigned_to_me",
  tasksOverdue: "/tasks?view=assigned_to_me&ordering=due_at",
} as const;

export function activityLink(activity: DashboardActivity): string | null {
  if (!activity.matter_id) {
    return null;
  }
  return `/activity?matter=${activity.matter_id}`;
}
