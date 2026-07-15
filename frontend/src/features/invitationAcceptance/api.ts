import { apiClient } from "../../api/client";
import type { InvitationAcceptInput, InvitationAcceptResponse } from "./types";

export async function acceptInvitation(
  input: InvitationAcceptInput,
): Promise<InvitationAcceptResponse> {
  return apiClient.request<InvitationAcceptResponse>(
    "/auth/invitations/accept/",
    {
      body: input,
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}
