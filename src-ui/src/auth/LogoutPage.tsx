import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return <div className="page">Signing out...</div>;
}
