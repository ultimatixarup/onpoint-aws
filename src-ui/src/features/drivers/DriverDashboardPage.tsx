import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    fetchDriverDashboard,
    fetchDriverDashboardEvents,
    fetchDriverDashboardTrips,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

function formatNumber(value?: number | null, suffix = "") {
  if (value === null || value === undefined) return "--";
  return `${value}${suffix}`;
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

  const handleKpiView = (nextView: "trips" | "events", nextEventType?: string) => {
    setView(nextView);
    if (nextEventType) setEventType(nextEventType);
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

  if (!driverId) {
    return (
      <div className="page">
        <PageHeader
          title="Driver dashboard"
          subtitle="Select a driver first."
        />
      </div>
    );
  }

  const totals = dashboard?.totals;

  return (
    <div className="page driver-dashboard">
      <PageHeader
        title="Driver dashboard"
        subtitle={
          dashboard?.driverId ? `Driver ${dashboard.driverId}` : undefined
        }
      />

      <div className="driver-dashboard__actions">
        <div className="inline">
          <label className="form__field">
            <span className="text-muted">From</span>
            <input
              className="input"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">To</span>
            <input
              className="input"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
        <div className="inline">
          <Link className="btn btn--secondary" to={`/adlp/drivers/${driverId}`}>
            Profile
          </Link>
          <button className="btn" type="button" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </div>

      <Card title="Safety & efficiency">
        {isLoading ? (
          <div className="empty-state">Loading dashboard...</div>
        ) : error ? (
          <div className="empty-state">Unable to load dashboard.</div>
        ) : (
          <div className="kpi-grid">
            <div className="kpi-card" {...clickableProps(() => handleKpiView("trips"))}>
              <span>Total miles</span>
              <strong>{formatNumber(totals?.milesDriven)}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("trips"))}>
              <span>Driving time</span>
              <strong>{formatNumber(totals?.drivingTimeSeconds, "s")}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "idling"))}>
              <span>Idling time</span>
              <strong>{formatNumber(totals?.idlingTimeSeconds, "s")}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("trips"))}>
              <span>Night miles</span>
              <strong>{formatNumber(totals?.nightMiles)}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("trips"))}>
              <span>Average speed</span>
              <strong>{formatNumber(totals?.averageSpeedMph, " mph")}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "overspeed"))}>
              <span>Top speed</span>
              <strong>{formatNumber(totals?.topSpeedMph, " mph")}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "safety_score"))}>
              <span>Safety score</span>
              <strong>{formatNumber(totals?.safetyScore)}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("trips"))}>
              <span>Fuel efficiency</span>
              <strong>{formatNumber(totals?.fuelEfficiencyMpg, " mpg")}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "harsh_braking"))}>
              <span>Harsh braking</span>
              <strong>{formatNumber(totals?.harshBraking)}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "harsh_acceleration"))}>
              <span>Harsh acceleration</span>
              <strong>{formatNumber(totals?.harshAcceleration)}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "harsh_cornering"))}>
              <span>Harsh cornering</span>
              <strong>{formatNumber(totals?.harshCornering)}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "seatbelt_violation"))}>
              <span>Seatbelt violations</span>
              <strong>{formatNumber(totals?.seatbeltViolations)}</strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "overspeed"))}>
              <span>Overspeed events</span>
              <strong>
                {formatNumber(totals?.overspeed?.eventCountTotal)}
              </strong>
            </div>
            <div className="kpi-card" {...clickableProps(() => handleKpiView("events", "overspeed"))}>
              <span>Overspeed miles</span>
              <strong>{formatNumber(totals?.overspeed?.milesTotal)}</strong>
            </div>
          </div>
        )}
      </Card>

      <Card title="Drilldowns">
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
          {view === "events" ? (
            <label className="form__field">
              <span className="text-muted">Event type</span>
              <input
                className="input"
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                placeholder="harsh_braking"
              />
            </label>
          ) : null}
        </div>

        {view === "trips" ? (
          <div className="table-list">
            {trips.length === 0 ? (
              <div className="empty-state">No trips in this range.</div>
            ) : (
              trips.map((trip) => (
                <div key={`${trip.tripId}-${trip.vin}`} className="table-row">
                  <div>
                    <strong>{trip.tripId ?? "--"}</strong>
                    <div className="text-muted">{trip.vin ?? "--"}</div>
                  </div>
                  <div>
                    <span className="text-muted">Miles</span>
                    <strong>{formatNumber(trip.milesDriven)}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Top speed</span>
                    <strong>{formatNumber(trip.topSpeedMph, " mph")}</strong>
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
                  className="table-row"
                >
                  <div>
                    <strong>{event.eventType ?? "--"}</strong>
                    <div className="text-muted">{event.eventTime ?? "--"}</div>
                  </div>
                  <div>
                    <span className="text-muted">Trip</span>
                    <strong>{event.tripId ?? "--"}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Speed</span>
                    <strong>{formatNumber(event.speedMph, " mph")}</strong>
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
