import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { ErrorState } from "../components/standardStates";

export function RouteErrorState() {
  const routeError = useRouteError();

  if (isRouteErrorResponse(routeError) && routeError.status === 404) {
    return (
      <ErrorState
        title="Page not found"
        message="The page could not be found."
      />
    );
  }

  return (
    <ErrorState
      title="Something went wrong"
      message="Refresh the page or try again shortly."
    />
  );
}
