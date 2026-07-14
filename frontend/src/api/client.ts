import { createNetworkError, parseApiErrorResponse } from "./errors";

export type AccessTokenProvider = () => string | null | undefined;
export type RefreshAccessToken = () => Promise<string | null>;
export type UnauthorizedHandler = () => void;

export type QueryValue = boolean | number | string | null | undefined;

export type ApiRequestOptions = {
  body?: unknown;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  method?: string;
  query?: Record<string, QueryValue | QueryValue[]>;
  replayOnUnauthorized?: boolean;
  signal?: AbortSignal;
};

export type ApiClient = {
  request: <TResponse>(
    path: string,
    options?: ApiRequestOptions,
  ) => Promise<TResponse>;
};

export type ApiClientConfig = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  getAccessToken?: AccessTokenProvider;
  onUnauthorized?: UnauthorizedHandler;
  refreshAccessToken?: RefreshAccessToken;
};

const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

let defaultAccessTokenProvider: AccessTokenProvider | undefined;
let defaultRefreshAccessToken: RefreshAccessToken | undefined;
let defaultUnauthorizedHandler: UnauthorizedHandler | undefined;

export function createApiClient(config: ApiClientConfig = {}): ApiClient {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const fetchImpl = config.fetchImpl ?? ((input, init) => fetch(input, init));
  const getAccessToken =
    config.getAccessToken ?? (() => defaultAccessTokenProvider?.());
  const refreshAccessToken =
    config.refreshAccessToken ??
    (() => defaultRefreshAccessToken?.() ?? Promise.resolve(null));
  const onUnauthorized =
    config.onUnauthorized ?? (() => defaultUnauthorizedHandler?.());

  return {
    request: (path, options = {}) =>
      apiRequest(path, options, {
        baseUrl,
        fetchImpl,
        getAccessToken,
        onUnauthorized,
        refreshAccessToken,
      }),
  };
}

export const apiClient = createApiClient();

export function configureApiClientAuth(config: {
  getAccessToken?: AccessTokenProvider;
  onUnauthorized?: UnauthorizedHandler;
  refreshAccessToken?: RefreshAccessToken;
}): void {
  defaultAccessTokenProvider = config.getAccessToken;
  defaultRefreshAccessToken = config.refreshAccessToken;
  defaultUnauthorizedHandler = config.onUnauthorized;
}

export function resetApiClientAuth(): void {
  defaultAccessTokenProvider = undefined;
  defaultRefreshAccessToken = undefined;
  defaultUnauthorizedHandler = undefined;
}

async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions,
  config: Required<Pick<ApiClientConfig, "baseUrl" | "fetchImpl">> &
    Pick<
      ApiClientConfig,
      "getAccessToken" | "onUnauthorized" | "refreshAccessToken"
    >,
): Promise<TResponse> {
  const response = await sendRequest(path, options, config);
  if (response.status === 401 && shouldReplayAfterRefresh(options)) {
    const refreshedToken = await tryRefreshAccessToken(config);
    if (refreshedToken) {
      const replayResponse = await sendRequest(
        path,
        { ...options, replayOnUnauthorized: false },
        config,
      );
      return parseResponse<TResponse>(replayResponse);
    }
    config.onUnauthorized?.();
    return parseResponse<TResponse>(response);
  }
  if (response.status === 401) {
    config.onUnauthorized?.();
  }

  return parseResponse<TResponse>(response);
}

async function tryRefreshAccessToken(
  config: Pick<ApiClientConfig, "refreshAccessToken">,
): Promise<string | null> {
  try {
    return (await config.refreshAccessToken?.()) ?? null;
  } catch {
    return null;
  }
}

function shouldReplayAfterRefresh(options: ApiRequestOptions): boolean {
  if (options.replayOnUnauthorized === false) {
    return false;
  }
  if (options.replayOnUnauthorized === true) {
    return true;
  }

  const method = (options.method ?? "GET").toUpperCase();
  return method === "GET" || method === "HEAD";
}

async function parseResponse<TResponse>(
  response: Response,
): Promise<TResponse> {
  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw parseApiErrorResponse(response, payload);
  }

  return payload as TResponse;
}

async function sendRequest(
  path: string,
  options: ApiRequestOptions,
  config: Required<Pick<ApiClientConfig, "baseUrl" | "fetchImpl">> &
    Pick<ApiClientConfig, "getAccessToken">,
): Promise<Response> {
  try {
    return await config.fetchImpl(
      buildUrl(config.baseUrl, path, options.query),
      {
        body: serializeBody(options.body),
        credentials: options.credentials ?? "include",
        headers: buildHeaders(
          options.headers,
          options.body,
          config.getAccessToken?.(),
        ),
        method: options.method ?? "GET",
        signal: options.signal,
      },
    );
  } catch {
    throw createNetworkError();
  }
}

function buildHeaders(
  baseHeaders: HeadersInit | undefined,
  body: unknown,
  token: string | null | undefined,
) {
  const headers = new Headers(baseHeaders);
  headers.set("Accept", "application/json");

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }
  if (body instanceof FormData || typeof body === "string") {
    return body;
  }
  return JSON.stringify(body);
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, QueryValue | QueryValue[]>,
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const urlBase = normalizedBase.startsWith("http")
    ? normalizedBase
    : `http://local.test${normalizedBase}`;
  const url = new URL(`${urlBase}${normalizedPath}`);

  appendQuery(url, query);
  if (normalizedBase.startsWith("http")) {
    return url.toString();
  }
  return `${url.pathname}${url.search}`;
}

function appendQuery(
  url: URL,
  query?: Record<string, QueryValue | QueryValue[]>,
): void {
  if (!query) {
    return;
  }

  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item !== undefined && item !== null) {
        url.searchParams.append(key, String(item));
      }
    }
  }
}
