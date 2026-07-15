import type { MembershipRole } from "../../auth/permissions";

export type DashboardSummary = {
  cases: DashboardCaseSummary;
  contracts: DashboardContractSummary;
  deadlines: DashboardDeadlineSummary;
  notices: DashboardNoticeSummary;
  recent_activity: DashboardActivity[];
  tasks: DashboardTaskSummary;
};

export type DashboardCaseSummary = {
  high_priority: number;
  open: number;
  total: number;
};

export type DashboardContractSummary = {
  expiring_soon: number;
  total: number;
};

export type DashboardNoticeSummary = {
  open: number;
  response_overdue: number;
};

export type DashboardDeadlineSummary = {
  assigned_to_me: number;
  overdue: number;
  today: number;
  upcoming: number;
};

export type DashboardTaskSummary = {
  assigned_to_me: number;
  overdue: number;
};

export type DashboardActivity = {
  action: string;
  actor_membership_id: string | null;
  created_at: string;
  id: string;
  matter_id: string | null;
  target_id: string | null;
  target_type: string;
};

export type DashboardRole = MembershipRole | string;
