import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
    fetchDrivers,
    fetchFleets,
    fetchUsers,
    fetchVehicles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { fetchTripSummaryTrips } from "../../api/tripSummaryApi";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
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
    queryKey: tenantId ? queryKeys.drivers(tenantId) : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: tenantId ? queryKeys.users(tenantId) : ["users", "none"],
    queryFn: () => fetchUsers(tenantId),
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
    const normalized = vehicles.map((vehicle) => normalizeStatus(vehicle.status));
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
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : undefined;
    return {
      trips: tripPreview.length,
      avgSafety,
    };
  }, [tripPreview]);

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
            item.error instanceof Error
              ? item.error.message
              : "Unknown error",
        })),
    [fleetsError, vehiclesError, driversError, usersError, tripsError],
  );

  return (
    <div className="page">
      <PageHeader
        title="Tenant Dashboard"
        subtitle={
          tenant
            ? `${tenant.name} · ${tenant.id}`
            : "Fleet operations at a glance"
        }
      />
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
      <div className="grid">
        <Card title="Fleets">
          <div className="stat">
            <p className="stat__label">Total fleets</p>
            <p className="stat__value">{fleets.length}</p>
            <p className="stat__hint">Across all customers</p>
          </div>
        </Card>
        <Card title="Vehicles">
          <div className="stat">
            <p className="stat__label">Total vehicles</p>
            <p className="stat__value">{vehicles.length}</p>
            <p className="stat__hint">
              {vehicleStats.active} active · {vehicleStats.inactive} inactive · {vehicleStats.unknown} unknown
            </p>
          </div>
        </Card>
        <Card title="Drivers">
          <div className="stat">
            <p className="stat__label">Total drivers</p>
            <p className="stat__value">{drivers.length}</p>
            <p className="stat__hint">Assigned and unassigned</p>
          </div>
        </Card>
        <Card title="Users">
          <div className="stat">
            <p className="stat__label">Tenant users</p>
            <p className="stat__value">{users.length}</p>
            <p className="stat__hint">Active accounts</p>
          </div>
        </Card>
        <Card title="Recent trips">
          <div className="stat">
            <p className="stat__label">
              {tripsFallback
                ? "Latest completed trip"
                : `Trips (last ${TRIP_LOOKBACK_DAYS} days)`}
            </p>
            <p className="stat__value">{tripStats.trips}</p>
            <p className="stat__hint">
              Avg. safety score {tripStats.avgSafety ?? "--"}
            </p>
          </div>
        </Card>
        <Card title="Tenant Health">
          <div className="stat">
            <p className="stat__label">Status</p>
            <p className="stat__value">{normalizeStatus(tenant?.status)}</p>
            <p className="stat__hint">Tenant operational state</p>
          </div>
        </Card>
      </div>

      <div className="section">
        <div className="section__title">Fleet Breakdown</div>
        {fleets.length === 0 ? (
          <p>No fleets available for this tenant.</p>
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
                        <div className="text-muted mono">{fleet.fleetId}</div>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{status}</span>
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
      </div>

      <div className="section">
        <div className="section__title">Recent Trips</div>
        {tripPreview.length === 0 ? (
          <p>No trips available.</p>
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
                        <div>{trip.tripId}</div>
                      </td>
                      <td>{trip.vin}</td>
                      <td>{formatTimestamp(trip.endTime ?? trip.startTime)}</td>
                      <td>{miles}</td>
                      <td>{safety}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
