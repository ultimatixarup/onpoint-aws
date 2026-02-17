import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login, completeNewPassword, challenge, challengeUsername } =
    useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setStatus("loading");
      setErrorMessage(null);
      const result = await login(username, password);
      setStatus("idle");
      if (!result.requiresNewPassword) {
        navigate("/adlp", { replace: true });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign in failed.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  const onSubmitNewPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!newPassword.trim()) {
      setErrorMessage("New password is required.");
      setStatus("error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setStatus("error");
      return;
    }
    try {
      setStatus("loading");
      setErrorMessage(null);
      await completeNewPassword(newPassword);
      setStatus("idle");
      navigate("/adlp", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero__glow" />
        <div>
          <p className="auth-hero__eyebrow">OnPoint operations</p>
          <h1>Drive smarter fleet decisions.</h1>
          <p className="auth-hero__subtitle">
            Sign in to manage tenants, monitor trips, and keep drivers aligned.
          </p>
          <div className="auth-hero__bullets">
            <div>
              <strong>Live fleet health</strong>
              <span className="text-muted">
                Status, alerts, and safety metrics.
              </span>
            </div>
            <div>
              <strong>Unified telemetry</strong>
              <span className="text-muted">
                Raw + normalized signals in one view.
              </span>
            </div>
            <div>
              <strong>Actionable insights</strong>
              <span className="text-muted">
                Trip trends and driver performance.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>
              {challenge === "new-password" ? "Set a new password" : "Sign in"}
            </h2>
            <p className="text-muted">
              {challenge === "new-password"
                ? `Password change required for ${challengeUsername ?? "your account"}.`
                : "Use your fleet manager credentials."}
            </p>
          </div>
          {challenge === "new-password" ? (
            <form onSubmit={onSubmitNewPassword} className="auth-form">
              <label className="form__field">
                <span className="text-muted">New password</span>
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label className="form__field">
                <span className="text-muted">Confirm new password</span>
                <input
                  className="input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              <button
                className="btn auth-form__submit"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Updating..." : "Update password"}
              </button>
              {status === "error" && (
                <div className="auth-form__error">
                  {errorMessage ?? "Unable to update password."}
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={onSubmit} className="auth-form">
              <label className="form__field">
                <span className="text-muted">Email or username</span>
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label className="form__field">
                <span className="text-muted">Password</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button
                className="btn auth-form__submit"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Signing in..." : "Sign in"}
              </button>
              {status === "error" && (
                <div className="auth-form__error">
                  {errorMessage ?? "Sign in failed."}
                </div>
              )}
            </form>
          )}
          <div className="auth-card__footer">
            <Link className="auth-link" to="/auth/reset-password-email">
              Forgot password?
            </Link>
            <Link className="auth-link" to="/legal/privacy">
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
