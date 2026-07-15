import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { isApiError } from "../../api/errors";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import "./login.css";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ password, username });
      navigate(redirectPath(location.state), { replace: true });
    } catch (error) {
      setErrorMessage(formatLoginError(error, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell app-shell--public">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="app-kicker">{t("auth.login.eyebrow")}</p>
        <h1 id="login-title">{t("auth.login.title")}</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>{t("auth.login.username")}</span>
            <input
              autoComplete="username"
              name="username"
              onChange={(event) => setUsername(event.currentTarget.value)}
              required
              type="text"
              value={username}
            />
          </label>
          <label className="login-field">
            <span>{t("auth.login.password")}</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {errorMessage ? (
            <p className="login-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button
            className="login-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}

function redirectPath(state: unknown): string {
  const from = (state as LocationState | null)?.from?.pathname;

  if (!from || from === "/login") {
    return "/";
  }

  return from;
}

function formatLoginError(
  error: unknown,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (!isApiError(error)) {
    return t("auth.login.errors.network");
  }
  if (error.status === 429) {
    return buildRateLimitMessage(error.retryAfterSeconds, t);
  }
  if (error.status === 0) {
    return t("auth.login.errors.network");
  }

  return t("auth.login.errors.invalidCredentials");
}

function buildRateLimitMessage(
  retryAfterSeconds: number | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (retryAfterSeconds === undefined) {
    return t("auth.login.errors.rateLimited");
  }

  return t("auth.login.errors.rateLimitedWithSeconds", {
    seconds: retryAfterSeconds,
  });
}
