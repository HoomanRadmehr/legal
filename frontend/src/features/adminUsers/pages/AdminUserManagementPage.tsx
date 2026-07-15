import { Link } from "react-router-dom";
import { useState } from "react";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import {
  canManageOrganization,
  isMembershipRole,
} from "../../../auth/permissions";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import {
  ForbiddenState,
  LoadingState,
} from "../../../components/standardStates";
import { StatusBadge } from "../../../components/statusBadge";
import { useI18n } from "../../../i18n";
import { useChangeMembershipRole, useMembershipList } from "../hooks";
import type { MembershipListItem } from "../types";
import "../adminUsers.css";

const LIST_PARAMS = { page: 1, pageSize: 100 };

export function AdminUserManagementPage() {
  const { logout, session } = useAuth();
  const { t } = useI18n();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {canManageOrganization(session.membership.role) ? (
        <AdminUserManagementContent currentUserId={session.user.id} />
      ) : (
        <ForbiddenState
          title={t("components.standardStates.accessDenied")}
          message={t("features.adminUsers.errors.permission")}
        />
      )}
    </AppShell>
  );
}

function AdminUserManagementContent({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const { t } = useI18n();
  const memberships = useMembershipList(LIST_PARAMS);
  const [filters, setFilters] = useState({ role: "", search: "" });
  const rows = filteredMemberships(memberships.data?.results ?? [], filters);

  return (
    <section className="admin-user-page" aria-labelledby="admin-users-title">
      <PageHeader
        eyebrow={t("features.adminUsers.management.eyebrow")}
        title={t("features.adminUsers.management.title")}
        description={t("features.adminUsers.management.description")}
        actions={
          <Link to="/admin/users/new">
            {t("features.adminUsers.management.invite")}
          </Link>
        }
      />
      <MembershipFilters filters={filters} onChange={setFilters} />
      {memberships.isLoading ? (
        <LoadingState label={t("features.adminUsers.management.loading")} />
      ) : null}
      {memberships.error ? (
        <p className="admin-user-alert admin-user-alert--error" role="alert">
          {listErrorMessage(memberships.error, t)}
        </p>
      ) : null}
      {memberships.data ? (
        <MembershipTable currentUserId={currentUserId} rows={rows} />
      ) : null}
    </section>
  );
}

function MembershipFilters({
  filters,
  onChange,
}: {
  filters: { role: string; search: string };
  onChange: (filters: { role: string; search: string }) => void;
}) {
  const { t } = useI18n();

  return (
    <form className="admin-user-filters" role="search">
      <label>
        {t("features.adminUsers.management.search")}
        <input
          onChange={(event) =>
            onChange({ ...filters, search: event.currentTarget.value })
          }
          type="search"
          value={filters.search}
        />
      </label>
      <label>
        {t("features.adminUsers.management.roleFilter")}
        <select
          onChange={(event) =>
            onChange({ ...filters, role: event.currentTarget.value })
          }
          value={filters.role}
        >
          <option value="">
            {t("features.adminUsers.management.allRoles")}
          </option>
          {roleOptions(t).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}

function MembershipTable({
  currentUserId,
  rows,
}: {
  currentUserId: string;
  rows: MembershipListItem[];
}) {
  const { t } = useI18n();

  return (
    <div className="admin-user-table">
      <table>
        <caption>{t("features.adminUsers.management.tableCaption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("features.adminUsers.management.user")}</th>
            <th scope="col">{t("features.adminUsers.management.email")}</th>
            <th scope="col">{t("features.adminUsers.management.status")}</th>
            <th scope="col">{t("features.adminUsers.management.role")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((membership) => (
              <MembershipRow
                currentUserId={currentUserId}
                key={membership.id}
                membership={membership}
              />
            ))
          ) : (
            <tr>
              <td colSpan={4}>{t("features.adminUsers.management.empty")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MembershipRow({
  currentUserId,
  membership,
}: {
  currentUserId: string;
  membership: MembershipListItem;
}) {
  const { refresh } = useAuth();
  const { t } = useI18n();
  const mutation = useChangeMembershipRole();
  const [message, setMessage] = useState<string | null>(null);

  async function changeRole(nextRole: string) {
    if (!isMembershipRole(nextRole) || nextRole === membership.role) {
      return;
    }
    setMessage(null);
    try {
      const updated = await mutation.mutateAsync({
        membershipId: membership.id,
        role: nextRole,
      });
      setMessage(t("features.adminUsers.management.saved"));
      if (updated.user_id === currentUserId) {
        await refresh?.();
      }
    } catch (error) {
      setMessage(roleErrorMessage(error, t));
    }
  }

  return (
    <tr>
      <td>{membership.display_name}</td>
      <td>{membership.email}</td>
      <td>
        <StatusBadge
          label={statusLabel(membership, t)}
          tone={membership.user_is_active ? "success" : "warning"}
        />
      </td>
      <td>
        <label className="admin-user-role-control">
          <span>{t("features.adminUsers.management.role")}</span>
          <select
            aria-label={`${membership.display_name} ${t(
              "features.adminUsers.management.role",
            )}`}
            disabled={mutation.isPending}
            onChange={(event) => void changeRole(event.currentTarget.value)}
            value={membership.role}
          >
            {roleOptions(t).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {message ? (
          <p
            className="admin-user-row-message"
            role={mutation.isError ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

function filteredMemberships(
  memberships: MembershipListItem[],
  filters: { role: string; search: string },
): MembershipListItem[] {
  const search = filters.search.trim().toLowerCase();
  return memberships.filter((membership) => {
    const matchesRole = !filters.role || membership.role === filters.role;
    const text = `${membership.display_name} ${membership.email}`.toLowerCase();
    return matchesRole && (!search || text.includes(search));
  });
}

function roleErrorMessage(
  error: unknown,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (isApiError(error) && error.code === "last_admin_required") {
    return t("features.adminUsers.management.errors.lastAdmin");
  }
  if (isApiError(error) && error.status === 409) {
    return t("features.adminUsers.management.errors.stale");
  }
  return listErrorMessage(error, t);
}

function listErrorMessage(
  error: unknown,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (isApiError(error) && error.status === 429) {
    return retryMessage(error, t);
  }
  if (isApiError(error) && (error.status === 403 || error.status === 404)) {
    return t("features.adminUsers.management.errors.permission");
  }
  if (isApiError(error) && error.status === 0) {
    return t("features.adminUsers.management.errors.network");
  }
  return t("features.adminUsers.management.errors.failed");
}

function retryMessage(
  error: { retryAfterSeconds?: number },
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (error.retryAfterSeconds !== undefined) {
    return t("features.adminUsers.management.errors.rateLimitedWithSeconds", {
      seconds: error.retryAfterSeconds,
    });
  }
  return t("features.adminUsers.management.errors.rateLimited");
}

function statusLabel(
  membership: MembershipListItem,
  t: (key: string) => string,
): string {
  if (!membership.user_is_active) {
    return t("features.adminUsers.management.inactive");
  }
  return t("features.adminUsers.management.active");
}

function roleOptions(t: (key: string) => string) {
  return [
    { label: t("features.adminUsers.roles.viewer"), value: "viewer" },
    {
      label: t("features.adminUsers.roles.legalCounsel"),
      value: "legal_counsel",
    },
    {
      label: t("features.adminUsers.roles.legalManager"),
      value: "legal_manager",
    },
    { label: t("features.adminUsers.roles.legalAdmin"), value: "legal_admin" },
  ] as const;
}
