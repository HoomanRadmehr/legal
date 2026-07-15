import { useMutation } from "@tanstack/react-query";

import { acceptInvitation } from "./api";
import type { InvitationAcceptInput } from "./types";

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (input: InvitationAcceptInput) => acceptInvitation(input),
  });
}
