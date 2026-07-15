import type { UseFormReturn } from "react-hook-form";

import { ErrorState, LoadingState } from "../../../components/standardStates";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import type { NoticeFormValues } from "../schemas";
import { useRelatedMatterChoices } from "../hooks";
import type { RelatedMatterChoice } from "../types";
import { noticeText } from "./noticeLabels";

export function NoticeRelatedMatterPicker({
  form,
  onSearch,
  search,
}: {
  form: UseFormReturn<NoticeFormValues>;
  onSearch: (search: string) => void;
  search: string;
}) {
  const { locale } = useI18n();
  const labels = noticeText(locale);
  const query = useRelatedMatterChoices(search);
  const choices = query.data ?? [];
  const selectedIds = form.watch("related_matter_ids") ?? [];

  return (
    <fieldset>
      <legend>{labels.relatedMatters}</legend>
      <label>
        {labels.searchRelated}
        <input
          aria-label={labels.searchRelatedAria}
          onChange={(event) => onSearch(event.target.value)}
          value={search}
        />
      </label>
      <p className="notice-help">
        {labels.permissionHelp}
      </p>
      {query.isLoading ? (
        <LoadingState label={labels.loadingRelatedMatters} />
      ) : null}
      {query.isError ? (
        <ErrorState
          title={labels.relatedUnavailable}
          message={query.error.message}
        />
      ) : null}
      {choices.length === 0 && !query.isLoading ? (
        <p>{labels.noMatches}</p>
      ) : null}
      <MatterChoiceGroup
        choices={choices.filter((choice) => choice.kind === "case")}
        form={form}
        legend={labels.visibleCases}
      />
      <MatterChoiceGroup
        choices={choices.filter((choice) => choice.kind === "contract")}
        form={form}
        legend={labels.visibleContracts}
      />
      <SelectedMatterIds
        choices={choices}
        labels={labels}
        selectedIds={selectedIds}
      />
    </fieldset>
  );
}

function MatterChoiceGroup({
  choices,
  form,
  legend,
}: {
  choices: RelatedMatterChoice[];
  form: UseFormReturn<NoticeFormValues>;
  legend: string;
}) {
  if (choices.length === 0) {
    return null;
  }

  return (
    <section className="notice-choice-group" aria-label={legend}>
      <h3>{legend}</h3>
      {choices.map((choice) => (
        <label className="notice-checkbox" key={choice.id}>
          <input
            {...form.register("related_matter_ids")}
            type="checkbox"
            value={choice.id}
          />
          <span>
            <TechnicalValue>{choice.reference_code}</TechnicalValue>{" "}
            {choice.title}
          </span>
        </label>
      ))}
    </section>
  );
}

function SelectedMatterIds({
  choices,
  labels,
  selectedIds,
}: {
  choices: RelatedMatterChoice[];
  labels: ReturnType<typeof noticeText>;
  selectedIds: string[];
}) {
  if (selectedIds.length === 0) {
    return null;
  }

  const visibleChoiceIds = new Set(choices.map((choice) => choice.id));
  const hiddenSelectedIds = selectedIds.filter(
    (id) => !visibleChoiceIds.has(id),
  );

  return (
    <section aria-label={labels.selectedRelatedMatters}>
      <h3>{labels.selectedRelatedMatters}</h3>
      <ul className="notice-related-id-list">
        {selectedIds.map((matterId) => (
          <li key={matterId}>
            <TechnicalValue>{matterId}</TechnicalValue>
          </li>
        ))}
      </ul>
      {hiddenSelectedIds.length > 0 ? (
        <p className="notice-help">{labels.hiddenSelected}</p>
      ) : null}
    </section>
  );
}
