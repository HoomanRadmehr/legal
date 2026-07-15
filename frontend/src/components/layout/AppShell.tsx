import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import type { AuthSession } from "../../auth/api";
import {
  canChangeMatterOwner,
  canCreateMatter,
  canEditMatter,
  canManageOrganization,
  canRunOffboarding,
  canUploadDocument,
  canViewActivityLog,
  readonlyReason,
} from "../../auth/permissions";
import { useI18n } from "../../i18n";
import "./appShell.css";

type AppShellProps = {
  children: ReactNode;
  onLogout: () => void;
  session: AuthSession;
};

export function AppShell({ children, onLogout, session }: AppShellProps) {
  const { changeLocale, direction, locale, t } = useI18n();
  const role = session.membership.role;
  const organizationName =
    session.membership.organization_name ?? session.membership.organization_id;

  return (
    <div className={`layout-shell layout-shell--${direction}`}>
      <aside className="layout-sidebar" aria-label={t("layout.workspace")}>
        <div>
          <p className="layout-kicker">{t("layout.organization")}</p>
          <p className="layout-organization">{organizationName}</p>
        </div>
        <WorkspaceNavigation role={role} />
      </aside>
      <div className="layout-main">
        <header className="layout-header">
          <div>
            <span className="layout-sr-only">
              {t("layout.signedInAsName", {
                name: session.user.display_name,
              })}
            </span>
            <p className="layout-kicker">{t("layout.signedInAs")}</p>
            <p className="layout-user">{session.user.display_name}</p>
          </div>
          <div className="layout-header__actions">
            <NotificationIndicator />
            <LocaleSwitcher
              locale={locale}
              onEnglish={() => changeLocale("en")}
              onPersian={() => changeLocale("fa")}
            />
            <button className="layout-button" onClick={onLogout} type="button">
              {t("layout.signOut")}
            </button>
          </div>
        </header>
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}

export function RoleActionBar({ role }: { role: string }) {
  const reason = readonlyReason(role);
  const { t } = useI18n();

  return (
    <section
      className="layout-actions"
      aria-label={t("layout.availableActions")}
    >
      {canCreateMatter(role) ? (
        <button type="button">{t("layout.actions.createMatter")}</button>
      ) : null}
      {canEditMatter(role) ? (
        <button type="button">{t("layout.actions.editMatter")}</button>
      ) : null}
      {canUploadDocument(role) ? (
        <button type="button">{t("layout.actions.uploadDocument")}</button>
      ) : null}
      {canChangeMatterOwner(role) ? (
        <button type="button">{t("layout.actions.transferOwner")}</button>
      ) : null}
      {canRunOffboarding(role) ? (
        <NavLink className="layout-action-link" to="/admin/offboarding">
          {t("layout.actions.runOffboarding")}
        </NavLink>
      ) : null}
      {reason ? (
        <p className="layout-readonly">{t("layout.readonly.viewer")}</p>
      ) : null}
    </section>
  );
}

function WorkspaceNavigation({ role }: { role: string }) {
  const { t } = useI18n();

  return (
    <nav className="layout-nav" aria-label={t("layout.mainNavigation")}>
      <NavItem to="/" label={t("layout.navigation.dashboard")} />
      <NavItem to="/cases" label={t("layout.navigation.cases")} />
      <NavItem to="/contracts" label={t("layout.navigation.contracts")} />
      <NavItem to="/notices" label={t("layout.navigation.notices")} />
      <NavItem to="/deadlines" label={t("layout.navigation.deadlines")} />
      <NavItem to="/tasks" label={t("layout.navigation.tasks")} />
      <NavItem to="/documents" label={t("layout.navigation.documents")} />
      {canViewActivityLog(role) ? (
        <NavItem to="/activity" label={t("layout.navigation.activity")} />
      ) : null}
      <NavItem
        to="/notifications"
        label={t("layout.navigation.notifications")}
      />
      {canManageOrganization(role) ? (
        <NavItem to="/admin/users" label={t("layout.navigation.admin")} />
      ) : null}
      {canManageOrganization(role) ? (
        <NavItem
          to="/admin/users/new"
          label={t("layout.navigation.inviteUser")}
        />
      ) : null}
      {canRunOffboarding(role) ? (
        <NavItem
          to="/admin/offboarding"
          label={t("layout.navigation.offboarding")}
        />
      ) : null}
    </nav>
  );
}

function NavItem({ label, to }: { label: string; to: string }) {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? "layout-nav__link layout-nav__link--active"
          : "layout-nav__link"
      }
      to={to}
    >
      {label}
    </NavLink>
  );
}

function NotificationIndicator() {
  const { t } = useI18n();

  return (
    <span
      className="layout-notification"
      aria-label={t("layout.notifications")}
    >
      0
    </span>
  );
}

function LocaleSwitcher({
  locale,
  onEnglish,
  onPersian,
}: {
  locale: string;
  onEnglish: () => void;
  onPersian: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="layout-locale" aria-label={t("layout.localeSwitcher")}>
      <button
        aria-pressed={locale === "fa"}
        className="layout-button"
        onClick={onPersian}
        type="button"
      >
        {t("locale.fa")}
      </button>
      <button
        aria-pressed={locale === "en"}
        className="layout-button"
        onClick={onEnglish}
        type="button"
      >
        {t("locale.en")}
      </button>
    </div>
  );
}
