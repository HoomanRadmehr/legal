import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { resetAuthForTests } from "../../../auth/testUtils";
import { I18nProvider } from "../../../i18n";

export function renderDeadlineRoute({
  children,
  path = "/deadlines",
  role = "legal_admin",
  route = "/deadlines",
}: {
  children: ReactNode;
  path?: string;
  role?: string;
  route?: string;
}) {
  return render(
    <I18nProvider>
      <AuthContext.Provider value={authContext(role)}>
        <QueryClientProvider client={createAppQueryClient()}>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={children} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

export function resetDeadlineTestState(): void {
  resetAuthForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
}

function authContext(role: string): AuthContextValue {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    session: {
      access: "access-token",
      membership: {
        organization_id: "org-1",
        organization_name: "Acme Legal",
        role,
      },
      user: {
        display_name: "Ava Counsel",
        id: "user-1",
        preferred_language: "en",
      },
    },
    status: "authenticated",
  };
}
