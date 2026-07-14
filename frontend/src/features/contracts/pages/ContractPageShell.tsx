import type { ReactNode } from "react";

import { useAuth } from "../../../auth";
import { AppShell } from "../../../components/layout/AppShell";
import "../contracts.css";

export function ContractPageShell({ children }: { children: ReactNode }) {
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
