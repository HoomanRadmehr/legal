import type { RouteObject } from "react-router-dom";

import { ProtectedRoute } from "../auth";
import { NotFoundState } from "../components/standardStates";
import { ConfidentialRecordNotFoundPage, PublicLoginPage } from "./pages";
import {
  AdminUserCreatePage,
  AdminUserManagementPage,
} from "../features/adminUsers";
import { ActivityListPage } from "../features/activity";
import { AdminOffboardingPage } from "../features/offboarding";
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
import { DashboardPage } from "../features/dashboard";
import { DocumentsPage } from "../features/documents";
import {
  NoticeCreatePage,
  NoticeDetailPage,
  NoticeEditPage,
  NoticeListPage,
} from "../features/notices/pages";
import {
  NotificationCenterPage,
  NotificationPreferencesPage,
} from "../features/notifications";
import { InvitationAcceptancePage } from "../features/invitationAcceptance";
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
      { index: true, element: <DashboardPage /> },
      { path: "activity", element: <ActivityListPage /> },
      { path: "admin/offboarding", element: <AdminOffboardingPage /> },
      { path: "admin/users", element: <AdminUserManagementPage /> },
      { path: "admin/users/new", element: <AdminUserCreatePage /> },
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
      { path: "documents", element: <DocumentsPage /> },
      { path: "notices", element: <NoticeListPage /> },
      { path: "notices/new", element: <NoticeCreatePage /> },
      { path: "notices/:noticeId", element: <NoticeDetailPage /> },
      { path: "notices/:noticeId/edit", element: <NoticeEditPage /> },
      { path: "notifications", element: <NotificationCenterPage /> },
      {
        path: "settings/notifications",
        element: <NotificationPreferencesPage />,
      },
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
    path: "/accept-invitation",
    element: <InvitationAcceptancePage />,
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
