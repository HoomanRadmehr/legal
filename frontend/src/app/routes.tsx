import type { RouteObject } from "react-router-dom";

import { NotFoundState } from "../components/standardStates";
import { ProtectedAppShellPage, PublicLoginPage } from "./pages";
import { RouteErrorState } from "./routeError";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <ProtectedAppShellPage />,
    errorElement: <RouteErrorState />,
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
