import type {
  MatterChoiceKind,
  MatterChoicePurpose,
  MembershipChoicePurpose,
} from "./types";

export const choiceQueryKeys = {
  all: ["api", "choices"] as const,
  matters: (input: { kind?: MatterChoiceKind; purpose: MatterChoicePurpose }) =>
    [
      ...choiceQueryKeys.all,
      "matters",
      input.purpose,
      input.kind ?? "",
    ] as const,
  memberships: (input: {
    excludeMembershipId?: string;
    purpose: MembershipChoicePurpose;
  }) =>
    [
      ...choiceQueryKeys.all,
      "memberships",
      input.purpose,
      input.excludeMembershipId ?? "",
    ] as const,
};
