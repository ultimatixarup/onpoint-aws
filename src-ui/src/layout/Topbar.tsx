import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchFleets } from "../api/onpointApi";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/AuthContext";
import { useFleet } from "../context/FleetContext";
import { useTenant } from "../context/TenantContext";

export function Topbar() {
  const { pathname } = useLocation();
  const { displayName, username, logout } = useAuth();
  const { tenant, setTenant, tenants, isLoadingTenants, tenantsError } =
    useTenant();
  const { fleet, setFleet } = useFleet();
  const userLabel = displayName ?? username ?? "User";
  const initials = userLabel
    .split("@")[0]
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
  const hideContextSelectors = pathname.startsWith("/adlp/platform");
  const {
    data: fleetOptions = [],
    isLoading: isLoadingFleets,
    error: fleetsError,
  } = useQuery({
    queryKey: tenant ? queryKeys.fleets(tenant.id) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenant?.id ?? ""),
    enabled: Boolean(tenant?.id) && !hideContextSelectors,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo">OnPoint</span>
        <span className="topbar__tagline">Fleet Command</span>
      </div>
      {hideContextSelectors ? null : (
        <div className="topbar__context">
          <label className="topbar__context-item">
            <span className="topbar__context-label">Tenant</span>
            <select
              className="select topbar__select"
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
              <span className="topbar__context-hint">
                Unable to load tenants
              </span>
            ) : null}
          </label>
          <label className="topbar__context-item">
            <span className="topbar__context-label">Fleet</span>
            <select
              className="select topbar__select"
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
              <span className="topbar__context-hint">
                Unable to load fleets
              </span>
            ) : null}
          </label>
        </div>
      )}
      <div className="topbar__user">
        <div className="topbar__avatar" aria-hidden="true">
          {initials || "U"}
        </div>
        <div className="topbar__user-meta">
          <span className="topbar__user-name">{userLabel}</span>
          <button className="btn btn--ghost" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
