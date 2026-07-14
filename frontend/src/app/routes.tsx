import type { RouteObject } from "react-router-dom";

import { ProtectedRoute } from "../auth";
import { NotFoundState } from "../components/standardStates";
import {
  AdminOffboardingPage,
  ConfidentialRecordNotFoundPage,
  ProtectedAppShellPage,
  PublicLoginPage,
} from "./pages";
import { RouteErrorState } from "./routeError";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <RouteErrorState />,
    children: [
      { index: true, element: <ProtectedAppShellPage /> },
      { path: "admin/offboarding", element: <AdminOffboardingPage /> },
      {
        path: "matters/not-visible",
        element: <ConfidentialRecordNotFoundPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <PublicLoginPage />,
    errorElement: <RouteErrorState />,
  },
  {
    path: "*",
    element: (
      <main className="app-shell">
        <NotFoundState />
      </main>
    ),
    errorElement: <RouteErrorState />,
  },
];
