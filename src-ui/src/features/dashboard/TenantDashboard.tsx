import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  fetchAssignedDriverIdsByAssignments,
  fetchDrivers,
  fetchFleets,
  fetchUsers,
  fetchVehicles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { fetchTripSummaryTrips } from "../../api/tripSummaryApi";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { formatDate } from "../../utils/date";

const TRIP_LOOKBACK_DAYS = 7;
const TRIP_PREVIEW_LIMIT = 10;

function formatTimestamp(value?: string | null) {
  return formatDate(value, "--");
}

function normalizeStatus(value?: string) {
  if (!value) return "UNKNOWN";
  return value.toUpperCase();
}

export function TenantDashboard() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id ?? "";

  const {
    data: fleets = [],
    isLoading: isLoadingFleets,
    error: fleetsError,
  } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const primaryFleetId = useMemo(
    () => (fleets.length === 1 ? fleets[0].fleetId : undefined),
    [fleets],
  );

  const fleetIds = useMemo(
    () => fleets.map((fleet) => fleet.fleetId).filter(Boolean),
    [fleets],
  );

  const {
    data: vehicles = [],
    isLoading: isLoadingVehicles,
    error: vehiclesError,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, primaryFleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, primaryFleetId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: drivers = [],
    isLoading: isLoadingDrivers,
    error: driversError,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, primaryFleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId, primaryFleetId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: assignedDriverIds = [] } = useQuery({
    queryKey: [
      "dashboard-assigned-driver-ids",
      tenantId,
      primaryFleetId ?? "all",
    ],
    queryFn: () =>
      fetchAssignedDriverIdsByAssignments(tenantId, primaryFleetId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.users(tenantId, primaryFleetId)
      : ["users", "none"],
    queryFn: () => fetchUsers(tenantId, primaryFleetId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const { from, to } = useMemo(() => {
    const now = new Date();
    const start = new Date();
    start.setDate(start.getDate() - TRIP_LOOKBACK_DAYS);
    return { from: start.toISOString(), to: now.toISOString() };
  }, []);

  const vehicleIds = useMemo(
    () => vehicles.map((vehicle) => vehicle.vin).filter(Boolean),
    [vehicles],
  );

  const {
    data: tripPreviewResult,
    isLoading: isLoadingTrips,
    error: tripsError,
  } = useQuery({
    queryKey: ["tenant-dashboard", "trips", tenantId, vehicleIds.join("|")],
    queryFn: async () => {
      if (!tenantId || vehicleIds.length === 0) {
        return { items: [], isFallback: false };
      }
      const response = await fetchTripSummaryTrips({
        tenantId,
        vehicleIds,
        from,
        to,
        limit: TRIP_PREVIEW_LIMIT,
      });
      const merged = response.items ?? [];
      merged.sort((a, b) => {
        const aTime = a.endTime ? new Date(a.endTime).getTime() : 0;
        const bTime = b.endTime ? new Date(b.endTime).getTime() : 0;
        return bTime - aTime;
      });
      const recent = merged.slice(0, TRIP_PREVIEW_LIMIT);
      if (recent.length > 0) {
        return { items: recent, isFallback: false };
      }

      const fallbackResponses = await Promise.all(
        fleetIds.map((fleetId) =>
          fetchTripSummaryTrips({
            tenantId,
            fleetId,
            limit: 1,
          }),
        ),
      );
      const fallbackMerged = fallbackResponses.flatMap(
        (response) => response.items ?? [],
      );
      fallbackMerged.sort((a, b) => {
        const aTime = a.endTime ? new Date(a.endTime).getTime() : 0;
        const bTime = b.endTime ? new Date(b.endTime).getTime() : 0;
        return bTime - aTime;
      });
      return {
        items: fallbackMerged.slice(0, TRIP_PREVIEW_LIMIT),
        isFallback: true,
      };
    },
    enabled: Boolean(tenantId && fleetIds.length),
  });

  const tripPreview = tripPreviewResult?.items ?? [];
  const tripsFallback = tripPreviewResult?.isFallback ?? false;

  const vehicleStats = useMemo(() => {
    const normalized = vehicles.map((vehicle) =>
      normalizeStatus(vehicle.status),
    );
    const active = normalized.filter((status) => status === "ACTIVE").length;
    const inactive = normalized.filter(
      (status) => status === "INACTIVE" || status === "SUSPENDED",
    ).length;
    const unknown = vehicles.length - active - inactive;
    return { active, inactive, unknown };
  }, [vehicles]);

  const fleetVehicleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const vehicle of vehicles) {
      if (vehicle.fleetId) {
        counts[vehicle.fleetId] = (counts[vehicle.fleetId] ?? 0) + 1;
        continue;
      }
      if (primaryFleetId) {
        counts[primaryFleetId] = (counts[primaryFleetId] ?? 0) + 1;
      }
    }
    return counts;
  }, [vehicles, primaryFleetId]);

  const tripStats = useMemo(() => {
    const scores = tripPreview
      .map((trip) => trip.safetyScore)
      .filter((score): score is number => typeof score === "number");
    const avgSafety =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          )
        : undefined;
    return {
      trips: tripPreview.length,
      avgSafety,
    };
  }, [tripPreview]);

  const latestTrip = tripPreview[0];

  const assignedDriverSet = useMemo(
    () => new Set(assignedDriverIds),
    [assignedDriverIds],
  );

  const unassignedDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) => !driver.driverId || !assignedDriverSet.has(driver.driverId),
      ).length,
    [assignedDriverSet, drivers],
  );

  const isLoading =
    isLoadingFleets ||
    isLoadingVehicles ||
    isLoadingDrivers ||
    isLoadingUsers ||
    isLoadingTrips;

  const hasError =
    Boolean(fleetsError) ||
    Boolean(vehiclesError) ||
    Boolean(driversError) ||
    Boolean(usersError) ||
    Boolean(tripsError);

  const errorDetails = useMemo(
    () =>
      [
        { label: "Fleets", error: fleetsError },
        { label: "Vehicles", error: vehiclesError },
        { label: "Drivers", error: driversError },
        { label: "Users", error: usersError },
        { label: "Trips", error: tripsError },
      ]
        .filter((item) => Boolean(item.error))
        .map((item) => ({
          label: item.label,
          message:
            item.error instanceof Error ? item.error.message : "Unknown error",
        })),
    [fleetsError, vehiclesError, driversError, usersError, tripsError],
  );

  const tenantSubtitle = tenant
    ? `${tenant.name} · ${tenant.id}`
    : "Fleet operations at a glance";

  return (
    <div className="page dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero__glow" />
        <div className="dashboard-hero__content">
          <div>
            <p className="dashboard-hero__eyebrow">Tenant overview</p>
            <h1>Tenant Dashboard</h1>
            <p className="dashboard-hero__subtitle">{tenantSubtitle}</p>
          </div>
          <div className="dashboard-hero__meta">
            <span className="dashboard-pill">
              Last {TRIP_LOOKBACK_DAYS} days
            </span>
            <span
              className={`dashboard-status dashboard-status--${normalizeStatus(
                tenant?.status,
              ).toLowerCase()}`}
            >
              {normalizeStatus(tenant?.status)}
            </span>
          </div>
        </div>
      </section>
      {isLoading ? <p>Loading tenant insights...</p> : null}
      {hasError ? (
        <div className="banner banner--warning">
          Some dashboard data failed to load. Check your API connectivity and
          try again.
          {errorDetails.length ? (
            <ul>
              {errorDetails.map((item) => (
                <li key={item.label}>
                  {item.label}: {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div className="dashboard-stats">
        <a
          className="dashboard-stat dashboard-stat--link"
          href="#fleet-breakdown"
        >
          <span>Total fleets</span>
          <strong>{fleets.length}</strong>
          <span className="text-muted">Across all customers</span>
        </a>
        <Link
          className="dashboard-stat dashboard-stat--link"
          to="/adlp/vehicles/vin-summary"
        >
          <span>Total vehicles</span>
          <strong>{vehicles.length}</strong>
          <span className="text-muted">
            {vehicleStats.active} active · {vehicleStats.inactive} inactive ·{" "}
            {vehicleStats.unknown} unknown
          </span>
        </Link>
        <Link
          className="dashboard-stat dashboard-stat--link"
          to="/adlp/drivers/summary"
        >
          <span>Total drivers</span>
          <strong>{drivers.length}</strong>
          <span className="text-muted">
            With and without active assignments
          </span>
        </Link>
        <Link className="dashboard-stat dashboard-stat--link" to="/adlp/users">
          <span>Tenant users</span>
          <strong>{users.length}</strong>
          <span className="text-muted">Active accounts</span>
        </Link>
        <Link
          className="dashboard-stat dashboard-stat--link"
          to="/adlp/tracking/trips"
        >
          <span>{`Trips (last ${TRIP_LOOKBACK_DAYS} days)`}</span>
          <strong>{tripStats.trips}</strong>
          <span className="text-muted">
            {latestTrip
              ? `Latest ended ${formatTimestamp(latestTrip.endTime ?? latestTrip.startTime)}${tripsFallback ? " (fallback)" : ""}`
              : "No completed trips in range"}
          </span>
        </Link>
        <Link
          className="dashboard-stat dashboard-stat--link"
          to="/adlp/drivers/summary?filter=unassigned"
        >
          <span>Unassigned drivers</span>
          <strong>{unassignedDrivers}</strong>
          <span className="text-muted">Drivers without active assignment</span>
        </Link>
      </div>

      <div className="dashboard-panels">
        <div id="fleet-breakdown">
          <Card title="Fleet Breakdown">
            {fleets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">Fleet</div>
                <h3>No fleets available</h3>
                <p className="text-muted">Assign fleets to this tenant.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fleet</th>
                      <th>Status</th>
                      <th>Vehicles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleets.map((fleet) => {
                      const status = normalizeStatus(fleet.status);
                      const badgeClass =
                        status === "ACTIVE"
                          ? "badge--active"
                          : status === "SUSPENDED"
                            ? "badge--suspended"
                            : status === "DELETED"
                              ? "badge--deleted"
                              : "badge--inactive";
                      return (
                        <tr key={fleet.fleetId}>
                          <td>
                            <div>{fleet.name}</div>
                            <div className="text-muted mono">
                              {fleet.fleetId}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${badgeClass}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            {fleetVehicleCounts[fleet.fleetId] ??
                              fleet.vehicleCount ??
                              0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card title="Recent Trips">
          {tripPreview.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">Trips</div>
              <h3>No trips available</h3>
              <p className="text-muted">Trips will appear as they complete.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Vehicle</th>
                    <th>Ended</th>
                    <th>Miles</th>
                    <th>Safety</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tripPreview.map((trip) => {
                    const status = normalizeStatus(trip.tripStatus);
                    const miles =
                      typeof trip.milesDriven === "number"
                        ? trip.milesDriven.toFixed(1)
                        : "--";
                    const safety =
                      typeof trip.safetyScore === "number"
                        ? Math.round(trip.safetyScore)
                        : "--";
                    const badgeClass =
                      status === "COMPLETED"
                        ? "badge--active"
                        : status === "IN_PROGRESS"
                          ? "badge--suspended"
                          : "badge--inactive";
                    return (
                      <tr key={trip.tripId}>
                        <td>
                          <div>
                            {trip.tripId ? (
                              <Link
                                to={`/adlp/tracking/trips?tripId=${encodeURIComponent(trip.tripId)}${trip.vin ? `&vin=${encodeURIComponent(trip.vin)}` : ""}`}
                              >
                                {trip.tripId}
                              </Link>
                            ) : (
                              "--"
                            )}
                          </div>
                        </td>
                        <td>{trip.vin}</td>
                        <td>
                          {formatTimestamp(trip.endTime ?? trip.startTime)}
                        </td>
                        <td>{miles}</td>
                        <td>{safety}</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
