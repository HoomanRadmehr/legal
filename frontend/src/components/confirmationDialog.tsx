import { type ReactNode, useEffect, useRef } from "react";

import { useI18n } from "../i18n";

export function ConfirmationDialog({
  cancelLabel,
  children,
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  title,
}: {
  cancelLabel?: string;
  children: ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}) {
  const { t } = useI18n();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      previousFocusRef.current?.focus();
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop">
      <section
        className="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
      >
        <h2 id="confirmation-dialog-title">{title}</h2>
        <div className="confirmation-dialog__body">{children}</div>
        <div className="confirmation-dialog__actions">
          <button ref={cancelButtonRef} type="button" onClick={onCancel}>
            {cancelLabel ?? t("actions.cancel")}
          </button>
          <button type="button" onClick={onConfirm}>
            {confirmLabel ?? t("actions.confirm")}
          </button>
        </div>
      </section>
    </div>
  );
}
