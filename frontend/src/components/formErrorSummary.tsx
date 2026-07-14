import { useI18n } from "../i18n";

export type FormErrorItem = {
  fieldId?: string;
  label: string;
  message: string;
};

export function FormErrorSummary({
  errors,
  title,
}: {
  errors: FormErrorItem[];
  title?: string;
}) {
  const { t } = useI18n();

  if (errors.length === 0) {
    return null;
  }

  return (
    <section
      className="form-error-summary"
      role="alert"
      aria-labelledby="form-error-summary-title"
    >
      <h2 id="form-error-summary-title">
        {title ?? t("components.formErrorSummary.title")}
      </h2>
      <ul>
        {errors.map((error) => (
          <li key={`${error.label}-${error.message}`}>
            {error.fieldId ? (
              <a href={`#${error.fieldId}`}>
                {error.label}: {error.message}
              </a>
            ) : (
              <span>
                {error.label}: {error.message}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
