import type { MembershipRole } from "../../auth/permissions";

export type MembershipSummary = {
  display_name: string;
  id: string;
  role: MembershipRole | string;
};

export type MatterSummary = {
  id: string;
  reference_code: string;
  title: string;
  version: number;
};

export type WorkSummary = {
  id: string;
  matter_id: string;
  title: string;
  version: number;
};

export type AccessSummary = {
  id: string;
  level: string;
  matter_id: string;
};

export type OffboardingCounts = {
  active_access_grants: number;
  open_deadlines: number;
  open_tasks: number;
  owned_matters: number;
};

export type OffboardingPreview = {
  active_access_grants: AccessSummary[];
  counts: OffboardingCounts;
  departing: MembershipSummary;
  fingerprint: string;
  open_deadlines: WorkSummary[];
  open_tasks: WorkSummary[];
  owned_matters: MatterSummary[];
  replacement: MembershipSummary;
  warnings: string[];
};

export type OffboardingPreviewInput = {
  departing_membership_id: string;
  replacement_membership_id: string;
};

export type OffboardingExecuteInput = OffboardingPreviewInput & {
  confirmation: string;
  preview_fingerprint: string;
};

export type OffboardingRun = {
  departing_membership_id: string;
  executed_at: string;
  id: string;
  organization_id: string;
  preview: OffboardingPreview;
  replacement_membership_id: string;
  status: string;
};
