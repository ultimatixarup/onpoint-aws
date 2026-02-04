import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from "aws-amplify/auth";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate } from "react-router-dom";

export type AuthRole = "platform_admin" | "tenant_admin" | "tenant_user";

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  username?: string;
  tenantId?: string;
  roles: AuthRole[];
};

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapGroupsToRoles(groups: string[] | undefined): AuthRole[] {
  if (!groups) return [];
  const roleMap: Record<string, AuthRole | undefined> = {
    platformadmin: "platform_admin",
    tenantadmin: "tenant_admin",
    tenantuser: "tenant_user",
    platform_admin: "platform_admin",
    tenant_admin: "tenant_admin",
    tenant_user: "tenant_user",
  };

  return groups
    .map((group) => group.toLowerCase().replace(/[^a-z0-9_]/g, ""))
    .map((group) => roleMap[group])
    .filter((role): role is AuthRole => Boolean(role));
}

function getTenantIdFromSession(
  session: Awaited<ReturnType<typeof fetchAuthSession>>,
): string | undefined {
  const idPayload = session.tokens?.idToken?.payload ?? {};
  const accessPayload = session.tokens?.accessToken?.payload ?? {};
  const tenantId =
    (idPayload["custom:tenantId"] as string | undefined) ??
    (idPayload["tenantId"] as string | undefined) ??
    (accessPayload["custom:tenantId"] as string | undefined) ??
    (accessPayload["tenantId"] as string | undefined);
  return tenantId;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    roles: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getCurrentUser();
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload[
          "cognito:groups"
        ] as string[] | undefined;
        setState({
          status: "authenticated",
          username: user.username,
          tenantId: getTenantIdFromSession(session),
          roles: mapGroupsToRoles(groups),
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
          const groups = session.tokens?.accessToken?.payload[
            "cognito:groups"
          ] as string[] | undefined;
          setState({
            status: "authenticated",
            username,
            tenantId: getTenantIdFromSession(session),
            roles: mapGroupsToRoles(groups),
          });
        } catch (error) {
          console.error("Cognito sign-in failed", error);
          throw error;
        }
      },
      logout: async () => {
        await signOut();
        setState({ status: "unauthenticated", roles: [] });
      },
    }),
    [state],
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
  if (auth.status === "unauthenticated")
    return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

export function RequirePlatformAdmin({ children }: PropsWithChildren) {
  const auth = useAuth();
  if (auth.status === "loading") return <div className="page">Loading...</div>;
  if (!auth.roles.includes("platform_admin")) {
    return (
      <div className="page">
        <h1>Access denied</h1>
        <p>Platform admin role is required.</p>
      </div>
    );
  }
  return <>{children}</>;
}
