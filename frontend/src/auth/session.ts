import type { AuthSession } from "./api";

export type SessionRefreshFunction = () => Promise<AuthSession>;

let accessToken: string | null = null;
let refreshSessionFunction: SessionRefreshFunction | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAuthSession(session: AuthSession): void {
  accessToken = session.access;
}

export function clearAuthSession(): void {
  accessToken = null;
}

export function configureSessionRefresh(
  refreshFunction: SessionRefreshFunction,
): void {
  refreshSessionFunction = refreshFunction;
}

export function resetSessionState(): void {
  accessToken = null;
  refreshSessionFunction = null;
  refreshPromise = null;
}

export async function refreshSessionOnce(): Promise<AuthSession | null> {
  if (!refreshSessionFunction) {
    return null;
  }
  if (!refreshPromise) {
    refreshPromise = runRefresh();
  }

  return refreshPromise;
}

async function runRefresh(): Promise<AuthSession | null> {
  try {
    const session = await refreshSessionFunction?.();
    if (!session) {
      clearAuthSession();
      return null;
    }
    setAuthSession(session);
    return session;
  } catch {
    clearAuthSession();
    return null;
  } finally {
    refreshPromise = null;
  }
}
