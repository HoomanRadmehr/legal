import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { AsyncChoice } from "../../../components/forms/AsyncChoiceSelect";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import type { NoticeFormValues } from "../schemas";
import { RelatedMatterChoiceSelect } from "../../choices";
import { noticeText } from "./noticeLabels";

export function NoticeRelatedMatterPicker({
  form,
  mode,
}: {
  form: UseFormReturn<NoticeFormValues>;
  mode: "create" | "edit";
}) {
  const { locale } = useI18n();
  const labels = noticeText(locale);
  const [choice, setChoice] = useState<AsyncChoice | null>(null);
  const selectedIds = form.watch("related_matter_ids") ?? [];

  if (mode === "edit") {
    return <SelectedMatterIds labels={labels} selectedIds={selectedIds} />;
  }

  return (
    <fieldset>
      <legend>{labels.relatedMatters}</legend>
      <RelatedMatterChoiceSelect
        id="related_matter_ids"
        onChange={(nextChoice) => {
          setChoice(nextChoice);
          appendSelectedMatter(form, selectedIds, nextChoice);
        }}
        value={choice}
      />
      <p className="notice-help">{labels.permissionHelp}</p>
      <SelectedMatterIds
        labels={labels}
        onRemove={(matterId) =>
          removeSelectedMatter(form, selectedIds, matterId)
        }
        selectedIds={selectedIds}
      />
    </fieldset>
  );
}

function appendSelectedMatter(
  form: UseFormReturn<NoticeFormValues>,
  selectedIds: string[],
  choice: AsyncChoice | null,
) {
  if (!choice || selectedIds.includes(choice.id)) {
    return;
  }
  form.setValue("related_matter_ids", [...selectedIds, choice.id], {
    shouldDirty: true,
    shouldValidate: true,
  });
}

function removeSelectedMatter(
  form: UseFormReturn<NoticeFormValues>,
  selectedIds: string[],
  matterId: string,
) {
  form.setValue(
    "related_matter_ids",
    selectedIds.filter((id) => id !== matterId),
    { shouldDirty: true, shouldValidate: true },
  );
}

function SelectedMatterIds({
  labels,
  onRemove,
  selectedIds,
}: {
  labels: ReturnType<typeof noticeText>;
  onRemove?: (matterId: string) => void;
  selectedIds: string[];
}) {
  if (selectedIds.length === 0) {
    return null;
  }
  return (
    <section aria-label={labels.selectedRelatedMatters}>
      <h3>{labels.selectedRelatedMatters}</h3>
      <ul className="notice-related-id-list">
        {selectedIds.map((matterId) => (
          <li key={matterId}>
            <TechnicalValue>{matterId}</TechnicalValue>
            {onRemove ? (
              <button onClick={() => onRemove(matterId)} type="button">
                {labels.removeRelatedMatter}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
