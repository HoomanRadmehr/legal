import { useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { Link } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canManageOrganization } from "../../../auth/permissions";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import { ForbiddenState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { useInviteOrganizationUser } from "../hooks";
import {
  buildAdminUserInviteInput,
  defaultAdminUserInviteFormValues,
  type AdminUserInviteFormValues,
} from "../schemas";
import "../adminUsers.css";

export function AdminUserCreatePage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      {canManageOrganization(session.membership.role) ? (
        <AdminUserCreateContent />
      ) : (
        <ForbiddenState
          title="Access denied"
          message="This administrative page is not available for your role."
        />
      )}
    </AppShell>
  );
}

function AdminUserCreateContent() {
  const { t } = useI18n();
  const mutation = useInviteOrganizationUser();
  const form = useForm<AdminUserInviteFormValues>({
    defaultValues: defaultAdminUserInviteFormValues(),
  });

  async function submit(values: AdminUserInviteFormValues) {
    form.clearErrors();
    try {
      const input = buildAdminUserInviteInput(values);
      await mutation.mutateAsync(input);
      form.reset(defaultAdminUserInviteFormValues());
      form.setError("root", {
        message: t("features.adminUsers.form.success", { email: input.email }),
        type: "success",
      });
    } catch (error) {
      applyInviteError(form.setError, error, t);
    }
  }

  return (
    <section className="admin-user-page" aria-labelledby="admin-user-title">
      <PageHeader
        eyebrow={t("features.adminUsers.page.eyebrow")}
        title={t("features.adminUsers.page.title")}
        description={t("features.adminUsers.page.description")}
        actions={<Link to="/">{t("features.adminUsers.page.back")}</Link>}
      />
      <form
        className="admin-user-form"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <InviteStatus errors={form.formState.errors} />
        <fieldset>
          <legend>{t("features.adminUsers.form.identity")}</legend>
          <label>
            {t("features.adminUsers.form.email")}
            <input {...form.register("email")} id="email" type="email" />
          </label>
          <label>
            {t("features.adminUsers.form.firstName")}
            <input {...form.register("first_name")} id="first_name" />
          </label>
          <label>
            {t("features.adminUsers.form.lastName")}
            <input {...form.register("last_name")} id="last_name" />
          </label>
        </fieldset>
        <fieldset>
          <legend>{t("features.adminUsers.form.access")}</legend>
          <label>
            {t("features.adminUsers.form.role")}
            <select {...form.register("role")} id="role">
              {roleOptions(t).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("features.adminUsers.form.language")}
            <select
              {...form.register("preferred_language")}
              id="preferred_language"
            >
              <option value="en">{t("common.locale.en")}</option>
              <option value="fa">{t("common.locale.fa")}</option>
            </select>
          </label>
        </fieldset>
        <p className="admin-user-alert">
          {t("features.adminUsers.form.noPassword")}
        </p>
        <div className="admin-user-actions">
          <button disabled={mutation.isPending} type="submit">
            {t("features.adminUsers.form.submit")}
          </button>
        </div>
      </form>
    </section>
  );
}

function InviteStatus({
  errors,
}: {
  errors: FieldErrors<AdminUserInviteFormValues>;
}) {
  const root = errors.root;
  if (root?.type === "success" && root.message) {
    return (
      <p className="admin-user-alert admin-user-alert--success" role="status">
        {root.message}
      </p>
    );
  }
  if (root?.message) {
    return (
      <p className="admin-user-alert admin-user-alert--error" role="alert">
        {root.message}
      </p>
    );
  }
  return <FormErrorSummary errors={formErrors(errors)} />;
}

function applyInviteError(
  setError: ReturnType<typeof useForm<AdminUserInviteFormValues>>["setError"],
  error: unknown,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(issue.path.join(".") as FieldPath<AdminUserInviteFormValues>, {
        message: issue.message,
      });
    }
    return;
  }
  if (isApiError(error) && error.code === "user_email_conflict") {
    setError("email", {
      message: t("features.adminUsers.errors.emailConflict"),
    });
    return;
  }
  if (isApiError(error) && error.status === 429) {
    setError("root", { message: retryMessage(error, t) });
    return;
  }
  setError("root", {
    message:
      error instanceof Error
        ? error.message
        : t("features.adminUsers.errors.failed"),
  });
}

function retryMessage(
  error: { retryAfterSeconds?: number },
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (error.retryAfterSeconds !== undefined) {
    return t("features.adminUsers.errors.rateLimitedWithSeconds", {
      seconds: error.retryAfterSeconds,
    });
  }
  return t("features.adminUsers.errors.rateLimited");
}

function formErrors(
  errors: FieldErrors<AdminUserInviteFormValues>,
): FormErrorItem[] {
  return Object.entries(errors).flatMap(([field, error]) => {
    if (!error || field === "root") {
      return [];
    }
    return [
      {
        fieldId: field,
        label: fieldLabel(field),
        message: String(error.message),
      },
    ];
  });
}

function fieldLabel(field: string): string {
  return field.replaceAll("_", " ");
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
