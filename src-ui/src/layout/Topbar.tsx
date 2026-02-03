import { useAuth } from "../context/AuthContext";
import { useFleet } from "../context/FleetContext";
import { useTenant } from "../context/TenantContext";

const tenantOptions = [
  { id: "tenant-001", name: "OnPoint Demo" },
  { id: "tenant-002", name: "Fleet Ops" }
];

const fleetOptions = [
  { id: "fleet-001", name: "North" },
  { id: "fleet-002", name: "South" }
];

export function Topbar() {
  const { username, logout } = useAuth();
  const { tenant, setTenant } = useTenant();
  const { fleet, setFleet } = useFleet();

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
              const selected = tenantOptions.find((item) => item.id === event.target.value);
              if (selected) {
                setTenant(selected);
                setFleet(undefined);
              }
            }}
          >
            <option value="" disabled>
              Choose tenant
            </option>
            {tenantOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fleet
          <select
            className="select"
            value={fleet?.id ?? ""}
            onChange={(event) => {
              const selected = fleetOptions.find((item) => item.id === event.target.value);
              setFleet(selected);
            }}
          >
            <option value="">All fleets</option>
            {fleetOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
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
