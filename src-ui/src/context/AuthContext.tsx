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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate } from "react-router-dom";

const SESSION_STARTED_AT_KEY = "onpoint.auth.sessionStartedAt";
const LAST_ACTIVITY_AT_KEY = "onpoint.auth.lastActivityAt";
const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
const DEFAULT_ABSOLUTE_TIMEOUT_HOURS = 8;

function parsePositiveNumber(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const IDLE_TIMEOUT_MINUTES = parsePositiveNumber(
  import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MINUTES,
  DEFAULT_IDLE_TIMEOUT_MINUTES,
);
const ABSOLUTE_TIMEOUT_HOURS = parsePositiveNumber(
  import.meta.env.VITE_SESSION_MAX_TIMEOUT_HOURS,
  DEFAULT_ABSOLUTE_TIMEOUT_HOURS,
);

const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000;

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
  const isLoggingOutRef = useRef(false);

  const writeSessionActivity = useCallback(() => {
    if (typeof window === "undefined") return;
    const now = Date.now().toString();
    if (!window.localStorage.getItem(SESSION_STARTED_AT_KEY)) {
      window.localStorage.setItem(SESSION_STARTED_AT_KEY, now);
    }
    window.localStorage.setItem(LAST_ACTIVITY_AT_KEY, now);
  }, []);

  const clearSessionActivity = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SESSION_STARTED_AT_KEY);
    window.localStorage.removeItem(LAST_ACTIVITY_AT_KEY);
  }, []);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      await signOut();
    } catch {
    } finally {
      clearSessionActivity();
      setState({
        status: "unauthenticated",
        roles: [],
        challenge: undefined,
        challengeUsername: undefined,
      });
      isLoggingOutRef.current = false;
    }
  }, [clearSessionActivity]);

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
        writeSessionActivity();
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
  }, [writeSessionActivity]);

  useEffect(() => {
    if (state.status !== "authenticated") return;

    writeSessionActivity();

    const markActivity = () => {
      if (document.visibilityState === "hidden") return;
      writeSessionActivity();
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, markActivity, { passive: true }),
    );

    const interval = window.setInterval(() => {
      const now = Date.now();
      const lastActivityRaw = window.localStorage.getItem(LAST_ACTIVITY_AT_KEY);
      const sessionStartedRaw = window.localStorage.getItem(
        SESSION_STARTED_AT_KEY,
      );
      const lastActivity = Number(lastActivityRaw ?? String(now));
      const sessionStarted = Number(sessionStartedRaw ?? String(now));

      if (
        Number.isFinite(lastActivity) &&
        now - lastActivity >= IDLE_TIMEOUT_MS
      ) {
        void performLogout();
        return;
      }

      if (
        Number.isFinite(sessionStarted) &&
        now - sessionStarted >= ABSOLUTE_TIMEOUT_MS
      ) {
        void performLogout();
      }
    }, 15000);

    return () => {
      window.clearInterval(interval);
      events.forEach((eventName) =>
        window.removeEventListener(eventName, markActivity),
      );
    };
  }, [performLogout, state.status, writeSessionActivity]);

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
          writeSessionActivity();
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
        writeSessionActivity();
      },
      logout: async () => {
        await performLogout();
      },
    }),
    [performLogout, state, writeSessionActivity],
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
