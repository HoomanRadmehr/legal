import type { ReactNode } from "react";

export type StandardStateProps = {
  title: string;
  message?: string;
};

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <span className="state__spinner" aria-hidden="true" />
      <span>{label}</span>
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
  title = "Request failed",
  message = "The request could not be completed.",
  requestId,
  retryAfterSeconds,
}: {
  title?: string;
  message?: string;
  requestId?: string;
  retryAfterSeconds?: number;
}) {
  return (
    <section
      className="state state--error"
      role="alert"
      aria-labelledby="error-state-title"
    >
      <h2 id="error-state-title">{title}</h2>
      <p>{message}</p>
      <ErrorMetadata
        requestId={requestId}
        retryAfterSeconds={retryAfterSeconds}
      />
    </section>
  );
}

export function ForbiddenState({
  title = "Access denied",
  message = "You do not have permission to view this page.",
}: Partial<StandardStateProps>) {
  return (
    <section
      className="state state--error"
      role="alert"
      aria-labelledby="forbidden-state-title"
    >
      <h2 id="forbidden-state-title">{title}</h2>
      <p>{message}</p>
    </section>
  );
}

export function NotFoundState({
  title = "Page not found",
  message = "The page could not be found.",
}: Partial<StandardStateProps>) {
  return (
    <section className="state" aria-labelledby="not-found-state-title">
      <h2 id="not-found-state-title">{title}</h2>
      <p>{message}</p>
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
  const metadata = buildErrorMetadata({ requestId, retryAfterSeconds });

  if (!metadata) {
    return null;
  }

  return <p className="state__metadata">{metadata}</p>;
}

function buildErrorMetadata({
  requestId,
  retryAfterSeconds,
}: {
  requestId?: string;
  retryAfterSeconds?: number;
}): ReactNode {
  if (requestId && retryAfterSeconds !== undefined) {
    return `Request ID ${requestId}. Retry after ${retryAfterSeconds} seconds.`;
  }
  if (requestId) {
    return `Request ID ${requestId}.`;
  }
  if (retryAfterSeconds !== undefined) {
    return `Retry after ${retryAfterSeconds} seconds.`;
  }
  return null;
}
