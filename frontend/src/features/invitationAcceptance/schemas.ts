import { z } from "zod";

import type { InvitationAcceptInput } from "./types";

export const invitationAcceptanceSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirm: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: "Password confirmation does not match.",
    path: ["password_confirm"],
  });

export type InvitationAcceptanceFormValues = z.input<
  typeof invitationAcceptanceSchema
>;

export function defaultInvitationAcceptanceValues(): InvitationAcceptanceFormValues {
  return {
    password: "",
    password_confirm: "",
  };
}

export function buildInvitationAcceptInput({
  token,
  values,
}: {
  token: string;
  values: InvitationAcceptanceFormValues;
}): InvitationAcceptInput {
  const parsed = invitationAcceptanceSchema.parse(values);
  return {
    password: parsed.password,
    password_confirm: parsed.password_confirm,
    token,
  };
}
