import {
  confirmSignIn,
  fetchAuthSession,
  fetchUserAttributes,
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

export type AuthRole =
  | "platform_admin"
  | "tenant_admin"
  | "tenant_user"
  | "fleet_manager"
  | "dispatcher"
  | "read_only";

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  username?: string;
  displayName?: string;
  email?: string;
  tenantId?: string;
  roles: AuthRole[];
  challenge?: "new-password";
  challengeUsername?: string;
};

type AuthContextValue = AuthState & {
  login: (
    username: string,
    password: string,
  ) => Promise<{ requiresNewPassword: boolean }>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapGroupsToRoles(groups: string[] | undefined): AuthRole[] {
  if (!groups) return [];
  const roleMap: Record<string, AuthRole | undefined> = {
    platformadmin: "platform_admin",
    tenantadmin: "tenant_admin",
    tenantuser: "tenant_user",
    fleetmanager: "fleet_manager",
    dispatcher: "dispatcher",
    readonly: "read_only",
    platform_admin: "platform_admin",
    tenant_admin: "tenant_admin",
    tenant_user: "tenant_user",
    fleet_manager: "fleet_manager",
    read_only: "read_only",
  };

  return groups
    .map((group) => group.toLowerCase().replace(/[^a-z0-9_]/g, ""))
    .map((group) => roleMap[group])
    .filter((role): role is AuthRole => Boolean(role));
}

function getGroupsFromSession(
  session: Awaited<ReturnType<typeof fetchAuthSession>>,
): string[] {
  const accessPayload = session.tokens?.accessToken?.payload ?? {};
  const idPayload = session.tokens?.idToken?.payload ?? {};
  const groups =
    (accessPayload["cognito:groups"] as string[] | string | undefined) ??
    (accessPayload.groups as string[] | string | undefined) ??
    (idPayload["cognito:groups"] as string[] | string | undefined) ??
    (idPayload.groups as string[] | string | undefined);
  if (!groups) return [];
  if (Array.isArray(groups)) return groups;
  if (typeof groups === "string") {
    return groups
      .split(",")
      .map((group) => group.trim())
      .filter(Boolean);
  }
  return [];
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

function getTenantIdFromAttributes(
  attributes?: Record<string, string>,
): string | undefined {
  if (!attributes) return undefined;
  return attributes["custom:tenantId"] ?? attributes.tenantId;
}

function getUserProfileFromSession(
  session: Awaited<ReturnType<typeof fetchAuthSession>>,
  fallbackUsername?: string,
): { displayName?: string; email?: string } {
  const idPayload = session.tokens?.idToken?.payload ?? {};
  const accessPayload = session.tokens?.accessToken?.payload ?? {};
  const email =
    (idPayload.email as string | undefined) ??
    (accessPayload.email as string | undefined);
  const name =
    (idPayload.name as string | undefined) ??
    (accessPayload.name as string | undefined) ??
    (idPayload.given_name as string | undefined) ??
    (accessPayload.given_name as string | undefined) ??
    (idPayload.preferred_username as string | undefined) ??
    (accessPayload.preferred_username as string | undefined);
  if (name && name.trim()) {
    return { displayName: name, email };
  }
  const labelSource = email ?? fallbackUsername;
  if (labelSource && labelSource.includes("@")) {
    const derived = labelSource
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return { displayName: derived || labelSource, email };
  }
  return { displayName: labelSource, email };
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
        const attributes = await fetchUserAttributes();
        const groups = getGroupsFromSession(session);
        const profile = getUserProfileFromSession(session, user.username);
        const tenantId =
          getTenantIdFromSession(session) ??
          getTenantIdFromAttributes(attributes);
        setState({
          status: "authenticated",
          username: user.username,
          displayName: profile.displayName,
          email: profile.email,
          tenantId,
          roles: mapGroupsToRoles(groups),
          challenge: undefined,
          challengeUsername: undefined,
        });
      } catch {
        setState({
          status: "unauthenticated",
          roles: [],
          challenge: undefined,
          challengeUsername: undefined,
        });
      }
    };
    load();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: async (username, password) => {
        try {
          const signInResult = await signIn({ username, password });
          if (signInResult && !signInResult.isSignedIn) {
            const step = signInResult.nextStep?.signInStep;
            if (step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
              setState((prev) => ({
                ...prev,
                status: "unauthenticated",
                roles: [],
                challenge: "new-password",
                challengeUsername: username,
              }));
              return { requiresNewPassword: true };
            }
            throw new Error("Additional authentication is required.");
          }
          const session = await fetchAuthSession();
          const attributes = await fetchUserAttributes();
          const groups = getGroupsFromSession(session);
          const profile = getUserProfileFromSession(session, username);
          const tenantId =
            getTenantIdFromSession(session) ??
            getTenantIdFromAttributes(attributes);
          setState({
            status: "authenticated",
            username,
            displayName: profile.displayName,
            email: profile.email,
            tenantId,
            roles: mapGroupsToRoles(groups),
            challenge: undefined,
            challengeUsername: undefined,
          });
          return { requiresNewPassword: false };
        } catch (error) {
          console.error("Cognito sign-in failed", error);
          throw error;
        }
      },
      completeNewPassword: async (newPassword) => {
        await confirmSignIn({ challengeResponse: newPassword });
        const user = await getCurrentUser();
        const session = await fetchAuthSession();
        const attributes = await fetchUserAttributes();
        const groups = getGroupsFromSession(session);
        const profile = getUserProfileFromSession(session, user.username);
        const tenantId =
          getTenantIdFromSession(session) ??
          getTenantIdFromAttributes(attributes);
        setState({
          status: "authenticated",
          username: user.username,
          displayName: profile.displayName,
          email: profile.email,
          tenantId,
          roles: mapGroupsToRoles(groups),
          challenge: undefined,
          challengeUsername: undefined,
        });
      },
      logout: async () => {
        await signOut();
        setState({
          status: "unauthenticated",
          roles: [],
          challenge: undefined,
          challengeUsername: undefined,
        });
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
