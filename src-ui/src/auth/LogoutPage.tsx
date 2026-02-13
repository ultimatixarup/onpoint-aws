import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="auth-shell auth-shell--single">
      <div className="auth-panel">
        <div className="auth-card auth-card--center">
          <div className="auth-card__header">
            <h2>Signing out</h2>
            <p className="text-muted">Closing your session safely.</p>
          </div>
          <div className="auth-spinner" />
        </div>
      </div>
    </div>
  );
}
