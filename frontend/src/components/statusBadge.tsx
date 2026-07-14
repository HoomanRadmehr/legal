import { useI18n } from "../i18n";

export type StatusBadgeTone = "danger" | "neutral" | "success" | "warning";

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label?: string;
  tone?: StatusBadgeTone;
}) {
  const { t } = useI18n();
  const displayLabel = label ?? t(`status.${tone}`);

  return (
    <span className={`status-badge status-badge--${tone}`}>{displayLabel}</span>
  );
}
