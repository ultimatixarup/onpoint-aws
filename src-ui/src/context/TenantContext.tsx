import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { fetchTenants, TenantSummary } from "../api/onpointApi";
import { queryKeys } from "../api/queryKeys";

export type Tenant = TenantSummary;

type TenantContextValue = {
  tenant?: Tenant;
  setTenant: (tenant: Tenant) => void;
  tenants: Tenant[];
  isLoadingTenants: boolean;
  tenantsError?: Error;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: PropsWithChildren) {
  const { status, roles, tenantId } = useAuth();
  const [tenant, setTenant] = useState<Tenant | undefined>();
  const isAdmin = roles.includes("platform_admin");
  const {
    data: tenants = [],
    isLoading: isLoadingTenants,
    error: tenantsError,
  } = useQuery({
    queryKey: queryKeys.tenants(tenantId, isAdmin),
    queryFn: () => fetchTenants({ tenantId, isAdmin }),
    staleTime: 5 * 60 * 1000,
    enabled: status === "authenticated" && (isAdmin || Boolean(tenantId)),
  });

  useEffect(() => {
    if (!tenant && tenants.length === 1) {
      setTenant(tenants[0]);
    }
  }, [tenant, tenants]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      setTenant,
      tenants,
      isLoadingTenants,
      tenantsError: tenantsError instanceof Error ? tenantsError : undefined,
    }),
    [tenant, tenants, isLoadingTenants, tenantsError],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}

export function RequireTenant({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const { tenant, setTenant, tenants, isLoadingTenants, tenantsError } =
    useTenant();
  if (!tenant) {
    if (status !== "authenticated") {
      return <div className="page">Loading...</div>;
    }
    return (
      <div className="page">
        <h1>Select a tenant</h1>
        {isLoadingTenants ? (
          <p>Loading tenants...</p>
        ) : tenantsError ? (
          <p>Unable to load tenants. Please try again.</p>
        ) : tenants.length === 0 ? (
          <p>No tenants available for this user.</p>
        ) : (
          <>
            <p>Please choose a tenant to continue.</p>
            <select
              className="select"
              onChange={(event) => {
                const selected = tenants.find(
                  (item) => item.id === event.target.value,
                );
                if (selected) setTenant(selected);
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Choose tenant
              </option>
              {tenants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
