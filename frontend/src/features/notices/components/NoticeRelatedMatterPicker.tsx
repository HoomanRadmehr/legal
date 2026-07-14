import type { UseFormReturn } from "react-hook-form";

import { ErrorState, LoadingState } from "../../../components/standardStates";
import { TechnicalValue } from "../../../components/technicalValue";
import type { NoticeFormValues } from "../schemas";
import { useRelatedMatterChoices } from "../hooks";
import type { RelatedMatterChoice } from "../types";

export function NoticeRelatedMatterPicker({
  form,
  onSearch,
  search,
}: {
  form: UseFormReturn<NoticeFormValues>;
  onSearch: (search: string) => void;
  search: string;
}) {
  const query = useRelatedMatterChoices(search);
  const choices = query.data ?? [];
  const selectedIds = form.watch("related_matter_ids") ?? [];

  return (
    <fieldset>
      <legend>Related matters</legend>
      <label>
        Search visible cases and contracts
        <input
          aria-label="Search visible related matters"
          onChange={(event) => onSearch(event.target.value)}
          value={search}
        />
      </label>
      <p className="notice-help">
        Only matters returned by permission-scoped case and contract searches
        can be selected.
      </p>
      {query.isLoading ? (
        <LoadingState label="Loading related matters" />
      ) : null}
      {query.isError ? (
        <ErrorState
          title="Related matters unavailable"
          message={query.error.message}
        />
      ) : null}
      {choices.length === 0 && !query.isLoading ? (
        <p>No visible cases or contracts match this search.</p>
      ) : null}
      <MatterChoiceGroup
        choices={choices.filter((choice) => choice.kind === "case")}
        form={form}
        legend="Visible cases"
      />
      <MatterChoiceGroup
        choices={choices.filter((choice) => choice.kind === "contract")}
        form={form}
        legend="Visible contracts"
      />
      <SelectedMatterIds choices={choices} selectedIds={selectedIds} />
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
  selectedIds,
}: {
  choices: RelatedMatterChoice[];
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
    <section aria-label="Selected related matters">
      <h3>Selected related matters</h3>
      <ul className="notice-related-id-list">
        {selectedIds.map((matterId) => (
          <li key={matterId}>
            <TechnicalValue>{matterId}</TechnicalValue>
          </li>
        ))}
      </ul>
      {hiddenSelectedIds.length > 0 ? (
        <p className="notice-help">
          Some selected matters are not in the current search results.
        </p>
      ) : null}
    </section>
  );
}
