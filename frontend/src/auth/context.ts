import { createContext } from "react";

import type { AuthSession, LoginInput } from "./api";

export type AuthStatus = "anonymous" | "authenticated" | "restoring";

export type AuthContextValue = {
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  session: AuthSession | null;
  status: AuthStatus;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
