import type { AsyncChoice } from "../../../components/forms/AsyncChoiceSelect";
import { useI18n } from "../../../i18n";
import { MatterChoiceSelect } from "../../choices";
import { documentText } from "../text";

type DocumentMatterChoiceSelectProps = {
  disabled?: boolean;
  error?: string;
  onChange: (choice: AsyncChoice | null) => void;
  value: AsyncChoice | null;
};

export function DocumentMatterChoiceSelect({
  disabled = false,
  error,
  onChange,
  value,
}: DocumentMatterChoiceSelectProps) {
  const { locale } = useI18n();
  const labels = documentText(locale);

  return (
    <div className="document-choice">
      <MatterChoiceSelect
        disabled={disabled}
        error={Boolean(error)}
        helperText={error}
        id="document-matter-choice"
        label={labels.selectLegalMatter}
        onChange={onChange}
        purpose="document_upload"
        value={value}
      />
    </div>
  );
}
