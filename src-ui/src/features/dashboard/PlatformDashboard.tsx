import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchDrivers,
  fetchFleets,
  fetchTenants,
  fetchUsers,
  fetchVehicles,
} from "../../api/onpointApi";
import { Card } from "../../ui/Card";

type TenantRollup = {
  tenantId: string;
  name: string;
  fleets: number;
  vehicles: number;
  drivers: number;
  users: number;
  status?: string;
  error?: string;
};

async function buildTenantRollups() {
  const tenants = await fetchTenants({ isAdmin: true });
  const rollups = await Promise.all(
    tenants.map(async (tenant) => {
      try {
        const [fleets, vehicles, drivers, users] = await Promise.all([
          fetchFleets(tenant.id),
          fetchVehicles(tenant.id),
          fetchDrivers(tenant.id),
          fetchUsers(tenant.id),
        ]);
        return {
          tenantId: tenant.id,
          name: tenant.name,
          fleets: fleets.length,
          vehicles: vehicles.length,
          drivers: drivers.length,
          users: users.length,
          status: tenant.status,
        } satisfies TenantRollup;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Load failed";
        return {
          tenantId: tenant.id,
          name: tenant.name,
          fleets: 0,
          vehicles: 0,
          drivers: 0,
          users: 0,
          status: tenant.status,
          error: message,
        } satisfies TenantRollup;
      }
    }),
  );

  return rollups;
}

export function PlatformDashboard() {
  const {
    data: rollups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["platform", "rollups"],
    queryFn: buildTenantRollups,
  });

  const totals = useMemo(
    () =>
      rollups.reduce(
        (acc, item) => ({
          tenants: acc.tenants + 1,
          fleets: acc.fleets + item.fleets,
          vehicles: acc.vehicles + item.vehicles,
          drivers: acc.drivers + item.drivers,
          users: acc.users + item.users,
          errors: acc.errors + (item.error ? 1 : 0),
        }),
        {
          tenants: 0,
          fleets: 0,
          vehicles: 0,
          drivers: 0,
          users: 0,
          errors: 0,
        },
      ),
    [rollups],
  );

  return (
    <div className="page platform-page">
      <section className="platform-hero">
        <div className="platform-hero__glow" />
        <div>
          <p className="platform-hero__eyebrow">Platform intelligence</p>
          <h1>Platform Admin Dashboard</h1>
          <p className="platform-hero__subtitle">Global tenancy overview.</p>
        </div>
      </section>
      {isLoading ? <p>Loading platform metrics...</p> : null}
      {error ? <p>Unable to load platform metrics.</p> : null}
      <div className="grid">
        <Card title="Tenants">
          <p className="stat__value">{totals.tenants}</p>
          <p className="stat__label">total tenants</p>
        </Card>
        <Card title="Fleets">
          <p className="stat__value">{totals.fleets}</p>
          <p className="stat__label">total fleets</p>
        </Card>
        <Card title="Vehicles">
          <p className="stat__value">{totals.vehicles}</p>
          <p className="stat__label">total vehicles</p>
        </Card>
        <Card title="Drivers">
          <p className="stat__value">{totals.drivers}</p>
          <p className="stat__label">total drivers</p>
        </Card>
        <Card title="Users">
          <p className="stat__value">{totals.users}</p>
          <p className="stat__label">total users</p>
        </Card>
        <Card title="Data Health">
          <p className="stat__value">{totals.errors}</p>
          <p className="stat__label">tenants with errors</p>
        </Card>
      </div>
      <div className="section">
        <div className="section__title">Tenant Breakdown</div>
        {rollups.length === 0 ? (
          <p>No tenants available.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Fleets</th>
                  <th>Vehicles</th>
                  <th>Drivers</th>
                  <th>Users</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {rollups.map((tenant) => (
                  <tr key={tenant.tenantId}>
                    <td>
                      <div>{tenant.name}</div>
                      <div className="text-muted mono">{tenant.tenantId}</div>
                    </td>
                    <td>
                      <span
                        className={`badge badge--${
                          tenant.status?.toUpperCase() === "ACTIVE"
                            ? "active"
                            : tenant.status?.toUpperCase() === "SUSPENDED"
                              ? "suspended"
                              : "inactive"
                        }`}
                      >
                        {tenant.status ?? "UNKNOWN"}
                      </span>
                    </td>
                    <td>{tenant.fleets}</td>
                    <td>{tenant.vehicles}</td>
                    <td>{tenant.drivers}</td>
                    <td>{tenant.users}</td>
                    <td>
                      {tenant.error ? (
                        <span className="badge badge--inactive">Error</span>
                      ) : (
                        <span className="badge badge--active">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
