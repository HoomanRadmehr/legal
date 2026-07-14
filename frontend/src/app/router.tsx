import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { appRoutes } from "./routes";

const appRouter = createBrowserRouter(appRoutes);

export function AppRouter() {
  return <RouterProvider router={appRouter} />;
}
