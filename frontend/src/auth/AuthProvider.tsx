import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { configureApiClientAuth } from "../api/client";
import {
  login as loginRequest,
  logoutSession,
  refreshSession,
  type AuthSession,
  type LoginInput,
} from "./api";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./context";
import {
  clearAuthSession,
  configureSessionRefresh,
  getAccessToken,
  refreshSessionOnce,
  setAuthSession,
} from "./session";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("restoring");
  const restoredRef = useRef(false);

  const clearSession = useCallback(() => {
    clearAuthSession();
    setSession(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    configureSessionRefresh(refreshSession);
    configureApiClientAuth({
      getAccessToken,
      onUnauthorized: clearSession,
      refreshAccessToken: async () => {
        const refreshedSession = await refreshSessionOnce();
        if (refreshedSession) {
          setSession(refreshedSession);
          setStatus("authenticated");
          return refreshedSession.access;
        }
        clearSession();
        return null;
      },
    });
  }, [clearSession]);

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    void restoreSession();

    async function restoreSession() {
      const restoredSession = await refreshSessionOnce();
      if (restoredSession) {
        setSession(restoredSession);
        setStatus("authenticated");
        return;
      }
      clearSession();
    }
  }, [clearSession]);

  const login = useCallback(async (input: LoginInput) => {
    const nextSession = await loginRequest(input);
    setAuthSession(nextSession);
    setSession(nextSession);
    setStatus("authenticated");
  }, []);

  const refresh = useCallback(async () => {
    const nextSession = await refreshSessionOnce();
    if (nextSession) {
      setSession(nextSession);
      setStatus("authenticated");
      return;
    }
    clearSession();
  }, [clearSession]);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // Logout still clears local state when the cookie/session is already gone.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ login, logout, refresh, session, status }),
    [login, logout, refresh, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
