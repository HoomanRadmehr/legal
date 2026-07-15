import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { I18nProvider } from "../../../i18n";
import { DocumentList } from "../components/DocumentList";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("lists documents and asks backend for a fresh download URL per click", async () => {
  const user = userEvent.setup();
  const assign = vi.fn();
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/download-url/")) {
      return Response.json({
        expires_in_seconds: 120,
        url: "https://minio.example.test/download",
      });
    }
    return Response.json(documentPage());
  });
  vi.stubGlobal("fetch", fetchImpl);
  stubLocationAssign(assign);

  renderDocumentList();
  await screen.findByText("notice.pdf");
  await user.click(screen.getByRole("button", { name: "Download" }));

  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/documents/document-1/download-url/"),
    expect.objectContaining({ method: "POST" }),
  );
  expect(assign).toHaveBeenCalledWith("https://minio.example.test/download");
});

test("viewer can download but cannot revoke documents", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(documentPage())),
  );

  renderDocumentList({ role: "viewer" });

  expect(await screen.findByRole("button", { name: "Download" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Revoke" }),
  ).not.toBeInTheDocument();
});

function renderDocumentList({ role = "legal_admin" }: { role?: string } = {}) {
  return renderWithProviders(
    <DocumentList matterId="11111111-1111-1111-1111-111111111111" />,
    role,
  );
}

function renderWithProviders(children: ReactNode, role: string) {
  return render(
    <I18nProvider initialLocale="en">
      <AuthContext.Provider value={authContext(role)}>
        <QueryClientProvider client={createAppQueryClient()}>
          {children}
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

function documentPage() {
  return {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        actual_checksum: "abc",
        content_type: "application/pdf",
        created_at: "2027-07-14T10:00:00Z",
        description: "",
        etag: "etag",
        expected_checksum: "",
        expected_size: 2048,
        failure_code: "",
        id: "document-1",
        matter_id: "matter-1",
        original_filename: "notice.pdf",
        size: 2048,
        status: "available",
        updated_at: "2027-07-14T10:05:00Z",
        upload_expires_at: null,
        uploaded_at: "2027-07-14T10:05:00Z",
        uploaded_by_id: "membership-1",
      },
    ],
  };
}

function stubLocationAssign(assign: (url: string) => void): void {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, assign },
  });
}
