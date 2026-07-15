import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { I18nProvider } from "../../../i18n";
import { DocumentSection } from "../components/DocumentSection";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("shows polling recovery guidance when realtime is unavailable", async () => {
  vi.stubGlobal("WebSocket", undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(emptyDocumentPage())),
  );

  renderWithProviders(
    <DocumentSection matterId="11111111-1111-1111-1111-111111111111" />,
  );

  expect(
    await screen.findByText(
      "Realtime updates are reconnecting. Active uploads will be checked.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Documents" }),
  ).toBeInTheDocument();
});

function renderWithProviders(children: ReactNode) {
  return render(
    <I18nProvider initialLocale="en">
      <AuthContext.Provider value={authContext()}>
        <QueryClientProvider client={createAppQueryClient()}>
          {children}
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

function authContext(): AuthContextValue {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    session: {
      access: "access-token",
      membership: {
        organization_id: "org-1",
        organization_name: "Acme Legal",
        role: "legal_admin",
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

function emptyDocumentPage() {
  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
}
