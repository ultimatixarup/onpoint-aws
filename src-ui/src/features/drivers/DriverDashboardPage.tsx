import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchDriverDashboard,
  fetchDriverDashboardEvents,
  fetchDriverDashboardTrips,
  fetchDriverDetail,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatNumber(
  value?: number | string | null,
  suffix = "",
  options?: Intl.NumberFormatOptions,
) {
  if (value === null || value === undefined) return "--";
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return "--";
  const formatter = options
    ? new Intl.NumberFormat("en-US", options)
    : numberFormatter;
  return `${formatter.format(parsed)}${suffix}`;
}

function dateToInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function inputToIso(value: string, endOfDay = false) {
  if (!value) return undefined;
  const suffix = endOfDay ? "T23:59:59Z" : "T00:00:00Z";
  return `${value}${suffix}`;
}

export function DriverDashboardPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;
  const now = useMemo(() => new Date(), []);
  const lastWeek = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);
  const [from, setFrom] = useState(dateToInput(lastWeek));
  const [to, setTo] = useState(dateToInput(now));
  const [eventType, setEventType] = useState("harsh_braking");
  const [view, setView] = useState<"trips" | "events">("trips");
  const [isAutoRange, setIsAutoRange] = useState(true);

  const handleKpiView = (
    nextView: "trips" | "events",
    nextEventType?: string,
  ) => {
    setView(nextView);
    if (nextEventType) setEventType(nextEventType);
  };

  const handleTripDrilldown = (tripId?: string | null, vin?: string | null) => {
    if (!tripId) return;
    const params = new URLSearchParams();
    params.set("tripId", tripId);
    if (vin) params.set("vin", vin);
    navigate(`/adlp/tracking/trips?${params.toString()}`);
  };

  const clickableProps = (handler: () => void) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }
    },
  });

  const fromIso = inputToIso(from);
  const toIso = inputToIso(to, true);

  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey:
      tenantId && driverId
        ? queryKeys.driverDashboard(tenantId, driverId, fromIso, toIso)
        : ["driver-dashboard", "none"],
    queryFn: () =>
      fetchDriverDashboard(tenantId ?? "", driverId ?? "", {
        from: fromIso,
        to: toIso,
        fleetId,
      }),
    enabled: Boolean(tenantId && driverId),
  });

  const { data: driverDetail } = useQuery({
    queryKey:
      tenantId && driverId
        ? queryKeys.driverDetail(tenantId, driverId)
        : ["driver-detail", "none"],
    queryFn: () => fetchDriverDetail(tenantId ?? "", driverId ?? ""),
    enabled: Boolean(tenantId && driverId),
  });

  const { data: trips = [] } = useQuery({
    queryKey:
      tenantId && driverId
        ? queryKeys.driverTrips(tenantId, driverId, fromIso, toIso)
        : ["driver-trips", "none"],
    queryFn: async () => {
      const response = await fetchDriverDashboardTrips(
        tenantId ?? "",
        driverId ?? "",
        { from: fromIso, to: toIso, limit: 10 },
      );
      return response.items ?? [];
    },
    enabled: Boolean(tenantId && driverId),
  });

  const { data: latestTrip } = useQuery({
    queryKey:
      tenantId && driverId
        ? ["driver-trips-latest", tenantId, driverId]
        : ["driver-trips-latest", "none"],
    queryFn: async () => {
      const response = await fetchDriverDashboardTrips(
        tenantId ?? "",
        driverId ?? "",
        { limit: 1 },
      );
      return response.items?.[0];
    },
    enabled: Boolean(tenantId && driverId),
  });

  const { data: events = [] } = useQuery({
    queryKey:
      tenantId && driverId
        ? queryKeys.driverEvents(tenantId, driverId, fromIso, toIso, eventType)
        : ["driver-events", "none"],
    queryFn: async () => {
      const response = await fetchDriverDashboardEvents(
        tenantId ?? "",
        driverId ?? "",
        { from: fromIso, to: toIso, type: eventType, limit: 10 },
      );
      return response.items ?? [];
    },
    enabled: Boolean(tenantId && driverId),
  });

  useEffect(() => {
    if (!driverId) return;
    setIsAutoRange(true);
    setFrom(dateToInput(lastWeek));
    setTo(dateToInput(now));
  }, [driverId, lastWeek, now]);

  useEffect(() => {
    if (!isAutoRange || !latestTrip) return;
    const latestTimestamp = latestTrip.endTime ?? latestTrip.startTime;
    if (!latestTimestamp) return;
    const latestDate = new Date(latestTimestamp);
    if (Number.isNaN(latestDate.getTime())) return;
    const fromDate = new Date(latestDate);
    fromDate.setDate(fromDate.getDate() - 7);
    setFrom(dateToInput(fromDate));
    setTo(dateToInput(latestDate));
  }, [isAutoRange, latestTrip]);

  if (!driverId) {
    return (
      <div className="page driver-dashboard">
        <section className="insight-hero insight-hero--drivers">
          <div className="insight-hero__glow" />
          <div className="insight-hero__content">
            <div>
              <p className="insight-hero__eyebrow">Driver operations</p>
              <h1>Driver dashboard</h1>
              <p className="insight-hero__subtitle">
                Select a driver to view detailed safety and efficiency
                analytics.
              </p>
            </div>
            <div className="insight-hero__meta">
              <div className="insight-chip">Driver: Not selected</div>
              <div className="insight-chip">Range: --</div>
              <Link className="btn" to="/adlp/drivers/summary">
                Go to driver directory
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const totals = dashboard?.totals;

  return (
    <div className="page driver-dashboard">
      <section className="insight-hero insight-hero--drivers">
        <div className="insight-hero__glow" />
        <div className="insight-hero__content">
          <div>
            <p className="insight-hero__eyebrow">Driver operations</p>
            <h1>Driver dashboard</h1>
            <p className="insight-hero__subtitle">
              {dashboard?.driverId
                ? `${
                    driverDetail?.name ??
                    driverDetail?.displayName ??
                    dashboard.driverId
                  }`
                : "Loading driver insights."}
            </p>
          </div>
          <div className="insight-hero__meta">
            <div className="insight-chip">
              Range: {from} - {to}
            </div>
            <div className="insight-chip">
              Safety score: {formatNumber(totals?.safetyScore)}
            </div>
            <div className="insight-chip">
              Total miles: {formatNumber(totals?.milesDriven)}
            </div>
            <div className="insight-chip">Events loaded: {events.length}</div>
            <div className="insight-chip">View: {view}</div>
            <div className="insight-chip">Event type: {eventType}</div>
            <Link className="btn btn--secondary" to="/adlp/drivers/dashboard">
              Change driver
            </Link>
            <Link
              className="btn btn--secondary"
              to={`/adlp/drivers/${driverId}`}
            >
              Profile
            </Link>
            <button className="btn" type="button" onClick={() => refetch()}>
              Refresh
            </button>
          </div>
        </div>
      </section>

      <Card title="Filters & date range">
        <div className="driver-dashboard__actions">
          <div className="inline">
            <label className="form__field">
              <span className="text-muted">From</span>
              <input
                className="input"
                type="date"
                value={from}
                onChange={(event) => {
                  setIsAutoRange(false);
                  setFrom(event.target.value);
                }}
              />
            </label>
            <label className="form__field">
              <span className="text-muted">To</span>
              <input
                className="input"
                type="date"
                value={to}
                onChange={(event) => {
                  setIsAutoRange(false);
                  setTo(event.target.value);
                }}
              />
            </label>
          </div>
          <div className="inline">
            <label className="form__field">
              <span className="text-muted">Event type</span>
              <input
                className="input"
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                placeholder="harsh_braking"
              />
            </label>
            <div className="inline">
              <button
                className={`filter-chip${view === "trips" ? " filter-chip--active" : ""}`}
                type="button"
                onClick={() => setView("trips")}
              >
                Trips
              </button>
              <button
                className={`filter-chip${view === "events" ? " filter-chip--active" : ""}`}
                type="button"
                onClick={() => setView("events")}
              >
                Events
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Safety & efficiency">
        {isLoading ? (
          <div className="empty-state">Loading dashboard...</div>
        ) : error ? (
          <div className="empty-state">Unable to load dashboard.</div>
        ) : (
          <div className="kpi-grid">
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("trips"))}
            >
              <span>Total miles</span>
              <strong>{formatNumber(totals?.milesDriven)}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("trips"))}
            >
              <span>Driving time</span>
              <strong>{formatNumber(totals?.drivingTimeSeconds, "s")}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("events", "idling"))}
            >
              <span>Idling time</span>
              <strong>{formatNumber(totals?.idlingTimeSeconds, "s")}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("trips"))}
            >
              <span>Night miles</span>
              <strong>{formatNumber(totals?.nightMiles)}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("trips"))}
            >
              <span>Average speed</span>
              <strong>{formatNumber(totals?.averageSpeedMph, " mph")}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("events", "overspeed"))}
            >
              <span>Top speed</span>
              <strong>{formatNumber(totals?.topSpeedMph, " mph")}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("events", "safety_score"))}
            >
              <span>Safety score</span>
              <strong>{formatNumber(totals?.safetyScore)}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("trips"))}
            >
              <span>Fuel efficiency</span>
              <strong>{formatNumber(totals?.fuelEfficiencyMpg, " mpg")}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() =>
                handleKpiView("events", "harsh_braking"),
              )}
            >
              <span>Harsh braking</span>
              <strong>{formatNumber(totals?.harshBraking)}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() =>
                handleKpiView("events", "harsh_acceleration"),
              )}
            >
              <span>Harsh acceleration</span>
              <strong>{formatNumber(totals?.harshAcceleration)}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() =>
                handleKpiView("events", "harsh_cornering"),
              )}
            >
              <span>Harsh cornering</span>
              <strong>{formatNumber(totals?.harshCornering)}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() =>
                handleKpiView("events", "seatbelt_violation"),
              )}
            >
              <span>Seatbelt violations</span>
              <strong>{formatNumber(totals?.seatbeltViolations)}</strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("events", "overspeed"))}
            >
              <span>Overspeed events</span>
              <strong>
                {formatNumber(totals?.overspeed?.eventCountTotal)}
              </strong>
            </div>
            <div
              className="kpi-card"
              {...clickableProps(() => handleKpiView("events", "overspeed"))}
            >
              <span>Overspeed miles</span>
              <strong>{formatNumber(totals?.overspeed?.milesTotal)}</strong>
            </div>
          </div>
        )}
      </Card>

      <Card title="Drilldowns">
        {view === "trips" ? (
          <div className="table-list">
            {trips.length === 0 ? (
              <div className="empty-state">No trips in this range.</div>
            ) : (
              trips.map((trip) => (
                <div
                  key={`${trip.tripId}-${trip.vin}`}
                  className="table-row table-row--drilldown"
                  {...clickableProps(() =>
                    handleTripDrilldown(trip.tripId, trip.vin),
                  )}
                >
                  <div className="table-row__primary">
                    <span className="text-muted">Trip ID</span>
                    <strong className="mono">{trip.tripId ?? "--"}</strong>
                    <div className="text-muted">VIN: {trip.vin ?? "--"}</div>
                  </div>
                  <div className="table-row__metric">
                    <span className="text-muted">Miles</span>
                    <strong>{formatNumber(trip.milesDriven)}</strong>
                  </div>
                  <div className="table-row__metric">
                    <span className="text-muted">Top speed</span>
                    <strong>
                      {formatNumber(trip.topSpeedMph, " mph", {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="table-list">
            {events.length === 0 ? (
              <div className="empty-state">No events in this range.</div>
            ) : (
              events.map((event, index) => (
                <div
                  key={`${event.tripId}-${event.eventTime}-${index}`}
                  className="table-row table-row--drilldown"
                  {...clickableProps(() =>
                    handleTripDrilldown(event.tripId ?? undefined),
                  )}
                >
                  <div className="table-row__primary">
                    <span className="text-muted">Event</span>
                    <strong>{event.eventType ?? "--"}</strong>
                    <div className="text-muted">{event.eventTime ?? "--"}</div>
                  </div>
                  <div className="table-row__metric">
                    <span className="text-muted">Trip ID</span>
                    <strong className="mono">{event.tripId ?? "--"}</strong>
                  </div>
                  <div className="table-row__metric">
                    <span className="text-muted">Speed</span>
                    <strong>
                      {formatNumber(event.speedMph, " mph", {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
