import { useQuery } from "@tanstack/react-query";
import { fetchVehicles } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function VinSummaryPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;

  const {
    data: vehicles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId && fleetId),
  });

  return (
    <div className="page">
      <PageHeader title="VIN Summary" />
      <Card title="VIN Overview">
        {!tenantId ? (
          <p>Select a tenant to view vehicles.</p>
        ) : !fleetId ? (
          <p>Select a fleet to view vehicles.</p>
        ) : isLoading ? (
          <p>Loading vehicles...</p>
        ) : error ? (
          <p>Unable to load vehicles.</p>
        ) : vehicles.length === 0 ? (
          <p>No vehicles found for the selected tenant/fleet.</p>
        ) : (
          <div className="stack">
            {vehicles.map((vehicle) => (
              <div key={vehicle.vin} className="card">
                <div className="card__title">{vehicle.vin}</div>
                <div className="card__body">
                  <div>Status: {vehicle.status ?? "Unknown"}</div>
                  {vehicle.fleetId ? <div>Fleet: {vehicle.fleetId}</div> : null}
                  {vehicle.make || vehicle.model ? (
                    <div>
                      {vehicle.year ? `${vehicle.year} ` : ""}
                      {[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
