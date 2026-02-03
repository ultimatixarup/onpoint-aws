import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setStatus("loading");
      setErrorMessage(null);
      await login(username, password);
      setStatus("idle");
      navigate("/adlp", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  return (
    <div className="page auth-page">
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} className="form">
        <label className="form__field">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="form__field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn" type="submit" disabled={status === "loading"}>
          Sign in
        </button>
        {status === "error" && (
          <p className="error">{errorMessage ?? "Sign in failed."}</p>
        )}
      </form>
    </div>
  );
}
