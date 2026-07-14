import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { isApiError } from "../../api/errors";
import { useAuth } from "../../auth";
import "./login.css";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { login } = useAuth();
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
      setErrorMessage(formatLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell app-shell--public">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="app-kicker">Legal workspace</p>
        <h1 id="login-title">Sign in</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Email or username</span>
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
            <span>Password</span>
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
            {isSubmitting ? "Signing in" : "Sign in"}
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

function formatLoginError(error: unknown): string {
  if (!isApiError(error)) {
    return "Unable to reach the server. Check your connection and try again.";
  }
  if (error.status === 429) {
    return buildRateLimitMessage(error.retryAfterSeconds);
  }
  if (error.status === 0) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return "The username or password is incorrect.";
}

function buildRateLimitMessage(retryAfterSeconds?: number): string {
  if (retryAfterSeconds === undefined) {
    return "Too many sign-in attempts. Try again later.";
  }

  return `Too many sign-in attempts. Try again in ${retryAfterSeconds} seconds.`;
}
