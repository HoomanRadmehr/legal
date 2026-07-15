import { z } from "zod";

import type { AdminUserInviteInput } from "./types";

export const adminUserInviteFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  first_name: z.string().trim().max(150).optional().default(""),
  last_name: z.string().trim().max(150).optional().default(""),
  preferred_language: z.enum(["en", "fa"]).default("en"),
  role: z.enum(["legal_admin", "legal_manager", "legal_counsel", "viewer"]),
});

export type AdminUserInviteFormValues = z.input<
  typeof adminUserInviteFormSchema
>;

export function defaultAdminUserInviteFormValues(): AdminUserInviteFormValues {
  return {
    email: "",
    first_name: "",
    last_name: "",
    preferred_language: "en",
    role: "viewer",
  };
}

export function buildAdminUserInviteInput(
  values: AdminUserInviteFormValues,
): AdminUserInviteInput {
  const parsed = adminUserInviteFormSchema.parse(values);
  return {
    email: parsed.email,
    first_name: emptyToUndefined(parsed.first_name),
    last_name: emptyToUndefined(parsed.last_name),
    preferred_language: parsed.preferred_language,
    role: parsed.role,
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  return value?.trim() ? value : undefined;
}
