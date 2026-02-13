import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

export function ResetPasswordPage() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="auth-shell auth-shell--single">
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Set a new password</h2>
            <p className="text-muted">
              Use the code from your email to confirm the reset.
            </p>
          </div>
          <form onSubmit={onSubmit} className="auth-form">
            <label className="form__field">
              <span className="text-muted">Verification code</span>
              <input
                className="input"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span className="text-muted">New password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="btn auth-form__submit" type="submit">
              Update password
            </button>
          </form>
          <div className="auth-card__footer">
            <Link className="auth-link" to="/auth/login">
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
