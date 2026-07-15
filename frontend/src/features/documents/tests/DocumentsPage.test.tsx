import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { I18nProvider } from "../../../i18n";
import { DocumentsPage } from "../pages/DocumentsPage";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test.each([["legal_admin"], ["legal_manager"], ["legal_counsel"]])(
  "shows upload action for %s",
  async (role) => {
    vi.stubGlobal("WebSocket", undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(emptyDocumentPage())),
    );

    renderDocumentsPage({ role });

    expect(
      await screen.findByRole("link", { name: "Upload document" }),
    ).toHaveAttribute("href", "/documents/new");
    expect(
      await screen.findByText("No documents have been uploaded."),
    ).toBeInTheDocument();
  },
);

test("hides upload action for viewer", async () => {
  vi.stubGlobal("WebSocket", undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(emptyDocumentPage())),
  );

  renderDocumentsPage({ role: "viewer" });

  expect(
    await screen.findByText("No documents have been uploaded."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Upload document" }),
  ).not.toBeInTheDocument();
});

function renderDocumentsPage({ role }: { role: string }) {
  return renderWithProviders(<DocumentsPage />, role);
}

function renderWithProviders(children: ReactNode, role: string) {
  return render(
    <I18nProvider initialLocale="en">
      <AuthContext.Provider value={authContext(role)}>
        <QueryClientProvider client={createAppQueryClient()}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
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

function emptyDocumentPage() {
  return { count: 0, next: null, previous: null, results: [] };
}
