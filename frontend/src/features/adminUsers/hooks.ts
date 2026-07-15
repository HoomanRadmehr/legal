import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import {
  changeMembershipRole,
  inviteOrganizationUser,
  listMemberships,
} from "./api";
import type {
  AdminUserInviteInput,
  MembershipListParams,
  MembershipRoleChangeInput,
} from "./types";

export const adminUserQueryKeys = {
  all: ["api", "memberships"] as const,
  list: (params: MembershipListParams = {}) =>
    ["api", "memberships", "list", params] as const,
};

export function useMembershipList(params: MembershipListParams = {}) {
  return useQuery({
    queryFn: () => listMemberships(params),
    queryKey: adminUserQueryKeys.list(params),
  });
}

export function useInviteOrganizationUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminUserInviteInput) =>
      inviteOrganizationUser({
        idempotencyKey: createIdempotencyKey(),
        input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
}

export function useChangeMembershipRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      membershipId: string;
      role: MembershipRoleChangeInput["role"];
    }) =>
      changeMembershipRole({
        input: { role: input.role },
        membershipId: input.membershipId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
}

export function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? fallbackIdempotencyKey();
}

function fallbackIdempotencyKey(): string {
  const value = Math.random().toString(16).slice(2).padEnd(32, "0");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-4${value.slice(13, 16)}-8${value.slice(17, 20)}-${value.slice(20, 32)}`;
}
