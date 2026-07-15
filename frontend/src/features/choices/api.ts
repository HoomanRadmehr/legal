import { apiClient } from "../../api/client";
import type {
  MatterChoice,
  MatterChoicePage,
  MatterChoiceRequest,
  MembershipChoice,
  MembershipChoicePage,
  MembershipChoiceRequest,
  RawChoicePage,
  RawMatterChoice,
  RawMembershipChoice,
} from "./types";

export async function listMembershipChoices(
  input: MembershipChoiceRequest,
): Promise<MembershipChoicePage> {
  const page = await apiClient.request<RawChoicePage<RawMembershipChoice>>(
    "/memberships/choices/",
    {
      query: {
        cursor: emptyToUndefined(input.cursor),
        exclude_membership_id: emptyToUndefined(input.excludeMembershipId),
        purpose: input.purpose,
        q: emptyToUndefined(input.query),
      },
    },
  );
  return { ...page, results: page.results.map(mapMembershipChoice) };
}

export async function listMatterChoices(
  input: MatterChoiceRequest,
): Promise<MatterChoicePage> {
  const page = await apiClient.request<RawChoicePage<RawMatterChoice>>(
    "/matters/choices/",
    {
      query: {
        cursor: emptyToUndefined(input.cursor),
        kind: emptyToUndefined(input.kind),
        purpose: input.purpose,
        q: emptyToUndefined(input.query),
      },
    },
  );
  return { ...page, results: page.results.map(mapMatterChoice) };
}

function mapMembershipChoice(choice: RawMembershipChoice): MembershipChoice {
  return {
    id: choice.id,
    label: choice.label,
    role: choice.role,
    secondaryLabel: choice.secondary_label,
    userId: choice.user_id,
  };
}

function mapMatterChoice(choice: RawMatterChoice): MatterChoice {
  return {
    id: choice.id,
    kind: choice.kind,
    label: choice.label,
    secondaryLabel: choice.secondary_label,
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
