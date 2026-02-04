import { useQuery } from "@tanstack/react-query";
import { fetchDrivers } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function DriverDashboardPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;

  const {
    data: drivers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId && fleetId),
  });

  return (
    <div className="page">
      <PageHeader title="Driver Dashboard" />
      <Card title="Drivers">
        {!tenantId ? (
          <p>Select a tenant to view drivers.</p>
        ) : !fleetId ? (
          <p>Select a fleet to view drivers.</p>
        ) : isLoading ? (
          <p>Loading drivers...</p>
        ) : error ? (
          <p>Unable to load drivers.</p>
        ) : drivers.length === 0 ? (
          <p>No drivers found for the selected tenant/fleet.</p>
        ) : (
          <div className="stack">
            {drivers.map((driver) => (
              <div key={driver.driverId} className="card">
                <div className="card__title">
                  {driver.name ?? driver.driverId}
                </div>
                <div className="card__body">
                  <div>ID: {driver.driverId}</div>
                  {driver.status ? <div>Status: {driver.status}</div> : null}
                  {driver.fleetId ? <div>Fleet: {driver.fleetId}</div> : null}
                  {driver.email ? <div>Email: {driver.email}</div> : null}
                  {driver.phone ? <div>Phone: {driver.phone}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
