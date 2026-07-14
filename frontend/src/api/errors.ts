export type ErrorDetails = Record<string, unknown>;

export type ErrorEnvelope = {
  code: string;
  message: string;
  details: ErrorDetails;
  request_id?: string;
};

export type ApiError = Error & {
  status: number;
  code: string;
  details: ErrorDetails;
  requestId?: string;
  retryAfterSeconds?: number;
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && "status" in error && "code" in error;
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

export function parseApiErrorResponse(
  response: Response,
  payload: unknown,
): ApiError {
  const retryAfterSeconds = parseRetryAfter(
    response.headers.get("Retry-After"),
  );
  const requestIdHeader = response.headers.get("X-Request-ID") ?? undefined;

  if (isErrorEnvelope(payload)) {
    return createApiError({
      status: response.status,
      code: payload.code,
      message: payload.message,
      details: payload.details,
      requestId: payload.request_id ?? requestIdHeader,
      retryAfterSeconds,
    });
  }

  return createApiError({
    status: response.status,
    code: fallbackCode(response.status),
    message: fallbackMessage(response.status),
    details: {},
    requestId: requestIdHeader,
    retryAfterSeconds,
  });
}

export function createNetworkError(): ApiError {
  return createApiError({
    status: 0,
    code: "network_error",
    message: "Unable to reach the server.",
    details: {},
  });
}

function createApiError(input: {
  status: number;
  code: string;
  message: string;
  details: ErrorDetails;
  requestId?: string;
  retryAfterSeconds?: number;
}): ApiError {
  return Object.assign(new Error(input.message), {
    name: "ApiError",
    status: input.status,
    code: input.code,
    details: input.details,
    requestId: input.requestId,
    retryAfterSeconds: input.retryAfterSeconds,
  });
}

function fallbackCode(status: number): string {
  if (status === 401) {
    return "authentication_required";
  }
  if (status === 403) {
    return "permission_denied";
  }
  if (status === 404) {
    return "not_found";
  }
  if (status === 429) {
    return "rate_limit_exceeded";
  }
  return "request_failed";
}

function fallbackMessage(status: number): string {
  if (status === 0) {
    return "Unable to reach the server.";
  }
  if (status >= 500) {
    return "The server is temporarily unavailable.";
  }
  return "The request could not be completed.";
}

function isErrorEnvelope(payload: unknown): payload is ErrorEnvelope {
  if (!isRecord(payload) || !isRecord(payload.details)) {
    return false;
  }

  return (
    typeof payload.code === "string" && typeof payload.message === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
