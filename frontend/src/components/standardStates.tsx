import type { ReactNode } from "react";

import { useI18n } from "../i18n";

export type StandardStateProps = {
  title: string;
  message?: string;
};

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();

  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <span className="state__spinner" aria-hidden="true" />
      <span>{label ?? t("components.standardStates.loading")}</span>
    </div>
  );
}

export function EmptyState({ title, message }: StandardStateProps) {
  return (
    <section className="state" aria-labelledby="empty-state-title">
      <h2 id="empty-state-title">{title}</h2>
      {message ? <p>{message}</p> : null}
    </section>
  );
}

export function ErrorState({
  title,
  message,
  requestId,
  retryAfterSeconds,
}: {
  title?: string;
  message?: string;
  requestId?: string;
  retryAfterSeconds?: number;
}) {
  const { t } = useI18n();

  return (
    <section
      className="state state--error"
      role="alert"
      aria-labelledby="error-state-title"
    >
      <h2 id="error-state-title">
        {title ?? t("components.standardStates.requestFailed")}
      </h2>
      <p>{message ?? t("components.standardStates.requestFailedMessage")}</p>
      <ErrorMetadata
        requestId={requestId}
        retryAfterSeconds={retryAfterSeconds}
      />
    </section>
  );
}

export function ForbiddenState({
  title,
  message,
}: Partial<StandardStateProps>) {
  const { t } = useI18n();

  return (
    <section
      className="state state--error"
      role="alert"
      aria-labelledby="forbidden-state-title"
    >
      <h2 id="forbidden-state-title">
        {title ?? t("components.standardStates.accessDenied")}
      </h2>
      <p>{message ?? t("components.standardStates.forbiddenMessage")}</p>
    </section>
  );
}

export function NotFoundState({
  title,
  message,
}: Partial<StandardStateProps>) {
  const { t } = useI18n();

  return (
    <section className="state" aria-labelledby="not-found-state-title">
      <h2 id="not-found-state-title">
        {title ?? t("components.standardStates.pageNotFound")}
      </h2>
      <p>{message ?? t("components.standardStates.notFoundMessage")}</p>
    </section>
  );
}

function ErrorMetadata({
  requestId,
  retryAfterSeconds,
}: {
  requestId?: string;
  retryAfterSeconds?: number;
}) {
  const { t } = useI18n();
  const metadata = buildErrorMetadata({ requestId, retryAfterSeconds, t });

  if (!metadata) {
    return null;
  }

  return <p className="state__metadata">{metadata}</p>;
}

function buildErrorMetadata({
  requestId,
  retryAfterSeconds,
  t,
}: {
  requestId?: string;
  retryAfterSeconds?: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}): ReactNode {
  if (requestId && retryAfterSeconds !== undefined) {
    return t("components.standardStates.requestIdWithRetry", {
      requestId,
      seconds: retryAfterSeconds,
    });
  }
  if (requestId) {
    return t("components.standardStates.requestId", { requestId });
  }
  if (retryAfterSeconds !== undefined) {
    return t("components.standardStates.retryAfter", {
      seconds: retryAfterSeconds,
    });
  }
  return null;
}
