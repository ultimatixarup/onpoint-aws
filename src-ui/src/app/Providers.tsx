import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Amplify } from "aws-amplify";
import { PropsWithChildren } from "react";
import { AuthProvider } from "../context/AuthContext";
import { FleetProvider } from "../context/FleetContext";
import { TenantProvider } from "../context/TenantContext";
import { ToastProvider } from "../ui/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  signUpVerificationMethod: "code",
  loginWith: {
    email: true,
    username: true,
  },
} as Record<string, unknown>;

if (import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID) {
  cognitoConfig.identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
}

let amplifyConfigured = false;

function configureAmplify() {
  if (amplifyConfigured) {
    return;
  }
  Amplify.configure({
    Auth: {
      Cognito: cognitoConfig as any,
    },
  });
  amplifyConfigured = true;
}

export function Providers({ children }: PropsWithChildren) {
  const missingAuthConfig =
    !import.meta.env.VITE_COGNITO_USER_POOL_ID ||
    !import.meta.env.VITE_COGNITO_CLIENT_ID;

  if (missingAuthConfig) {
    return (
      <div className="page">
        <h1>Auth UserPool not configured</h1>
        <p>
          Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in
          src-ui/.env, then restart the dev server.
        </p>
      </div>
    );
  }

  configureAmplify();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <TenantProvider>
            <FleetProvider>{children}</FleetProvider>
          </TenantProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
