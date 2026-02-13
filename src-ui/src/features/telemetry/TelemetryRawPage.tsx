import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchTripEvents,
  fetchTripSummaryTrips,
} from "../../api/tripSummaryApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

type TelemetryEvent = {
  id: string;
  timestamp: string;
  vin: string;
  tripId: string;
  provider: string;
  level: "info" | "warn" | "error";
  size: number;
  status: "accepted" | "rejected" | "queued";
  summary: string;
  payload: Record<string, unknown>;
};

const MAX_TRIPS = 10;
const EVENTS_PER_TRIP = 200;
const MAX_EVENT_PAGES = 5;
const AUTO_REFRESH_MS = 30_000;

function extractTimestamp(value?: string) {
  if (!value) return undefined;
  if (value.startsWith("TS#")) {
    const parts = value.split("#");
    return parts.length > 1 ? parts[1] : undefined;
  }
  return value;
}

function normalizeLevel(value?: string): TelemetryEvent["level"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "warn" || normalized === "warning") return "warn";
  if (normalized === "error" || normalized === "failed") return "error";
  return "info";
}

function normalizeStatus(value?: string): TelemetryEvent["status"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "rejected" || normalized === "failed") return "rejected";
  if (normalized === "queued" || normalized === "pending") return "queued";
  return "accepted";
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export function TelemetryRawPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id ?? "";
  const [providerFilter, setProviderFilter] = useState("all");
  const [vinFilter, setVinFilter] = useState("all");
  const [tripIdFilter, setTripIdFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "payload" | "overview" | "headers"
  >("payload");
  const [paused, setPaused] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const {
    data: telemetryEvents = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["telemetry-raw", tenantId, fleetId],
    queryFn: async (): Promise<TelemetryEvent[]> => {
      if (!tenantId || !fleetId) return [];
      const trips = await fetchTripSummaryTrips({
        tenantId,
        fleetId,
        limit: MAX_TRIPS,
      });

      const tripItems = trips.items ?? [];
      const eventsByTrip = await Promise.all(
        tripItems
          .filter((trip) => trip.vin && trip.tripId)
          .map(async (trip) => {
            const items: Record<string, unknown>[] = [];
            let nextToken: string | undefined;
            let pages = 0;

            do {
              const response = await fetchTripEvents({
                tenantId,
                vin: trip.vin,
                tripId: trip.tripId,
                limit: EVENTS_PER_TRIP,
                nextToken,
              });
              items.push(...(response.items ?? []));
              nextToken = response.nextToken ?? undefined;
              pages += 1;
            } while (nextToken && pages < MAX_EVENT_PAGES);

            return {
              vin: trip.vin,
              tripId: trip.tripId,
              items,
            };
          }),
      );

      return eventsByTrip
        .flatMap(({ vin, tripId, items }) =>
          items.map((item, index) => {
            const record = item as Record<string, unknown>;
            const rawTimestamp =
              (record.eventTime as string | undefined) ??
              (record.timestamp as string | undefined) ??
              extractTimestamp(record.SK as string | undefined) ??
              new Date().toISOString();
            const provider =
              (record.provider as string | undefined) ??
              (record.source as string | undefined) ??
              "Unknown";
            const level = normalizeLevel(record.level as string | undefined);
            const status = normalizeStatus(
              (record.status as string | undefined) ??
                (record.processingStatus as string | undefined),
            );
            const summary =
              (record.summary as string | undefined) ??
              (record.message as string | undefined) ??
              (record.description as string | undefined) ??
              (record.error as string | undefined) ??
              "Telemetry event";
            const size =
              typeof record.size === "number"
                ? record.size
                : JSON.stringify(record).length;
            const eventId =
              (record.messageId as string | undefined) ??
              (record.id as string | undefined) ??
              (record.SK as string | undefined) ??
              `${tripId}-${index}`;

            return {
              id: eventId,
              timestamp: rawTimestamp,
              vin: String(record.vin ?? record.VIN ?? vin),
              tripId,
              provider,
              level,
              size,
              status,
              summary,
              payload: record,
            } as TelemetryEvent;
          }),
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },
    enabled: Boolean(tenantId && fleetId),
    refetchInterval: paused ? false : AUTO_REFRESH_MS,
  });

  const providers = useMemo(
    () => Array.from(new Set(telemetryEvents.map((event) => event.provider))),
    [telemetryEvents],
  );

  const vins = useMemo(
    () => Array.from(new Set(telemetryEvents.map((event) => event.vin))),
    [telemetryEvents],
  );

  const tripIds = useMemo(
    () => Array.from(new Set(telemetryEvents.map((event) => event.tripId))),
    [telemetryEvents],
  );

  const filteredEvents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return telemetryEvents
      .filter((event) => {
        if (providerFilter !== "all" && event.provider !== providerFilter) {
          return false;
        }
        if (levelFilter !== "all" && event.level !== levelFilter) {
          return false;
        }
        if (vinFilter !== "all" && event.vin !== vinFilter) {
          return false;
        }
        if (tripIdFilter !== "all" && event.tripId !== tripIdFilter) {
          return false;
        }
        if (searchTerm && !event.summary.toLowerCase().includes(searchTerm)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [
    levelFilter,
    providerFilter,
    search,
    telemetryEvents,
    tripIdFilter,
    vinFilter,
  ]);

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedId) ??
    filteredEvents[0];
  const counts = useMemo(() => {
    const total = filteredEvents.length;
    const errors = filteredEvents.filter(
      (event) => event.level === "error",
    ).length;
    const warnings = filteredEvents.filter(
      (event) => event.level === "warn",
    ).length;
    const avgSize =
      total > 0
        ? Math.round(
            filteredEvents.reduce((sum, event) => sum + event.size, 0) / total,
          )
        : 0;
    return { total, errors, warnings, avgSize };
  }, [filteredEvents]);

  const streamStatus = paused ? "Paused" : isLoading ? "Syncing" : "Live";
  const lastUpdatedLabel = lastRefreshed
    ? formatTimestamp(lastRefreshed)
    : "--";

  useEffect(() => {
    if (telemetryEvents.length > 0) {
      setLastRefreshed(new Date().toISOString());
    }
  }, [telemetryEvents]);

  useEffect(() => {
    if (!filteredEvents.length) {
      setSelectedId(null);
      return;
    }
    const stillVisible = filteredEvents.some(
      (event) => event.id === selectedId,
    );
    if (!stillVisible) {
      setSelectedId(filteredEvents[0].id);
    }
  }, [filteredEvents, selectedId]);

  return (
    <div className="page telemetry-raw">
      <div className="telemetry-header">
        <PageHeader title="Telemetry (Raw)" subtitle="Provider payloads" />
        <div className="telemetry-switcher">
          <Link
            className="telemetry-switcher__item telemetry-switcher__item--active"
            to="/adlp/telemetry/raw"
          >
            Raw
          </Link>
          <Link
            className="telemetry-switcher__item"
            to="/adlp/telemetry/normalized"
          >
            Normalized
          </Link>
        </div>
      </div>
      <div className="telemetry-hero">
        <div className="telemetry-hero__glow" />
        <div className="telemetry-hero__content">
          <div>
            <p className="telemetry-hero__eyebrow">Streaming health</p>
            <h2>Inbound telemetry at a glance.</h2>
            <p className="telemetry-hero__subtitle">
              Monitor raw provider payloads, spot anomalies, and inspect
              rejected messages with full context.
            </p>
            <div className="telemetry-hero__meta">
              <span
                className={`telemetry-status-badge telemetry-status-badge--${streamStatus.toLowerCase()}`}
              >
                {streamStatus}
              </span>
              <span className="telemetry-meta">
                Last updated {lastUpdatedLabel}
              </span>
            </div>
          </div>
          <div className="telemetry-hero__metrics">
            <div className="telemetry-metric">
              <span className="telemetry-metric__label">Events</span>
              <span className="telemetry-metric__value">{counts.total}</span>
            </div>
            <div className="telemetry-metric">
              <span className="telemetry-metric__label">Warnings</span>
              <span className="telemetry-metric__value">{counts.warnings}</span>
            </div>
            <div className="telemetry-metric">
              <span className="telemetry-metric__label">Errors</span>
              <span className="telemetry-metric__value telemetry-metric__value--alert">
                {counts.errors}
              </span>
            </div>
            <div className="telemetry-metric">
              <span className="telemetry-metric__label">Avg payload</span>
              <span className="telemetry-metric__value">
                {counts.avgSize} B
              </span>
            </div>
            <div className="telemetry-metric">
              <span className="telemetry-metric__label">Trips in view</span>
              <span className="telemetry-metric__value">{tripIds.length}</span>
            </div>
          </div>
          <div className="telemetry-hero__actions">
            <button className="btn" onClick={() => refetch()}>
              Refresh stream
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => setPaused((prev) => !prev)}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>
      </div>

      <Card title="Filters">
        <div className="form-grid telemetry-filters">
          <label className="form__field">
            <span className="text-muted">Provider</span>
            <select
              className="select"
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
            >
              <option value="all">All providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">VIN</span>
            <select
              className="select"
              value={vinFilter}
              onChange={(event) => setVinFilter(event.target.value)}
            >
              <option value="all">All VINs</option>
              {vins.map((vin) => (
                <option key={vin} value={vin}>
                  {vin}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Trip ID</span>
            <select
              className="select"
              value={tripIdFilter}
              onChange={(event) => setTripIdFilter(event.target.value)}
            >
              <option value="all">All trips</option>
              {tripIds.map((tripId) => (
                <option key={tripId} value={tripId}>
                  {tripId}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Level</span>
            <select
              className="select"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="all">All levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </label>
          <label className="form__field form__field--full">
            <span className="text-muted">Search payload summary</span>
            <input
              className="input"
              placeholder="Filter by message description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </Card>

      <div className="telemetry-layout">
        <Card title="Raw Stream">
          <div className="telemetry-stream">
            {isLoading ? (
              <div className="empty-state">
                <div className="empty-state__icon">Signal</div>
                <h3>Loading telemetry</h3>
                <p className="text-muted">Fetching recent provider events.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">Signal</div>
                <h3>No matching events</h3>
                <p className="text-muted">
                  Adjust your filters to view telemetry messages.
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <button
                  key={event.id}
                  className={`telemetry-event${
                    selectedEvent?.id === event.id
                      ? " telemetry-event--active"
                      : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedId(event.id)}
                >
                  <div className="telemetry-event__row">
                    <div>
                      <div className="telemetry-event__title">{event.vin}</div>
                      <div className="telemetry-event__summary">
                        {event.summary}
                      </div>
                    </div>
                    <span
                      className={`telemetry-pill telemetry-pill--${event.level}`}
                    >
                      {event.level}
                    </span>
                  </div>
                  <div className="telemetry-event__meta">
                    <span>{event.provider}</span>
                    <span>{formatTimestamp(event.timestamp)}</span>
                    <span>{event.size} B</span>
                    <span
                      className={`telemetry-status telemetry-status--${event.status}`}
                    >
                      {event.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card title="Event Inspector">
          {!selectedEvent ? (
            <div className="empty-state">
              <div className="empty-state__icon">Inspect</div>
              <h3>Select an event</h3>
              <p className="text-muted">
                Choose a message on the left to inspect its raw payload.
              </p>
            </div>
          ) : (
            <div className="stack">
              <div className="tabs telemetry-tabs">
                <button
                  className={
                    activeTab === "overview" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={
                    activeTab === "payload" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setActiveTab("payload")}
                >
                  Payload
                </button>
                <button
                  className={
                    activeTab === "headers" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setActiveTab("headers")}
                >
                  Headers
                </button>
              </div>

              {activeTab === "overview" ? (
                <div className="telemetry-overview">
                  <div>
                    <div className="text-muted">VIN</div>
                    <div className="mono telemetry-overview__value">
                      {selectedEvent.vin}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Trip ID</div>
                    <div className="mono telemetry-overview__value">
                      {selectedEvent.tripId}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Provider</div>
                    <div className="telemetry-overview__value">
                      {selectedEvent.provider}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Timestamp</div>
                    <div className="telemetry-overview__value">
                      {formatTimestamp(selectedEvent.timestamp)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Status</div>
                    <div
                      className={`telemetry-status telemetry-status--${selectedEvent.status} telemetry-overview__value`}
                    >
                      {selectedEvent.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Payload size</div>
                    <div className="telemetry-overview__value">
                      {selectedEvent.size} bytes
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "payload" ? (
                <pre className="code-block telemetry-code">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              ) : null}

              {activeTab === "headers" ? (
                <div className="telemetry-overview">
                  <div>
                    <div className="text-muted">Correlation ID</div>
                    <div className="mono telemetry-overview__value">
                      {selectedEvent.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Source</div>
                    <div className="telemetry-overview__value">
                      {selectedEvent.provider}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Enqueued</div>
                    <div className="telemetry-overview__value">
                      {formatTimestamp(selectedEvent.timestamp)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Retries</div>
                    <div className="telemetry-overview__value">
                      {selectedEvent.level === "error" ? "2" : "0"}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
