import {
  AsyncChoiceSelect,
  type AsyncChoice,
} from "../../components/forms/AsyncChoiceSelect";
import { useI18n } from "../../i18n";
import { listMatterChoices, listMembershipChoices } from "./api";
import { choiceQueryKeys } from "./queryKeys";
import { choiceLabels } from "./text";
import type {
  MatterChoiceKind,
  MatterChoicePurpose,
  MembershipChoicePurpose,
} from "./types";

type ChoiceProps = {
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  id?: string;
  onChange: (value: AsyncChoice | null) => void;
  value: AsyncChoice | null;
};

type MembershipChoiceSelectProps = ChoiceProps & {
  excludeMembershipId?: string;
  label: string;
  purpose: MembershipChoicePurpose;
};

type MatterChoiceSelectProps = ChoiceProps & {
  kind?: MatterChoiceKind;
  label: string;
  purpose: MatterChoicePurpose;
};

export function MembershipChoiceSelect({
  disabled,
  error,
  excludeMembershipId,
  helperText,
  id,
  label,
  onChange,
  purpose,
  value,
}: MembershipChoiceSelectProps) {
  const { locale } = useI18n();
  const labels = choiceLabels(locale);

  return (
    <AsyncChoiceSelect
      disabled={disabled}
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      loadPage={(input) =>
        listMembershipChoices({
          cursor: input.cursor,
          excludeMembershipId,
          purpose,
          query: input.query,
        })
      }
      onChange={onChange}
      placeholder={labels.searchMembership}
      queryKey={choiceQueryKeys.memberships({ excludeMembershipId, purpose })}
      value={value}
    />
  );
}

export function MatterChoiceSelect({
  disabled,
  error,
  helperText,
  id,
  kind,
  label,
  onChange,
  purpose,
  value,
}: MatterChoiceSelectProps) {
  const { locale } = useI18n();
  const labels = choiceLabels(locale);

  return (
    <AsyncChoiceSelect
      disabled={disabled}
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      loadPage={(input) =>
        listMatterChoices({
          cursor: input.cursor,
          kind,
          purpose,
          query: input.query,
        })
      }
      onChange={onChange}
      placeholder={labels.searchMatter}
      queryKey={choiceQueryKeys.matters({ kind, purpose })}
      value={value}
    />
  );
}

export function OwnerChoiceSelect(props: Omit<ChoiceProps, "label">) {
  const { locale } = useI18n();
  return (
    <MembershipChoiceSelect
      label={choiceLabels(locale).owner}
      purpose="owner"
      {...props}
    />
  );
}

export function AssigneeChoiceSelect(props: Omit<ChoiceProps, "label">) {
  const { locale } = useI18n();
  return (
    <MembershipChoiceSelect
      label={choiceLabels(locale).assignee}
      purpose="assignee"
      {...props}
    />
  );
}

export function RelatedMatterChoiceSelect(props: Omit<ChoiceProps, "label">) {
  const { locale } = useI18n();
  return (
    <MatterChoiceSelect
      label={choiceLabels(locale).relatedLegalMatter}
      purpose="notice_relation"
      {...props}
    />
  );
}

export function ReplacementMembershipChoiceSelect({
  excludeMembershipId,
  ...props
}: Omit<ChoiceProps, "label"> & { excludeMembershipId?: string }) {
  const { locale } = useI18n();
  return (
    <MembershipChoiceSelect
      excludeMembershipId={excludeMembershipId}
      label={choiceLabels(locale).replacementUser}
      purpose="offboarding_replacement"
      {...props}
    />
  );
}
