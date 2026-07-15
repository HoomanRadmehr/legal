import { Link } from "react-router-dom";

import { useI18n } from "../../../i18n";
import { documentText } from "../text";
import type { DocumentStatus } from "../types";

export function DocumentUploadResult({
  document,
  onReset,
}: {
  document: { status: DocumentStatus };
  onReset: () => void;
}) {
  const { locale } = useI18n();
  const labels = documentText(locale);

  if (document.status !== "available") {
    return null;
  }

  return (
    <section className="document-upload__result" aria-live="polite">
      <h2>{labels.available}</h2>
      <p>{labels.uploadAvailable}</p>
      <div className="document-upload__actions">
        <Link to="/documents">{labels.backToDocuments}</Link>
        <button onClick={onReset} type="button">
          {labels.uploadAnother}
        </button>
      </div>
    </section>
  );
}
