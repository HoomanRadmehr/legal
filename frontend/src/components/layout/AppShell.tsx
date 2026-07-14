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
  const { changeLocale, locale } = useI18n();
  const role = session.membership.role;
  const organizationName =
    session.membership.organization_name ?? session.membership.organization_id;

  return (
    <div className="layout-shell">
      <aside className="layout-sidebar" aria-label="Workspace">
        <div>
          <p className="layout-kicker">Organization</p>
          <p className="layout-organization">{organizationName}</p>
        </div>
        <WorkspaceNavigation role={role} />
      </aside>
      <div className="layout-main">
        <header className="layout-header">
          <div>
            <p className="layout-kicker">Signed in as</p>
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
              Sign out
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

  return (
    <section className="layout-actions" aria-label="Available actions">
      {canCreateMatter(role) ? (
        <button type="button">Create matter</button>
      ) : null}
      {canEditMatter(role) ? <button type="button">Edit matter</button> : null}
      {canUploadDocument(role) ? (
        <button type="button">Upload document</button>
      ) : null}
      {canChangeMatterOwner(role) ? (
        <button type="button">Transfer owner</button>
      ) : null}
      {canRunOffboarding(role) ? (
        <NavLink className="layout-action-link" to="/admin/offboarding">
          Run offboarding
        </NavLink>
      ) : null}
      {reason ? <p className="layout-readonly">{reason}</p> : null}
    </section>
  );
}

function WorkspaceNavigation({ role }: { role: string }) {
  return (
    <nav className="layout-nav" aria-label="Main navigation">
      <NavItem to="/" label="Dashboard" />
      <NavItem to="/cases" label="Cases" />
      <NavItem to="/contracts" label="Contracts" />
      <NavItem to="/notices" label="Notices" />
      <NavItem to="/deadlines" label="Deadlines" />
      <NavItem to="/tasks" label="Tasks" />
      <NavItem to="/documents" label="Documents" />
      {canViewActivityLog(role) ? (
        <NavItem to="/activity" label="Activity" />
      ) : null}
      <NavItem to="/notifications" label="Notifications" />
      {canManageOrganization(role) ? (
        <NavItem to="/admin" label="Admin" />
      ) : null}
      {canRunOffboarding(role) ? (
        <NavItem to="/admin/offboarding" label="Offboarding" />
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
  return (
    <span className="layout-notification" aria-label="Notifications">
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
  return (
    <div className="layout-locale" aria-label="Locale switcher">
      <button
        aria-pressed={locale === "en"}
        className="layout-button"
        onClick={onEnglish}
        type="button"
      >
        English
      </button>
      <button
        aria-pressed={locale === "fa"}
        className="layout-button"
        onClick={onPersian}
        type="button"
      >
        Persian
      </button>
    </div>
  );
}
