import type { ReactNode } from "react";

import { useAuth } from "../../../auth";
import { AppShell } from "../../../components/layout/AppShell";
import "../tasks.css";

export function TaskPageShell({ children }: { children: ReactNode }) {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {children}
    </AppShell>
  );
}
