import type { ReactNode } from "react";

export function TechnicalValue({ children }: { children: ReactNode }) {
  return (
    <bdi className="technical-value" dir="ltr">
      {children}
    </bdi>
  );
}
