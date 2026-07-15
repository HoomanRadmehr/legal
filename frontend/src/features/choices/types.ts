import type { AsyncChoice, ChoicePage } from "../../components/forms/AsyncChoiceSelect";

export type MembershipChoicePurpose =
  | "assignee"
  | "offboarding_replacement"
  | "owner"
  | "participant";

export type MatterChoicePurpose =
  | "deadline_create"
  | "document_upload"
  | "link"
  | "notice_relation"
  | "task_create";

export type MatterChoiceKind = "case" | "contract" | "notice";

export type MembershipChoice = AsyncChoice & {
  role: string;
  userId: string;
};

export type MatterChoice = AsyncChoice & {
  kind: MatterChoiceKind;
};

export type MembershipChoiceRequest = {
  cursor?: string;
  excludeMembershipId?: string;
  purpose: MembershipChoicePurpose;
  query: string;
};

export type MatterChoiceRequest = {
  cursor?: string;
  kind?: MatterChoiceKind;
  purpose: MatterChoicePurpose;
  query: string;
};

export type MembershipChoicePage = ChoicePage & {
  results: MembershipChoice[];
};

export type MatterChoicePage = ChoicePage & {
  results: MatterChoice[];
};

export type RawMembershipChoice = {
  id: string;
  label: string;
  role: string;
  secondary_label?: string;
  user_id: string;
};

export type RawMatterChoice = {
  id: string;
  kind: MatterChoiceKind;
  label: string;
  secondary_label?: string;
};

export type RawChoicePage<TChoice> = {
  has_more: boolean;
  next_cursor: string | null;
  results: TChoice[];
};
