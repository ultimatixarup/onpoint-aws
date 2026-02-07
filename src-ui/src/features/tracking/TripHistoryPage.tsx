import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchFleets } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { fetchTripSummaryTrips } from "../../api/tripSummaryApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { formatDate } from "../../utils/date";

export function TripHistoryPage() {
  const [dateRange, setDateRange] = useState("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedVin, setSelectedVin] = useState("all");

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

  const stats = [
    { label: "Trips (last 30d)", value: "128" },
    { label: "Miles driven", value: "4,982" },
    { label: "Avg. trip duration", value: "42m" },
    { label: "Alerts", value: "6" },
  ];

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

  return (
    <div className="page">
      <div className="page-header-row">
        <PageHeader title="Trip History" subtitle="Trips and alerts" />
        <div className="page-header-actions">
          <Button variant="secondary">Export</Button>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      <div className="grid">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="stat">
              <p className="stat__label">{stat.label}</p>
              <p className="stat__value">{stat.value}</p>
              <p className="stat__hint">Compared to previous period</p>
            </div>
          </Card>
        ))}
      </div>

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
              <option value="4JGFB4FB7RA981998">4JGFB4FB7RA981998</option>
              <option value="1C6RREMT0PN664947">1C6RREMT0PN664947</option>
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
                  <tr key={trip.id}>
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
    </div>
  );
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
