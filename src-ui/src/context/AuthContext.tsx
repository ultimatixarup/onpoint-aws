import { fetchAuthSession, getCurrentUser, signIn, signOut } from "aws-amplify/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

export type AuthRole = "platform_admin" | "tenant_admin" | "tenant_user";

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  username?: string;
  roles: AuthRole[];
};

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapGroupsToRoles(groups: string[] | undefined): AuthRole[] {
  if (!groups) return [];
  return groups
    .map((group) => group.toLowerCase())
    .filter((group): group is AuthRole =>
      group === "platform_admin" || group === "tenant_admin" || group === "tenant_user"
    );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    roles: []
  });

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getCurrentUser();
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload["cognito:groups"] as
          | string[]
          | undefined;
        setState({
          status: "authenticated",
          username: user.username,
          roles: mapGroupsToRoles(groups)
        });
      } catch {
        setState({ status: "unauthenticated", roles: [] });
      }
    };
    load();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: async (username, password) => {
        try {
          await signIn({ username, password });
          const session = await fetchAuthSession();
          const groups = session.tokens?.accessToken?.payload["cognito:groups"] as
            | string[]
            | undefined;
          setState({ status: "authenticated", username, roles: mapGroupsToRoles(groups) });
        } catch (error) {
          console.error("Cognito sign-in failed", error);
          throw error;
        }
      },
      logout: async () => {
        await signOut();
        setState({ status: "unauthenticated", roles: [] });
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: PropsWithChildren) {
  const auth = useAuth();
  if (auth.status === "loading") return <div className="page">Loading...</div>;
  if (auth.status === "unauthenticated") return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}
