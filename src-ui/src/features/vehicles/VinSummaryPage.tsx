import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchVehicles } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

const STATUS_FILTERS = [
  "all",
  "active",
  "inactive",
  "suspended",
  "deleted",
  "unknown",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function normalizeStatus(value?: string) {
  return (value ?? "unknown").toLowerCase();
}

function toBadgeClass(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "active") return "badge badge--active";
  if (normalized === "inactive") return "badge badge--inactive";
  if (normalized === "suspended") return "badge badge--suspended";
  if (normalized === "deleted") return "badge badge--deleted";
  return "badge";
}

export function VinSummaryPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    data: vehicles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId && fleetId),
  });

  const stats = useMemo(() => {
    const counts = {
      total: vehicles.length,
      active: 0,
      inactive: 0,
      attention: 0,
    };

    vehicles.forEach((vehicle) => {
      const status = normalizeStatus(vehicle.status);
      if (status === "active") counts.active += 1;
      else if (status === "inactive") counts.inactive += 1;
      else counts.attention += 1;
    });

    return counts;
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const status = normalizeStatus(vehicle.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;
      return [
        vehicle.vin,
        vehicle.fleetId,
        vehicle.make,
        vehicle.model,
        vehicle.year ? String(vehicle.year) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [search, statusFilter, vehicles]);

  return (
    <div className="page vehicles-page">
      <section className="vehicles-hero">
        <div className="vehicles-hero__glow" />
        <div className="vehicles-hero__content">
          <div>
            <p className="vehicles-hero__eyebrow">Fleet inventory</p>
            <h1>VIN Summary</h1>
            <p className="vehicles-hero__subtitle">
              Monitor vehicle coverage, status, and identity in one glance.
            </p>
          </div>
          <div className="vehicles-hero__actions">
            <button className="btn" type="button" onClick={() => refetch()}>
              Refresh
            </button>
          </div>
        </div>
        <div className="vehicles-stats">
          <div className="vehicle-stat">
            <span>Total VINs</span>
            <strong>{stats.total}</strong>
            <span className="text-muted">Across current fleet</span>
          </div>
          <div className="vehicle-stat">
            <span>Active</span>
            <strong>{stats.active}</strong>
            <span className="text-muted">Healthy assets</span>
          </div>
          <div className="vehicle-stat">
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
            <span className="text-muted">Not reporting</span>
          </div>
          <div className="vehicle-stat">
            <span>Needs attention</span>
            <strong>{stats.attention}</strong>
            <span className="text-muted">Suspended or unknown</span>
          </div>
        </div>
      </section>

      <Card title="Filters">
        <div className="vehicles-filters">
          <label className="form__field">
            <span className="text-muted">Search VIN, fleet, make, model</span>
            <input
              className="input"
              placeholder="Start typing a VIN or model"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="vehicles-filters__chips">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                className={`filter-chip${
                  statusFilter === status ? " filter-chip--active" : ""
                }`}
                type="button"
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title={`Vehicles (${filteredVehicles.length})`}>
        {!tenantId ? (
          <div className="empty-state">
            <div className="empty-state__icon">Fleet</div>
            <h3>Select a tenant</h3>
            <p className="text-muted">Choose a tenant to view vehicles.</p>
          </div>
        ) : !fleetId ? (
          <div className="empty-state">
            <div className="empty-state__icon">Fleet</div>
            <h3>Select a fleet</h3>
            <p className="text-muted">Pick a fleet to see VINs.</p>
          </div>
        ) : isLoading ? (
          <div className="empty-state">
            <div className="empty-state__icon">Signal</div>
            <h3>Loading vehicles</h3>
            <p className="text-muted">Fetching fleet inventory.</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon">Alert</div>
            <h3>Unable to load vehicles</h3>
            <p className="text-muted">Try refreshing the page.</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">Search</div>
            <h3>No matches</h3>
            <p className="text-muted">
              Adjust filters or search to find vehicles.
            </p>
          </div>
        ) : (
          <div className="vehicles-grid">
            {filteredVehicles.map((vehicle) => (
              <article key={vehicle.vin} className="vehicle-card">
                <div className="vehicle-card__header">
                  <div>
                    <div className="vehicle-card__vin mono">{vehicle.vin}</div>
                    <div className="vehicle-card__subtitle">
                      {vehicle.year ? `${vehicle.year} ` : ""}
                      {[vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ") || "Unknown model"}
                    </div>
                  </div>
                  <span className={toBadgeClass(vehicle.status)}>
                    {vehicle.status ?? "Unknown"}
                  </span>
                </div>
                <div className="vehicle-card__meta">
                  <div>
                    <span className="text-muted">Fleet</span>
                    <strong>{vehicle.fleetId ?? "--"}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Status</span>
                    <strong>{vehicle.status ?? "Unknown"}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
