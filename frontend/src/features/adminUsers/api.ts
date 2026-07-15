import { apiClient } from "../../api/client";
import type {
  AdminUserInvitation,
  AdminUserInviteInput,
  MembershipListItem,
  MembershipListParams,
  MembershipRoleChangeInput,
  PaginatedResponse,
} from "./types";

export async function inviteOrganizationUser({
  idempotencyKey,
  input,
}: {
  idempotencyKey: string;
  input: AdminUserInviteInput;
}): Promise<AdminUserInvitation> {
  return apiClient.request<AdminUserInvitation>("/memberships/", {
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function listMemberships(
  params: MembershipListParams = {},
): Promise<PaginatedResponse<MembershipListItem>> {
  return apiClient.request<PaginatedResponse<MembershipListItem>>(
    "/memberships/",
    {
      query: {
        page: params.page,
        page_size: params.pageSize,
      },
    },
  );
}

export async function changeMembershipRole({
  input,
  membershipId,
}: {
  input: MembershipRoleChangeInput;
  membershipId: string;
}): Promise<MembershipListItem> {
  return apiClient.request<MembershipListItem>(
    `/memberships/${membershipId}/role/`,
    {
      body: input,
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}
