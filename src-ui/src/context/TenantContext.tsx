import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

export type Tenant = {
  id: string;
  name: string;
};

type TenantContextValue = {
  tenant?: Tenant;
  setTenant: (tenant: Tenant) => void;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: PropsWithChildren) {
  const [tenant, setTenant] = useState<Tenant | undefined>();

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      setTenant
    }),
    [tenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}

export function RequireTenant({ children }: PropsWithChildren) {
  const { tenant, setTenant } = useTenant();
  if (!tenant) {
    const options: Tenant[] = [
      { id: "tenant-001", name: "OnPoint Demo" },
      { id: "tenant-002", name: "Fleet Ops" }
    ];
    return (
      <div className="page">
        <h1>Select a tenant</h1>
        <p>Please choose a tenant to continue.</p>
        <select
          className="select"
          onChange={(event) => {
            const selected = options.find((item) => item.id === event.target.value);
            if (selected) setTenant(selected);
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Choose tenant
          </option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return <>{children}</>;
}
