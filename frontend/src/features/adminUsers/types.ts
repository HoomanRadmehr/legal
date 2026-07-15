import type { MembershipRole } from "../../auth/permissions";

export type PreferredLanguage = "en" | "fa";

export type AdminUserInviteInput = {
  email: string;
  first_name?: string;
  last_name?: string;
  preferred_language?: PreferredLanguage;
  role: MembershipRole;
};

export type AdminUserInvitation = {
  expires_at: string;
  id: string;
  invitation_id: string;
  invitation_status: string;
  organization_id: string;
  role: MembershipRole;
  status: string;
  user_id: string;
};

export type MembershipListItem = {
  created_at: string;
  display_name: string;
  email: string;
  id: string;
  joined_at: string;
  offboarded_at: string | null;
  organization_id: string;
  role: MembershipRole;
  status: string;
  updated_at: string;
  user_id: string;
  user_is_active: boolean;
};

export type MembershipListParams = {
  page?: number;
  pageSize?: number;
};

export type MembershipRoleChangeInput = {
  role: MembershipRole;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};
