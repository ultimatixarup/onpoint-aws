import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  fetchTripEventsRaw,
  fetchTripSummaryTrips,
} from "../../api/tripSummaryApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { formatDateTime } from "../../utils/date";

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
  searchIndex: string;
};

const MAX_TRIPS = 10;
const EVENTS_PER_TRIP = 200;
const MAX_EVENT_PAGES = 5;
const AUTO_REFRESH_MS = 30_000;
const RAW_SPEED_DECIMALS = 2;
const RAW_COORD_DECIMALS = 5;
const RAW_ODOMETER_DECIMALS = 1;
const RAW_FUEL_PERCENT_DECIMALS = 1;
const RAW_FUEL_LEVEL_DECIMALS = 2;
const RAW_ALTITUDE_DECIMALS = 1;
const RAW_BLOB_KEYS = new Set([
  "raw",
  "rawmessage",
  "raw_message",
  "originalraw",
  "original_raw",
  "providerpayload",
]);

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
  return formatDateTime(value, "--");
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function isTimestampKey(key?: string) {
  if (!key) return false;
  const normalized = key.toLowerCase();
  return (
    normalized === "timestamp" ||
    normalized === "eventtime" ||
    normalized === "event_time" ||
    normalized.endsWith("_time") ||
    normalized.endsWith("_timestamp")
  );
}

function normalizeNumberByKey(value: number, key?: string) {
  const normalized = (key ?? "").toLowerCase();
  if (["heading", "rpm", "satellite_count"].includes(normalized)) {
    return Math.round(value);
  }
  if (
    ["lat", "lon", "latitude", "longitude"].includes(normalized) ||
    normalized.endsWith("_lat") ||
    normalized.endsWith("_lon")
  ) {
    return roundTo(value, RAW_COORD_DECIMALS);
  }
  if (normalized.includes("speed")) {
    return roundTo(value, RAW_SPEED_DECIMALS);
  }
  if (normalized.includes("odometer")) {
    return roundTo(value, RAW_ODOMETER_DECIMALS);
  }
  if (normalized === "fuel_percent" || normalized === "fuelpercent") {
    return roundTo(value, RAW_FUEL_PERCENT_DECIMALS);
  }
  if (normalized.includes("fuel_level")) {
    return roundTo(value, RAW_FUEL_LEVEL_DECIMALS);
  }
  if (normalized.includes("altitude")) {
    return roundTo(value, RAW_ALTITUDE_DECIMALS);
  }
  return value;
}

function normalizePayloadValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return value;
    return normalizeNumberByKey(value, key);
  }

  if (typeof value === "string") {
    if (isTimestampKey(key)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return formatTimestamp(value);
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizePayloadValue(item, key));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record)
        .filter(([childKey]) => !RAW_BLOB_KEYS.has(childKey.toLowerCase()))
        .map(([childKey, childValue]) => [
          childKey,
          normalizePayloadValue(childValue, childKey),
        ]),
    );
  }

  return value;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function extractIncomingRawMessage(payload: Record<string, unknown>): unknown {
  const directRaw = payload.raw;
  if (typeof directRaw === "string") return tryParseJson(directRaw);
  if (directRaw && typeof directRaw === "object") return directRaw;

  const candidates = [
    payload.rawMessage,
    payload.raw_message,
    payload.originalRaw,
    payload.original_raw,
    payload.providerPayload,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") return tryParseJson(candidate);
    if (candidate && typeof candidate === "object") return candidate;
  }

  return payload;
}

function pruneNullish(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "string") {
    return value.trim() === "" ? undefined : value;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => pruneNullish(item))
      .filter((item) => item !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => [key, pruneNullish(val)] as const)
      .filter(([, val]) => val !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return value;
}

function buildSearchIndex(input: {
  id: string;
  timestamp: string;
  vin: string;
  tripId: string;
  provider: string;
  level: string;
  status: string;
  summary: string;
  payload: Record<string, unknown>;
}) {
  const payloadText = JSON.stringify(input.payload).slice(0, 6000);
  return [
    input.id,
    input.timestamp,
    input.vin,
    input.tripId,
    input.provider,
    input.level,
    input.status,
    input.summary,
    payloadText,
  ]
    .join(" ")
    .toLowerCase();
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
  const [payloadView, setPayloadView] = useState<"normalized" | "raw">(
    "normalized",
  );
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
              const response = await fetchTripEventsRaw({
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
              searchIndex: buildSearchIndex({
                id: eventId,
                timestamp: rawTimestamp,
                vin: String(record.vin ?? record.VIN ?? vin),
                tripId,
                provider,
                level,
                status,
                summary,
                payload: record,
              }),
            } as TelemetryEvent;
          }),
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },
    enabled: Boolean(tenantId && fleetId),
    refetchInterval: paused ? false : AUTO_REFRESH_MS,
  });

  const providers = useMemo(
    () =>
      Array.from(
        new Set(
          telemetryEvents
            .map((event) => String(event.provider ?? "").trim())
            .filter((v) => v !== ""),
        ),
      ),
    [telemetryEvents],
  );

  const vins = useMemo(
    () =>
      Array.from(
        new Set(
          telemetryEvents
            .map((event) => String(event.vin ?? "").trim())
            .filter((v) => v !== ""),
        ),
      ),
    [telemetryEvents],
  );

  const tripIds = useMemo(
    () =>
      Array.from(
        new Set(
          telemetryEvents
            .map((event) => String(event.tripId ?? "").trim())
            .filter((v) => v !== ""),
        ),
      ),
    [telemetryEvents],
  );

  const filteredEvents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    const normalize = (v?: string) =>
      String(v ?? "")
        .trim()
        .toLowerCase();

    const providerFilterNormalized = normalize(providerFilter);
    const vinFilterNormalized = normalize(vinFilter);
    const tripIdFilterNormalized = normalize(tripIdFilter);

    return telemetryEvents
      .filter((event) => {
        if (
          providerFilter !== "all" &&
          normalize(event.provider) !== providerFilterNormalized
        ) {
          return false;
        }
        if (levelFilter !== "all" && event.level !== levelFilter) {
          return false;
        }
        if (
          vinFilter !== "all" &&
          normalize(event.vin) !== vinFilterNormalized
        ) {
          return false;
        }
        if (
          tripIdFilter !== "all" &&
          !normalize(event.tripId).includes(tripIdFilterNormalized)
        ) {
          return false;
        }
        if (searchTerm && !event.searchIndex.includes(searchTerm)) {
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

  const normalizedPayloadForDisplay = useMemo(
    () =>
      selectedEvent ? normalizePayloadValue(selectedEvent.payload) : undefined,
    [selectedEvent],
  );

  const originalRawPayloadForDisplay = useMemo(() => {
    if (!selectedEvent) return undefined;
    const rawMessage = extractIncomingRawMessage(selectedEvent.payload);
    return pruneNullish(rawMessage) ?? rawMessage;
  }, [selectedEvent]);

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

  // Clear selection when any filter changes so the inspector resets
  // to the first matching event. This avoids showing a stale event
  // when the left stream is narrowed by VIN/provider/trip filters.
  useEffect(() => {
    setSelectedId(null);
  }, [vinFilter, providerFilter, tripIdFilter, levelFilter, search]);

  return (
    <div className="page telemetry-raw">
      <div className="telemetry-header">
        <PageHeader
          title="Telemetry Events"
          subtitle="Raw + normalized views"
        />
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
          <label className="form__field telemetry-filters__field">
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
          <label className="form__field telemetry-filters__field">
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
          <label className="form__field telemetry-filters__field telemetry-filters__field--trip-id">
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
          <label className="form__field telemetry-filters__field">
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
            <span className="text-muted">Search events</span>
            <input
              className="input"
              placeholder="Search summary, VIN, trip ID, provider, status, or payload"
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
                <>
                  <div className="tabs telemetry-tabs">
                    <button
                      className={
                        payloadView === "normalized" ? "tab tab--active" : "tab"
                      }
                      onClick={() => setPayloadView("normalized")}
                    >
                      Normalized View
                    </button>
                    <button
                      className={
                        payloadView === "raw" ? "tab tab--active" : "tab"
                      }
                      onClick={() => setPayloadView("raw")}
                    >
                      Original Raw
                    </button>
                  </div>
                  <pre className="code-block telemetry-code">
                    {JSON.stringify(
                      payloadView === "normalized"
                        ? normalizedPayloadForDisplay
                        : originalRawPayloadForDisplay,
                      null,
                      2,
                    )}
                  </pre>
                </>
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
