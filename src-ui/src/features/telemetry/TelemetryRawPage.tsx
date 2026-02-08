import { useEffect, useMemo, useState } from "react";
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

const SAMPLE_EVENTS: TelemetryEvent[] = [
  {
    id: "evt_0c95f",
    timestamp: "2026-02-07T21:02:14.000Z",
    vin: "4JGFB4FB7RA981998",
    tripId: "trip-9f82a",
    provider: "CerebrumX",
    level: "info",
    size: 1324,
    status: "accepted",
    summary: "Ignition off, parked in San Diego",
    payload: {
      provider: "CerebrumX",
      eventTime: "2026-02-07T21:02:14.000Z",
      vin: "4JGFB4FB7RA981998",
      tripId: "trip-9f82a",
      coordinates: { lat: 32.958121, lon: -117.140695 },
      speedMph: 0,
      heading: 149,
      fuelPercent: 69,
      ignition: "OFF",
      status: "TRIP_ENDED",
    },
  },
  {
    id: "evt_12fae",
    timestamp: "2026-02-07T20:58:02.000Z",
    vin: "1FM5K8AB7PGB60162",
    tripId: "trip-2271c",
    provider: "CerebrumX",
    level: "warn",
    size: 1480,
    status: "queued",
    summary: "Speed spike detected (85 mph)",
    payload: {
      provider: "CerebrumX",
      eventTime: "2026-02-07T20:58:02.000Z",
      vin: "1FM5K8AB7PGB60162",
      tripId: "trip-2271c",
      speedMph: 85,
      limitMph: 65,
      overspeed: true,
      location: { lat: 33.01421, lon: -117.10212 },
    },
  },
  {
    id: "evt_7bb10",
    timestamp: "2026-02-07T20:45:41.000Z",
    vin: "1C6RREMT0PN664947",
    tripId: "trip-5b1aa",
    provider: "RoadReady",
    level: "info",
    size: 1011,
    status: "accepted",
    summary: "Route checkpoint captured",
    payload: {
      provider: "RoadReady",
      eventTime: "2026-02-07T20:45:41.000Z",
      vin: "1C6RREMT0PN664947",
      tripId: "trip-5b1aa",
      routeId: "rr-2249",
      checkpoint: 12,
      location: { lat: 32.991, lon: -117.102 },
      odometerMiles: 19264.5,
    },
  },
  {
    id: "evt_4aa66",
    timestamp: "2026-02-07T20:22:19.000Z",
    vin: "4JGFB4FB7RA981998",
    tripId: "trip-9f82a",
    provider: "CerebrumX",
    level: "error",
    size: 940,
    status: "rejected",
    summary: "Malformed payload - missing odometer",
    payload: {
      provider: "CerebrumX",
      eventTime: "2026-02-07T20:22:19.000Z",
      vin: "4JGFB4FB7RA981998",
      tripId: "trip-9f82a",
      error: "Missing required field: odometer",
    },
  },
];

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export function TelemetryRawPage() {
  const [providerFilter, setProviderFilter] = useState("all");
  const [vinFilter, setVinFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "payload" | "overview" | "headers"
  >("payload");

  const providers = useMemo(
    () => Array.from(new Set(SAMPLE_EVENTS.map((event) => event.provider))),
    [],
  );

  const vins = useMemo(
    () => Array.from(new Set(SAMPLE_EVENTS.map((event) => event.vin))),
    [],
  );

  const filteredEvents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return SAMPLE_EVENTS.filter((event) => {
      if (providerFilter !== "all" && event.provider !== providerFilter) {
        return false;
      }
      if (levelFilter !== "all" && event.level !== levelFilter) {
        return false;
      }
      if (vinFilter !== "all" && event.vin !== vinFilter) {
        return false;
      }
      if (searchTerm && !event.summary.toLowerCase().includes(searchTerm)) {
        return false;
      }
      return true;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [levelFilter, providerFilter, search, vinFilter]);

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
      <PageHeader title="Telemetry (Raw)" subtitle="Provider payloads" />
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
          </div>
          <div className="telemetry-hero__actions">
            <button className="btn">Refresh stream</button>
            <button className="btn btn--secondary">Pause</button>
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
            {filteredEvents.length === 0 ? (
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
                    <div className="mono">{selectedEvent.vin}</div>
                  </div>
                  <div>
                    <div className="text-muted">Trip ID</div>
                    <div className="mono">{selectedEvent.tripId}</div>
                  </div>
                  <div>
                    <div className="text-muted">Provider</div>
                    <div>{selectedEvent.provider}</div>
                  </div>
                  <div>
                    <div className="text-muted">Timestamp</div>
                    <div>{formatTimestamp(selectedEvent.timestamp)}</div>
                  </div>
                  <div>
                    <div className="text-muted">Status</div>
                    <div
                      className={`telemetry-status telemetry-status--${selectedEvent.status}`}
                    >
                      {selectedEvent.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Payload size</div>
                    <div>{selectedEvent.size} bytes</div>
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
                    <div className="mono">{selectedEvent.id}</div>
                  </div>
                  <div>
                    <div className="text-muted">Source</div>
                    <div>{selectedEvent.provider}</div>
                  </div>
                  <div>
                    <div className="text-muted">Enqueued</div>
                    <div>{formatTimestamp(selectedEvent.timestamp)}</div>
                  </div>
                  <div>
                    <div className="text-muted">Retries</div>
                    <div>{selectedEvent.level === "error" ? "2" : "0"}</div>
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
