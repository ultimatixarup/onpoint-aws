import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { fetchFleets, fetchVehicles } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import {
  fetchTripEvents,
  fetchTripSummaryTrips,
} from "../../api/tripSummaryApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { formatDate } from "../../utils/date";

export function TripHistoryPage() {
  const [dateRange, setDateRange] = useState("last90");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedVin, setSelectedVin] = useState("all");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTripVin, setSelectedTripVin] = useState<string | null>(null);

  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id;

  const { data: fleetOptions = [], isLoading: isLoadingFleets } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const canFetchTrips = Boolean(
    tenantId &&
    (fleetId ||
      selectedVin !== "all" ||
      (fleetOptions.length > 0 && !isLoadingFleets)),
  );

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (dateRange === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "last7") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "last30") {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "last90") {
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "custom") {
      const start = parseUsDate(customFrom, "start");
      const end = parseUsDate(customTo, "end");
      return {
        from: start ? start.toISOString() : undefined,
        to: end ? end.toISOString() : undefined,
      };
    }
    return { from: undefined, to: undefined };
  }, [customFrom, customTo, dateRange]);

  const {
    data: tripResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "trip-summary",
      tenantId,
      fleetId ?? "all",
      selectedVin,
      from ?? "",
      to ?? "",
    ],
    queryFn: async () => {
      if (selectedVin !== "all") {
        return fetchTripSummaryTrips({
          tenantId,
          vin: selectedVin,
          from,
          to,
          limit: 50,
        });
      }

      if (fleetId) {
        return fetchTripSummaryTrips({
          tenantId,
          fleetId,
          from,
          to,
          limit: 50,
        });
      }

      if (!fleetOptions.length) {
        return { items: [], nextToken: null };
      }

      const responses = await Promise.all(
        fleetOptions.map((fleetOption) =>
          fetchTripSummaryTrips({
            tenantId,
            fleetId: fleetOption.fleetId,
            from,
            to,
            limit: 50,
          }),
        ),
      );

      const merged = responses.flatMap((response) => response.items ?? []);
      merged.sort((a, b) => {
        const aEnd = a.endTime ? new Date(a.endTime).getTime() : 0;
        const bEnd = b.endTime ? new Date(b.endTime).getTime() : 0;
        return bEnd - aEnd;
      });

      return { items: merged, nextToken: null };
    },
    enabled: canFetchTrips,
  });

  const stats = useMemo(() => {
    const items = tripResponse?.items ?? [];
    const totalTrips = items.length;
    const totalMiles = items.reduce(
      (sum, item) =>
        sum + (typeof item.milesDriven === "number" ? item.milesDriven : 0),
      0,
    );
    const totalAlerts = items.reduce(
      (sum, item) =>
        sum +
        (typeof item.overspeedEventCountTotal === "number"
          ? item.overspeedEventCountTotal
          : 0),
      0,
    );
    const durations = items
      .map((item) => minutesBetween(item.startTime, item.endTime))
      .filter((value): value is number => typeof value === "number");
    const avgMinutes =
      durations.length > 0
        ? Math.round(
            durations.reduce((sum, value) => sum + value, 0) / durations.length,
          )
        : undefined;

    return [
      {
        label: `Trips (${rangeLabel(dateRange)})`,
        value: totalTrips.toLocaleString(),
      },
      {
        label: "Miles driven",
        value:
          totalMiles > 0
            ? totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })
            : "0",
      },
      {
        label: "Avg. trip duration",
        value: avgMinutes ? formatMinutes(avgMinutes) : "--",
      },
      { label: "Alerts", value: totalAlerts.toLocaleString() },
    ];
  }, [dateRange, tripResponse]);

  const trips = useMemo(() => {
    const items = tripResponse?.items ?? [];
    const normalized = items.map((item) => {
      const start = formatDate(item.startTime, "--");
      const end = formatDate(item.endTime, "--");
      const miles =
        typeof item.milesDriven === "number"
          ? item.milesDriven.toFixed(1)
          : "--";
      const duration =
        item.startTime && item.endTime
          ? formatDuration(item.startTime, item.endTime)
          : "--";
      const status =
        item.tripStatus?.toLowerCase() === "completed"
          ? "Completed"
          : item.tripStatus?.toLowerCase() === "canceled"
            ? "Canceled"
            : item.tripStatus?.toLowerCase() === "in_progress"
              ? "In Progress"
              : "Completed";
      return {
        id: item.tripId,
        vin: item.vin,
        start,
        end,
        miles,
        duration,
        status,
        alerts: item.overspeedEventCountTotal ?? 0,
      };
    });

    if (!search.trim()) return normalized;
    const term = search.trim().toLowerCase();
    return normalized.filter((trip) => trip.id.toLowerCase().includes(term));
  }, [search, tripResponse]);

  const vehicleOptions = useMemo(
    () => vehicles.map((vehicle) => vehicle.vin).filter(Boolean),
    [vehicles],
  );

  useEffect(() => {
    if (!selectedTripId || !selectedTripVin) return;
    const stillExists = trips.some(
      (trip) => trip.id === selectedTripId && trip.vin === selectedTripVin,
    );
    if (!stillExists) {
      setSelectedTripId(null);
      setSelectedTripVin(null);
    }
  }, [selectedTripId, selectedTripVin, trips]);

  const {
    data: tripEventsResponse,
    isLoading: isLoadingTripEvents,
    error: tripEventsError,
  } = useQuery({
    queryKey: [
      "trip-events",
      tenantId,
      selectedTripVin ?? "",
      selectedTripId ?? "",
    ],
    queryFn: () =>
      fetchTripEvents({
        tenantId,
        vin: selectedTripVin ?? "",
        tripId: selectedTripId ?? "",
        limit: 500,
      }),
    enabled: Boolean(tenantId && selectedTripId && selectedTripVin),
  });

  const tripPath = useMemo(() => {
    const items = tripEventsResponse?.items ?? [];
    return items
      .map((item) => extractEventPosition(item))
      .filter((pos): pos is [number, number] => Boolean(pos));
  }, [tripEventsResponse]);

  const tripBounds = useMemo(() => {
    if (tripPath.length === 0) return null;
    return L.latLngBounds(tripPath);
  }, [tripPath]);

  return (
    <div className="page trip-history-page">
      <section className="trip-hero">
        <div className="trip-hero__glow" />
        <div className="trip-hero__content">
          <div>
            <p className="trip-hero__eyebrow">Trip intelligence</p>
            <h1>Trip History</h1>
            <p className="trip-hero__subtitle">
              Audit fleet movement, safety signals, and route performance.
            </p>
          </div>
          <div className="trip-hero__actions">
            <Button variant="secondary">Export</Button>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>
        <div className="trip-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="trip-stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <span className="text-muted">Compared to previous period</span>
            </div>
          ))}
        </div>
      </section>

      <Card title="Filters">
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Date range</span>
            <select
              className="select"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <option value="today">Today</option>
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">From</span>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="MM/DD/YYYY"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              disabled={dateRange !== "custom"}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">To</span>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="MM/DD/YYYY"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              disabled={dateRange !== "custom"}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Vehicle (VIN)</span>
            <select
              className="select"
              value={selectedVin}
              onChange={(event) => setSelectedVin(event.target.value)}
            >
              <option value="all">All vehicles</option>
              {vehicleOptions.map((vin) => (
                <option key={vin} value={vin}>
                  {vin}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Status</span>
            <select className="select" defaultValue="all">
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In progress</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Search</span>
            <input
              className="input"
              placeholder="Search by trip ID or driver"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </Card>

      <Card title="Trips">
        <div className="tabs">
          <button className="tab tab--active">Trips</button>
          <button className="tab">Alerts</button>
        </div>

        <div className="table-toolbar">
          <p className="text-muted">
            {!canFetchTrips
              ? "Select a fleet or VIN to load trips"
              : isLoading
                ? "Loading trips..."
                : error
                  ? "Unable to load trips"
                  : `Showing ${trips.length} trips`}
          </p>
          <div className="inline">
            <button className="icon-button" aria-label="Grid view">
              ▦
            </button>
            <button className="icon-button" aria-label="List view">
              ≡
            </button>
          </div>
        </div>

        {!canFetchTrips ? (
          <div className="empty-state">
            <div className="empty-state__icon">📍</div>
            <h3>Select a fleet or VIN</h3>
            <p className="text-muted">
              Choose a fleet from the top bar or select a specific VIN to view
              trips.
            </p>
          </div>
        ) : isLoading ? (
          <div className="empty-state">
            <div className="empty-state__icon">⏳</div>
            <h3>Loading trips</h3>
            <p className="text-muted">
              Fetching trip summaries for the selected filters.
            </p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon">⚠️</div>
            <h3>Unable to load trips</h3>
            <p className="text-muted">
              Verify your tenant and fleet selection, then try again.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🧭</div>
            <h3>No trips found</h3>
            <p className="text-muted">
              Trips will appear here as vehicles report telemetry. Adjust
              filters or try another date range.
            </p>
            <Button
              onClick={() => {
                setDateRange("last30");
                setCustomFrom("");
                setCustomTo("");
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>VIN</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Miles</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Alerts</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr
                    key={trip.id}
                    className={
                      trip.id === selectedTripId && trip.vin === selectedTripVin
                        ? "is-selected"
                        : undefined
                    }
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setSelectedTripVin(trip.vin);
                    }}
                  >
                    <td className="mono">{trip.id}</td>
                    <td className="mono">{trip.vin}</td>
                    <td>{trip.start}</td>
                    <td>{trip.end}</td>
                    <td>{trip.miles}</td>
                    <td>{trip.duration}</td>
                    <td>
                      <span
                        className={`badge ${
                          trip.status === "Completed"
                            ? "badge--active"
                            : trip.status === "In Progress"
                              ? "badge--suspended"
                              : "badge--inactive"
                        }`}
                      >
                        {trip.status}
                      </span>
                    </td>
                    <td>{trip.alerts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Trip Map">
        {!selectedTripId || !selectedTripVin ? (
          <div className="empty-state">
            <div className="empty-state__icon">🗺️</div>
            <h3>Select a trip</h3>
            <p className="text-muted">
              Click a trip to view its route on the map.
            </p>
          </div>
        ) : isLoadingTripEvents ? (
          <div className="empty-state">
            <div className="empty-state__icon">⏳</div>
            <h3>Loading trip route</h3>
            <p className="text-muted">
              Fetching telemetry events for this trip.
            </p>
          </div>
        ) : tripEventsError ? (
          <div className="empty-state">
            <div className="empty-state__icon">⚠️</div>
            <h3>Unable to load route</h3>
            <p className="text-muted">Verify your API access and try again.</p>
          </div>
        ) : tripPath.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📍</div>
            <h3>No GPS points available</h3>
            <p className="text-muted">
              This trip has no location data to display.
            </p>
          </div>
        ) : (
          <div className="map-container">
            <MapContainer
              center={tripPath[0]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {tripBounds ? <FitBounds bounds={tripBounds} /> : null}
              <Polyline positions={tripPath} color="#1d4ed8" weight={4} />
              {tripPath.length > 0 ? (
                <Marker position={tripPath[0]}>
                  <Popup>
                    Start
                    <br />
                    {selectedTripVin}
                  </Popup>
                </Marker>
              ) : null}
              {tripPath.length > 1 ? (
                <Marker position={tripPath[tripPath.length - 1]}>
                  <Popup>
                    End
                    <br />
                    {selectedTripVin}
                  </Popup>
                </Marker>
              ) : null}
            </MapContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function FitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [bounds, map]);

  return null;
}

function extractEventPosition(event: Record<string, unknown>) {
  const directLat = asNumber(event.lat ?? event.latitude);
  const directLon = asNumber(event.lon ?? event.longitude);
  if (directLat !== null && directLon !== null)
    return [directLat, directLon] as [number, number];

  const location = event.location as Record<string, unknown> | undefined;
  if (location) {
    const locLat = asNumber(location.lat ?? location.latitude);
    const locLon = asNumber(location.lon ?? location.longitude);
    if (locLat !== null && locLon !== null)
      return [locLat, locLon] as [number, number];
  }

  const geo = event.geo as Record<string, unknown> | undefined;
  if (geo) {
    const geoLat = asNumber(geo.lat ?? geo.latitude);
    const geoLon = asNumber(geo.lon ?? geo.longitude);
    if (geoLat !== null && geoLon !== null)
      return [geoLat, geoLon] as [number, number];
  }

  return null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatDuration(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "--";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function minutesBetween(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return undefined;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return undefined;
  return Math.round(ms / 60000);
}

function formatMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "--";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function rangeLabel(value: string) {
  if (value === "today") return "today";
  if (value === "last7") return "last 7d";
  if (value === "last30") return "last 30d";
  if (value === "last90") return "last 90d";
  if (value === "custom") return "custom";
  return value;
}

function parseUsDate(value: string, mode: "start" | "end") {
  if (!value) return undefined;
  const trimmed = value.trim();
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(trimmed);
  if (!match) return undefined;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!month || !day || !year || month > 12 || day > 31) return undefined;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;
  if (mode === "end") {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}
