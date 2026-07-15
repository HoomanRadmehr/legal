import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { ErrorState } from "../components/standardStates";
import { useI18n } from "../i18n";

export function RouteErrorState() {
  const routeError = useRouteError();
  const { t } = useI18n();

  if (isRouteErrorResponse(routeError) && routeError.status === 404) {
    return (
      <ErrorState
        title={t("components.standardStates.pageNotFound")}
        message={t("components.standardStates.notFoundMessage")}
      />
    );
  }

  return (
    <ErrorState
      title={t("routes.error.title")}
      message={t("routes.error.message")}
    />
  );
}
