import { useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { Link } from "react-router-dom";
import { ZodError } from "zod";

import { isApiError } from "../../../api/errors";
import {
  FormErrorSummary,
  type FormErrorItem,
} from "../../../components/formErrorSummary";
import { PageHeader } from "../../../components/pageHeader";
import { useI18n } from "../../../i18n";
import { useAcceptInvitation } from "../hooks";
import {
  buildInvitationAcceptInput,
  defaultInvitationAcceptanceValues,
  type InvitationAcceptanceFormValues,
} from "../schemas";
import { readInvitationToken } from "../token";
import "../invitationAcceptance.css";

export function InvitationAcceptancePage() {
  const { t } = useI18n();
  const token = readInvitationToken(window.location.hash);

  return (
    <main className="app-shell app-shell--public invitation-page">
      <section className="invitation-panel" aria-labelledby="invitation-title">
        <PageHeader
          eyebrow={t("features.invitationAcceptance.page.eyebrow")}
          title={t("features.invitationAcceptance.page.title")}
          description={t("features.invitationAcceptance.page.description")}
        />
        {token ? <InvitationAcceptanceForm token={token} /> : <MissingToken />}
      </section>
    </main>
  );
}

function InvitationAcceptanceForm({ token }: { token: string }) {
  const { t } = useI18n();
  const mutation = useAcceptInvitation();
  const form = useForm<InvitationAcceptanceFormValues>({
    defaultValues: defaultInvitationAcceptanceValues(),
  });

  async function submit(values: InvitationAcceptanceFormValues) {
    form.clearErrors();
    try {
      await mutation.mutateAsync(buildInvitationAcceptInput({ token, values }));
      form.reset(defaultInvitationAcceptanceValues());
      form.setError("root", {
        message: t("features.invitationAcceptance.form.success"),
        type: "success",
      });
    } catch (error) {
      applyInvitationError(form.setError, error, t);
    }
  }

  return (
    <form className="invitation-form" onSubmit={form.handleSubmit(submit)}>
      <InvitationStatus errors={form.formState.errors} />
      <label className="invitation-field">
        {t("features.invitationAcceptance.form.password")}
        <input
          {...form.register("password")}
          autoComplete="new-password"
          id="password"
          type="password"
        />
      </label>
      <label className="invitation-field">
        {t("features.invitationAcceptance.form.passwordConfirm")}
        <input
          {...form.register("password_confirm")}
          autoComplete="new-password"
          id="password_confirm"
          type="password"
        />
      </label>
      <button
        className="invitation-submit"
        disabled={mutation.isPending}
        type="submit"
      >
        {t("features.invitationAcceptance.form.submit")}
      </button>
      <Link to="/login">{t("features.invitationAcceptance.form.login")}</Link>
    </form>
  );
}

function MissingToken() {
  const { t } = useI18n();

  return (
    <p className="invitation-error" role="alert">
      {t("features.invitationAcceptance.errors.missingToken")}
    </p>
  );
}

function InvitationStatus({
  errors,
}: {
  errors: FieldErrors<InvitationAcceptanceFormValues>;
}) {
  const root = errors.root;
  if (root?.type === "success" && root.message) {
    return (
      <p className="invitation-success" role="status">
        {root.message}
      </p>
    );
  }
  if (root?.message) {
    return (
      <p className="invitation-error" role="alert">
        {root.message}
      </p>
    );
  }
  return <FormErrorSummary errors={formErrors(errors)} />;
}

function applyInvitationError(
  setError: ReturnType<
    typeof useForm<InvitationAcceptanceFormValues>
  >["setError"],
  error: unknown,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      setError(
        issue.path.join(".") as FieldPath<InvitationAcceptanceFormValues>,
        {
          message: issue.message,
        },
      );
    }
    return;
  }
  if (isApiError(error) && error.status === 429) {
    setError("root", { message: retryMessage(error, t) });
    return;
  }
  if (isApiError(error) && error.code === "validation_error") {
    if (applyFieldErrors(setError, error.details)) {
      return;
    }
    setError("root", {
      message: t("features.invitationAcceptance.errors.invalid"),
    });
    return;
  }
  setError("root", {
    message: t("features.invitationAcceptance.errors.invalid"),
  });
}

function applyFieldErrors(
  setError: ReturnType<
    typeof useForm<InvitationAcceptanceFormValues>
  >["setError"],
  details: Record<string, unknown>,
): boolean {
  let hasError = false;
  for (const field of ["password", "password_confirm"] as const) {
    const message = fieldErrorMessage(details[field]);
    if (message) {
      setError(field, { message });
      hasError = true;
    }
  }
  return hasError;
}

function fieldErrorMessage(value: unknown): string | null {
  if (Array.isArray(value) && value.length > 0) {
    return String(value[0]);
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

function retryMessage(
  error: { retryAfterSeconds?: number },
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (error.retryAfterSeconds !== undefined) {
    return t("features.invitationAcceptance.errors.rateLimitedWithSeconds", {
      seconds: error.retryAfterSeconds,
    });
  }
  return t("features.invitationAcceptance.errors.rateLimited");
}

function formErrors(
  errors: FieldErrors<InvitationAcceptanceFormValues>,
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
