import type { RouteObject } from "react-router-dom";

import { ProtectedRoute } from "../auth";
import { NotFoundState } from "../components/standardStates";
import {
  AdminOffboardingPage,
  ConfidentialRecordNotFoundPage,
  ProtectedAppShellPage,
  PublicLoginPage,
} from "./pages";
import {
  CaseCreatePage,
  CaseDetailPage,
  CaseEditPage,
  CaseListPage,
} from "../features/cases/pages";
import {
  ContractCreatePage,
  ContractDetailPage,
  ContractEditPage,
  ContractListPage,
} from "../features/contracts/pages";
import {
  DeadlineCreatePage,
  DeadlineDetailPage,
  DeadlineEditPage,
  DeadlineListPage,
} from "../features/deadlines/pages";
import {
  NoticeCreatePage,
  NoticeDetailPage,
  NoticeEditPage,
  NoticeListPage,
} from "../features/notices/pages";
import {
  TaskCreatePage,
  TaskDetailPage,
  TaskEditPage,
  TaskListPage,
} from "../features/tasks/pages";
import { RouteErrorState } from "./routeError";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <RouteErrorState />,
    children: [
      { index: true, element: <ProtectedAppShellPage /> },
      { path: "admin/offboarding", element: <AdminOffboardingPage /> },
      { path: "cases", element: <CaseListPage /> },
      { path: "cases/new", element: <CaseCreatePage /> },
      { path: "cases/:caseId", element: <CaseDetailPage /> },
      { path: "cases/:caseId/edit", element: <CaseEditPage /> },
      { path: "contracts", element: <ContractListPage /> },
      { path: "contracts/new", element: <ContractCreatePage /> },
      { path: "contracts/:contractId", element: <ContractDetailPage /> },
      { path: "contracts/:contractId/edit", element: <ContractEditPage /> },
      { path: "deadlines", element: <DeadlineListPage /> },
      { path: "deadlines/new", element: <DeadlineCreatePage /> },
      { path: "deadlines/:deadlineId", element: <DeadlineDetailPage /> },
      { path: "deadlines/:deadlineId/edit", element: <DeadlineEditPage /> },
      { path: "notices", element: <NoticeListPage /> },
      { path: "notices/new", element: <NoticeCreatePage /> },
      { path: "notices/:noticeId", element: <NoticeDetailPage /> },
      { path: "notices/:noticeId/edit", element: <NoticeEditPage /> },
      { path: "tasks", element: <TaskListPage /> },
      { path: "tasks/new", element: <TaskCreatePage /> },
      { path: "tasks/:taskId", element: <TaskDetailPage /> },
      { path: "tasks/:taskId/edit", element: <TaskEditPage /> },
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
