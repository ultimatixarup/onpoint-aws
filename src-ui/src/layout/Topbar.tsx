import { useAuth } from "../context/AuthContext";
import { useFleet } from "../context/FleetContext";
import { useTenant } from "../context/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { fetchFleets } from "../api/onpointApi";
import { queryKeys } from "../api/queryKeys";

export function Topbar() {
  const { username, logout } = useAuth();
  const { tenant, setTenant, tenants, isLoadingTenants, tenantsError } =
    useTenant();
  const { fleet, setFleet } = useFleet();
  const {
    data: fleetOptions = [],
    isLoading: isLoadingFleets,
    error: fleetsError,
  } = useQuery({
    queryKey: tenant ? queryKeys.fleets(tenant.id) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenant?.id ?? ""),
    enabled: Boolean(tenant?.id),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <header className="topbar">
      <div className="topbar__brand">OnPoint</div>
      <div className="topbar__context">
        <label>
          Tenant
          <select
            className="select"
            value={tenant?.id ?? ""}
            onChange={(event) => {
              const selected = tenants.find(
                (item) => item.id === event.target.value,
              );
              if (selected) {
                setTenant(selected);
                setFleet(undefined);
              }
            }}
            disabled={isLoadingTenants || Boolean(tenantsError)}
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
          {tenantsError ? (
            <span className="text-muted">Unable to load tenants</span>
          ) : null}
        </label>
        <label>
          Fleet
          <select
            className="select"
            value={fleet?.id ?? ""}
            onChange={(event) => {
              const selected = fleetOptions.find(
                (item) => item.fleetId === event.target.value,
              );
              setFleet(
                selected
                  ? { id: selected.fleetId, name: selected.name }
                  : undefined,
              );
            }}
            disabled={!tenant || isLoadingFleets || Boolean(fleetsError)}
          >
            <option value="">All fleets</option>
            {fleetOptions.map((item) => (
              <option key={item.fleetId} value={item.fleetId}>
                {item.name}
              </option>
            ))}
          </select>
          {fleetsError ? (
            <span className="text-muted">Unable to load fleets</span>
          ) : null}
        </label>
      </div>
      <div className="topbar__user">
        <span>{username ?? "User"}</span>
        <button className="btn" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </header>
  );
}
