import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDrivers } from "../../api/onpointApi";
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

export function DriverSummaryPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    data: drivers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId && fleetId),
  });

  const stats = useMemo(() => {
    const counts = {
      total: drivers.length,
      active: 0,
      inactive: 0,
      attention: 0,
    };
    drivers.forEach((driver) => {
      const status = normalizeStatus(driver.status);
      if (status === "active") counts.active += 1;
      else if (status === "inactive") counts.inactive += 1;
      else counts.attention += 1;
    });
    return counts;
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const status = normalizeStatus(driver.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;
      return [
        driver.name,
        driver.displayName,
        driver.driverId,
        driver.email,
        driver.phone,
        driver.fleetId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [drivers, search, statusFilter]);

  return (
    <div className="page drivers-page">
      <section className="drivers-hero">
        <div className="drivers-hero__glow" />
        <div className="drivers-hero__content">
          <div>
            <p className="drivers-hero__eyebrow">Driver directory</p>
            <h1>Drivers</h1>
            <p className="drivers-hero__subtitle">
              Track roster health, engagement, and assignments across the fleet.
            </p>
          </div>
          <div className="drivers-hero__actions">
            <Link className="btn btn--secondary" to="/adlp/drivers/add">
              Add driver
            </Link>
            <Link className="btn btn--secondary" to="/adlp/drivers/assign">
              Assign driver
            </Link>
            <button className="btn" type="button" onClick={() => refetch()}>
              Refresh
            </button>
          </div>
        </div>
        <div className="drivers-stats">
          <div className="driver-stat">
            <span>Total drivers</span>
            <strong>{stats.total}</strong>
            <span className="text-muted">Fleet roster</span>
          </div>
          <div className="driver-stat">
            <span>Active</span>
            <strong>{stats.active}</strong>
            <span className="text-muted">Currently enabled</span>
          </div>
          <div className="driver-stat">
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
            <span className="text-muted">Off duty</span>
          </div>
          <div className="driver-stat">
            <span>Needs attention</span>
            <strong>{stats.attention}</strong>
            <span className="text-muted">Suspended or unknown</span>
          </div>
        </div>
      </section>

      <Card title="Filters">
        <div className="drivers-filters">
          <label className="form__field">
            <span className="text-muted">Search name, email, ID</span>
            <input
              className="input"
              placeholder="Search drivers"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="drivers-filters__chips">
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

      <Card title={`Drivers (${filteredDrivers.length})`}>
        {!tenantId ? (
          <div className="empty-state">
            <div className="empty-state__icon">Fleet</div>
            <h3>Select a tenant</h3>
            <p className="text-muted">Choose a tenant to view drivers.</p>
          </div>
        ) : !fleetId ? (
          <div className="empty-state">
            <div className="empty-state__icon">Fleet</div>
            <h3>Select a fleet</h3>
            <p className="text-muted">Pick a fleet to see drivers.</p>
          </div>
        ) : isLoading ? (
          <div className="empty-state">
            <div className="empty-state__icon">Signal</div>
            <h3>Loading drivers</h3>
            <p className="text-muted">Fetching roster details.</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon">Alert</div>
            <h3>Unable to load drivers</h3>
            <p className="text-muted">Try refreshing the page.</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">Search</div>
            <h3>No matches</h3>
            <p className="text-muted">
              Adjust filters or search to find drivers.
            </p>
          </div>
        ) : (
          <div className="drivers-grid">
            {filteredDrivers.map((driver) => (
              <article key={driver.driverId} className="driver-card">
                <div className="driver-card__header">
                  <div>
                    <div className="driver-card__name">
                      {driver.name ?? driver.displayName ?? "Unnamed driver"}
                    </div>
                    <div className="driver-card__id mono">
                      {driver.driverId}
                    </div>
                  </div>
                  <span className={toBadgeClass(driver.status)}>
                    {driver.status ?? "Unknown"}
                  </span>
                </div>
                <div className="driver-card__meta">
                  <div>
                    <span className="text-muted">Email</span>
                    <strong>{driver.email ?? "--"}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Phone</span>
                    <strong>{driver.phone ?? "--"}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Fleet</span>
                    <strong>{driver.fleetId ?? "--"}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Customer ID</span>
                    <strong>{driver.customerId ?? "--"}</strong>
                  </div>
                </div>
                <div className="driver-card__actions">
                  <Link
                    className="btn btn--secondary"
                    to={`/adlp/drivers/${driver.driverId}`}
                  >
                    Profile
                  </Link>
                  <Link
                    className="btn"
                    to={`/adlp/drivers/${driver.driverId}/dashboard`}
                  >
                    Dashboard
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
