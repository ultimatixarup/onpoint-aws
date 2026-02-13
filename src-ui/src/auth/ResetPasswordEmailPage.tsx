import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

export function ResetPasswordEmailPage() {
  const [email, setEmail] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="auth-shell auth-shell--single">
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Reset your password</h2>
            <p className="text-muted">
              Enter the email linked to your account. We will send a reset link.
            </p>
          </div>
          <form onSubmit={onSubmit} className="auth-form">
            <label className="form__field">
              <span className="text-muted">Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button className="btn auth-form__submit" type="submit">
              Send reset link
            </button>
          </form>
          <div className="auth-card__footer">
            <Link className="auth-link" to="/auth/login">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
