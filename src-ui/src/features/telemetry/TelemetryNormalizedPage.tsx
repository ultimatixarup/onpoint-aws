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
};

const MAX_TRIPS = 10;
const EVENTS_PER_TRIP = 200;
const MAX_EVENT_PAGES = 5;
const AUTO_REFRESH_MS = 45_000;

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

function getFirstNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return null;
}

function roundTo(value: number | null, decimals: number): number | null {
  if (value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatRounded(value: number | null, decimals: number): string {
  const rounded = roundTo(value, decimals);
  if (rounded === null) return "--";
  return rounded.toFixed(decimals);
}

export function TelemetryNormalizedPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id ?? "";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [payloadTab, setPayloadTab] = useState<"normalized" | "raw">(
    "normalized",
  );
  const [selectedVin, setSelectedVin] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");

  const fromIso = useMemo(
    () => (fromInput ? new Date(fromInput).toISOString() : undefined),
    [fromInput],
  );
  const toIso = useMemo(
    () => (toInput ? new Date(toInput).toISOString() : undefined),
    [toInput],
  );

  const {
    data: tripSummary,
    isLoading: tripsLoading,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: [
      "telemetry-normalized-trips",
      tenantId,
      fleetId,
      selectedVin,
      fromIso,
      toIso,
    ],
    queryFn: async () => {
      if (!tenantId || !fleetId) return { items: [] };
      return fetchTripSummaryTrips({
        tenantId,
        fleetId,
        limit: MAX_TRIPS,
        from: fromIso,
        to: toIso,
        vehicleIds: selectedVin ? [selectedVin] : undefined,
      });
    },
    enabled: Boolean(tenantId && fleetId),
    refetchInterval: paused ? false : AUTO_REFRESH_MS,
  });

  const tripItems = tripSummary?.items ?? [];

  const {
    data: telemetryEvents = [],
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: [
      "telemetry-normalized-events",
      tenantId,
      fleetId,
      selectedVin,
      selectedTripId,
      fromIso,
      toIso,
    ],
    queryFn: async (): Promise<TelemetryEvent[]> => {
      if (!tenantId || !fleetId) return [];
      const scopedTrips = tripItems
        .filter((trip) => trip.vin && trip.tripId)
        .filter((trip) =>
          selectedTripId ? trip.tripId === selectedTripId : true,
        )
        .filter((trip) => (selectedVin ? trip.vin === selectedVin : true));

      if (!scopedTrips.length) return [];
      const eventsByTrip = await Promise.all(
        scopedTrips.map(async (trip) => {
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
    enabled: Boolean(tenantId && fleetId && !tripsLoading),
    refetchInterval: paused ? false : AUTO_REFRESH_MS,
  });

  const filteredEvents = useMemo(() => {
    if (!telemetryEvents.length) return [];
    const fromTime = fromIso ? Date.parse(fromIso) : null;
    const toTime = toIso ? Date.parse(toIso) : null;
    return telemetryEvents.filter((event) => {
      if (selectedVin && event.vin !== selectedVin) return false;
      if (selectedTripId && event.tripId !== selectedTripId) return false;
      if (fromTime !== null || toTime !== null) {
        const eventTime = Date.parse(event.timestamp);
        if (Number.isNaN(eventTime)) return false;
        if (fromTime !== null && eventTime < fromTime) return false;
        if (toTime !== null && eventTime > toTime) return false;
      }
      return true;
    });
  }, [fromIso, selectedTripId, selectedVin, telemetryEvents, toIso]);

  const isLoading = tripsLoading || eventsLoading;

  const vinOptions = useMemo(() => {
    const values = tripItems
      .map((trip) => trip.vin)
      .filter((vin): vin is string => Boolean(vin));
    return Array.from(new Set(values)).sort();
  }, [tripItems]);

  const tripOptions = useMemo(
    () =>
      tripItems.filter((trip) =>
        selectedVin ? trip.vin === selectedVin : true,
      ),
    [selectedVin, tripItems],
  );

  const handleRefresh = () => {
    refetchTrips();
    refetchEvents();
  };

  const clearFilters = () => {
    setSelectedVin("");
    setSelectedTripId("");
    setFromInput("");
    setToInput("");
  };

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedId) ??
    filteredEvents[0];

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

  useEffect(() => {
    if (!selectedTripId) return;
    const stillAvailable = tripOptions.some(
      (trip) => trip.tripId === selectedTripId,
    );
    if (!stillAvailable) {
      setSelectedTripId("");
    }
  }, [selectedTripId, tripOptions]);

  const normalizedSnapshot = useMemo(() => {
    const payload = selectedEvent?.payload ?? {};
    const record = payload as Record<string, unknown>;
    const lat =
      getFirstNumber(record.lat) ??
      getFirstNumber(record.latitude) ??
      getFirstNumber((record.location as { lat?: unknown })?.lat) ??
      getFirstNumber((record.geo as { lat?: unknown })?.lat);
    const lon =
      getFirstNumber(record.lon) ??
      getFirstNumber(record.longitude) ??
      getFirstNumber((record.location as { lon?: unknown })?.lon) ??
      getFirstNumber((record.geo as { lon?: unknown })?.lon);

    return {
      speed: getFirstNumber(
        record.speed_mph ?? record.speedMph ?? record.speed,
      ),
      heading: getFirstNumber(record.heading),
      ignition: String(
        record.ignition_status ??
          record.ignition ??
          record.ignitionStatus ??
          "--",
      ),
      fuel: getFirstNumber(record.fuelPercent ?? record.fuel_percent),
      odometer: getFirstNumber(
        record.odometer_Miles ?? record.odometerMiles ?? record.odometer_miles,
      ),
      lat,
      lon,
      state: String(record.vehicleState ?? record.state ?? "--"),
    };
  }, [selectedEvent]);

  const roundedSnapshot = useMemo(
    () => ({
      ...normalizedSnapshot,
      odometer: roundTo(normalizedSnapshot.odometer, 1),
      lat: roundTo(normalizedSnapshot.lat, 5),
      lon: roundTo(normalizedSnapshot.lon, 5),
    }),
    [normalizedSnapshot],
  );

  const normalizedPayload = useMemo(
    () => ({
      vin: selectedEvent?.vin ?? "--",
      tripId: selectedEvent?.tripId ?? "--",
      timestamp: selectedEvent?.timestamp ?? "--",
      ...roundedSnapshot,
    }),
    [roundedSnapshot, selectedEvent],
  );

  return (
    <div className="page telemetry-normalized">
      <div className="telemetry-header">
        <PageHeader title="Telemetry (Normalized)" subtitle="Unified schema" />
        <div className="telemetry-switcher">
          <Link className="telemetry-switcher__item" to="/adlp/telemetry/raw">
            Raw
          </Link>
          <Link
            className="telemetry-switcher__item telemetry-switcher__item--active"
            to="/adlp/telemetry/normalized"
          >
            Normalized
          </Link>
        </div>
      </div>

      <div className="telemetry-hero telemetry-hero--normalized">
        <div className="telemetry-hero__glow" />
        <div className="telemetry-hero__content">
          <div>
            <p className="telemetry-hero__eyebrow">Normalized feed</p>
            <h2>Consistent telemetry, ready for analytics.</h2>
            <p className="telemetry-hero__subtitle">
              Review normalized fields and drill into provider payloads when you
              need the raw context.
            </p>
          </div>
          <div className="telemetry-hero__actions">
            <button className="btn" onClick={handleRefresh}>
              Refresh
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
        <div className="telemetry-filters">
          <label className="form__field">
            <span className="text-muted">VIN</span>
            <select
              className="select"
              value={selectedVin}
              onChange={(event) => setSelectedVin(event.target.value)}
            >
              <option value="">All VINs</option>
              {vinOptions.map((vin) => (
                <option key={vin} value={vin}>
                  {vin}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Trip</span>
            <select
              className="select"
              value={selectedTripId}
              onChange={(event) => setSelectedTripId(event.target.value)}
            >
              <option value="">All trips</option>
              {tripOptions.map((trip) => (
                <option key={trip.tripId} value={trip.tripId}>
                  {trip.tripId}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">From</span>
            <input
              className="select"
              type="datetime-local"
              value={fromInput}
              onChange={(event) => setFromInput(event.target.value)}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">To</span>
            <input
              className="select"
              type="datetime-local"
              value={toInput}
              onChange={(event) => setToInput(event.target.value)}
            />
          </label>
          <div className="telemetry-filters__actions">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>
      </Card>

      <div className="telemetry-layout">
        <Card title="Normalized Stream">
          <div className="telemetry-stream">
            {isLoading ? (
              <div className="empty-state">
                <div className="empty-state__icon">Signal</div>
                <h3>Loading telemetry</h3>
                <p className="text-muted">Fetching normalized events.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">Signal</div>
                <h3>No events yet</h3>
                <p className="text-muted">No telemetry found for this fleet.</p>
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

        <Card title="Normalized Snapshot">
          {!selectedEvent ? (
            <div className="empty-state">
              <div className="empty-state__icon">Inspect</div>
              <h3>Select an event</h3>
              <p className="text-muted">
                Choose a message to see normalized fields.
              </p>
            </div>
          ) : (
            <div className="stack">
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
                  <div className="text-muted">Timestamp</div>
                  <div className="telemetry-overview__value">
                    {formatTimestamp(selectedEvent.timestamp)}
                  </div>
                </div>
                <div>
                  <div className="text-muted">State</div>
                  <div className="telemetry-overview__value">
                    {normalizedSnapshot.state}
                  </div>
                </div>
              </div>

              <div className="telemetry-kpis">
                <div className="telemetry-kpi">
                  <span>Speed</span>
                  <strong>{normalizedSnapshot.speed ?? "--"}</strong>
                  <span className="text-muted">mph</span>
                </div>
                <div className="telemetry-kpi">
                  <span>Heading</span>
                  <strong>{normalizedSnapshot.heading ?? "--"}</strong>
                  <span className="text-muted">deg</span>
                </div>
                <div className="telemetry-kpi">
                  <span>Ignition</span>
                  <strong>{normalizedSnapshot.ignition}</strong>
                </div>
                <div className="telemetry-kpi">
                  <span>Fuel</span>
                  <strong>{normalizedSnapshot.fuel ?? "--"}</strong>
                  <span className="text-muted">%</span>
                </div>
                <div className="telemetry-kpi">
                  <span>Odometer</span>
                  <strong>{formatRounded(roundedSnapshot.odometer, 1)}</strong>
                  <span className="text-muted">mi</span>
                </div>
                <div className="telemetry-kpi">
                  <span>Location</span>
                  <strong>
                    {roundedSnapshot.lat !== null &&
                    roundedSnapshot.lon !== null
                      ? `${formatRounded(roundedSnapshot.lat, 5)}, ${formatRounded(roundedSnapshot.lon, 5)}`
                      : "--"}
                  </strong>
                </div>
              </div>

              <div className="tabs telemetry-tabs">
                <button
                  className={
                    payloadTab === "normalized" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setPayloadTab("normalized")}
                >
                  Normalized
                </button>
                <button
                  className={payloadTab === "raw" ? "tab tab--active" : "tab"}
                  onClick={() => setPayloadTab("raw")}
                >
                  Raw
                </button>
              </div>
              <pre className="code-block telemetry-code">
                {JSON.stringify(
                  payloadTab === "normalized"
                    ? normalizedPayload
                    : selectedEvent.payload,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
